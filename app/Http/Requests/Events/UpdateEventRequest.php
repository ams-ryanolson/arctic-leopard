<?php

namespace App\Http\Requests\Events;

use App\Enums\EventModality;
use App\Enums\EventStatus;
use App\Enums\EventType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $modality = $this->string('modality')->toString()
            ?: ($this->route('event')?->modality?->value ?? EventModality::InPerson->value);

        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'subtitle' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'string'],
            'status' => ['sometimes', Rule::enum(EventStatus::class)],
            'type' => ['sometimes', Rule::enum(EventType::class)],
            'modality' => ['sometimes', Rule::enum(EventModality::class)],
            'starts_at' => ['sometimes', 'date'],
            'ends_at' => ['sometimes', 'nullable', 'date', 'after:starts_at'],
            'timezone' => ['sometimes', 'string', 'timezone'],
            'avatar_path' => ['sometimes', 'string', 'max:2048'],
            'cover_path' => ['sometimes', 'string', 'max:2048'],
            'manager_id' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
            'submitted_by_id' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
            'rsvp_limit' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'allow_guests' => ['sometimes', 'boolean'],
            'is_recurring' => ['sometimes', 'boolean'],
            'recurrence_rule' => ['sometimes', 'nullable', 'string', 'max:255'],
            'occurrences' => ['sometimes', 'nullable', 'array', 'max:104'],
            'occurrences.*.id' => ['nullable', 'integer', 'exists:events,id'],
            'occurrences.*.starts_at' => ['required_with:occurrences', 'date'],
            'occurrences.*.ends_at' => ['nullable', 'date', 'after:occurrences.*.starts_at'],
            'occurrences.*.status' => ['nullable', Rule::enum(EventStatus::class)],
            'occurrences.*.timezone' => ['nullable', 'timezone'],
            'tags' => ['sometimes', 'nullable', 'array', 'max:12'],
            'tags.*' => ['integer', 'exists:event_tags,id'],
            'requirements' => ['sometimes', 'nullable', 'array'],
            'requirements.*' => ['nullable', 'string', 'max:500'],
            'extra_attributes' => ['sometimes', 'nullable', 'array'],
            'extra_attributes.*' => ['nullable'],
            'submission_notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'admin_notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'published_at' => ['sometimes', 'nullable', 'date'],
            'approved_at' => ['sometimes', 'nullable', 'date'],
            'cancelled_at' => ['sometimes', 'nullable', 'date'],
            'location_name' => [
                'sometimes',
                Rule::requiredIf($modality !== EventModality::Virtual->value),
                'nullable',
                'string',
                'max:255',
            ],
            'location_venue' => ['sometimes', 'nullable', 'string', 'max:255'],
            'location_address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'location_city' => [
                'sometimes',
                Rule::requiredIf($modality !== EventModality::Virtual->value),
                'nullable',
                'string',
                'max:120',
            ],
            'location_region' => ['sometimes', 'nullable', 'string', 'max:120'],
            'location_postal_code' => ['sometimes', 'nullable', 'string', 'max:32'],
            'location_country' => ['sometimes', 'nullable', 'string', 'size:2'],
            'location_latitude' => ['sometimes', 'nullable', 'numeric', 'between:-90,90'],
            'location_longitude' => ['sometimes', 'nullable', 'numeric', 'between:-180,180'],
            'virtual_meeting_url' => [
                'sometimes',
                Rule::requiredIf($modality !== EventModality::InPerson->value),
                'nullable',
                'string',
                'max:2048',
            ],
        ];
    }
}
