<?php

namespace App\Http\Requests\Posts;

use App\Enums\PostAudience;
use App\Enums\PostType;
use App\Models\Post;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Post|null $post */
        $post = $this->route('post');

        return $post !== null && $this->user()?->can('update', $post);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $payToView = PostAudience::PayToView->value;

        return [
            'type' => ['sometimes', Rule::enum(PostType::class)],
            'audience' => ['sometimes', Rule::enum(PostAudience::class)],
            'body' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'is_pinned' => ['sometimes', 'boolean'],
            'scheduled_at' => ['sometimes', 'nullable', 'date', 'after_or_equal:now'],
            'published_at' => ['sometimes', 'nullable', 'date'],
            'hashtags' => ['sometimes', 'array', 'max:8'],
            'hashtags.*' => ['string', 'max:120'],
            'media' => ['sometimes', 'array', 'max:6'],
            'media.*.disk' => ['required_with:media', 'string'],
            'media.*.path' => ['required_with:media', 'string'],
            'media.*.thumbnail_path' => ['nullable', 'string'],
            'media.*.mime_type' => ['required_with:media', 'string', 'max:150'],
            'media.*.position' => ['nullable', 'integer', 'min:0'],
            'media.*.width' => ['nullable', 'integer', 'min:1'],
            'media.*.height' => ['nullable', 'integer', 'min:1'],
            'media.*.duration' => ['nullable', 'integer', 'min:1'],
            'media.*.meta' => ['nullable', 'array'],
            'poll' => ['sometimes', 'nullable', 'array'],
            'poll.question' => ['required_with:poll', 'string', 'max:255'],
            'poll.allow_multiple' => ['nullable', 'boolean'],
            'poll.max_choices' => ['nullable', 'integer', 'min:2', 'max:10'],
            'poll.options' => ['nullable', 'array', 'min:2', 'max:6'],
            'poll.options.*' => ['string', 'max:140'],
            'poll.closes_at' => ['nullable', 'date', 'after:now'],
            'poll.meta' => ['nullable', 'array'],
            'paywall_price' => [
                'sometimes',
                Rule::requiredIf(fn () => $this->input('audience') === $payToView),
                'nullable',
                'integer',
                'min:100',
            ],
            'paywall_currency' => [
                'sometimes',
                Rule::requiredIf(fn () => $this->input('audience') === $payToView),
                'nullable',
                'string',
                'size:3',
            ],
            'extra_attributes' => ['sometimes', 'nullable', 'array'],
            'extra_attributes.tip_goal' => ['sometimes', 'nullable', 'array'],
            'extra_attributes.tip_goal.amount' => [
                'required_with:extra_attributes.tip_goal',
                'integer',
                'min:100',
            ],
            'extra_attributes.tip_goal.currency' => ['nullable', 'string', 'size:3'],
            'extra_attributes.tip_goal.label' => ['nullable', 'string', 'max:160'],
            'extra_attributes.tip_goal.deadline' => ['nullable', 'date', 'after:now'],
        ];
    }
}
