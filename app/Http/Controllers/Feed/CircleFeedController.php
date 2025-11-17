<?php

namespace App\Http\Controllers\Feed;

use App\Http\Controllers\Controller;
use App\Models\Circle;
use App\Services\Feed\FeedService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CircleFeedController extends Controller
{
    public function __construct(private readonly FeedService $feedService) {}

    public function show(Request $request, Circle $circle): JsonResponse
    {
        $this->authorize('view', $circle);

        $viewer = $request->user();
        $page = max(1, (int) $request->integer('page', 1));
        $perPage = max(1, (int) $request->integer('per_page', 10));

        $payload = $this->feedService->getCircleFeed(
            $circle,
            $viewer,
            $page,
            $perPage,
            $request,
        );

        return response()->json($payload);
    }
}
