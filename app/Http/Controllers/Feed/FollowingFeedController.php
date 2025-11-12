<?php

namespace App\Http\Controllers\Feed;

use App\Http\Controllers\Controller;
use App\Services\Cache\TimelineCacheService;
use App\Services\Feed\FeedService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FollowingFeedController extends Controller
{
    public function __construct(
        private TimelineCacheService $timelineCache,
        private FeedService $feedService,
    )
    {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $page = max(1, (int) $request->integer('page', 1));

        if ($user === null) {
            abort(401);
        }

        $payload = $this->timelineCache->rememberFollowingFeed($user, $page, function () use ($request, $user, $page) {
            return $this->feedService->getFollowingFeed(
                $user,
                $page,
                20,
                $request,
            );
        });

        return response()->json($payload);
    }
}
