<?php

namespace App\Http\Requests\Payments;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentMethodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'provider_token_id' => ['required', 'string'],
            'gateway' => ['nullable', 'string', 'in:ccbill'],
            'is_default' => ['boolean'],
            'billing_address' => ['nullable', 'array'],
            // Card details - required for CCBill since their API doesn't return card info
            'card_last_four' => ['nullable', 'string', 'size:4', 'regex:/^\d{4}$/'],
            'card_brand' => ['nullable', 'string', 'max:50'],
            'card_exp_month' => ['nullable', 'string', 'size:2', 'regex:/^(0[1-9]|1[0-2])$/'],
            'card_exp_year' => ['nullable', 'string', 'size:4', 'regex:/^\d{4}$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'provider_token_id.required' => 'Payment token ID is required.',
            'gateway.in' => 'Invalid gateway specified.',
        ];
    }
}
