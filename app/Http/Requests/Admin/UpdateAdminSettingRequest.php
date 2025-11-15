<?php

namespace App\Http\Requests\Admin;

use App\Models\AdminSetting;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAdminSettingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null) {
            return false;
        }

        return $user->can('manageUsers', User::class) || $user->can('manageSettings');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $setting = AdminSetting::query()->where('key', $this->route('key'))->first();

        $rules = [
            'value' => ['required'],
        ];

        if ($setting !== null) {
            $type = $setting->type;

            $rules['value'] = match ($type) {
                'integer' => ['required', 'integer'],
                'boolean' => ['required', 'boolean'],
                'json' => ['required', 'json'],
                default => ['required', 'string'],
            };
        }

        return $rules;
    }
}
