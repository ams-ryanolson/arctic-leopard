<?php

namespace App\Http\Requests\Events;

use App\Enums\EventModality;
use App\Enums\EventStatus;
use App\Enums\EventType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEventRequest extends FormRequest
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
        $modality = $this->string('modality')->toString() ?: EventModality::InPerson->value;

        return [
            'title' => ['required', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'status' => ['required', Rule::enum(EventStatus::class)],
            'type' => ['required', Rule::enum(EventType::class)],
            'modality' => ['required', Rule::enum(EventModality::class)],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
            'timezone' => ['required', 'timezone'],
            'avatar_path' => ['required', 'string', 'max:2048'],
            'cover_path' => ['required', 'string', 'max:2048'],
            'manager_id' => ['nullable', 'integer', 'exists:users,id'],
            'submitted_by_id' => ['nullable', 'integer', 'exists:users,id'],
            'rsvp_limit' => ['nullable', 'integer', 'min:1'],
            'allow_guests' => ['sometimes', 'boolean'],
            'is_recurring' => ['sometimes', 'boolean'],
            'recurrence_rule' => [
                'nullable',
                'string',
                'max:255',
                Rule::requiredIf(fn (): bool => $this->boolean('is_recurring')),
            ],
            'occurrences' => ['nullable', 'array', 'max:104'],
            'occurrences.*.id' => ['nullable', 'integer', 'exists:events,id'],
            'occurrences.*.starts_at' => ['required', 'date'],
            'occurrences.*.ends_at' => ['nullable', 'date', 'after:occurrences.*.starts_at'],
            'occurrences.*.status' => ['nullable', Rule::enum(EventStatus::class)],
            'occurrences.*.timezone' => ['nullable', 'timezone'],
            'tags' => ['nullable', 'array', 'max:12'],
            'tags.*' => ['integer', 'exists:event_tags,id'],
            'requirements' => ['nullable', 'array'],
            'requirements.*' => ['nullable', 'string', 'max:500'],
            'extra_attributes' => ['nullable', 'array'],
            'extra_attributes.*' => ['nullable'],
            'submission_notes' => ['nullable', 'string', 'max:2000'],
            'admin_notes' => ['nullable', 'string', 'max:2000'],
            'published_at' => ['nullable', 'date'],
            'approved_at' => ['nullable', 'date'],
            'cancelled_at' => ['nullable', 'date'],
            'location_name' => [
                Rule::requiredIf($modality !== EventModality::Virtual->value),
                'nullable',
                'string',
                'max:255',
            ],
            'location_venue' => ['nullable', 'string', 'max:255'],
            'location_address' => ['nullable', 'string', 'max:255'],
            'location_city' => [
                Rule::requiredIf($modality !== EventModality::Virtual->value),
                'nullable',
                'string',
                'max:120',
            ],
            'location_region' => ['nullable', 'string', 'max:120'],
            'location_postal_code' => ['nullable', 'string', 'max:32'],
            'location_country' => ['nullable', 'string', 'size:2'],
            'location_latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'location_longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'virtual_meeting_url' => [
                Rule::requiredIf($modality !== EventModality::InPerson->value),
                'nullable',
                'string',
                'max:2048',
            ],
        ];
    }
}
