<?php

namespace App\Http\Requests\Events;

use App\Enums\EventRsvpStatus;
use App\Models\Event;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEventRsvpRequest extends FormRequest
{
    public function authorize(): bool
    {
        $event = $this->route('event');

        return $event instanceof Event
            ? $this->user()?->can('view', $event) ?? false
            : false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(EventRsvpStatus::class)],
            'guest_count' => ['nullable', 'integer', 'min:0', 'max:10'],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
