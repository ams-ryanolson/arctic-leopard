<?php

namespace App\Http\Requests\Toasts;

use Illuminate\Foundation\Http\FormRequest;

class ResolveToastActionRequest extends FormRequest
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
            'action' => ['required', 'string'],
            'payload' => ['sometimes', 'array'],
        ];
    }
}



