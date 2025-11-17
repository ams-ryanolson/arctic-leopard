<?php

namespace App\Jobs;

use App\Models\Post;
use App\Models\PostViewEvent;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Throwable;

class RecordPostView implements ShouldQueue
{
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    /**
     * @param  array<string, mixed>  $context
     */
    public function __construct(
        public int $postId,
        public ?int $viewerId,
        public ?string $sessionUuid,
        public string $fingerprintHash,
        public ?string $ipHash,
        public ?string $userAgentHash,
        public ?string $countryCode,
        public array $context,
        public Carbon $occurredAt,
        public int $dedupeTtlSeconds = 120,
    ) {}

    public function handle(): void
    {
        $storeName = config('cache.default');

        $cacheStore = Cache::store($storeName);

        if (config('cache.stores.redis') !== null) {
            try {
                $cacheStore = Cache::store('redis');
            } catch (Throwable) {
                // Fallback to the default cache store when Redis is unavailable.
            }
        }

        $cacheKey = sprintf('post:%d:view:%s', $this->postId, $this->fingerprintHash);

        if (! $cacheStore->add($cacheKey, true, $this->dedupeTtlSeconds)) {
            return;
        }

        Post::query()
            ->whereKey($this->postId)
            ->increment('views_count');

        PostViewEvent::query()->create([
            'post_id' => $this->postId,
            'viewer_id' => $this->viewerId,
            'session_uuid' => $this->sessionUuid,
            'fingerprint_hash' => $this->fingerprintHash,
            'ip_hash' => $this->ipHash,
            'user_agent_hash' => $this->userAgentHash,
            'country_code' => $this->countryCode,
            'context' => $this->context,
            'occurred_at' => $this->occurredAt,
        ]);
    }
}
