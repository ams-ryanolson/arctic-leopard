<?php

namespace App\Services\Analytics;

use App\Models\Post;
use App\Models\PostMetricDaily;
use App\Models\PostViewEvent;
use App\Support\Analytics\PostViewSummaryRepository;
use Illuminate\Support\Carbon;
use Symfony\Component\Intl\Countries;

class PostAnalyticsService
{
    public function __construct(private readonly PostViewSummaryRepository $summaryRepository) {}

    /**
     * Build headline metrics and timeline series for the requested window.
     *
     * @return array{
     *     timeline: array<int, array<string, mixed>>,
     *     totals: array<string, int|float>,
     *     today: array<string, int>,
     *     live: array<string, mixed>
     * }
     */
    public function buildSummary(Post $post, Carbon $start, Carbon $end): array
    {
        $metrics = PostMetricDaily::query()
            ->where('post_id', $post->getKey())
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->get()
            ->keyBy(fn (PostMetricDaily $record) => $record->date->toDateString());

        $includeToday = $end->isSameDay(Carbon::today());

        $liveSummary = null;

        if ($includeToday) {
            $liveCollection = $this->summaryRepository->summarize(
                [$post->getKey()],
                $end->copy()->startOfDay(),
                Carbon::now()
            );

            $liveSummary = $liveCollection->get($post->getKey());
        }

        $timeline = [];
        $totals = [
            'views' => 0,
            'unique_viewers' => 0,
            'unique_authenticated_viewers' => 0,
            'unique_guest_viewers' => 0,
            'purchases' => 0,
        ];

        $todaySnapshot = [
            'views' => 0,
            'unique_viewers' => 0,
            'unique_authenticated_viewers' => 0,
            'unique_guest_viewers' => 0,
            'purchases' => 0,
        ];

        $cursor = $start->copy();

        while ($cursor->lessThanOrEqualTo($end)) {
            $dateKey = $cursor->toDateString();
            $record = $metrics->get($dateKey);

            $views = (int) ($record->views ?? 0);
            $uniqueViewers = (int) ($record->unique_viewers ?? 0);
            $uniqueAuthenticated = (int) ($record->unique_authenticated_viewers ?? 0);
            $uniqueGuests = (int) ($record->unique_guest_viewers ?? 0);
            $purchases = (int) ($record->purchases ?? 0);

            if ($includeToday && $cursor->isSameDay(Carbon::today()) && $liveSummary !== null) {
                $views = (int) ($liveSummary['views'] ?? 0);
                $uniqueViewers = (int) ($liveSummary['unique_viewers'] ?? 0);
                $uniqueAuthenticated = (int) ($liveSummary['unique_authenticated_viewers'] ?? 0);
                $uniqueGuests = (int) ($liveSummary['unique_guest_viewers'] ?? 0);
            }

            $timeline[] = [
                'date' => $dateKey,
                'views' => $views,
                'unique_viewers' => $uniqueViewers,
                'unique_authenticated_viewers' => $uniqueAuthenticated,
                'unique_guest_viewers' => $uniqueGuests,
                'purchases' => $purchases,
            ];

            $totals['views'] += $views;
            $totals['unique_viewers'] += $uniqueViewers;
            $totals['unique_authenticated_viewers'] += $uniqueAuthenticated;
            $totals['unique_guest_viewers'] += $uniqueGuests;
            $totals['purchases'] += $purchases;

            if ($cursor->isSameDay(Carbon::today())) {
                $todaySnapshot = [
                    'views' => $views,
                    'unique_viewers' => $uniqueViewers,
                    'unique_authenticated_viewers' => $uniqueAuthenticated,
                    'unique_guest_viewers' => $uniqueGuests,
                    'purchases' => $purchases,
                ];
            }

            $cursor->addDay();
        }

        $conversionRate = $totals['views'] > 0
            ? round($totals['purchases'] / $totals['views'], 4)
            : 0.0;

        return [
            'timeline' => $timeline,
            'totals' => array_merge($totals, [
                'conversion_rate' => $conversionRate,
            ]),
            'today' => $todaySnapshot,
            'live' => [
                'includes_today' => $includeToday,
                'refreshed_at' => Carbon::now()->toIso8601String(),
            ],
        ];
    }

