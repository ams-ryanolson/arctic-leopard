<?php

namespace App\Http\Requests\Onboarding;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Validator;

class ProfileBasicsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'display_name' => ['required', 'string', 'max:150'],
            'pronouns' => ['nullable', 'string', 'max:100'],
            'bio' => ['nullable', 'string'],
            'interests' => ['nullable', 'array', 'max:5'],
            'interests.*' => ['integer', 'exists:interests,id'],
            'hashtags' => ['nullable', 'array', 'max:20'],
            'hashtags.*' => ['string', 'max:120'],
        ];
    }

    /**
     * Sanitize inputs prior to validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'display_name' => $this->input('display_name'),
            'pronouns' => $this->input('pronouns'),
            'bio' => $this->input('bio'),
            'interests' => $this->input('interests') ?? [],
            'hashtags' => $this->input('hashtags') ?? [],
        ]);
    }

    /**
     * Configure the validator instance.
     */
    protected function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $bio = $this->input('bio');

            if (! is_string($bio) || trim($bio) === '') {
                return;
            }

            $plainLength = Str::length(
                Str::of($bio)
                    ->replace('<br />', "\n")
                    ->replace('<br/>', "\n")
                    ->replace('<br>', "\n")
                    ->stripTags()
                    ->toString()
            );

            if ($plainLength > 2500) {
                $validator->errors()->add('bio', 'The bio may not be greater than 2500 characters.');
            }
        });
    }
}

