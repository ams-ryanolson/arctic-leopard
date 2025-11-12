<?php

namespace App\Http\Requests\Circles;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CircleFilterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:120'],
            'interest' => ['nullable', 'string', 'exists:interests,slug'],
            'facet' => ['nullable', 'string', 'max:120'],
            'joined' => ['nullable', 'boolean'],
            'sort' => ['nullable', 'string', Rule::in(['featured', 'recent', 'members'])],
        ];
    }

    /**
     * Normalise incoming query parameters.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('joined')) {
            $this->merge([
                'joined' => filter_var($this->input('joined'), FILTER_VALIDATE_BOOLEAN),
            ]);
        }
    }
}
