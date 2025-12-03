<?php

namespace App\Http\Requests\LiveStreaming;

use App\Enums\LiveStreamCategory;
use App\Enums\LiveStreamVisibility;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLiveStreamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'category' => ['required', Rule::enum(LiveStreamCategory::class)],
            'visibility' => ['required', Rule::enum(LiveStreamVisibility::class)],
        ];
    }
}
