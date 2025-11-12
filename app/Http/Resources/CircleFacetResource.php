<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CircleFacetResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'key' => $this->key,
            'value' => $this->value,
            'label' => $this->label,
            'description' => $this->description,
            'filters' => $this->filters,
            'isDefault' => (bool) $this->is_default,
            'sortOrder' => $this->sort_order,
        ];
    }
}