    /**
     * Aggregate country-level view counts for the supplied window.
     *
     * @return array{data: array<int, array<string, mixed>>, total: int}
     */
    public function countryBreakdown(Post $post, Carbon $start, Carbon $end, int $limit = 10): array
    {
        $metrics = PostMetricDaily::query()
            ->where('post_id', $post->getKey())
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->pluck('country_breakdown')
            ->filter()
            ->all();

        $counts = [];

        foreach ($metrics as $breakdown) {
            foreach ($breakdown as $code => $value) {
                $counts[$code] = ($counts[$code] ?? 0) + (int) $value;
            }
        }

        $includeToday = $end->isSameDay(Carbon::today());

        if ($includeToday) {
            $liveSummary = $this->summaryRepository->summarize(
                [$post->getKey()],
                $end->copy()->startOfDay(),
                Carbon::now()
            )->get($post->getKey());

            if ($liveSummary !== null && isset($liveSummary['countries'])) {
                foreach ($liveSummary['countries'] as $code => $value) {
                    $counts[$code] = ($counts[$code] ?? 0) + (int) $value;
                }
            }
        }

        $total = array_sum($counts);

        $data = collect($counts)
            ->sortDesc()
            ->take($limit)
            ->map(static function (int $count, string $code) use ($total): array {
                $countryCode = strtoupper($code);

                return [
                    'country_code' => $countryCode,
                    'country' => Countries::exists($countryCode)
                        ? Countries::getName($countryCode)
                        : $countryCode,
                    'views' => $count,
                    'percentage' => $total > 0 ? round($count / $total, 4) : 0,
                ];
            })
            ->values()
            ->all();

        return [
            'data' => $data,
            'total' => $total,
        ];
    }

    /**
     * Fetch recent view events for timeline display.
     *
     * @return array<int, array<string, mixed>>
     */
    public function recentViews(Post $post, int $limit = 40): array
    {
        return PostViewEvent::query()
            ->with('viewer')
            ->where('post_id', $post->getKey())
            ->orderByDesc('occurred_at')
            ->limit($limit)
            ->get()
            ->map(static function (PostViewEvent $event): array {
                $context = collect($event->context ?? [])
                    ->only(['source', 'location', 'viewport'])
                    ->filter(static fn ($value) => is_scalar($value) && $value !== '')
                    ->toArray();

                return [
                    'occurred_at' => optional($event->occurred_at)->toIso8601String(),
                    'country_code' => $event->country_code,
                    'viewer' => $event->viewer ? [
                        'id' => $event->viewer->getKey(),
                        'username' => $event->viewer->username,
                        'display_name' => $event->viewer->display_name ?? $event->viewer->name,
                        'avatar_url' => $event->viewer->avatar_url,
                    ] : null,
                    'context' => $context,
                ];
            })
            ->all();
    }

    /**
     * Get list of users who amplified this post.
     *
     * @return array<int, array<string, mixed>>
     */
    public function amplifiedBy(Post $post, int $limit = 20): array
    {
        return $post->amplifiedBy()
            ->with('user')
            ->latest()
            ->limit($limit)
            ->get()
            ->map(static function ($repost) {
                $user = $repost->user;
                if (! $user) {
                    return null;
                }

                return [
                    'id' => $user->id,
                    'username' => $user->username,
                    'display_name' => $user->display_name ?? $user->name,
                    'name' => $user->name,
                    'avatar_url' => $user->avatar_url,
                    'is_verified' => (bool) $user->email_verified_at,
                    'amplified_at' => optional($repost->created_at)->toIso8601String(),
                ];
            })
            ->filter()
            ->values()
            ->all();
    }
}
