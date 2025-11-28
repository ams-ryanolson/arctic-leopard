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
