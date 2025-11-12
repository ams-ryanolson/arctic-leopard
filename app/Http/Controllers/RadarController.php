<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;
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

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        $page = max(1, (int) $request->integer(self::PAGE_NAME, 1));
        $viewer = $request->user();

        $radarPayload = $this->buildRadarResults($viewer, $page);

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

        return Inertia::render('Radar/Index', [
            'viewer' => [
                'name' => $viewer?->display_name ?? $viewer?->username ?? $viewer?->name ?? 'You',
                'location' => $this->formatViewerLocation($viewer),
                'travelBeacon' => (bool) ($viewer?->is_traveling ?? false),
            ],
            'filters' => $this->mockFilters(),
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
     */
    private function buildRadarResults(?User $viewer, int $page): array
    {
        $viewerHasLocation = $viewer !== null
            && $viewer->location_latitude !== null
            && $viewer->location_longitude !== null;

        if ($viewerHasLocation && $viewer !== null) {
            $withinRadiusQuery = $this->prepareBaseQuery($viewer);
            $this->applyDistanceSelect($withinRadiusQuery, $viewer, true);

            $withinRadius = $this->paginateRadar($withinRadiusQuery, $page, $viewer);

            if ((int) Arr::get($withinRadius, 'meta.total', 0) > 0) {
                return $withinRadius;
            }

            $expandedQuery = $this->prepareBaseQuery($viewer);
            $this->applyDistanceSelect($expandedQuery, $viewer);

            return $this->paginateRadar($expandedQuery, $page, $viewer);
        }

        $baseQuery = $this->prepareBaseQuery($viewer);
        $baseQuery->selectRaw('0 as distance_km')
            ->orderByDesc('profile_completed_at');

        return $this->paginateRadar($baseQuery, $page, $viewer);
    }

    private function prepareBaseQuery(?User $viewer): Builder
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
            ])
            ->whereNotNull('profile_completed_at')
            ->whereNotNull('location_latitude')
            ->whereNotNull('location_longitude');

        if ($viewer !== null) {
            $query->excludeBlockedFor($viewer)
                ->whereKeyNot($viewer->getKey());
        }

        return $query;
    }

    private function paginateRadar(Builder $query, int $page, ?User $viewer): array
    {
        $paginator = $query->paginate(
            perPage: self::PER_PAGE,
            pageName: self::PAGE_NAME,
            page: $page,
        );

        $collection = $paginator->getCollection()->transform(function (User $user) use ($viewer): array {
            $distance = $user->distance_km !== null ? (float) $user->distance_km : 0.0;

            return $this->makeRadarProfile($user, $distance, $viewer);
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
        bool $limitToMaxDistance = false,
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

        if ($limitToMaxDistance) {
            $latitudeRange = self::MAX_DISTANCE_KM / 111;
            $longitudeDenominator = max(cos(deg2rad($viewer->location_latitude)), 0.00001);
            $longitudeRange = self::MAX_DISTANCE_KM / (111 * $longitudeDenominator);

            $query->whereBetween('users.location_latitude', [
                max(-90, $viewer->location_latitude - $latitudeRange),
                min(90, $viewer->location_latitude + $latitudeRange),
            ])->whereBetween('users.location_longitude', [
                max(-180, $viewer->location_longitude - $longitudeRange),
                min(180, $viewer->location_longitude + $longitudeRange),
            ]);

            $query->whereRaw(
                sprintf('%s <= ?', $distanceExpression),
                array_merge($bindings, [self::MAX_DISTANCE_KM]),
            );
        }

        $query->orderBy('distance_km');
    }

    /**
     * @return array<string, mixed>
     */
    private function mockFilters(): array
    {
        return [
            'positions' => [
                ['label' => 'Top', 'value' => 'top'],
                ['label' => 'Bottom', 'value' => 'bottom'],
                ['label' => 'Switch', 'value' => 'switch'],
            ],
            'sort' => [
                ['label' => 'Closest first', 'value' => 'distance'],
                ['label' => 'Heat index', 'value' => 'heat'],
                ['label' => 'Compatibility', 'value' => 'compatibility'],
                ['label' => 'Newest', 'value' => 'newest'],
            ],
        ];
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
