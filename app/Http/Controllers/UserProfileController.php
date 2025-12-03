<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserProfileController extends Controller
{
    public function show(Request $request, User $user): JsonResponse
    {
        $authUser = $request->user();

        if ($authUser !== null && $authUser->hasBlockRelationshipWith($user)) {
            abort(404);
        }

        $isOwnProfile = $authUser?->id === $user->id;
        $followersCount = method_exists($user, 'approvedFollowers')
            ? $user->approvedFollowers()->count()
            : 0;
        $followingCount = method_exists($user, 'approvedFollowings')
            ? $user->approvedFollowings()->count()
            : 0;
        $postCount = Post::query()->forAuthor($user)->count();

        $isFollowing = $authUser !== null && method_exists($authUser, 'isFollowing')
            ? $authUser->isFollowing($user)
            : false;

        $hasPendingFollowRequest = $authUser !== null && method_exists($authUser, 'hasRequestedToFollow')
            ? $authUser->hasRequestedToFollow($user)
            : false;

        return response()->json([
            'id' => $user->id,
            'username' => $user->username,
            'display_name' => $user->display_name,
            'bio' => $user->bio,
            'avatar_url' => $user->avatar_url,
            'cover_url' => $user->cover_url,
            'is_verified' => $user->isIdVerified(),
            'is_following' => $isFollowing,
            'has_pending_follow_request' => $hasPendingFollowRequest,
            'can_follow' => ! $isOwnProfile && $authUser !== null,
            'stats' => [
                'posts' => $postCount,
                'followers' => $followersCount,
                'following' => $followingCount,
            ],
        ]);
    }
}
