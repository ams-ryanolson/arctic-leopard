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
     * Search mentions with prioritization based on user relationships.
     *
     * Priority order:
     * 1. Users you follow (exact username/display_name match)
     * 2. Users who follow you
     * 3. Users you've interacted with (liked/commented on their posts)
     * 4. Popular users (by followers_count)
     * 5. Alphabetical matches
     */
    public function searchMentions(string $query, ?User $user, int $limit = 8): Collection
    {
        $cleanQuery = trim($this->cleanQuery($query));
        $normalizedQuery = strtolower($cleanQuery);

        if ($cleanQuery === '') {
            return $this->getPopularMentions($user, $limit);
        }

        $userIds = [];
        $seenIds = [];

        // If user is authenticated, prioritize based on relationships
        if ($user !== null) {
            // 1. Users you follow with exact match
            $followingIds = $user->approvedFollowings()
                ->pluck('followable_id')
                ->toArray();

            if (! empty($followingIds)) {
                $following = User::query()
                    ->whereIn('id', $followingIds)
                    ->where(function ($q) use ($normalizedQuery) {
                        $q->whereRaw('LOWER(username) LIKE ?', ["{$normalizedQuery}%"])
                            ->orWhereRaw('LOWER(display_name) LIKE ?', ["{$normalizedQuery}%"])
                            ->orWhereRaw('LOWER(name) LIKE ?', ["{$normalizedQuery}%"]);
                    })
                    ->limit($limit)
                    ->pluck('id')
                    ->toArray();

                $userIds = array_merge($userIds, $following);
                $seenIds = array_merge($seenIds, $following);
            }

            // 2. Users who follow you
            if (count($userIds) < $limit) {
                $followerIds = $user->approvedFollowers()
                    ->pluck('users.id')
                    ->toArray();

                if (! empty($followerIds)) {
                    $followers = User::query()
                        ->whereIn('id', $followerIds)
                        ->where(function ($q) use ($normalizedQuery) {
                            $q->whereRaw('LOWER(username) LIKE ?', ["{$normalizedQuery}%"])
                                ->orWhereRaw('LOWER(display_name) LIKE ?', ["{$normalizedQuery}%"])
                                ->orWhereRaw('LOWER(name) LIKE ?', ["{$normalizedQuery}%"]);
                        })
                        ->whereNotIn('id', $seenIds)
                        ->limit($limit - count($userIds))
                        ->pluck('id')
                        ->toArray();

                    $userIds = array_merge($userIds, $followers);
                    $seenIds = array_merge($seenIds, $followers);
                }
            }

            // 3. Users you've interacted with (liked/commented on their posts)
            if (count($userIds) < $limit) {
                $interactedUserIds = $this->getInteractedUserIds($user, $normalizedQuery, $seenIds, $limit - count($userIds));

                $userIds = array_merge($userIds, $interactedUserIds);
                $seenIds = array_merge($seenIds, $interactedUserIds);
            }
        }

        // 4. Popular users
        if (count($userIds) < $limit) {
            $popularUserIds = User::query()
                ->withCount('approvedFollowers as followers_count')
                ->where(function ($q) use ($normalizedQuery) {
                    $q->whereRaw('LOWER(username) LIKE ?', ["{$normalizedQuery}%"])
                        ->orWhereRaw('LOWER(display_name) LIKE ?', ["{$normalizedQuery}%"])
                        ->orWhereRaw('LOWER(name) LIKE ?', ["{$normalizedQuery}%"]);
                })
                ->when($user !== null, function ($q) use ($user) {
                    $q->excludeBlockedFor($user);
                })
                ->whereNotIn('id', $seenIds)
                ->orderByDesc('followers_count')
                ->orderBy('username')
                ->limit($limit - count($userIds))
                ->pluck('id')
                ->toArray();

            $userIds = array_merge($userIds, $popularUserIds);
            $seenIds = array_merge($seenIds, $popularUserIds);
        }

        // 5. Use search index for remaining matches
        if (count($userIds) < $limit) {
            $searchResultIds = User::search($cleanQuery)
                ->take($limit - count($userIds))
                ->get()
                ->pluck('id')
                ->toArray();

            $userIds = array_merge($userIds, $searchResultIds);
        }

        // Return empty collection if no IDs
        if (empty($userIds)) {
            return User::query()->whereRaw('1=0')->get();
        }

        // Fetch all users in prioritized order and return as Eloquent Collection
        $finalUserIds = array_slice($userIds, 0, $limit);

        if (empty($finalUserIds)) {
            return User::query()->whereRaw('1=0')->get();
        }

        // Use FIELD() to preserve priority order
        $placeholders = implode(',', array_fill(0, count($finalUserIds), '?'));

        return User::query()
            ->with('latestVerification')
            ->whereIn('id', $finalUserIds)
            ->orderByRaw("FIELD(id, {$placeholders})", $finalUserIds)
            ->get();
    }

    /**
     * Get popular mentions for empty query.
     */
    protected function getPopularMentions(?User $user, int $limit): Collection
    {
        $userIds = [];
        $seenIds = [];

        // If user is authenticated, start with users they follow
        if ($user !== null) {
            $followingIds = $user->approvedFollowings()
                ->pluck('followable_id')
                ->toArray();

            if (! empty($followingIds)) {
                $following = array_slice($followingIds, 0, $limit);
                $userIds = array_merge($userIds, $following);
                $seenIds = array_merge($seenIds, $following);
            }

            // Then users who follow them
            if (count($userIds) < $limit) {
                $followerIds = $user->approvedFollowers()
                    ->pluck('users.id')
                    ->toArray();

                if (! empty($followerIds)) {
                    $followers = array_slice(
                        array_diff($followerIds, $seenIds),
                        0,
                        $limit - count($userIds)
                    );
                    $userIds = array_merge($userIds, $followers);
                    $seenIds = array_merge($seenIds, $followers);
                }
            }
        }

        // Fill remaining with popular users
        if (count($userIds) < $limit) {
            $popularUserIds = User::query()
                ->withCount('approvedFollowers as followers_count')
                ->when($user !== null, function ($q) use ($user) {
                    $q->excludeBlockedFor($user);
                })
                ->whereNotIn('id', $seenIds)
                ->orderByDesc('followers_count')
                ->limit($limit - count($userIds))
                ->pluck('id')
                ->toArray();

            $userIds = array_merge($userIds, $popularUserIds);
        }

        // Return empty collection if no IDs
        if (empty($userIds)) {
            return User::query()->whereRaw('1=0')->get();
        }

        // Fetch all users in one query and return as Eloquent Collection
        return User::query()
            ->with('latestVerification')
            ->whereIn('id', array_slice($userIds, 0, $limit))
            ->get();
    }

    /**
     * Get user IDs the authenticated user has interacted with (liked/commented on their posts).
     *
     * @return array<int>
     */
    protected function getInteractedUserIds(User $user, string $query, array $excludeIds, int $limit): array
    {
        $userIds = [];

        // Users whose posts the user has liked
        $likedPostAuthorIds = User::query()
            ->whereIn('id', function ($q) use ($user) {
                $q->select('posts.user_id')
                    ->from('posts')
                    ->join('likes', function ($join) use ($user) {
                        $join->on('likes.likeable_id', '=', 'posts.id')
                            ->where('likes.likeable_type', '=', 'App\Models\Post')
                            ->where('likes.user_id', '=', $user->id);
                    });
            })
            ->where(function ($q) use ($query) {
                $q->whereRaw('LOWER(username) LIKE ?', ["{$query}%"])
                    ->orWhereRaw('LOWER(display_name) LIKE ?', ["{$query}%"])
                    ->orWhereRaw('LOWER(name) LIKE ?', ["{$query}%"]);
            })
            ->whereNotIn('id', $excludeIds)
            ->limit($limit)
            ->pluck('id')
            ->toArray();

        $userIds = array_merge($userIds, $likedPostAuthorIds);
        $excludeIds = array_merge($excludeIds, $likedPostAuthorIds);

        // Users whose posts the user has commented on
        if (count($userIds) < $limit) {
            $commentedPostAuthorIds = User::query()
                ->whereIn('id', function ($q) use ($user) {
                    $q->select('posts.user_id')
                        ->from('posts')
                        ->join('comments', function ($join) use ($user) {
                            $join->on('comments.post_id', '=', 'posts.id')
                                ->where('comments.user_id', '=', $user->id);
                        });
                })
                ->where(function ($q) use ($query) {
                    $q->whereRaw('LOWER(username) LIKE ?', ["{$query}%"])
                        ->orWhereRaw('LOWER(display_name) LIKE ?', ["{$query}%"])
                        ->orWhereRaw('LOWER(name) LIKE ?', ["{$query}%"]);
                })
                ->whereNotIn('id', $excludeIds)
                ->limit($limit - count($userIds))
                ->pluck('id')
                ->toArray();

            $userIds = array_merge($userIds, $commentedPostAuthorIds);
        }

        return array_slice($userIds, 0, $limit);
    }

    /**
     * Search hashtags with prioritization for composer autocomplete.
     *
     * Priority order:
     * 1. Hashtags you've used before (if authenticated)
     * 2. Trending hashtags (last 24h usage)
     * 3. Popular hashtags (total usage_count)
     * 4. Alphabetical matches
     */
    public function searchHashtagsForComposer(string $query, ?User $user, int $limit = 8): Collection
    {
        $cleanQuery = trim($this->cleanQuery($query));
        $normalizedQuery = strtolower($cleanQuery);

        if ($cleanQuery === '') {
            return $this->getPopularHashtagsForComposer($user, $limit);
        }

        $hashtagIds = [];
        $seenIds = [];

        // If user is authenticated, prioritize hashtags they've used
        if ($user !== null) {
            $userHashtagIds = collect();

            // Hashtags from user's profile
            $userHashtagIds = $userHashtagIds->merge(
                DB::table('hashtag_user')
                    ->where('user_id', $user->id)
                    ->pluck('hashtag_id')
            );

            // Hashtags from user's posts
            $userHashtagIds = $userHashtagIds->merge(
                DB::table('post_hashtag')
                    ->join('posts', 'post_hashtag.post_id', '=', 'posts.id')
                    ->where('posts.user_id', $user->id)
                    ->pluck('post_hashtag.hashtag_id')
            );

            $userHashtagIds = $userHashtagIds->unique();

            $userHashtags = Hashtag::query()
                ->whereIn('id', $userHashtagIds)
                ->where(function ($q) use ($normalizedQuery) {
                    $q->whereRaw('LOWER(name) LIKE ?', ["{$normalizedQuery}%"])
                        ->orWhereRaw('LOWER(slug) LIKE ?', ["{$normalizedQuery}%"]);
                })
                ->limit($limit)
                ->pluck('id')
                ->toArray();

            $hashtagIds = array_merge($hashtagIds, $userHashtags);
            $seenIds = array_merge($seenIds, $userHashtags);
        }

        // Trending hashtags (last 24h) - build list with usage counts
        if (count($hashtagIds) < $limit) {
            $trendingHashtags = Hashtag::query()
                ->where(function ($q) use ($normalizedQuery) {
                    $q->whereRaw('LOWER(name) LIKE ?', ["{$normalizedQuery}%"])
                        ->orWhereRaw('LOWER(slug) LIKE ?', ["{$normalizedQuery}%"]);
                })
                ->whereNotIn('id', $seenIds)
                ->get()
                ->map(function (Hashtag $hashtag) {
                    $hashtag->recent_usage_count = $this->getRecentHashtagUsage($hashtag);

                    return $hashtag;
                })
                ->sortByDesc('recent_usage_count')
                ->take($limit - count($hashtagIds))
                ->pluck('id')
                ->toArray();

            $hashtagIds = array_merge($hashtagIds, $trendingHashtags);
            $seenIds = array_merge($seenIds, $trendingHashtags);
        }

        // Popular hashtags (total usage_count)
        if (count($hashtagIds) < $limit) {
            $popularHashtags = Hashtag::query()
                ->where(function ($q) use ($normalizedQuery) {
                    $q->whereRaw('LOWER(name) LIKE ?', ["{$normalizedQuery}%"])
                        ->orWhereRaw('LOWER(slug) LIKE ?', ["{$normalizedQuery}%"]);
                })
                ->whereNotIn('id', $seenIds)
                ->orderByDesc('usage_count')
                ->orderBy('name')
                ->limit($limit - count($hashtagIds))
                ->pluck('id')
                ->toArray();

            $hashtagIds = array_merge($hashtagIds, $popularHashtags);
            $seenIds = array_merge($seenIds, $popularHashtags);
        }

        // Use search index for remaining matches
        if (count($hashtagIds) < $limit) {
            $searchResultIds = Hashtag::search($cleanQuery)
                ->take($limit - count($hashtagIds))
                ->get()
                ->pluck('id')
                ->toArray();

            $hashtagIds = array_merge($hashtagIds, $searchResultIds);
        }

        // Return empty collection if no IDs
        if (empty($hashtagIds)) {
            return Hashtag::query()->whereRaw('1=0')->get();
        }

        // Fetch all hashtags in priority order using FIELD() and return as Eloquent Collection
        $finalHashtagIds = array_slice($hashtagIds, 0, $limit);

        if (empty($finalHashtagIds)) {
            return Hashtag::query()->whereRaw('1=0')->get();
        }

        $placeholders = implode(',', array_fill(0, count($finalHashtagIds), '?'));

        $hashtags = Hashtag::query()
            ->whereIn('id', $finalHashtagIds)
            ->orderByRaw("FIELD(id, {$placeholders})", $finalHashtagIds)
            ->get()
            ->map(function (Hashtag $hashtag) {
                $hashtag->recent_usage_count = $this->getRecentHashtagUsage($hashtag);

                return $hashtag;
            });

        return $hashtags;
    }

    /**
     * Get popular hashtags for empty query.
     */
    protected function getPopularHashtagsForComposer(?User $user, int $limit): Collection
    {
        $hashtagIds = [];
        $seenIds = [];

        // If user is authenticated, start with hashtags they've used
        if ($user !== null) {
            $userHashtagIds = collect();

            // Hashtags from user's profile
            $userHashtagIds = $userHashtagIds->merge(
                DB::table('hashtag_user')
                    ->where('user_id', $user->id)
                    ->pluck('hashtag_id')
            );

            // Hashtags from user's posts
            $userHashtagIds = $userHashtagIds->merge(
                DB::table('post_hashtag')
                    ->join('posts', 'post_hashtag.post_id', '=', 'posts.id')
                    ->where('posts.user_id', $user->id)
                    ->pluck('post_hashtag.hashtag_id')
            );

            $userHashtagIds = $userHashtagIds->unique()->toArray();

            $hashtagIds = array_slice($userHashtagIds, 0, $limit);
            $seenIds = array_merge($seenIds, $hashtagIds);
        }

        // Fill remaining with trending hashtags
        if (count($hashtagIds) < $limit) {
            $trendingHashtags = Hashtag::query()
                ->whereNotIn('id', $seenIds)
                ->get()
                ->map(function (Hashtag $hashtag) {
                    $hashtag->recent_usage_count = $this->getRecentHashtagUsage($hashtag);

                    return $hashtag;
                })
                ->sortByDesc('recent_usage_count')
                ->take($limit - count($hashtagIds))
                ->pluck('id')
                ->toArray();

            $hashtagIds = array_merge($hashtagIds, $trendingHashtags);
        }

        // Return empty collection if no IDs
        if (empty($hashtagIds)) {
            return Hashtag::query()->whereRaw('1=0')->get();
        }

        // Fetch all hashtags in priority order using FIELD() and return as Eloquent Collection
        $finalHashtagIds = array_slice($hashtagIds, 0, $limit);

        if (empty($finalHashtagIds)) {
            return Hashtag::query()->whereRaw('1=0')->get();
        }

        $placeholders = implode(',', array_fill(0, count($finalHashtagIds), '?'));

        $hashtags = Hashtag::query()
            ->whereIn('id', $finalHashtagIds)
            ->orderByRaw("FIELD(id, {$placeholders})", $finalHashtagIds)
            ->get()
            ->map(function (Hashtag $hashtag) {
                $hashtag->recent_usage_count = $this->getRecentHashtagUsage($hashtag);

                return $hashtag;
            });

        return $hashtags;
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
