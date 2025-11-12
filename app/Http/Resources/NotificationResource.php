<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Notifications\DatabaseNotification;

/**
 * @mixin DatabaseNotification
 */
class NotificationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var DatabaseNotification $notification */
        $notification = $this->resource;

        $data = $notification->data ?? [];

        return [
            'id' => $notification->id,
            'type' => $data['type'] ?? $notification->type,
            'actor' => $data['actor'] ?? null,
            'subject' => $data['subject'] ?? null,
            'meta' => $data['meta'] ?? [],
            'read_at' => $notification->read_at?->toJSON(),
            'created_at' => $notification->created_at?->toJSON(),
            'updated_at' => $notification->updated_at?->toJSON(),
        ];
    }
}



