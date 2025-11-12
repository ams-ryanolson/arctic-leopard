<?php

use App\Models\Circle;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

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

Broadcast::channel('conversations.{conversation}', static function (User $user, Conversation $conversation): array|bool {
    $participant = $conversation->participants()
        ->where('user_id', $user->getKey())
        ->whereNull('left_at')
        ->first();

    if ($participant === null) {
        return false;
    }

    return [
        'id' => $user->getKey(),
        'name' => $user->display_name ?? $user->username ?? $user->name,
        'avatar' => $user->avatar_url,
        'role' => $participant->role,
    ];
});


