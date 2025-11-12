<?php

namespace App\Http\Resources;

use App\Models\MessageReaction;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Collection;

/**
 * @mixin \App\Models\Message
 */
class MessageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $viewer = $request->user();
        $viewerId = $viewer?->getKey();

        /** @var Collection<int, MessageReaction> $reactionCollection */
        $reactionCollection = $this->relationLoaded('reactions')
            ? ($this->reactions instanceof Collection ? $this->reactions : collect($this->reactions))
            : collect();

        $reactionSummary = $reactionCollection
            ->groupBy(fn (MessageReaction $reaction) => $reaction->emoji.'|'.($reaction->variant ?? ''))
            ->map(function (Collection $group) use ($viewerId) {
                /** @var MessageReaction|null $first */
                $first = $group->first();

                return [
                    'emoji' => $first?->emoji,
                    'variant' => $first?->variant,
                    'count' => $group->count(),
                    'reacted' => $viewerId !== null
                        ? $group->contains(fn (MessageReaction $reaction) => (int) $reaction->user_id === (int) $viewerId)
                        : false,
                ];
            })
            ->values()
            ->all();

        $viewerReactions = $reactionCollection
            ->filter(fn (MessageReaction $reaction) => $viewerId !== null && (int) $reaction->user_id === (int) $viewerId)
            ->map(fn (MessageReaction $reaction) => [
                'emoji' => $reaction->emoji,
                'variant' => $reaction->variant,
            ])
            ->values()
            ->all();

        return [
            'id' => $this->id,
            'ulid' => $this->ulid,
            'conversation_id' => $this->conversation_id,
            'author' => $this->whenLoaded('author', fn () => [
                'id' => $this->author?->getKey(),
                'username' => $this->author?->username,
                'display_name' => $this->author?->display_name,
                'avatar_url' => $this->author?->avatar_url,
            ]),
            'type' => $this->type,
            'sequence' => $this->sequence,
            'body' => $this->body,
            'fragments' => $this->fragments,
            'metadata' => $this->metadata,
            'reply_to_id' => $this->reply_to_id,
            'deleted_at' => $this->deleted_at?->toIso8601String(),
            'visible_at' => $this->visible_at?->toIso8601String(),
            'edited_at' => $this->edited_at?->toIso8601String(),
            'undo_expires_at' => $this->undo_expires_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'attachments' => $this->whenLoaded('attachments', fn () => $this->attachments->map(fn ($attachment) => [
                'id' => $attachment->id,
                'type' => $attachment->type,
                'path' => $attachment->path,
                'disk' => $attachment->disk,
                'filename' => $attachment->filename,
                'mime_type' => $attachment->mime_type,
                'size' => $attachment->size,
                'width' => $attachment->width,
                'height' => $attachment->height,
                'duration' => $attachment->duration,
                'ordering' => $attachment->ordering,
                'is_inline' => $attachment->is_inline,
                'is_primary' => $attachment->is_primary,
                'meta' => $attachment->meta,
                'url' => $attachment->url,
            ])),
            'reaction_summary' => $this->when($this->relationLoaded('reactions'), $reactionSummary),
            'viewer_reactions' => $this->when($this->relationLoaded('reactions'), $viewerReactions),
        ];
    }
}
