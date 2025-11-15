<?php

namespace App\Http\Controllers;

use App\Models\Circle;
use App\Models\Hashtag;
use App\Models\User;
use App\Services\Radar\BoostService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Inertia\ScrollMetadata;

class RadarController extends Controller
{
    private const PAGE_NAME = 'radar_page';

    private const PER_PAGE = 12;

    private const MAX_DISTANCE_KM = 800.0;

    private const MAX_RESULTS = 100;

    public function __construct(
        private readonly BoostService $boostService,
    ) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        $page = max(1, (int) $request->integer(self::PAGE_NAME, 1));
        $viewer = $request->user();

        // Extract filter values from request
        // Default to full ranges (no filtering) and 50km distance
        $filters = [
            'position_min' => $request->has('position_min') ? $request->integer('position_min') : 0,
            'position_max' => $request->has('position_max') ? $request->integer('position_max') : 100,
            'age_min' => $request->has('age_min') ? $request->integer('age_min') : 18,
            'age_max' => $request->has('age_max') ? $request->integer('age_max') : 100,
            'last_active' => $request->string('last_active')->toString() ?: null,
            'hashtags' => $request->collect('hashtags')->filter()->map(fn ($value) => (int) $value)->all(),
            'circles' => $request->collect('circles')->filter()->map(fn ($value) => (int) $value)->all(),
            'distance_km' => $request->has('distance_km') ? $request->integer('distance_km') : 50,
        ];

        $radarPayload = $this->buildRadarResults($viewer, $page, $filters);

        $radar = Inertia::scroll(
            fn (): array => $radarPayload,
            metadata: static function (array $payload): ScrollMetadata {
                $meta = Arr::get($payload, 'meta', []);
                $current = (int) Arr::get($meta, 'current_page', 1);
                $last = (int) Arr::get($meta, 'last_page', $current);

                return new ScrollMetadata(
                    RadarController::PAGE_NAME,
                    $current > 1 ? $current - 1 : null,
                    $current < $last ? $current + 1 : null,
                    $current,
                );
            },
        );

        $boostInfo = $viewer !== null ? $this->boostService->getBoostInfo($viewer) : [
            'is_boosting' => false,
            'expires_at' => null,
            'boosts_used_today' => 0,
            'daily_limit' => 1,
            'can_boost' => false,
        ];

