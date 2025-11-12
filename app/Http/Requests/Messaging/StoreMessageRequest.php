<?php

namespace App\Http\Requests\Messaging;

use App\Models\Conversation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        $conversation = $this->route('conversation');

        if (! $conversation instanceof Conversation) {
            return false;
        }

        return $this->user()?->can('view', $conversation) ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'type' => ['nullable', 'string', Rule::in(['message', 'system', 'notice', 'tip', 'tip_request'])],
            'body' => ['nullable', 'string', 'max:4000'],
            'reply_to_id' => ['nullable', 'integer', 'exists:messages,id'],
            'fragments' => ['nullable', 'array'],
            'metadata' => ['nullable', 'array'],
            'metadata.amount' => ['required_if:type,tip,tip_request', 'numeric', 'min:1'],
            'metadata.currency' => ['required_if:type,tip,tip_request', 'string', 'size:3'],
            'metadata.status' => ['nullable', 'string', Rule::in(['pending', 'completed', 'accepted', 'declined'])],
            'metadata.mode' => ['nullable', 'string', Rule::in(['send', 'request'])],
            'metadata.requester_id' => ['nullable', 'integer', 'exists:users,id'],
            'metadata.payment_method' => ['nullable', 'string', 'max:255'],
            'visible_at' => ['nullable', 'date'],
            'undo_expires_at' => ['nullable', 'date', 'after:now'],
            'attachments' => ['nullable', 'array', 'max:6'],
            'attachments.*.id' => ['required', 'string'],
            'attachments.*.mime_type' => ['nullable', 'string'],
            'attachments.*.size' => ['nullable', 'integer', 'min:0'],
            'attachments.*.original_name' => ['nullable', 'string', 'max:255'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $metadata = $this->input('metadata', []);
        $type = $this->input('type', 'message');

        if ($type === 'tip') {
            $metadata['mode'] = 'send';
            $metadata['status'] ??= 'completed';
            $metadata['currency'] = strtoupper($metadata['currency'] ?? 'USD');
        }

        if ($type === 'tip_request') {
            $metadata['mode'] = 'request';
            $metadata['status'] ??= 'pending';
            $metadata['currency'] = strtoupper($metadata['currency'] ?? 'USD');
        }

        if (isset($metadata['currency']) && is_string($metadata['currency'])) {
            $metadata['currency'] = strtoupper($metadata['currency']);
        }

        $this->merge([
            'metadata' => $metadata,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function payload(): array
    {
        return [
            'type' => $this->input('type', 'message'),
            'body' => $this->input('body'),
            'reply_to_id' => $this->input('reply_to_id'),
            'fragments' => $this->input('fragments'),
            'metadata' => $this->input('metadata', []),
            'visible_at' => $this->input('visible_at'),
            'undo_expires_at' => $this->input('undo_expires_at'),
            'attachments' => $this->input('attachments', []),
        ];
    }
}
