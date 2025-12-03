<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MigrationMapping extends Model
{
    protected $fillable = [
        'source_type',
        'source_id',
        'target_type',
        'target_id',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    /**
     * Get the mapping for a SE4 entity.
     */
    public static function getMapping(string $sourceType, int $sourceId): ?self
    {
        return self::where('source_type', $sourceType)
            ->where('source_id', $sourceId)
            ->first();
    }

    /**
     * Create or update a mapping.
     */
    public static function setMapping(
        string $sourceType,
        int $sourceId,
        string $targetType,
        int $targetId,
        ?array $metadata = null
    ): self {
        return self::updateOrCreate(
            [
                'source_type' => $sourceType,
                'source_id' => $sourceId,
            ],
            [
                'target_type' => $targetType,
                'target_id' => $targetId,
                'metadata' => $metadata,
            ]
        );
    }
}
