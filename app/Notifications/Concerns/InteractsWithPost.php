<?php

namespace App\Notifications\Concerns;

use App\Models\Post;
use Illuminate\Support\Str;

trait InteractsWithPost
{
    /**
     * Structure post data shared across notifications.
     *
     * @return array<string, mixed>
     */
    protected function postSubject(Post $post): array
    {
        $post->loadMissing('author');

        $author = $post->author;

        return array_filter([
            'type' => 'post',
            'id' => $post->getKey(),
            'author' => $author ? [
                'id' => $author->getKey(),
                'username' => $author->username,
                'display_name' => $author->display_name,
            ] : null,
        ]);
    }

    /**
     * Provide supplemental metadata for a post.
     *
     * @return array<string, mixed>
     */
    protected function postMeta(Post $post): array
    {
        return array_filter([
            'excerpt' => $post->body ? Str::limit(strip_tags($post->body), 140) : null,
            'published_at' => $post->published_at?->toJSON(),
        ]);
    }
}




