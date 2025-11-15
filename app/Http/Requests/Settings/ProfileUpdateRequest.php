<?php

namespace App\Http\Requests\Settings;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'username' => [
                'required',
                'string',
                'min:3',
                'max:30',
                'regex:/^[A-Za-z0-9._-]+$/',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (! is_string($value)) {
                        $fail(__('The :attribute must be a string.', ['attribute' => $attribute]));

                        return;
                    }

                    $normalized = \Illuminate\Support\Str::lower($value);
                    $exists = User::where('username_lower', $normalized)
                        ->where('id', '!=', $this->user()->id)
                        ->exists();

                    if ($exists) {
                        $fail(__('This username is already taken.'));
                    }
                },
            ],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
            'display_name' => ['nullable', 'string', 'max:150'],
            'pronouns' => ['nullable', 'string', 'max:100'],
            'gender' => ['nullable', 'string', 'max:50', 'in:man,woman,non-binary,genderfluid,agender,prefer-not-to-say,other'],
            'role' => ['nullable', 'integer', 'min:0', 'max:100'],
            'bio' => ['nullable', 'string', 'max:2500'],
            'birthdate' => ['nullable', 'date', 'before:today'],
            'location_city' => ['nullable', 'string', 'max:255'],
            'location_region' => ['nullable', 'string', 'max:255'],
            'location_country' => ['nullable', 'string', 'max:255'],
            'interests' => ['nullable', 'array', 'max:5'],
            'interests.*' => ['integer', 'exists:interests,id'],
            'hashtags' => ['nullable', 'array', 'max:5'],
            'hashtags.*' => ['string', 'max:120'],
        ];
    }
}
