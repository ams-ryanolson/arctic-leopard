<?php

namespace App\Http\Requests\Comments;

use App\Models\Comment;
use App\Models\Post;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Post|null $post */
        $post = $this->route('post');

        return $post !== null && $this->user()?->can('interact', $post);
    }

    public function rules(): array
    {
        /** @var Post|null $post */
        $post = $this->route('post');

        return [
            'body' => ['required', 'string', 'max:4000'],
            'parent_id' => [
                'nullable',
                'integer',
                Rule::exists('comments', 'id')->where(static function ($query) use ($post): void {
                    if ($post !== null) {
                        $query->where('post_id', $post->getKey());
                    }
                }),
            ],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if (! $this->filled('parent_id')) {
                return;
            }

            $parent = Comment::query()->find($this->integer('parent_id'));

            if ($parent !== null && $parent->depth >= 2) {
                $validator->errors()->add('parent_id', __('Replies cannot nest more than two levels deep.'));
            }
        });
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('parent_id') && $this->integer('parent_id') <= 0) {
            $this->merge(['parent_id' => null]);
        }
    }
}
