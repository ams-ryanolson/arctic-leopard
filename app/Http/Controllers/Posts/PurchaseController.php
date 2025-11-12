<?php

namespace App\Http\Controllers\Posts;

use App\Http\Controllers\Controller;
use App\Http\Requests\Posts\PurchasePostRequest;
use App\Http\Resources\PostPurchaseResource;
use App\Models\Post;
use App\Services\Posts\PostLockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class PurchaseController extends Controller
{
    public function store(
        PurchasePostRequest $request,
        Post $post,
        PostLockService $postLockService,
    ): JsonResponse {
        $this->authorize('purchase', $post);

        [$purchase, $intent] = $postLockService->purchase(
            $request->user(),
            $post,
            (int) $request->integer('amount'),
            $request->string('currency')->upper()->value(),
            [
                'gateway' => $request->input('gateway'),
                'method' => $request->input('method'),
                'details' => $request->input('meta', []),
            ],
            $request->filled('expires_at') ? $request->date('expires_at') : null,
        );

        $purchase->loadMissing('post.author', 'post.media', 'post.poll.options', 'post.hashtags');

        if ($request->user()) {
            $request->user()->attachLikeStatus($purchase->post);
            $request->user()->attachBookmarkStatus($purchase->post);
        }

        $resource = (new PostPurchaseResource($purchase))
            ->toArray($request);

        return response()->json([
            'purchase' => $resource,
            'payment_intent' => $intent,
        ], Response::HTTP_CREATED);
    }
}
