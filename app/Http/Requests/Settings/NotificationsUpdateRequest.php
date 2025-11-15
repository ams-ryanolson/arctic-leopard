<?php

namespace App\Http\Requests\Settings;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class NotificationsUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'follows' => ['boolean'],
            'follow_requests' => ['boolean'],
            'follow_approvals' => ['boolean'],
            'post_likes' => ['boolean'],
            'post_bookmarks' => ['boolean'],
            'messages' => ['boolean'],
            'comments' => ['boolean'],
            'replies' => ['boolean'],
        ];
    }
}
