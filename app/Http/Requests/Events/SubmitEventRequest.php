<?php

namespace App\Http\Requests\Events;

use App\Enums\EventModality;
use App\Enums\EventType;
use App\Models\Event;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubmitEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('submit', Event::class) ?? false;
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
            'type' => ['required', Rule::enum(EventType::class)],
            'modality' => ['required', Rule::enum(EventModality::class)],
            'starts_at' => ['required', 'date', 'after:now'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
            'timezone' => ['required', 'timezone'],
            'avatar_path' => ['nullable', 'string', 'max:2048'],
            'cover_path' => ['nullable', 'string', 'max:2048'],
            'tags' => ['nullable', 'array', 'max:8'],
            'tags.*' => ['integer', 'exists:event_tags,id'],
            'requirements' => ['nullable', 'array'],
            'requirements.*' => ['nullable', 'string', 'max:500'],
            'submission_notes' => ['nullable', 'string', 'max:2000'],
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
