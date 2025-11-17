<?php

namespace App\Http\Requests\Posts;

use App\Models\Post;
use Illuminate\Foundation\Http\FormRequest;

class StorePostViewRequest extends FormRequest
{
    public function authorize(): bool
    {
        $post = $this->route('post');

        if (! $post instanceof Post) {
            return false;
        }

        return Post::query()
            ->whereKey($post->getKey())
            ->visibleTo($this->user())
            ->exists();
    }

    public function rules(): array
    {
        return [
            'session_uuid' => ['nullable', 'uuid'],
            'context' => ['nullable', 'array'],
            'context.source' => ['nullable', 'string', 'max:50'],
            'context.location' => ['nullable', 'string', 'max:50'],
            'context.viewport' => ['nullable', 'string', 'max:120'],
        ];
    }
}
