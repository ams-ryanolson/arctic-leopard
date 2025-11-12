<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CircleFacet extends Model
{
    /** @use HasFactory<\Database\Factories\CircleFacetFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'circle_id',
        'key',
        'value',
        'label',
        'description',
        'filters',
        'is_default',
        'sort_order',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'filters' => 'array',
        'is_default' => 'boolean',
    ];

    /**
     * The circle this facet belongs to.
     *
     * @return BelongsTo<Circle, CircleFacet>
     */
    public function circle(): BelongsTo
    {
        return $this->belongsTo(Circle::class);
    }
}
