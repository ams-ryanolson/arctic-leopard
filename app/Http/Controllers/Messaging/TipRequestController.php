<?php

namespace App\Http\Controllers\Messaging;

use App\Http\Controllers\Controller;
use App\Http\Resources\MessageResource;
use App\Models\Message;
use App\Services\Messaging\MessageService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class TipRequestController extends Controller
{
    public function __construct(
        private MessageService $messages,
    ) {}

    public function accept(Request $request, Message $message): JsonResponse
    {
        $actor = $request->user();
        $conversation = $message->conversation()->firstOrFail();

        if (! $actor?->can('view', $conversation)) {
            throw new AuthorizationException;
        }

        if ($message->type !== 'tip_request') {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'Message is not a tip request.');
        }

        $metadata = $message->metadata ?? [];

        if (($metadata['status'] ?? 'pending') !== 'pending') {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'Tip request has already been resolved.');
        }

        $requesterId = Arr::get($metadata, 'requester_id');

        if ((int) $requesterId === (int) $actor->getKey()) {
            abort(Response::HTTP_FORBIDDEN, 'You cannot accept your own tip request.');
        }

        $message->forceFill([
            'metadata' => array_replace($metadata, [
                'status' => 'accepted',
                'responder_id' => $actor->getKey(),
                'responded_at' => now()->toIso8601String(),
            ]),
        ])->save();

        $amount = (float) Arr::get($metadata, 'amount', 0);
        $currency = Str::upper((string) Arr::get($metadata, 'currency', 'USD'));

        $tipMessage = $this->messages->sendMessage($actor, $conversation, [
            'type' => 'tip',
            'body' => null,
            'metadata' => [
                'amount' => $amount,
                'currency' => $currency,
                'status' => 'completed',
                'mode' => 'send',
                'originating_request_id' => $message->getKey(),
            ],
        ])->load(['author', 'attachments', 'reactions']);

        return response()->json([
            'request' => (new MessageResource($message->fresh(['author', 'attachments', 'reactions'])))->resolve(),
            'tip' => (new MessageResource($tipMessage))->resolve(),
        ]);
    }

    public function decline(Request $request, Message $message): JsonResponse
    {
        $actor = $request->user();
        $conversation = $message->conversation()->firstOrFail();

        if (! $actor?->can('view', $conversation)) {
            throw new AuthorizationException;
        }

        if ($message->type !== 'tip_request') {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'Message is not a tip request.');
        }

        $metadata = $message->metadata ?? [];

        if (($metadata['status'] ?? 'pending') !== 'pending') {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'Tip request has already been resolved.');
        }

        $message->forceFill([
            'metadata' => array_replace($metadata, [
                'status' => 'declined',
                'responder_id' => $actor?->getKey(),
                'responded_at' => now()->toIso8601String(),
            ]),
        ])->save();

        return response()->json([
            'request' => (new MessageResource($message->fresh(['author', 'attachments', 'reactions'])))->resolve(),
        ]);
    }
}
