<?php

namespace App\Services\Toasts;

use App\Events\Toasts\ToastPushed;
use App\Models\User;
use App\Support\Toasts\ToastPayload;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Support\Carbon;

class ToastBus
{
    public const DEFAULT_LEVEL = 'info';

    private const DEFAULT_CATEGORY = 'notification';

    private const DEFAULT_TTL_SECONDS = 120;

    public function __construct(
        private readonly Repository $cache,
        private readonly Dispatcher $events,
        private readonly int $ttlSeconds = self::DEFAULT_TTL_SECONDS,
    ) {
    }

    public function push(User $user, ToastPayload $payload): ToastPayload
    {
        $this->store($user, $payload);

        $this->events->dispatch(new ToastPushed($user, $payload));

        return $payload;
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function notify(User $user, array $attributes): ToastPayload
    {
        return $this->push($user, ToastPayload::make($attributes));
    }

    public function info(User $user, string $body, array $overrides = []): ToastPayload
    {
        return $this->notify($user, [
            'level' => self::DEFAULT_LEVEL,
            'body' => $body,
            ...$overrides,
        ]);
    }

    public function success(User $user, string $body, array $overrides = []): ToastPayload
    {
        return $this->notify($user, [
            'level' => 'success',
            'body' => $body,
            ...$overrides,
        ]);
    }

    public function warning(User $user, string $body, array $overrides = []): ToastPayload
    {
        return $this->notify($user, [
            'level' => 'warning',
            'body' => $body,
            ...$overrides,
        ]);
    }

    public function danger(User $user, string $body, array $overrides = []): ToastPayload
    {
        return $this->notify($user, [
            'level' => 'danger',
            'body' => $body,
            ...$overrides,
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function flush(User $user): array
    {
        $key = $this->cacheKey($user);

        $buffer = $this->cache->pull($key, []);

        return array_map(
            static fn (array $toast): array => ToastPayload::make($toast)->toArray(),
            $buffer,
        );
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function peek(User $user): array
    {
        $buffer = $this->cache->get($this->cacheKey($user), []);

        return array_map(
            static fn (array $toast): array => ToastPayload::make($toast)->toArray(),
            $buffer,
        );
    }

    public function find(User $user, string $toastId): ?ToastPayload
    {
        $toast = collect($this->cache->get($this->cacheKey($user), []))
            ->firstWhere('id', $toastId);

        return $toast ? ToastPayload::make($toast) : null;
    }

    public function forget(User $user, string $toastId): ?ToastPayload
    {
        $key = $this->cacheKey($user);

        $collection = collect($this->cache->get($key, []));

        $toast = $collection->firstWhere('id', $toastId);

        if (! $toast) {
            return null;
        }

        $remaining = $collection
            ->reject(static fn (array $candidate): bool => (string) ($candidate['id'] ?? '') === $toastId)
            ->values()
            ->all();

        if ($remaining === []) {
            $this->cache->forget($key);
        } else {
            $this->cache->put($key, $remaining, $this->ttl());
        }

        return ToastPayload::make($toast);
    }

    private function store(User $user, ToastPayload $payload): void
    {
        $key = $this->cacheKey($user);

        $buffer = collect($this->cache->get($key, []))
            ->keyBy(static fn (array $toast): string => (string) ($toast['id'] ?? ''))
            ->put($payload->id, $payload->toArray())
            ->values()
            ->all();

        $this->cache->put($key, $buffer, $this->ttl());
    }

    private function cacheKey(User $user): string
    {
        return sprintf('toasts:user:%s', $user->getKey());
    }

    private function ttl(): Carbon
    {
        return Carbon::now()->addSeconds($this->ttlSeconds);
    }
}

