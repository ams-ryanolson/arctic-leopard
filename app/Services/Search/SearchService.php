<?php

namespace App\Services\Search;

use App\Enums\EventStatus;
use App\Models\Circle;
use App\Models\Event;
use App\Models\Hashtag;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class SearchService
{
    /**
     * Get the number of posts using this hashtag in the last 24 hours.
     */
    public function getRecentHashtagUsage(Hashtag $hashtag): int
    {
        $twentyFourHoursAgo = Carbon::now()->subDay();

        return DB::table('post_hashtag')
            ->where('hashtag_id', $hashtag->id)
            ->where('created_at', '>=', $twentyFourHoursAgo)
            ->count();
    }

    /**
     * Search across all models.
     *
     * @return array<string, Collection>
     */
    public function searchAll(string $query, ?string $type = null, int $limit = 20): array
    {
        $normalizedQuery = trim($query);

        if ($normalizedQuery === '') {
            return [
                'users' => collect(),
                'events' => collect(),
                'circles' => collect(),
                'hashtags' => collect(),
            ];
        }

        // Handle special query prefixes
        $searchType = $this->detectSearchType($normalizedQuery, $type);
        $cleanQuery = $this->cleanQuery($normalizedQuery);

        $results = [
            'users' => collect(),
            'events' => collect(),
            'circles' => collect(),
            'hashtags' => collect(),
        ];

        if ($searchType === 'users' || $searchType === 'all') {
            $results['users'] = $this->searchUsers($cleanQuery, $limit);
        }

        if ($searchType === 'events' || $searchType === 'all') {
            $results['events'] = $this->searchEvents($cleanQuery, $limit);
        }

        if ($searchType === 'circles' || $searchType === 'all') {
            $results['circles'] = $this->searchCircles($cleanQuery, $limit);
        }

        if ($searchType === 'hashtags' || $searchType === 'all') {
            $results['hashtags'] = $this->searchHashtags($cleanQuery, $limit);
        }

        return $results;
    }

    /**
     * Detect search type from query prefix or explicit type parameter.
     */
    protected function detectSearchType(string $query, ?string $type): string
    {
        if ($type !== null) {
            return $type;
        }

        if (str_starts_with($query, '@')) {
            return 'users';
        }

        if (str_starts_with($query, '#')) {
            return 'hashtags';
        }

        return 'all';
    }

    /**
     * Clean query by removing special prefixes.
     */
    protected function cleanQuery(string $query): string
    {
        return ltrim($query, '@#');
    }

    /**
     * Search users by username or display_name.
     */
    protected function searchUsers(string $query, int $limit): Collection
    {
        return User::search($query)
            ->take($limit)
            ->get();
    }

    /**
     * Search events by title, description, or slug.
     */
    protected function searchEvents(string $query, int $limit): Collection
    {
        return Event::search($query)
            ->take($limit)
            ->get();
    }

    /**
     * Search circles by name, tagline, description, or slug.
     */
    protected function searchCircles(string $query, int $limit): Collection
    {
        return Circle::search($query)
            ->take($limit)
            ->get();
    }

    /**
     * Search hashtags by name or slug.
     */
    protected function searchHashtags(string $query, int $limit): Collection
    {
        return Hashtag::search($query)
            ->take($limit)
            ->get()
            ->map(function (Hashtag $hashtag) {
                $hashtag->recent_usage_count = $this->getRecentHashtagUsage($hashtag);

                return $hashtag;
            })
            ->sortByDesc('recent_usage_count')
            ->values();
    }

    /**
     * Get popular content for empty search queries.
     *
     * @return array<string, Collection>
     */
    public function getPopularContent(int $limit = 10): array
    {
        return [
            'users' => User::query()
                ->withCount('followers as followers_count')
                ->orderByDesc('followers_count')
                ->orderByDesc('created_at')
                ->take($limit)
                ->get(),
            'events' => Event::query()
                ->where('status', EventStatus::Published)
                ->where('starts_at', '>=', Carbon::now())
                ->orderByDesc('starts_at')
                ->take($limit)
                ->get(),
            'circles' => Circle::query()
                ->withCount('members as members_count')
                ->orderByDesc('members_count')
                ->orderByDesc('created_at')
                ->take($limit)
                ->get(),
            'hashtags' => Hashtag::query()
                ->get()
                ->map(function (Hashtag $hashtag) {
                    $hashtag->recent_usage_count = $this->getRecentHashtagUsage($hashtag);

                    return $hashtag;
                })
                ->sortByDesc('recent_usage_count')
                ->take($limit)
                ->values(),
        ];
    }
}
