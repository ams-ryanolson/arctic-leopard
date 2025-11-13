<?php

namespace App\Models\Ads;

use App\Enums\Ads\AdPlacement;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdClick extends Model
{
    /** @use HasFactory<\Database\Factories\Ads\AdClickFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'ad_id',
        'ad_creative_id',
        'impression_id',
        'placement',
        'user_id',
        'session_id',
        'ip_address',
        'user_agent',
        'clicked_at',
        'metadata',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'placement' => AdPlacement::class,
            'clicked_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    /**
     * Ad that was clicked.
     *
     * @return BelongsTo<Ad, self>
     */
    public function ad(): BelongsTo
    {
        return $this->belongsTo(Ad::class, 'ad_id');
    }

    /**
     * Creative that was clicked.
     *
     * @return BelongsTo<AdCreative, self>
     */
    public function creative(): BelongsTo
    {
        return $this->belongsTo(AdCreative::class, 'ad_creative_id');
    }

    /**
     * Original impression that led to this click.
     *
     * @return BelongsTo<AdImpression, self>
     */
    public function impression(): BelongsTo
    {
        return $this->belongsTo(AdImpression::class, 'impression_id');
    }

    /**
     * User who clicked the ad.
     *
     * @return BelongsTo<User, self>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
