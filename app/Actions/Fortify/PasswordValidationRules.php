<?php

namespace App\Actions\Fortify;

use Closure;
use Illuminate\Validation\Rules\Password;

trait PasswordValidationRules
{
    /**
     * Get the validation rules used to validate passwords.
     *
     * @return array<int, \Illuminate\Contracts\Validation\Rule|array<mixed>|string>
     */
    protected function passwordRules(): array
    {
        return [
            'required',
            'string',
            Password::min(8)
                ->letters()
                ->numbers()
                ->symbols(),
            static function (string $attribute, mixed $value, Closure $fail): void {
                if (! is_string($value) || $value === '') {
                    return;
                }

                if (! preg_match('/[A-Z]/', $value)) {
                    $fail(__('The :attribute must contain at least one uppercase letter.', ['attribute' => $attribute]));
                }
            },
            'confirmed',
        ];
    }
}
