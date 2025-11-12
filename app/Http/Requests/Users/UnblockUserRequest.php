<?php

namespace App\Http\Requests\Users;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class UnblockUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        if (! config('block.enabled')) {
            return false;
        }

        /** @var User $target */
        $target = $this->route('user');

        return $this->user()?->can('unblock', $target) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [];
    }
}


