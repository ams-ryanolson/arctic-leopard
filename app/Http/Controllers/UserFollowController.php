<?php

namespace App\Http\Controllers;

use App\Http\Requests\Users\FollowUserRequest;
use App\Http\Requests\Users\UnfollowUserRequest;
use App\Models\User;
use App\Services\UserFollowService;
use Illuminate\Http\JsonResponse;

class UserFollowController extends Controller
{
    public function store(
        FollowUserRequest $request,
        User $user,
        UserFollowService $followService,
    ): JsonResponse {
        /** @var User $actor */
        $actor = $request->user();

        $result = $followService->follow($actor, $user);

        return response()->json([
            'status' => $result['pending'] ? 'pending' : 'following',
            'pending' => $result['pending'],
            'accepted' => $result['accepted'],
            'followers_count' => $user->approvedFollowers()->count(),
            'followings_count' => $actor->approvedFollowings()->count(),
        ]);
    }

    public function destroy(
        UnfollowUserRequest $request,
        User $user,
        UserFollowService $followService,
    ): JsonResponse {
        /** @var User $actor */
        $actor = $request->user();

        $followService->unfollow($actor, $user);

        return response()->json([
            'status' => 'unfollowed',
            'followers_count' => $user->approvedFollowers()->count(),
            'followings_count' => $actor->approvedFollowings()->count(),
        ]);
    }
}
