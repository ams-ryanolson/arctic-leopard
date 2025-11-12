<?php

namespace App\Http\Requests\Messaging;

use App\Models\Conversation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreConversationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Conversation::class) ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', 'string', Rule::in(['direct', 'group'])],
            'recipient_id' => [
                'required_if:type,direct',
                'nullable',
                'integer',
                'exists:users,id',
                Rule::notIn([$this->user()?->getKey()]),
            ],
            'participant_ids' => ['required_if:type,group', 'nullable', 'array', 'min:2'],
            'participant_ids.*' => [
                'integer',
                'distinct',
                'exists:users,id',
            ],
            'subject' => ['nullable', 'string', 'max:120'],
            'settings' => ['nullable', 'array'],
            'metadata' => ['nullable', 'array'],
        ];
    }

    /**
     * @return array<int, int>
     */
    public function participantIds(): array
    {
        $ids = $this->input('participant_ids', []);

        if ($this->input('type') === 'direct' && $this->filled('recipient_id')) {
            $ids[] = (int) $this->input('recipient_id');
        }

        return collect($ids)
            ->map(static fn ($id) => (int) $id)
            ->filter()
            ->unique()
            ->values()
            ->all();
    }
}
