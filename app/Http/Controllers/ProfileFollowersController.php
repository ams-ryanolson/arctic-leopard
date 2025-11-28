<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProfileFollowersController extends Controller
{
    public function show(Request $request, string $username, ?string $tab = null): Response
    {
        $normalizedUsername = Str::lower($username);

        $user = User::query()
            ->where(function ($query) use ($username, $normalizedUsername): void {
                $query->where('username_lower', $normalizedUsername)
                    ->orWhere('username', $username)
                    ->orWhereRaw('LOWER(username) = ?', [$normalizedUsername]);
            })
            ->firstOrFail();

        $authUser = $request->user();

        // Check for block relationships
        if ($authUser !== null && $authUser->hasBlockRelationshipWith($user)) {
            return redirect()->route('profile.show', ['username' => $user->username]);
        }

        // Default to 'followers' if no tab specified
        // Redirect mutual to followers if user is not authenticated
        if ($tab === 'mutual' && $authUser === null) {
            return redirect()->route('profile.followers', ['username' => $user->username]);
        }

        $activeTab = in_array($tab, ['followers', 'following', 'mutual'], true) ? $tab : 'followers';

        $userModel = new User;
        $followTable = config('follow.followables_table', 'followables');
        $followUserKey = config('follow.user_foreign_key', 'user_id');

        $followers = [];
        $following = [];
        $mutual = [];

        if ($activeTab === 'followers') {
            $followers = $this->getFollowers($user, $authUser, $userModel, $followTable, $followUserKey);
        } elseif ($activeTab === 'following') {
            $following = $this->getFollowing($user, $authUser, $userModel, $followTable, $followUserKey);
        } elseif ($activeTab === 'mutual' && $authUser !== null) {
            $mutual = $this->getMutualFollowers($user, $authUser, $userModel, $followTable, $followUserKey);
        }

        // Get counts for all tabs
        $followersCount = method_exists($user, 'approvedFollowers')
            ? $user->approvedFollowers()->count()
            : 0;
        $followingCount = method_exists($user, 'approvedFollowings')
            ? $user->approvedFollowings()->count()
            : 0;
        $mutualCount = $authUser !== null
            ? $this->getMutualFollowersCount($user, $authUser, $userModel, $followTable, $followUserKey)
            : 0;

        return Inertia::render('Profile/Followers', [
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'display_name' => $user->display_name,
                'avatar_url' => $user->avatar_url,
            ],
            'activeTab' => $activeTab,
            'counts' => [
                'followers' => $followersCount,
                'following' => $followingCount,
                'mutual' => $mutualCount,
            ],
            'followers' => $followers,
            'following' => $following,
            'mutual' => $mutual,
        ]);
    }

    /**
     * Get users that follow the given user.
     *
     * @return array<int, array<string, mixed>>
     */
    private function getFollowers(
        User $user,
        ?User $authUser,
        User $userModel,
        string $followTable,
        string $followUserKey
    ): array {
        $followerIds = DB::table($followTable)
            ->where('followable_type', $userModel->getMorphClass())
            ->where('followable_id', $user->id)
            ->whereNotNull('accepted_at')
            ->pluck($followUserKey);

        $followers = User::query()
            ->whereIn('id', $followerIds)
            ->when($authUser !== null, function ($query) use ($authUser) {
                $query->excludeBlockedFor($authUser);
            })
            ->get([
                'id',
                'username',
                'display_name',
                'pronouns',
                'bio',
                'avatar_path',
                'cover_path',
            ])
            ->map(function (User $follower) use ($authUser) {
                $isFollowing = $authUser !== null && method_exists($authUser, 'isFollowing')
                    ? $authUser->isFollowing($follower)
                    : false;

                return [
                    'id' => $follower->id,
                    'username' => $follower->username,
                    'display_name' => $follower->display_name,
                    'pronouns' => $follower->pronouns,
                    'bio' => $follower->bio,
                    'avatar_url' => $follower->avatar_url,
                    'cover_url' => $follower->cover_url,
                    'is_following' => $isFollowing,
                ];
            })
            ->values()
            ->toArray();

        return $followers;
    }

    /**
     * Get users that the given user follows.
     *
     * @return array<int, array<string, mixed>>
     */
    private function getFollowing(
        User $user,
        ?User $authUser,
        User $userModel,
        string $followTable,
        string $followUserKey
    ): array {
        $followingIds = DB::table($followTable)
            ->where($followUserKey, $user->id)
            ->where('followable_type', $userModel->getMorphClass())
            ->whereNotNull('accepted_at')
            ->pluck('followable_id');

        $following = User::query()
            ->whereIn('id', $followingIds)
            ->when($authUser !== null, function ($query) use ($authUser) {
                $query->excludeBlockedFor($authUser);
            })
            ->get([
                'id',
                'username',
                'display_name',
                'pronouns',
                'bio',
                'avatar_path',
                'cover_path',
            ])
            ->map(function (User $followed) use ($authUser) {
                $isFollowing = $authUser !== null && method_exists($authUser, 'isFollowing')
                    ? $authUser->isFollowing($followed)
                    : false;

                return [
                    'id' => $followed->id,
                    'username' => $followed->username,
                    'display_name' => $followed->display_name,
                    'pronouns' => $followed->pronouns,
                    'bio' => $followed->bio,
                    'avatar_url' => $followed->avatar_url,
                    'cover_url' => $followed->cover_url,
                    'is_following' => $isFollowing,
                ];
            })
            ->values()
            ->toArray();

        return $following;
    }

    /**
     * Get mutual followers between the given user and authenticated user.
     *
     * @return array<int, array<string, mixed>>
     */
    private function getMutualFollowers(
        User $user,
        User $authUser,
        User $userModel,
        string $followTable,
        string $followUserKey
    ): array {
        // Get users that both $user and $authUser follow
        $userFollowingIds = DB::table($followTable)
            ->where($followUserKey, $user->id)
            ->where('followable_type', $userModel->getMorphClass())
            ->whereNotNull('accepted_at')
            ->pluck('followable_id');

        $authUserFollowingIds = DB::table($followTable)
            ->where($followUserKey, $authUser->id)
            ->where('followable_type', $userModel->getMorphClass())
            ->whereNotNull('accepted_at')
            ->pluck('followable_id');

        $mutualIds = $userFollowingIds->intersect($authUserFollowingIds);

        $mutual = User::query()
            ->whereIn('id', $mutualIds)
            ->excludeBlockedFor($authUser)
            ->get([
                'id',
                'username',
                'display_name',
                'pronouns',
                'bio',
                'avatar_path',
                'cover_path',
            ])
            ->map(function (User $mutualUser) use ($authUser) {
                $isFollowing = method_exists($authUser, 'isFollowing')
                    ? $authUser->isFollowing($mutualUser)
                    : false;

                return [
                    'id' => $mutualUser->id,
                    'username' => $mutualUser->username,
                    'display_name' => $mutualUser->display_name,
                    'pronouns' => $mutualUser->pronouns,
                    'bio' => $mutualUser->bio,
                    'avatar_url' => $mutualUser->avatar_url,
                    'cover_url' => $mutualUser->cover_url,
                    'is_following' => $isFollowing,
                ];
            })
            ->values()
            ->toArray();

        return $mutual;
    }

    /**
     * Get count of mutual followers.
     */
    private function getMutualFollowersCount(
        User $user,
        User $authUser,
        User $userModel,
        string $followTable,
        string $followUserKey
    ): int {
        $userFollowingIds = DB::table($followTable)
            ->where($followUserKey, $user->id)
            ->where('followable_type', $userModel->getMorphClass())
            ->whereNotNull('accepted_at')
            ->pluck('followable_id');

        $authUserFollowingIds = DB::table($followTable)
            ->where($followUserKey, $authUser->id)
            ->where('followable_type', $userModel->getMorphClass())
            ->whereNotNull('accepted_at')
            ->pluck('followable_id');

        return $userFollowingIds->intersect($authUserFollowingIds)->count();
    }
}
