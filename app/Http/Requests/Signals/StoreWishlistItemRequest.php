<?php

namespace App\Http\Requests\Signals;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWishlistItemRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'amount' => ['nullable', 'integer', 'min:1'],
            'currency' => ['nullable', 'string', 'size:3'],
            'url' => ['nullable', 'url', 'max:2048'],
            'image_url' => ['nullable', 'url', 'max:2048'],
            'is_crowdfunded' => ['required', 'boolean'],
            'quantity' => [
                Rule::requiredIf(fn () => ! $isCrowdfunded),
                'nullable',
                'integer',
                'min:1',
            ],
            'goal_amount' => [
                Rule::requiredIf(fn () => $isCrowdfunded),
                'nullable',
                'integer',
                'min:1',
            ],
            'expires_at' => ['nullable', 'date', 'after:now'],
            'metadata' => ['nullable', 'array'],
        ];
    }
}
