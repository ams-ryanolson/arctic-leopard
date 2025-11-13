<?php

namespace App\Models\Ads;

use App\Enums\Ads\AdPlacement;
use App\Enums\Ads\AdSize;
use App\Enums\Ads\CreativeAssetType;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdCreative extends Model
{
    /** @use HasFactory<\Database\Factories\Ads\AdCreativeFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'ad_id',
        'placement',
        'size',
        'asset_type',
        'asset_path',
        'asset_url',
        'headline',
        'body_text',
        'cta_text',
        'cta_url',
        'display_order',
        'is_active',
        'review_status',
        'reviewed_at',
        'reviewed_by',
        'metadata',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'placement' => AdPlacement::class,
            'size' => AdSize::class,
            'asset_type' => CreativeAssetType::class,
            'is_active' => 'boolean',
            'reviewed_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    /**
     * Parent ad.
     *
     * @return BelongsTo<Ad, self>
     */
    public function ad(): BelongsTo
    {
        return $this->belongsTo(Ad::class, 'ad_id');
    }

    /**
     * User who reviewed this creative.
     *
     * @return BelongsTo<User, self>
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * Impressions for this creative.
     *
     * @return HasMany<AdImpression>
     */
    public function impressions(): HasMany
    {
        return $this->hasMany(AdImpression::class, 'ad_creative_id');
    }

    /**
     * Clicks for this creative.
     *
     * @return HasMany<AdClick>
     */
    public function clicks(): HasMany
    {
        return $this->hasMany(AdClick::class, 'ad_creative_id');
    }
}
