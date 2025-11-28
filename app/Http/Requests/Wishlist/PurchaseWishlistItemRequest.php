<?php

namespace App\Http\Requests\Wishlist;

use Illuminate\Foundation\Http\FormRequest;

class PurchaseWishlistItemRequest extends FormRequest
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
        return [
            'amount' => ['required', 'integer', 'min:500'], // Minimum $5.00 in cents
            'currency' => ['required', 'string', 'size:3'],
            'covers_fee' => ['sometimes', 'boolean'],
            'message' => ['nullable', 'string', 'max:1000'],
            'gateway' => ['nullable', 'string'],
            'method' => ['nullable', 'string'],
            'payment_method_id' => ['nullable', 'integer', 'exists:payment_methods,id'],
        ];
    }
}
