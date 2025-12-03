<?php

namespace App\Actions\Fortify;

use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\ResetsUserPasswords;

class ResetUserPassword implements ResetsUserPasswords
{
    use PasswordValidationRules;

    /**
     * Validate and reset the user's forgotten password.
     *
     * @param  array<string, string>  $input
     */
    public function reset(User $user, array $input): void
    {
        Validator::make($input, [
            'password' => $this->passwordRules(),
        ])->validate();

        $data = [
            'password' => $input['password'],
        ];

        // If user hasn't verified their email yet, verify it now.
        // They've proven ownership by receiving the password reset email.
        if (! $user->email_verified_at) {
            $data['email_verified_at'] = now();
        }

        $user->forceFill($data)->save();
    }
}
