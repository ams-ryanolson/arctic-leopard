<?php

namespace App\Models\Ads;

use App\Enums\Ads\AdPlacement;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdImpression extends Model
{
    /** @use HasFactory<\Database\Factories\Ads\AdImpressionFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'ad_id',
        'ad_creative_id',
        'placement',
        'user_id',
        'session_id',
        'ip_address',
        'user_agent',
        'referrer',
        'viewed_at',
        'metadata',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'placement' => AdPlacement::class,
            'viewed_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    /**
     * Ad that was shown.
     *
     * @return BelongsTo<Ad, self>
     */
    public function ad(): BelongsTo
    {
        return $this->belongsTo(Ad::class, 'ad_id');
    }

    /**
     * Creative that was shown.
     *
     * @return BelongsTo<AdCreative, self>
     */
    public function creative(): BelongsTo
    {
        return $this->belongsTo(AdCreative::class, 'ad_creative_id');
    }

    /**
     * User who viewed the ad.
     *
     * @return BelongsTo<User, self>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
