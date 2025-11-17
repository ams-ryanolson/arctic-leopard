<?php

namespace App\Http\Controllers\Feed;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Cache\TimelineCacheService;
use App\Services\Feed\FeedService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserFeedController extends Controller
{
    public function __construct(
        private TimelineCacheService $timelineCache,
        private FeedService $feedService,
    ) {}

    public function index(Request $request, User $user): JsonResponse
    {
        $viewer = $request->user();
        $page = max(1, (int) $request->integer('page', 1));

        $payload = $this->timelineCache->rememberUserFeed(
            $user,
            $viewer,
            $page,
            function () use ($request, $user, $viewer, $page) {
                return $this->feedService->getUserFeed(
                    $user,
                    $viewer,
                    $page,
                    20,
                    $request,
                );
            },
        );

        return response()->json($payload);
    }
}
