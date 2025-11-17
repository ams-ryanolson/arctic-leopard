<?php

namespace App\Support\Toasts;

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

/**
 * @phpstan-type ToastAction array{
 *     key: string,
 *     label: string,
 *     method?: string,
 *     route?: string,
 *     payload?: array<string, mixed>|null,
 *     meta?: array<string, mixed>|null
 * }
 * @phpstan-type ToastArray array{
 *     id: string,
 *     level: string,
 *     category: string,
 *     body: string,
 *     title?: string|null,
 *     icon?: string|null,
 *     actions?: array<ToastAction>,
 *     requiresInteraction?: bool,
 *     timeoutSeconds?: int|null,
 *     meta?: array<string, mixed>
 * }
 */
final class ToastPayload implements Arrayable
{
    /**
     * @param  array<ToastAction>  $actions
     * @param  array<string, mixed>  $meta
     */
    public function __construct(
        public readonly string $id,
        public readonly string $level,
        public readonly string $category,
        public readonly string $body,
        public readonly ?string $title = null,
        public readonly ?string $icon = null,
        public readonly array $actions = [],
        public readonly bool $requiresInteraction = false,
        public readonly ?int $timeoutSeconds = null,
        public readonly array $meta = [],
    ) {}

    /**
     * @param  array<string, mixed>  $attributes
     */
    public static function make(array $attributes): self
    {
        $actions = array_values(array_map(
            static fn (array $action): array => [
                'key' => Arr::get($action, 'key', (string) Str::ulid()),
                'label' => Arr::get($action, 'label'),
                'method' => Arr::get($action, 'method'),
                'route' => Arr::get($action, 'route'),
                'payload' => Arr::get($action, 'payload'),
                'meta' => Arr::get($action, 'meta', []),
            ],
            Arr::get($attributes, 'actions', []),
        ));

        return new self(
            id: Arr::get($attributes, 'id', (string) Str::ulid()),
            level: Arr::get($attributes, 'level', 'info'),
            category: Arr::get($attributes, 'category', 'notification'),
            body: Arr::get($attributes, 'body', ''),
            title: Arr::get($attributes, 'title'),
            icon: Arr::get($attributes, 'icon'),
            actions: $actions,
            requiresInteraction: (bool) Arr::get($attributes, 'requiresInteraction', false),
            timeoutSeconds: Arr::get($attributes, 'timeoutSeconds'),
            meta: Arr::get($attributes, 'meta', []),
        );
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'level' => $this->level,
            'category' => $this->category,
            'body' => $this->body,
            'title' => $this->title,
            'icon' => $this->icon,
            'actions' => $this->actions,
            'requiresInteraction' => $this->requiresInteraction,
            'timeoutSeconds' => $this->timeoutSeconds,
            'meta' => $this->meta,
        ];
    }

    public function withMeta(string $key, mixed $value): self
    {
        return self::make([
            ...$this->toArray(),
            'meta' => [
                ...$this->meta,
                $key => $value,
            ],
        ]);
    }

    /**
     * @return ToastAction|null
     */
    public function action(string $key): ?array
    {
        foreach ($this->actions as $action) {
            if (($action['key'] ?? null) === $key) {
                return $action;
            }
        }

        return null;
    }
}
