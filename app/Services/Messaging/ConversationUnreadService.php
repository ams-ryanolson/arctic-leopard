<?php

namespace App\Services\Messaging;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ConversationUnreadService
{
    private const CACHE_TTL_SECONDS = 30;

    public function getUnreadCount(User $user): int
    {
        $cacheKey = "messaging.unread_count.{$user->getKey()}";

        return Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($user): int {
            return DB::table('conversation_participants')
                ->join('messages', function ($join) {
                    $join->on('messages.conversation_id', '=', 'conversation_participants.conversation_id')
                        ->whereColumn('messages.id', '>', 'conversation_participants.last_read_message_id');
                })
                ->where('conversation_participants.user_id', $user->getKey())
                ->whereNull('conversation_participants.left_at')
                ->count();
        });
    }

    public function clearCache(User $user): void
    {
        $cacheKey = "messaging.unread_count.{$user->getKey()}";
        Cache::forget($cacheKey);
    }
}
