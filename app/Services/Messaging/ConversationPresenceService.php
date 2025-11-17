<?php

namespace App\Services\Messaging;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Support\Carbon;

class ConversationPresenceService
{
    private const HEARTBEAT_TTL_SECONDS = 90;

    private const TYPING_TTL_SECONDS = 12;

    public function __construct(
        private Repository $cache,
    ) {}

    public function heartbeat(Conversation $conversation, User $user): void
    {
        $entries = $this->pruneStale($this->presenceEntries($conversation), self::HEARTBEAT_TTL_SECONDS);

        $entries[$user->getKey()] = [
            'user_id' => $user->getKey(),
            'last_seen_at' => Carbon::now()->toIso8601String(),
            'expires_at' => Carbon::now()->addSeconds(self::HEARTBEAT_TTL_SECONDS)->toIso8601String(),
        ];

        $this->cache->put(
            $this->presenceKey($conversation),
            array_values($entries),
            self::HEARTBEAT_TTL_SECONDS,
        );
    }

    public function online(Conversation $conversation): array
    {
        $entries = $this->pruneStale($this->presenceEntries($conversation), self::HEARTBEAT_TTL_SECONDS);

        return array_values($entries);
    }

    public function setTyping(Conversation $conversation, User $user, bool $isTyping): void
    {
        $entries = $this->pruneStale($this->typingEntries($conversation), self::TYPING_TTL_SECONDS);

        if ($isTyping) {
            $entries[$user->getKey()] = [
                'user_id' => $user->getKey(),
                'started_at' => Carbon::now()->toIso8601String(),
                'expires_at' => Carbon::now()->addSeconds(self::TYPING_TTL_SECONDS)->toIso8601String(),
            ];
        } else {
            unset($entries[$user->getKey()]);
        }

        $this->cache->put(
            $this->typingKey($conversation),
            array_values($entries),
            self::TYPING_TTL_SECONDS,
        );
    }

    public function typing(Conversation $conversation): array
    {
        $entries = $this->pruneStale($this->typingEntries($conversation), self::TYPING_TTL_SECONDS);

        return array_values($entries);
    }

    /**
     * @param  array<int, array<string, mixed>>  $entries
     * @return array<int, array<string, mixed>>
     */
    protected function pruneStale(array $entries, int $ttlSeconds): array
    {
        $now = Carbon::now();

        return collect($entries)
            ->filter(function (array $entry): bool {
                $expiresAt = isset($entry['expires_at']) ? Carbon::parse($entry['expires_at']) : null;

                return $expiresAt === null || $expiresAt->isFuture();
            })
            ->keyBy(static fn (array $entry): string => (string) ($entry['user_id'] ?? ''))
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    protected function presenceEntries(Conversation $conversation): array
    {
        return $this->cache->get($this->presenceKey($conversation), []);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    protected function typingEntries(Conversation $conversation): array
    {
        return $this->cache->get($this->typingKey($conversation), []);
    }

    protected function presenceKey(Conversation $conversation): string
    {
        return sprintf('messaging:presence:%d', $conversation->getKey());
    }

    protected function typingKey(Conversation $conversation): string
    {
        return sprintf('messaging:typing:%d', $conversation->getKey());
    }
}
