<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMembershipPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage settings') ?? false;
    }

    public function rules(): array
    {
        $plan = $this->route('plan');

        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', Rule::unique('membership_plans', 'slug')->ignore($plan)],
            'description' => ['nullable', 'string'],
            'monthly_price' => ['required', 'integer', 'min:0'],
            'yearly_price' => ['required', 'integer', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],
            'role_to_assign' => ['required', 'string', Rule::exists('roles', 'name')],
            'permissions_to_grant' => ['nullable', 'array'],
            'permissions_to_grant.*' => ['string', Rule::exists('permissions', 'name')],
            'features' => ['nullable', 'array', 'sometimes'],
            'is_active' => ['boolean'],
            'is_public' => ['boolean'],
            'display_order' => ['integer', 'min:0'],
            'allows_recurring' => ['boolean'],
            'allows_one_time' => ['boolean'],
            'one_time_duration_days' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
