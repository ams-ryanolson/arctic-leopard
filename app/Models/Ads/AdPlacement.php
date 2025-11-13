<?php

namespace App\Models\Ads;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdPlacement extends Model
{
    /** @use HasFactory<\Database\Factories\Ads\AdPlacementFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'key',
        'name',
        'description',
        'allowed_sizes',
        'default_weight',
        'is_active',
        'metadata',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'allowed_sizes' => 'array',
            'is_active' => 'boolean',
            'metadata' => 'array',
        ];
    }
}
