<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class BulkModerationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && ($user->hasRole(['Admin', 'Super Admin', 'Moderator']));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'content_type' => ['required', 'string', 'in:post,story,comment'],
            'content_ids' => ['required', 'array', 'min:1'],
            'content_ids.*' => ['required', 'integer'],
            'action' => ['required', 'string', 'in:approve,reject,dismiss'],
            'rejection_reason' => ['required_if:action,reject', 'nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
