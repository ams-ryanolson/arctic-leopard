<?php

namespace App\Http\Requests\Subscriptions;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSubscriptionPlanRequest extends FormRequest
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
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'amount' => ['sometimes', 'integer', 'min:100'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'interval' => ['sometimes', 'string', Rule::in(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])],
            'interval_count' => ['nullable', 'integer', 'min:1', 'max:12'],
            'trial_days' => ['nullable', 'integer', 'min:0', 'max:365'],
            'is_active' => ['sometimes', 'boolean'],
            'is_public' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('currency')) {
            $this->merge(['currency' => strtoupper((string) $this->input('currency'))]);
        }

        if ($this->has('interval_count') && $this->input('interval_count') === null) {
            $this->merge(['interval_count' => 1]);
        }
    }
}

