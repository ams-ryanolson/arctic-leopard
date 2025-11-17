<?php

namespace App\Http\Requests\Signals;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateWishlistItemRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $isCrowdfunded = $this->boolean('is_crowdfunded', false);

        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'amount' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'currency' => ['sometimes', 'nullable', 'string', 'size:3'],
            'url' => ['sometimes', 'nullable', 'url', 'max:2048'],
            'image_url' => ['sometimes', 'nullable', 'url', 'max:2048'],
            'is_crowdfunded' => ['sometimes', 'required', 'boolean'],
            'quantity' => [
                'sometimes',
                Rule::requiredIf(fn () => ! $isCrowdfunded),
                'nullable',
                'integer',
                'min:1',
            ],
            'goal_amount' => [
                'sometimes',
                Rule::requiredIf(fn () => $isCrowdfunded),
                'nullable',
                'integer',
                'min:1',
            ],
            'expires_at' => ['sometimes', 'nullable', 'date', 'after:now'],
            'metadata' => ['sometimes', 'nullable', 'array'],
        ];
    }
}
