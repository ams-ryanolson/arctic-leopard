<?php

namespace App\Support\Analytics;

use App\Models\PostViewEvent;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class PostViewSummaryRepository
{
    /**
     * Compile per-post view summaries for the supplied window.
     *
     * @param  array<int>  $postIds
     * @return Collection<int, array<string, mixed>>
     */
    public function summarize(array $postIds, Carbon $start, Carbon $end): Collection
    {
        if ($postIds === []) {
            return collect();
        }

        $postIds = array_values(array_unique(array_map('intval', $postIds)));

        $viewCounts = PostViewEvent::query()
            ->whereIn('post_id', $postIds)
            ->whereBetween('occurred_at', [$start, $end])
            ->selectRaw('post_id, COUNT(*) as aggregate')
            ->groupBy('post_id')
            ->pluck('aggregate', 'post_id');

        $uniqueViewerCounts = PostViewEvent::query()
            ->whereIn('post_id', $postIds)
            ->whereBetween('occurred_at', [$start, $end])
            ->selectRaw('post_id, COUNT(DISTINCT fingerprint_hash) as aggregate')
            ->groupBy('post_id')
            ->pluck('aggregate', 'post_id');

        $uniqueAuthenticatedViewerCounts = PostViewEvent::query()
            ->whereIn('post_id', $postIds)
            ->whereBetween('occurred_at', [$start, $end])
            ->whereNotNull('viewer_id')
            ->selectRaw('post_id, COUNT(DISTINCT viewer_id) as aggregate')
            ->groupBy('post_id')
            ->pluck('aggregate', 'post_id');

        $uniqueGuestViewerCounts = PostViewEvent::query()
            ->whereIn('post_id', $postIds)
            ->whereBetween('occurred_at', [$start, $end])
            ->whereNull('viewer_id')
            ->selectRaw('post_id, COUNT(DISTINCT fingerprint_hash) as aggregate')
            ->groupBy('post_id')
            ->pluck('aggregate', 'post_id');

        $countryBreakdowns = PostViewEvent::query()
            ->whereIn('post_id', $postIds)
            ->whereBetween('occurred_at', [$start, $end])
            ->whereNotNull('country_code')
            ->selectRaw('post_id, country_code, COUNT(*) as aggregate')
            ->groupBy('post_id', 'country_code')
            ->get()
            ->groupBy('post_id')
            ->map(static function (Collection $rows): array {
                $countries = [];

                foreach ($rows as $row) {
                    $code = Arr::get($row, 'country_code');
                    $count = (int) Arr::get($row, 'aggregate', 0);

                    if (! is_string($code) || $code === '') {
                        continue;
                    }

                    $countries[strtoupper($code)] = $count;
                }

                ksort($countries);

                return $countries;
            });

        return collect($postIds)->mapWithKeys(static function (int $postId) use (
            $viewCounts,
            $uniqueViewerCounts,
            $uniqueAuthenticatedViewerCounts,
            $uniqueGuestViewerCounts,
            $countryBreakdowns,
        ): array {
            return [
                $postId => [
                    'views' => (int) $viewCounts->get($postId, 0),
                    'unique_viewers' => (int) $uniqueViewerCounts->get($postId, 0),
                    'unique_authenticated_viewers' => (int) $uniqueAuthenticatedViewerCounts->get($postId, 0),
                    'unique_guest_viewers' => (int) $uniqueGuestViewerCounts->get($postId, 0),
                    'countries' => $countryBreakdowns->get($postId, []),
                ],
            ];
        });
    }
}

