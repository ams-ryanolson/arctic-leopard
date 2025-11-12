<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Conversation
 */
class ConversationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ulid' => $this->ulid,
            'type' => $this->type,
            'subject' => $this->subject,
            'participant_count' => $this->participant_count,
            'message_count' => $this->message_count,
            'creator_id' => $this->creator_id,
            'last_message_id' => $this->last_message_id,
            'last_message_at' => $this->last_message_at?->toIso8601String(),
            'archived_at' => $this->archived_at?->toIso8601String(),
            'muted_until' => $this->muted_until?->toIso8601String(),
            'settings' => $this->settings,
            'metadata' => $this->metadata,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'participants' => ConversationParticipantResource::collection(
                $this->whenLoaded('participants'),
            ),
            'last_message' => $this->whenLoaded('lastMessage', fn () => new MessageResource($this->lastMessage)),
        ];
    }
}
