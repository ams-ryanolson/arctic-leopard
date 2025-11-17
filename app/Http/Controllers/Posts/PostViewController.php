<?php

namespace App\Http\Controllers\Posts;

use App\Http\Controllers\Controller;
use App\Http\Requests\Posts\StorePostViewRequest;
use App\Jobs\RecordPostView;
use App\Models\Post;
use App\Services\Geo\CountryResolver;
use Illuminate\Http\JsonResponse;

class PostViewController extends Controller
{
    public function __construct(private readonly CountryResolver $countryResolver) {}

    public function store(StorePostViewRequest $request, Post $post): JsonResponse
    {
        $validated = $request->validated();
        $viewer = $request->user();
        $ipAddress = (string) $request->ip();
        $userAgent = (string) $request->userAgent();
        $sessionUuid = $validated['session_uuid'] ?? ($request->hasSession() ? $request->session()->getId() : null);
        $context = $validated['context'] ?? [];

        $countryCode = $this->countryResolver->resolve(
            viewer: $viewer,
            ipAddress: $ipAddress,
            context: $context,
        );

        $fingerprintParts = [
            $post->getKey(),
            $viewer?->getKey() ?? 'guest',
            $sessionUuid ?? 'no-session',
            $ipAddress !== '' ? $ipAddress : 'ip-missing',
            $userAgent !== '' ? $userAgent : 'ua-missing',
        ];

        RecordPostView::dispatch(
            postId: $post->getKey(),
            viewerId: $viewer?->getKey(),
            sessionUuid: $sessionUuid,
            fingerprintHash: hash('sha256', implode('|', $fingerprintParts)),
            ipHash: $ipAddress !== '' ? hash('sha256', $ipAddress) : null,
            userAgentHash: $userAgent !== '' ? hash('sha256', $userAgent) : null,
            countryCode: $countryCode,
            context: $context,
            occurredAt: now(),
        );

        return response()->json([
            'status' => 'queued',
        ]);
    }
}
