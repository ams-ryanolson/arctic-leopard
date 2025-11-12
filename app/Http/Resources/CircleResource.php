<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class CircleResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $membership = null;

        if ($this->relationLoaded('members') && $this->members->isNotEmpty()) {
            $member = $this->members->first();

            if ($member !== null) {
                $membership = [
                    'role' => $member->pivot->role,
                    'preferences' => $member->pivot->preferences,
                    'joinedAt' => $member->pivot->joined_at
                        ? Carbon::parse($member->pivot->joined_at)->toAtomString()
                        : null,
                ];
            }
        }

        if ($membership === null && $this->pivot) {
            $membership = [
                'role' => $this->pivot->role,
                'preferences' => $this->pivot->preferences,
                'joinedAt' => $this->pivot->joined_at
                    ? Carbon::parse($this->pivot->joined_at)->toAtomString()
                    : null,
            ];
        }

        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'tagline' => $this->tagline,
            'description' => $this->description,
            'interest' => $this->whenLoaded('interest', function () {
                return [
                    'id' => $this->interest->id,
                    'name' => $this->interest->name,
                    'slug' => $this->interest->slug,
                ];
            }),
            'isFeatured' => (bool) $this->is_featured,
            'visibility' => $this->visibility,
            'sortOrder' => $this->sort_order,
            'facetFilters' => $this->facet_filters,
            'metadata' => $this->metadata,
            'membersCount' => (int) ($this->members_count ?? $this->members()->count()),
            'joined' => $membership !== null,
            'membership' => $membership,
            'facets' => CircleFacetResource::collection(
                $this->whenLoaded('facets', fn () => $this->facets->sortBy('sort_order')->values())
            ),
        ];
    }
}
