<?php

namespace App\Models\Ads;

use App\Enums\Ads\CampaignStatus;
use App\Enums\Ads\PacingStrategy;
use App\Models\Concerns\GeneratesUuid;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AdCampaign extends Model
{
    /** @use HasFactory<\Database\Factories\Ads\AdCampaignFactory> */
    use GeneratesUuid;

    use HasFactory;
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'advertiser_id',
        'name',
        'status',
        'start_date',
        'end_date',
        'total_budget',
        'currency',
        'spent_amount',
        'pacing_strategy',
        'metadata',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => CampaignStatus::class,
            'pacing_strategy' => PacingStrategy::class,
            'start_date' => 'datetime',
            'end_date' => 'datetime',
            'metadata' => 'array',
        ];
    }

    /**
     * Campaign advertiser.
     *
     * @return BelongsTo<User, self>
     */
    public function advertiser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'advertiser_id');
    }

    /**
     * Ads in this campaign.
     *
     * @return HasMany<Ad>
     */
    public function ads(): HasMany
    {
        return $this->hasMany(Ad::class, 'campaign_id');
    }

    /**
     * Reports for this campaign.
     *
     * @return HasMany<AdReport>
     */
    public function reports(): HasMany
    {
        return $this->hasMany(AdReport::class, 'campaign_id');
    }
}
