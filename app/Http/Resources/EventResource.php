<?php

namespace App\Http\Resources;

use App\Enums\EventModality;
use App\Enums\EventStatus;
use App\Enums\EventType;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Collection;

/**
 * @mixin Event
 */
class EventResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $status = $this->status instanceof EventStatus ? $this->status->value : $this->status;
        $type = $this->type instanceof EventType ? $this->type->value : $this->type;
        $modality = $this->modality instanceof EventModality ? $this->modality->value : $this->modality;

        $viewer = $request->user();
        $viewerRsvp = null;

        if ($viewer !== null) {
            $viewerRsvpModel = null;

            if ($this->relationLoaded('rsvps') && $this->rsvps instanceof Collection) {
                $viewerRsvpModel = $this->rsvps->firstWhere('user_id', $viewer->getKey());
            } elseif (property_exists($this->resource, 'viewer_rsvp') && $this->viewer_rsvp) {
                $viewerRsvpModel = $this->viewer_rsvp;
            }

            if ($viewerRsvpModel !== null) {
                $viewerRsvp = (new EventRsvpResource($viewerRsvpModel))->toArray($request);
            }
        }

        $manager = null;

        if ($this->relationLoaded('manager') && $this->manager) {
            $manager = [
                'id' => $this->manager->id,
                'username' => $this->manager->username,
                'display_name' => $this->manager->display_name ?? $this->manager->name,
                'name' => $this->manager->name,
                'avatar_url' => $this->manager->avatar_url ?? null,
            ];
        }

        $creator = null;

        if ($this->relationLoaded('creator') && $this->creator) {
            $creator = [
                'id' => $this->creator->id,
                'username' => $this->creator->username,
                'display_name' => $this->creator->display_name ?? $this->creator->name,
            ];
        }

        $submitter = null;

        if ($this->relationLoaded('submitter') && $this->submitter) {
            $submitter = [
                'id' => $this->submitter->id,
                'username' => $this->submitter->username,
                'display_name' => $this->submitter->display_name ?? $this->submitter->name,
            ];
        }

        $approver = null;

        if ($this->relationLoaded('approver') && $this->approver) {
            $approver = [
                'id' => $this->approver->id,
                'username' => $this->approver->username,
                'display_name' => $this->approver->display_name ?? $this->approver->name,
            ];
        }

        $tags = $this->relationLoaded('tags')
            ? EventTagResource::collection($this->tags)->toArray($request)
            : [];

        $media = $this->relationLoaded('media')
            ? EventMediaResource::collection($this->media)->toArray($request)
            : [];

        $occurrences = [];

        if ($this->relationLoaded('occurrences')) {
            $occurrences = $this->occurrences
                ->map(static function (Event $occurrence) {
                    $occurrenceStatus = $occurrence->status instanceof EventStatus
                        ? $occurrence->status->value
                        : $occurrence->status;

                    return [
                        'id' => $occurrence->id,
                        'slug' => $occurrence->slug,
                        'title' => $occurrence->title,
                        'starts_at' => optional($occurrence->starts_at)->toIso8601String(),
                        'ends_at' => optional($occurrence->ends_at)->toIso8601String(),
                        'status' => $occurrenceStatus,
                    ];
                })
                ->all();
        }

        $rsvpSummary = [
            'going' => (int) ($this->going_count ?? 0),
            'tentative' => (int) ($this->tentative_count ?? 0),
            'cancelled' => (int) ($this->cancelled_count ?? 0),
        ];
        $rsvpSummary['total'] = $rsvpSummary['going'] + $rsvpSummary['tentative'] + $rsvpSummary['cancelled'];

        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'series_id' => $this->series_id,
            'parent_event_id' => $this->parent_event_id,
            'title' => $this->title,
            'subtitle' => $this->subtitle,
            'description' => $this->description,
            'status' => $status,
            'type' => $type,
            'modality' => $modality,
            'timezone' => $this->timezone,
            'starts_at' => optional($this->starts_at)->toIso8601String(),
            'ends_at' => optional($this->ends_at)->toIso8601String(),
            'avatar_path' => $this->avatar_path,
            'cover_path' => $this->cover_path,
            'virtual_meeting_url' => $this->virtual_meeting_url,
            'is_recurring' => (bool) $this->is_recurring,
            'recurrence_rule' => $this->recurrence_rule,
            'rsvp_limit' => $this->rsvp_limit !== null ? (int) $this->rsvp_limit : null,
            'allow_guests' => (bool) $this->allow_guests,
            'is_past' => $this->starts_at !== null ? $this->starts_at->isPast() : false,
            'requirements' => $this->requirements ?? [],
            'extra_attributes' => $this->extra_attributes ?? [],
            'location' => [
                'name' => $this->location_name,
                'venue' => $this->location_venue,
                'address' => $this->location_address,
                'city' => $this->location_city,
                'region' => $this->location_region,
                'postal_code' => $this->location_postal_code,
                'country' => $this->location_country,
                'latitude' => $this->location_latitude !== null ? (float) $this->location_latitude : null,
                'longitude' => $this->location_longitude !== null ? (float) $this->location_longitude : null,
            ],
            'manager' => $manager,
            'creator' => $creator,
            'submitter' => $submitter,
            'approver' => $approver,
            'tags' => $tags,
            'media' => $media,
            'occurrences' => $occurrences,
            'submission_notes' => $this->submission_notes,
            'admin_notes' => $this->admin_notes,
            'submitted_at' => optional($this->submitted_at)->toIso8601String(),
            'approved_at' => optional($this->approved_at)->toIso8601String(),
            'published_at' => optional($this->published_at)->toIso8601String(),
            'cancelled_at' => optional($this->cancelled_at)->toIso8601String(),
            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
            'deleted_at' => optional($this->deleted_at)->toIso8601String(),
            'rsvp_summary' => $rsvpSummary,
            'viewer_rsvp' => $viewerRsvp,
            'can' => [
                'update' => $viewer ? $viewer->can('update', $this->resource) : false,
                'manageRsvps' => $viewer ? $viewer->can('manageRsvps', $this->resource) : false,
                'cancel' => $viewer ? $viewer->can('cancel', $this->resource) : false,
                'publish' => $viewer ? $viewer->can('publish', $this->resource) : false,
                'approve' => $viewer ? $viewer->can('approve', $this->resource) : false,
                'rsvp' => $viewer ? $viewer->can('view', $this->resource) : false,
            ],
        ];
    }
}
