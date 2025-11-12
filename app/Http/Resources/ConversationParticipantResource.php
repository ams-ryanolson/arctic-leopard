<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\ConversationParticipant
 */
class ConversationParticipantResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'role' => $this->role,
            'is_pinned' => $this->is_pinned,
            'is_favorite' => $this->is_favorite,
            'last_read_message_id' => $this->last_read_message_id,
            'last_read_at' => $this->last_read_at?->toIso8601String(),
            'joined_at' => $this->joined_at?->toIso8601String(),
            'left_at' => $this->left_at?->toIso8601String(),
            'muted_until' => $this->muted_until?->toIso8601String(),
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user?->getKey(),
                'username' => $this->user?->username,
                'display_name' => $this->user?->display_name,
                'avatar_url' => $this->user?->avatar_url,
            ]),
        ];
    }
}
