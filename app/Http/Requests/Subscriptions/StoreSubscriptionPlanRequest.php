<?php

namespace App\Http\Requests\Subscriptions;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSubscriptionPlanRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'amount' => ['required', 'integer', 'min:100'],
            'currency' => ['required', 'string', 'size:3'],
            'interval' => ['required', 'string', Rule::in(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])],
            'interval_count' => ['nullable', 'integer', 'min:1', 'max:12'],
            'trial_days' => ['nullable', 'integer', 'min:0', 'max:365'],
            'is_active' => ['sometimes', 'boolean'],
            'is_public' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'currency' => strtoupper($this->input('currency', 'USD')),
            'interval_count' => $this->input('interval_count') ?? 1,
            'trial_days' => $this->input('trial_days') ?? 0,
            'is_active' => $this->boolean('is_active', true),
            'is_public' => $this->boolean('is_public', true),
        ]);
    }
}

