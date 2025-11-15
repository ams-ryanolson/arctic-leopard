<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateDiscountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('manage settings');
    }

    public function rules(): array
    {
        $discountId = $this->route('discount')->id;

        return [
            'code' => ['required', 'string', 'max:255', Rule::unique('membership_discounts', 'code')->ignore($discountId)],
            'description' => ['nullable', 'string'],
            'discount_type' => ['required', 'string', 'in:percentage,fixed_amount'],
            'discount_value' => ['required', 'integer', 'min:1'],
            'membership_plan_id' => ['nullable', 'integer', 'exists:membership_plans,id'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['boolean'],
        ];
    }
}
