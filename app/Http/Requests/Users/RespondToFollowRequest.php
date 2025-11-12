<?php

namespace App\Http\Requests\Users;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class RespondToFollowRequest extends FormRequest
{
    public function authorize(): bool
    {
        $actor = $this->user();
        $target = $this->route('user');
        $follower = $this->route('follower');

        if (! $actor instanceof User || ! $target instanceof User || ! $follower instanceof User) {
            return false;
        }

        if (! $actor->is($target)) {
            return false;
        }

        if ($actor->hasBlockRelationshipWith($follower)) {
            return false;
        }

        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [];
    }
}
