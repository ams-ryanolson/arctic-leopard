<?php

namespace App\Services\Events;

use App\Enums\EventModality;
use App\Enums\EventStatus;
use App\Enums\EventType;
use App\Models\Event;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EventRecurrenceService
{
    /**
     * @param  array<int, array<string, mixed>>  $occurrences
     */
    public function syncOccurrences(Event $source, array $occurrences): void
    {
        $source->loadMissing('tags');

        DB::transaction(function () use ($source, $occurrences): void {
            if (! $source->is_recurring || $occurrences === []) {
                $source->occurrences()->delete();

                return;
            }

            if (blank($source->series_id)) {
                $source->series_id = Str::uuid()->toString();
                $source->save();
            }

            /** @var Collection<int, Event> $existing */
            $existing = $source->occurrences()
                ->get()
                ->keyBy(static fn (Event $event) => (int) $event->getKey());

            $retainedIds = [];

            foreach ($occurrences as $occurrenceData) {
                $occurrenceId = (int) ($occurrenceData['id'] ?? 0);

                if ($occurrenceId !== 0 && $existing->has($occurrenceId)) {
                    $occurrence = $existing->get($occurrenceId);

                    if ($occurrence !== null) {
                        $this->updateOccurrence($occurrence, $occurrenceData, $source);
                        $retainedIds[] = $occurrence->getKey();
                    }

                    continue;
                }

                $created = $this->createOccurrence($source, $occurrenceData);
                $retainedIds[] = $created->getKey();
            }

            $idsToDelete = $existing->keys()->diff($retainedIds);

            if ($idsToDelete->isNotEmpty()) {
                $source->occurrences()->whereIn('id', $idsToDelete)->delete();
            }
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    protected function updateOccurrence(Event $occurrence, array $data, Event $source): void
    {
        $attributes = $this->extractOccurrenceAttributes($data, $source);

        $occurrence->fill($attributes);
        $occurrence->is_recurring = false;
        $occurrence->parent_event_id = $source->getKey();
        $occurrence->series_id = $source->series_id;
        $occurrence->save();

        $this->syncTagsFromSource($occurrence, $source);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    protected function createOccurrence(Event $source, array $data): Event
    {
        $occurrence = new Event($this->extractOccurrenceAttributes($data, $source));

        $occurrence->slug = null;
        $occurrence->is_recurring = false;
        $occurrence->parent_event_id = $source->getKey();
        $occurrence->series_id = $source->series_id ?? Str::uuid()->toString();
        $occurrence->created_by_id = $source->created_by_id;
        $occurrence->submitted_by_id = $source->submitted_by_id;
        $occurrence->manager_id = $source->manager_id;

        $occurrence->save();

        $this->syncTagsFromSource($occurrence, $source);

        return $occurrence->fresh(['tags']);
    }

    /**
     * @return array<string, mixed>
     */
    protected function extractOccurrenceAttributes(array $data, Event $source): array
    {
        $startsAt = $data['starts_at'] ?? null;
        $endsAt = $data['ends_at'] ?? null;
        $timezone = $data['timezone'] ?? $source->timezone;

        $startsAt = $startsAt ? Carbon::parse($startsAt)->timezone($timezone) : $source->starts_at;
        $endsAt = $endsAt ? Carbon::parse($endsAt)->timezone($timezone) : $source->ends_at;

        $status = $data['status'] ?? ($source->status instanceof EventStatus ? $source->status->value : $source->status);
        $modality = $data['modality'] ?? ($source->modality instanceof EventModality ? $source->modality->value : $source->modality);
        $type = $data['type'] ?? ($source->type instanceof EventType ? $source->type->value : $source->type);

        return array_filter([
            'title' => $data['title'] ?? $source->title,
            'subtitle' => $data['subtitle'] ?? $source->subtitle,
            'description' => $data['description'] ?? $source->description,
            'status' => $status ?? EventStatus::Draft->value,
            'type' => $type ?? $source->type,
            'modality' => $modality ?? $source->modality,
            'avatar_path' => $data['avatar_path'] ?? $source->avatar_path,
            'cover_path' => $data['cover_path'] ?? $source->cover_path,
            'timezone' => $timezone,
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'rsvp_limit' => $data['rsvp_limit'] ?? $source->rsvp_limit,
            'allow_guests' => $data['allow_guests'] ?? $source->allow_guests,
            'location_name' => $data['location_name'] ?? $source->location_name,
            'location_venue' => $data['location_venue'] ?? $source->location_venue,
            'location_address' => $data['location_address'] ?? $source->location_address,
            'location_city' => $data['location_city'] ?? $source->location_city,
            'location_region' => $data['location_region'] ?? $source->location_region,
            'location_postal_code' => $data['location_postal_code'] ?? $source->location_postal_code,
            'location_country' => $data['location_country'] ?? $source->location_country,
            'location_latitude' => $data['location_latitude'] ?? $source->location_latitude,
            'location_longitude' => $data['location_longitude'] ?? $source->location_longitude,
            'virtual_meeting_url' => $data['virtual_meeting_url'] ?? $source->virtual_meeting_url,
            'requirements' => $data['requirements'] ?? $source->requirements,
            'extra_attributes' => $data['extra_attributes'] ?? $source->extra_attributes,
        ], static fn ($value) => $value !== null);
    }

    protected function syncTagsFromSource(Event $occurrence, Event $source): void
    {
        if (! $source->relationLoaded('tags')) {
            $source->load('tags');
        }

        $pivot = $source->tags
            ->mapWithKeys(static function ($tag) {
                $position = $tag->pivot->position ?? 0;

                return [
                    $tag->getKey() => [
                        'position' => $position,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                ];
            })
            ->all();

        if ($pivot === []) {
            $occurrence->tags()->sync([]);

            return;
        }

        $occurrence->tags()->sync($pivot);
    }
}
