<?php

namespace App\Http\Resources;

use App\Models\Circle;
use App\Models\Event;
use App\Models\Hashtag;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SearchResultResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        if ($this->resource instanceof User) {
            $verificationStatus = null;
            if ($this->isIdVerified() && $this->idVerificationNotExpired()) {
                $verificationStatus = 'approved';
            }

            return [
                'type' => 'user',
                'id' => $this->id,
                'username' => $this->username,
                'display_name' => $this->display_name ?? $this->name,
                'avatar_url' => $this->avatar_url,
                'cover_url' => $this->cover_url,
                'pronouns' => $this->pronouns,
                'bio' => $this->bio,
                'verification_status' => $verificationStatus,
            ];
        }

        if ($this->resource instanceof Event) {
            return [
                'type' => 'event',
                'id' => $this->id,
                'title' => $this->title,
                'slug' => $this->slug,
                'description' => $this->description,
                'starts_at' => $this->starts_at?->toIso8601String(),
            ];
        }

        if ($this->resource instanceof Circle) {
            return [
                'type' => 'circle',
                'id' => $this->id,
                'name' => $this->name,
                'slug' => $this->slug,
                'tagline' => $this->tagline,
                'description' => $this->description,
            ];
        }

        if ($this->resource instanceof Hashtag) {
            return [
                'type' => 'hashtag',
                'id' => $this->id,
                'name' => $this->name,
                'slug' => $this->slug,
                'usage_count' => $this->usage_count,
                'recent_usage_count' => $this->recent_usage_count ?? 0,
            ];
        }

        return parent::toArray($request);
    }
}
