<?php

namespace App\Http\Requests\Posts;

use App\Enums\PostAudience;
use App\Enums\PostType;
use App\Models\Post;
use App\Services\TemporaryUploadService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Post::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $payToView = PostAudience::PayToView->value;

        return [
            'type' => ['required', Rule::enum(PostType::class)],
            'audience' => ['required', Rule::enum(PostAudience::class)],
            'body' => [
                'nullable',
                'string',
                'max:10000',
                Rule::requiredIf(fn () => $this->input('type') === PostType::Text->value),
            ],
            'is_pinned' => ['sometimes', 'boolean'],
            'scheduled_at' => ['nullable', 'date', 'after_or_equal:now'],
            'published_at' => ['nullable', 'date'],
            'hashtags' => ['sometimes', 'array', 'max:8'],
            'hashtags.*' => ['string', 'max:120'],
            'media' => [
                Rule::requiredIf(fn () => $this->input('type') === PostType::Media->value),
                'array',
                'max:6',
            ],
            'media.*.identifier' => [
                'required_with:media',
                'string',
                function ($attribute, $value, $fail) {
                    if (! is_string($value)) {
                        return;
                    }

                    $temporaryUploads = app(TemporaryUploadService::class);

                    if (! $temporaryUploads->exists($value)) {
                        $fail('The temporary upload identifier is invalid or has expired.');
                    }
                },
            ],
            'media.*.mime_type' => ['required_with:media', 'string', 'max:150'],
            'media.*.position' => ['nullable', 'integer', 'min:0'],
            'media.*.width' => ['nullable', 'integer', 'min:1'],
            'media.*.height' => ['nullable', 'integer', 'min:1'],
            'media.*.duration' => ['nullable', 'integer', 'min:1'],
            'media.*.is_primary' => ['nullable', 'boolean'],
            'media.*.filename' => ['nullable', 'string', 'max:255'],
            'media.*.original_name' => ['nullable', 'string', 'max:255'],
            'media.*.size' => ['nullable', 'integer', 'min:1'],
            'media.*.meta' => ['nullable', 'array'],
            'poll' => [
                'nullable',
                Rule::requiredIf(fn () => $this->input('type') === PostType::Poll->value),
                'array',
            ],
            'poll.question' => ['required_with:poll', 'string', 'max:255'],
            'poll.allow_multiple' => ['nullable', 'boolean'],
            'poll.max_choices' => ['nullable', 'integer', 'min:2', 'max:10'],
            'poll.options' => ['required_with:poll', 'array', 'min:2', 'max:6'],
            'poll.options.*' => ['string', 'max:140'],
            'poll.closes_at' => ['nullable', 'date', 'after:now'],
            'poll.meta' => ['nullable', 'array'],
            'paywall_price' => [
                Rule::requiredIf(fn () => $this->input('audience') === $payToView),
                'nullable',
                'integer',
                'min:100',
            ],
            'paywall_currency' => [
                Rule::requiredIf(fn () => $this->input('audience') === $payToView),
                'nullable',
                'string',
                'size:3',
            ],
            'extra_attributes' => ['nullable', 'array'],
            'extra_attributes.tip_goal' => ['nullable', 'array'],
            'extra_attributes.tip_goal.amount' => [
                'required_with:extra_attributes.tip_goal',
                'integer',
                'min:100',
            ],
            'extra_attributes.tip_goal.currency' => ['nullable', 'string', 'size:3'],
            'extra_attributes.tip_goal.label' => ['nullable', 'string', 'max:160'],
            'extra_attributes.tip_goal.deadline' => ['nullable', 'date', 'after:now'],
            'post_to_circles' => ['sometimes', 'boolean'],
        ];
    }
}
