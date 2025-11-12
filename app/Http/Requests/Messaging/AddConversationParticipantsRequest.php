<?php

namespace App\Http\Requests\Messaging;

use App\Models\Conversation;
use Illuminate\Foundation\Http\FormRequest;

class AddConversationParticipantsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $conversation = $this->route('conversation');

        if (! $conversation instanceof Conversation) {
            return false;
        }

        return $this->user()?->can('addParticipants', $conversation) ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'participant_ids' => ['required', 'array', 'min:1'],
            'participant_ids.*' => ['integer', 'distinct', 'exists:users,id'],
        ];
    }

    /**
     * @return array<int, int>
     */
    public function participantIds(): array
    {
        return collect($this->input('participant_ids', []))
            ->map(static fn ($id) => (int) $id)
            ->filter()
            ->unique()
            ->values()
            ->all();
    }
}
