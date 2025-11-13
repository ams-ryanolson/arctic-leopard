<?php

namespace App\Http\Resources;

use App\Enums\EventRsvpStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\EventRsvp
 */
class EventRsvpResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $status = $this->status instanceof EventRsvpStatus
            ? $this->status->value
            : $this->status;

        $user = null;

        if ($this->relationLoaded('user') && $this->user) {
            $user = [
                'id' => $this->user->id,
                'username' => $this->user->username,
                'display_name' => $this->user->display_name ?? $this->user->name,
                'name' => $this->user->name,
                'avatar_url' => $this->user->avatar_url ?? null,
            ];
        }

        return [
            'id' => $this->id,
            'status' => $status,
            'guest_count' => (int) ($this->guest_count ?? 0),
            'note' => $this->note,
            'responded_at' => optional($this->responded_at)->toIso8601String(),
            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
            'user' => $user,
        ];
    }
}
