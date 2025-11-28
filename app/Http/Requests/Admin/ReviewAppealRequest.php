<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ReviewAppealRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        /** @var \App\Models\UserAppeal|null $appeal */
        $appeal = $this->route('appeal');

        return $appeal !== null && $this->user()?->can('reviewAppeals', $appeal->user) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:approved,rejected,dismissed'],
            'review_notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