        return Inertia::render('Radar/Index', [
            'viewer' => [
                'name' => $viewer?->display_name ?? $viewer?->username ?? $viewer?->name ?? 'You',
                'location' => $this->formatViewerLocation($viewer),
                'travelBeacon' => (bool) ($viewer?->is_traveling ?? false),
                'boostInfo' => $boostInfo,
            ],
            'filters' => $this->getFilterOptions(),
            'activeFilters' => $filters,
            'quickPrompts' => $this->mockPrompts(),
            'radar' => $radar,
            'pageName' => self::PAGE_NAME,
            'perPage' => self::PER_PAGE,
            'stats' => $this->buildSessionMetrics($radarPayload),
            'spotlights' => $this->mockSpotlights(),
        ]);
    }

    /**
     * @return array<string, string|null>
     */
    private function formatViewerLocation(?User $viewer): array
    {
        if ($viewer === null) {
            return [
                'city' => 'Unknown',
                'region' => null,
                'country' => null,
            ];
        }

        return [
            'city' => $viewer->location_city,
            'region' => $viewer->location_region,
            'country' => $viewer->location_country,
        ];
    }

    /**
     * Build the radar payload using live proximity data.
     *
     * @param  array<string, mixed>  $filters
     */
    private function buildRadarResults(?User $viewer, int $page, array $filters = []): array
    {
        $viewerHasLocation = $viewer !== null
            && $viewer->location_latitude !== null
            && $viewer->location_longitude !== null;

        if ($viewerHasLocation && $viewer !== null) {
            $query = $this->prepareBaseQuery($viewer, $filters);
            $this->applyFilters($query, $filters);
            $this->applyDistanceSelect($query, $viewer, $filters['distance_km'] ?? null);

            return $this->paginateRadar($query, $page, $viewer, $filters['distance_km'] ?? null);
        }

        $baseQuery = $this->prepareBaseQuery($viewer, $filters);
        $this->applyFilters($baseQuery, $filters);
        $baseQuery->selectRaw('0 as distance_km')
            ->orderByDesc('is_boosting_sort')
            ->orderByDesc('profile_completed_at');

        return $this->paginateRadar($baseQuery, $page, $viewer, null);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function prepareBaseQuery(?User $viewer, array $filters = []): Builder
    {
        $query = User::query()
            ->select([
                'users.id',
                'users.username',
                'users.display_name',
                'users.name',
                'users.pronouns',
                'users.bio',
                'users.avatar_path',
                'users.cover_path',
                'users.email_verified_at',
                'users.requires_follow_approval',
                'users.updated_at',
                'users.created_at',
                'users.location_city',
                'users.location_region',
                'users.location_country',
                'users.location_latitude',
                'users.location_longitude',
                'users.profile_completed_at',
                'users.is_traveling',
                'users.role',
                'users.birthdate',
            ])
            ->whereNotNull('profile_completed_at')
            ->whereNotNull('location_latitude')
            ->whereNotNull('location_longitude');

        // Add subquery to check if user has active boost for sorting priority
        $query->selectRaw('(
            SELECT CASE WHEN EXISTS (
                SELECT 1 FROM radar_boosts 
                WHERE radar_boosts.user_id = users.id 
                AND radar_boosts.expires_at > ?
            ) THEN 1 ELSE 0 END
        ) as is_boosting_sort', [Carbon::now()]);

        if ($viewer !== null) {
            $query->excludeBlockedFor($viewer)
                ->whereKeyNot($viewer->getKey());
        }

        return $query;
    }

    private function paginateRadar(Builder $query, int $page, ?User $viewer, ?int $maxDistanceKm): array
    {
        // When distance filter is applied, limit to MAX_RESULTS (100) closest matches
        // and manually paginate since we need to limit before counting
        if ($maxDistanceKm !== null && $maxDistanceKm > 0) {
            // Get the first MAX_RESULTS results
            $allResults = $query->limit(self::MAX_RESULTS)->get();
            $total = $allResults->count();
            $lastPage = (int) ceil($total / self::PER_PAGE);
            $currentPage = min($page, max(1, $lastPage));

            // Manually paginate the collection
            $offset = ($currentPage - 1) * self::PER_PAGE;
            $paginatedResults = $allResults->slice($offset, self::PER_PAGE)->values();

            // Get all user IDs to check boosts in batch
            $userIds = $paginatedResults->pluck('id')->all();
            $activeBoosts = $this->boostService->getActiveBoostsByUserIds($userIds);

            $collection = $paginatedResults->transform(function (User $user) use ($viewer, $activeBoosts): array {
                $distance = $user->distance_km !== null ? (float) $user->distance_km : 0.0;
                $isBoosting = isset($activeBoosts[$user->getKey()]);

                $profile = $this->makeRadarProfile($user, $distance, $viewer);
                $profile['is_boosting'] = $isBoosting;

                return $profile;
            });

            return [
                'data' => $collection->values()->all(),
                'links' => [],
                'meta' => [
                    'current_page' => $currentPage,
                    'last_page' => $lastPage,
                    'per_page' => self::PER_PAGE,
                    'total' => $total,
                    'next_page_url' => $currentPage < $lastPage ? '?'.self::PAGE_NAME.'='.($currentPage + 1) : null,
                    'prev_page_url' => $currentPage > 1 ? '?'.self::PAGE_NAME.'='.($currentPage - 1) : null,
                ],
            ];
        }

        // Normal pagination for non-distance-filtered queries
        $paginator = $query->paginate(
            perPage: self::PER_PAGE,
            pageName: self::PAGE_NAME,
            page: $page,
        );

        // Get all user IDs to check boosts in batch
        $userIds = $paginator->getCollection()->pluck('id')->all();
        $activeBoosts = $this->boostService->getActiveBoostsByUserIds($userIds);

        $collection = $paginator->getCollection()->transform(function (User $user) use ($viewer, $activeBoosts): array {
            $distance = $user->distance_km !== null ? (float) $user->distance_km : 0.0;
            $isBoosting = isset($activeBoosts[$user->getKey()]);

            $profile = $this->makeRadarProfile($user, $distance, $viewer);
            $profile['is_boosting'] = $isBoosting;

            return $profile;
        });

        $payload = $paginator->toArray();

        return [
            'data' => $collection->values()->all(),
            'links' => $payload['links'] ?? [],
            'meta' => [
                'current_page' => $payload['current_page'] ?? $paginator->currentPage(),
                'last_page' => $payload['last_page'] ?? $paginator->lastPage(),
                'per_page' => $payload['per_page'] ?? $paginator->perPage(),
                'total' => $payload['total'] ?? $paginator->total(),
                'next_page_url' => $payload['next_page_url'] ?? $paginator->nextPageUrl(),
                'prev_page_url' => $payload['prev_page_url'] ?? $paginator->previousPageUrl(),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function makeRadarProfile(User $user, float $distanceKm, ?User $viewer): array
    {
        $displayName = $user->display_name ?? $user->name ?? $user->username;
        $vibe = $user->bio !== null
            ? Str::limit(trim(preg_replace('/\s+/', ' ', (string) $user->bio)), 140)
            : null;

        $canFollow = $viewer !== null && ! $viewer->is($user);
        $isFollowing = $viewer !== null && method_exists($viewer, 'isFollowing')
            ? $viewer->isFollowing($user)
            : false;
        $hasPendingFollowRequest = $viewer !== null && method_exists($viewer, 'hasRequestedToFollow')
            ? $viewer->hasRequestedToFollow($user)
            : false;

        if ($isFollowing) {
            $hasPendingFollowRequest = false;
        }

        return [
            'id' => $user->getKey(),
            'display_name' => $displayName,
            'username' => $user->username,
            'avatar' => $user->avatar_url,
            'distance_km' => round($distanceKm, 1),
            'last_seen' => $this->formatLastSeenLabel($user),
            'pronouns' => $user->pronouns,
            'roles' => [],
            'vibe' => $vibe ?: 'Dialing in a fresh scene tonight.',
            'mutuals' => 0,
            'circles' => 0,
            'compatibility' => $this->resolveCompatibilityScore($user),
            'intent' => [],
            'badges' => $this->resolveBadges($user),
            'gallery' => array_values(array_filter([$user->cover_url])),
            'is_traveling' => (bool) $user->is_traveling,
            'is_following' => $isFollowing,
            'has_pending_follow_request' => $hasPendingFollowRequest,
            'can_follow' => $canFollow,
            'is_boosting' => false, // Will be overridden in paginateRadar
        ];
    }

    private function formatLastSeenLabel(User $user): string
    {
        $lastActive = $user->updated_at ?? $user->created_at;

        if ($lastActive === null) {
            return 'Seen recently';
        }

        $lastActive = Carbon::parse($lastActive);
        $diff = $lastActive->diffForHumans([
            'parts' => 1,
            'short' => true,
        ]);

        if ($lastActive->greaterThanOrEqualTo(Carbon::now()->subMinutes(5))) {
            return sprintf('Online · %s', $diff);
        }

        return sprintf('Seen · %s', $diff);
    }

    private function resolveCompatibilityScore(User $user): int
    {
        $seed = abs(crc32((string) $user->getKey()));

        return 60 + ($seed % 40);
    }

    /**
     * @return list<string>
     */
    private function resolveBadges(User $user): array
    {
        $badges = [];

        if ($user->email_verified_at !== null) {
            $badges[] = 'Verified';
        }

        if ($user->requires_follow_approval) {
            $badges[] = 'Private Circles';
        }

        return $badges;
    }

    private function applyDistanceSelect(
        Builder $query,
        User $viewer,
        ?int $maxDistanceKm = null,
    ): void {
        if ($viewer->location_latitude === null || $viewer->location_longitude === null) {
            return;
        }

        $distanceExpression = '6371 * acos(cos(radians(?)) * cos(radians(users.location_latitude)) * cos(radians(users.location_longitude) - radians(?)) + sin(radians(?)) * sin(radians(users.location_latitude)))';

        $bindings = [
            $viewer->location_latitude,
            $viewer->location_longitude,
            $viewer->location_latitude,
        ];

        $query->selectRaw(
            sprintf('ROUND(%s, 4) as distance_km', $distanceExpression),
            $bindings,
        );

        // Apply distance filter if specified
        if ($maxDistanceKm !== null && $maxDistanceKm > 0) {
            $latitudeRange = $maxDistanceKm / 111;
            $longitudeDenominator = max(cos(deg2rad($viewer->location_latitude)), 0.00001);
            $longitudeRange = $maxDistanceKm / (111 * $longitudeDenominator);

            $query->whereBetween('users.location_latitude', [
                max(-90, $viewer->location_latitude - $latitudeRange),
                min(90, $viewer->location_latitude + $latitudeRange),
            ])->whereBetween('users.location_longitude', [
                max(-180, $viewer->location_longitude - $longitudeRange),
                min(180, $viewer->location_longitude + $longitudeRange),
            ]);

            $query->whereRaw(
                sprintf('%s <= ?', $distanceExpression),
                array_merge($bindings, [$maxDistanceKm]),
            );
        }

        // Sort by boost priority first (boosted profiles first), then by distance
        $query->orderByDesc('is_boosting_sort')
            ->orderBy('distance_km');
    }

    /**
     * @return array<string, mixed>
     */
    /**
     * Get available filter options for the frontend.
     *
     * @return array<string, mixed>
     */
    private function getFilterOptions(): array
    {
        $hashtags = Hashtag::query()
            ->orderByDesc('usage_count')
            ->limit(50)
            ->get(['id', 'name'])
            ->map(fn (Hashtag $hashtag) => [
                'id' => $hashtag->getKey(),
                'name' => $hashtag->name,
            ])
            ->values()
            ->all();

        $circles = Circle::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->limit(100)
            ->get(['id', 'name'])
            ->map(fn (Circle $circle) => [
                'id' => $circle->getKey(),
                'name' => $circle->name,
            ])
            ->values()
            ->all();

        return [
            'hashtags' => $hashtags,
            'circles' => $circles,
            'positions' => [
                ['label' => 'Dominant', 'value' => 0],
                ['label' => 'Switch', 'value' => 50],
                ['label' => 'Submissive', 'value' => 100],
            ],
            'lastActiveOptions' => [
                ['label' => 'Last 5 minutes', 'value' => '5m'],
                ['label' => 'Last hour', 'value' => '1h'],
                ['label' => 'Last 24 hours', 'value' => '24h'],
                ['label' => 'Last week', 'value' => '7d'],
                ['label' => 'Any time', 'value' => 'any'],
            ],
            'distanceOptions' => [
                ['label' => '10 km / 6.2 mi', 'value' => 10],
                ['label' => '25 km / 15.5 mi', 'value' => 25],
                ['label' => '50 km / 31.1 mi', 'value' => 50],
                ['label' => '100 km / 62.1 mi', 'value' => 100],
                ['label' => '250 km / 155.3 mi', 'value' => 250],
                ['label' => '500 km / 310.7 mi', 'value' => 500],
            ],
        ];
    }

    /**
     * Apply filters to the query.
     *
     * @param  array<string, mixed>  $filters
     */
    private function applyFilters(Builder $query, array $filters): void
    {
        // Position/Role filter (0 = 100% Dominant, 100 = 100% Submissive)
        // Only apply if not default values (0 and 100 = full range, no filter)
        if (isset($filters['position_min']) && $filters['position_min'] > 0) {
            // position_min is the minimum % Dominant (inverted from role)
            // If position_min is 50, we want role <= 50 (50%+ Dominant)
            $query->where('users.role', '<=', 100 - $filters['position_min']);
        }
        if (isset($filters['position_max']) && $filters['position_max'] < 100) {
            // position_max is the maximum % Dominant (inverted from role)
            // If position_max is 80, we want role >= 20 (80%+ Submissive)
            $query->where('users.role', '>=', 100 - $filters['position_max']);
        }

        // Age filter (from birthdate)
        // Only apply if not default values (18 and 100 = full range, no filter)
        if (isset($filters['age_min']) && $filters['age_min'] > 18) {
            $maxBirthdate = Carbon::now()->subYears($filters['age_min'])->startOfDay();
            $query->where('users.birthdate', '<=', $maxBirthdate);
        }
        if (isset($filters['age_max']) && $filters['age_max'] < 100) {
            $minBirthdate = Carbon::now()->subYears($filters['age_max'] + 1)->endOfDay();
            $query->where('users.birthdate', '>=', $minBirthdate);
        }

        // Last active filter (on updated_at)
        if (isset($filters['last_active']) && $filters['last_active'] !== null && $filters['last_active'] !== 'any') {
            $cutoff = match ($filters['last_active']) {
                '5m' => Carbon::now()->subMinutes(5),
                '1h' => Carbon::now()->subHour(),
                '24h' => Carbon::now()->subDay(),
                '7d' => Carbon::now()->subWeek(),
                default => null,
            };

            if ($cutoff !== null) {
                $query->where('users.updated_at', '>=', $cutoff);
            }
        }

        // Hashtags filter
        if (! empty($filters['hashtags']) && is_array($filters['hashtags'])) {
            $query->whereHas('hashtags', fn ($q) => $q->whereIn('hashtags.id', $filters['hashtags']));
        }

        // Circles filter
        if (! empty($filters['circles']) && is_array($filters['circles'])) {
            $query->whereHas('circles', fn ($q) => $q->whereIn('circles.id', $filters['circles']));
        }

        // Distance filter is applied in applyDistanceSelect, not here
    }

    /**
     * @return array<int, string>
     */
    private function mockPrompts(): array
    {
        return [
            '“Radar is live” auto-pings the five closest verified players.',
            'Traveler mode hides your handle but keeps encrypted chat open.',
            'Signal boosts send you to the top of Radar for 45 minutes.',
        ];
    }

    private function buildSessionMetrics(array $radar): array
    {
        $data = collect(Arr::get($radar, 'data', []));
        $totalNearby = (int) Arr::get($radar, 'meta.total', 0);
        $currentPageCount = $data->count();
        $travelers = $data->where('is_traveling', true)->count();

        $nearbyLabel = sprintf('%s nearby', number_format($totalNearby));
        $travelersLabel = $travelers > 0
            ? sprintf(
                '%s %s active',
                number_format($travelers),
                Str::plural('travel beacon', $travelers),
            )
            : 'No travel beacons';
        $currentViewLabel = sprintf('%s profiles in view', number_format($currentPageCount));

        return [
            'online_now' => $nearbyLabel,
            'signal_boosts' => $travelersLabel,
            'meetups_happening' => $currentViewLabel,
        ];
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function mockSpotlights(): array
    {
        return [
            [
                'title' => 'Tonight’s heat surge',
                'description' => 'Circles within 3km are broadcasting private rope jams.',
            ],
            [
                'title' => 'Traveler queue',
                'description' => 'Seven visitors just toggled in from Berlin Leather Week.',
            ],
            [
                'title' => 'Consent check-ins',
                'description' => 'Moderators verified 26 new accounts in the last hour.',
            ],
        ];
    }
}
