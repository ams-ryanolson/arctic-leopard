<?php

namespace App\Http\Requests\Messaging;

use App\Models\Message;
use Illuminate\Foundation\Http\FormRequest;

class StoreReactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $message = $this->route('message');

        if (! $message instanceof Message) {
            return false;
        }

        return $this->user()?->can('view', $message) ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'emoji' => ['required', 'string', 'max:96'],
            'variant' => ['nullable', 'string', 'max:24'],
        ];
    }
}
