<?php

namespace App\Services\Cache;

use App\Models\Post;
use Closure;
use Illuminate\Support\Facades\Cache;

class PostCacheService
{
    public function __construct(
        private int $ttlSeconds = 120,
    ) {}

    /**
     * @param  Closure():array<string, mixed>  $resolver
     * @return array<string, mixed>
     */
    public function remember(Post $post, Closure $resolver): array
    {
        return Cache::tags($this->tagsForPost($post->getKey()))
            ->remember($this->postCacheKey($post->getKey()), $this->ttlSeconds, $resolver);
    }

    public function forget(Post|int $post): void
    {
        $postId = $post instanceof Post ? $post->getKey() : $post;

        Cache::tags($this->tagsForPost($postId))->flush();
    }

    /**
     * @return list<string>
     */
    private function tagsForPost(int $postId): array
    {
        return [
            'posts',
            "post:{$postId}",
        ];
    }

    private function postCacheKey(int $postId): string
    {
        return "post:{$postId}:show";
    }
}
