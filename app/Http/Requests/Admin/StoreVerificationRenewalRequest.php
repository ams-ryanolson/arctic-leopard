<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class StoreVerificationRenewalRequest extends FormRequest
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

        $targetUser = $this->route('user');

        if (! $targetUser instanceof User) {
            return false;
        }

        return $user->hasRole(['Admin', 'Super Admin']) || $user->can('manage users') || $user->can('manageCompliance');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'compliance_note' => ['required', 'string', 'max:1000'],
        ];
    }
}
