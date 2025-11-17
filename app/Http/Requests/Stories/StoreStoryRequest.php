<?php

namespace App\Http\Requests\Stories;

use App\Enums\StoryAudience;
use App\Models\Story;
use App\Services\TemporaryUploadService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Story::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'media' => ['required', 'array', 'max:1'],
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
            'media.*.width' => ['nullable', 'integer', 'min:1'],
            'media.*.height' => ['nullable', 'integer', 'min:1'],
            'media.*.duration' => ['nullable', 'integer', 'min:1'],
            'media.*.is_primary' => ['nullable', 'boolean'],
            'media.*.filename' => ['nullable', 'string', 'max:255'],
            'media.*.original_name' => ['nullable', 'string', 'max:255'],
            'media.*.size' => ['nullable', 'integer', 'min:1'],
            'media.*.meta' => ['nullable', 'array'],
            'audience' => ['required', Rule::enum(StoryAudience::class)],
            'is_subscriber_only' => ['sometimes', 'boolean'],
            'scheduled_at' => ['nullable', 'date', 'after_or_equal:now'],
            'position' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
