<?php

namespace App\Http\Controllers;

use App\Http\Requests\Users\RespondToFollowRequest;
use App\Models\User;
use App\Services\UserFollowService;
use Illuminate\Http\JsonResponse;

class UserFollowRequestController extends Controller
{
    public function accept(
        RespondToFollowRequest $request,
        User $user,
        User $follower,
        UserFollowService $followService,
    ): JsonResponse {
        $followService->accept($user, $follower);

        return response()->json([
            'status' => 'accepted',
            'follower_id' => $follower->getKey(),
            'followers_count' => $user->approvedFollowers()->count(),
            'pending_follow_request_count' => $user->pendingFollowers()->count(),
        ]);
    }

    public function destroy(
        RespondToFollowRequest $request,
        User $user,
        User $follower,
        UserFollowService $followService,
    ): JsonResponse {
        $followService->reject($user, $follower);

        return response()->json([
            'status' => 'rejected',
            'follower_id' => $follower->getKey(),
            'followers_count' => $user->approvedFollowers()->count(),
            'pending_follow_request_count' => $user->pendingFollowers()->count(),
        ]);
    }
}
