<?php

namespace App\Actions\Fortify;

use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, mixed>  $input
     */
    public function create(array $input): User
    {
        $validator = Validator::make($input, [
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

                    if (User::where('username_lower', Str::lower($value))->exists()) {
                        $fail(__('This username is already taken.'));
                    }
                },
            ],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (! is_string($value)) {
                        $fail(__('The :attribute must be a string.', ['attribute' => $attribute]));
                        return;
                    }

                    if (User::whereRaw('lower(email) = ?', [Str::lower($value)])->exists()) {
                        $fail(__('A user with this email already exists.'));
                    }
                },
            ],
            'password' => $this->passwordRules(),
            'birthdate' => [
                'required',
                'date',
                'before_or_equal:'.now()->subYears(18)->toDateString(),
            ],
            'location_city' => ['required', 'string', 'max:255'],
            'location_region' => ['nullable', 'string', 'max:255'],
            'location_country' => ['required', 'string', 'max:255'],
            'location_latitude' => ['required', 'numeric', 'between:-90,90'],
            'location_longitude' => ['required', 'numeric', 'between:-180,180'],
            'accepted_terms' => ['accepted'],
            'accepted_privacy' => ['accepted'],
        ], [], [
            'accepted_terms' => __('terms of service'),
            'accepted_privacy' => __('privacy policy'),
        ]);

        $validator->validateWithBag('register');

        $acceptedTerms = filter_var(Arr::get($input, 'accepted_terms'), FILTER_VALIDATE_BOOL);
        $acceptedPrivacy = filter_var(Arr::get($input, 'accepted_privacy'), FILTER_VALIDATE_BOOL);

        $now = now();

        return User::create([
            'username' => Arr::get($input, 'username'),
            'email' => Arr::get($input, 'email'),
            'password' => Arr::get($input, 'password'),
            'birthdate' => Arr::get($input, 'birthdate'),
            'location_city' => trim((string) Arr::get($input, 'location_city')),
            'location_region' => ($region = Arr::get($input, 'location_region')) ? trim((string) $region) : null,
            'location_country' => trim((string) Arr::get($input, 'location_country')),
            'location_latitude' => (float) Arr::get($input, 'location_latitude'),
            'location_longitude' => (float) Arr::get($input, 'location_longitude'),
            'accepted_terms_at' => $acceptedTerms ? $now : null,
            'accepted_privacy_at' => $acceptedPrivacy ? $now : null,
        ]);
    }
}
