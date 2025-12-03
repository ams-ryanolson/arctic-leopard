<?php

use App\Models\Circle;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;

Broadcast::channel('users.{id}.toasts', static fn (User $user, int $id): bool => (int) $user->getKey() === (int) $id);

Broadcast::channel('users.{id}.notifications', static fn (User $user, int $id): bool => (int) $user->getKey() === (int) $id);

Broadcast::channel('users.{id}.timeline', static fn (User $user, int $id): bool => (int) $user->getKey() === (int) $id);

Broadcast::channel('timeline.{id}', static fn (User $user, int $id): bool => (int) $user->getKey() === (int) $id);

Broadcast::channel('circles.{circle}', static function (User $user, string $circle): array|bool {
    $circleModel = Circle::query()
        ->when(
            is_numeric($circle),
            static fn ($query) => $query->whereKey((int) $circle),
            static fn ($query) => $query->where('slug', $circle),
        )
        ->first();

    if ($circleModel === null) {
        return false;
    }

    $isMember = $circleModel->members()
        ->whereKey($user->getKey())
        ->exists();

    if (! $isMember) {
        return false;
    }

    return [
        'id' => $user->getKey(),
        'name' => $user->display_name ?? $user->username ?? $user->name,
        'avatar' => $user->avatar_url,
    ];
});

Broadcast::channel('conversations.{conversationUlid}', static function (User $user, string $conversationUlid): array|bool {
    Log::info('Broadcasting authorization attempt', [
        'user_id' => $user->getKey(),
        'conversation_param' => $conversationUlid,
        'channel' => "conversations.{$conversationUlid}",
        'user_authenticated' => $user !== null,
    ]);

    $conversationModel = Conversation::query()
        ->when(
            is_numeric($conversationUlid),
            static fn ($query) => $query->whereKey((int) $conversationUlid),
            static fn ($query) => $query->where('ulid', $conversationUlid),
        )
        ->first();

    if ($conversationModel === null) {
        Log::warning('Broadcasting authorization failed: conversation not found', [
            'conversation_param' => $conversationUlid,
            'user_id' => $user->getKey(),
        ]);

        return false;
    }

    $participant = $conversationModel->participants()
        ->where('user_id', $user->getKey())
        ->whereNull('left_at')
        ->first();

    if ($participant === null) {
        Log::warning('Broadcasting authorization failed: user is not a participant', [
            'user_id' => $user->getKey(),
            'conversation_id' => $conversationModel->getKey(),
            'conversation_ulid' => $conversationModel->ulid,
        ]);

        return false;
    }

    Log::info('Broadcasting authorization successful', [
        'user_id' => $user->getKey(),
        'conversation_id' => $conversationModel->getKey(),
        'conversation_ulid' => $conversationModel->ulid,
    ]);

    return [
        'id' => $user->getKey(),
        'name' => $user->display_name ?? $user->username ?? $user->name,
        'avatar' => $user->avatar_url,
        'role' => $participant->role,
    ];
});

// Live streaming channels
Broadcast::channel('stream.{stream}', static function (User $user, \App\Models\LiveStream $stream): array|bool {
    if (! $stream->canJoin($user)) {
        return false;
    }

    return [
        'id' => $user->getKey(),
        'name' => $user->display_name ?? $user->username ?? $user->name,
        'avatar' => $user->avatar_url,
    ];
});

Broadcast::channel('private-stream.{stream}', static function (User $user, \App\Models\LiveStream $stream): array|bool {
    if ($stream->user_id !== $user->getKey() && ! $stream->canModerate($user)) {
        return false;
    }

    return [
        'id' => $user->getKey(),
        'name' => $user->display_name ?? $user->username ?? $user->name,
        'avatar' => $user->avatar_url,
    ];
});

Broadcast::channel('private-stream-chat.{stream}', static function (User $user, \App\Models\LiveStream $stream): array|bool {
    if (! $stream->canJoin($user)) {
        return false;
    }

    return [
        'id' => $user->getKey(),
        'name' => $user->display_name ?? $user->username ?? $user->name,
        'avatar' => $user->avatar_url,
    ];
});

Broadcast::channel('private-stream-stage.{stream}', static function (User $user, \App\Models\LiveStream $stream): array|bool {
    if ($stream->user_id !== $user->getKey() && ! $stream->canModerate($user)) {
        return false;
    }

    return [
        'id' => $user->getKey(),
        'name' => $user->display_name ?? $user->username ?? $user->name,
        'avatar' => $user->avatar_url,
    ];
});
