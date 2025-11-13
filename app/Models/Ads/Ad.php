<?php

namespace App\Models\Ads;

use App\Enums\Ads\AdPlacement;
use App\Enums\Ads\AdStatus;
use App\Enums\Ads\PricingModel;
use App\Models\Concerns\GeneratesUuid;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

class Ad extends Model
{
    /** @use HasFactory<\Database\Factories\Ads\AdFactory> */
    use GeneratesUuid;

    use HasFactory;
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'advertiser_id',
        'campaign_id',
        'name',
        'status',
        'start_date',
        'end_date',
        'max_impressions',
        'max_clicks',
        'daily_impression_cap',
        'daily_click_cap',
        'budget_amount',
        'budget_currency',
        'spent_amount',
        'pricing_model',
        'pricing_rate',
        'targeting',
        'metadata',
        'approved_at',
        'approved_by',
        'rejected_at',
        'rejection_reason',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => AdStatus::class,
            'pricing_model' => PricingModel::class,
            'start_date' => 'datetime',
            'end_date' => 'datetime',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
            'targeting' => 'array',
            'metadata' => 'array',
        ];
    }

    /**
     * Advertiser who owns this ad.
     *
     * @return BelongsTo<User, self>
     */
    public function advertiser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'advertiser_id');
    }

    /**
     * Campaign this ad belongs to.
     *
     * @return BelongsTo<AdCampaign, self>
     */
    public function campaign(): BelongsTo
    {
        return $this->belongsTo(AdCampaign::class, 'campaign_id');
    }

    /**
     * User who approved this ad.
     *
     * @return BelongsTo<User, self>
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Creatives for this ad.
     *
     * @return HasMany<AdCreative>
     */
    public function creatives(): HasMany
    {
        return $this->hasMany(AdCreative::class, 'ad_id');
    }

    /**
     * Impressions for this ad.
     *
     * @return HasMany<AdImpression>
     */
    public function impressions(): HasMany
    {
        return $this->hasMany(AdImpression::class, 'ad_id');
    }

    /**
     * Clicks for this ad.
     *
     * @return HasMany<AdClick>
     */
    public function clicks(): HasMany
    {
        return $this->hasMany(AdClick::class, 'ad_id');
    }

    /**
     * Reports for this ad.
     *
     * @return HasMany<AdReport>
     */
    public function reports(): HasMany
    {
        return $this->hasMany(AdReport::class, 'ad_id');
    }

    /**
     * Scope to active ads.
     *
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', AdStatus::Active);
    }

    /**
     * Scope to ads for a specific placement.
     *
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeForPlacement(Builder $query, AdPlacement $placement): Builder
    {
        return $query->whereHas('creatives', function (Builder $q) use ($placement): void {
            $q->where('placement', $placement->value)
                ->where('is_active', true)
                ->where('review_status', 'approved');
        });
    }

    /**
     * Scope to eligible ads (active, within dates, under caps, has budget).
     *
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeEligible(Builder $query): Builder
    {
        $now = Carbon::now();

        return $query->where('status', AdStatus::Active)
            ->where(function (Builder $q) use ($now): void {
                $q->whereNull('start_date')
                    ->orWhere('start_date', '<=', $now);
            })
            ->where(function (Builder $q) use ($now): void {
                $q->whereNull('end_date')
                    ->orWhere('end_date', '>=', $now);
            })
            ->whereColumn('spent_amount', '<', 'budget_amount')
            ->where(function (Builder $q): void {
                $q->whereNull('max_impressions')
                    ->orWhereRaw('(SELECT COUNT(*) FROM ad_impressions WHERE ad_impressions.ad_id = ads.id) < ads.max_impressions');
            })
            ->where(function (Builder $q): void {
                $q->whereNull('max_clicks')
                    ->orWhereRaw('(SELECT COUNT(*) FROM ad_clicks WHERE ad_clicks.ad_id = ads.id) < ads.max_clicks');
            });
    }

    /**
     * Scope to ads matching targeting for a viewer.
     *
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeForViewer(Builder $query, ?User $viewer): Builder
    {
        if ($viewer === null) {
            return $query->where(function (Builder $q): void {
                $q->whereNull('targeting')
                    ->orWhereJsonDoesntContain('targeting', 'require_auth');
            });
        }

        // For authenticated users, check targeting criteria
        // This is a simplified version - full targeting logic will be in AdServingService
        return $query->where(function (Builder $q): void {
            $q->whereNull('targeting')
                ->orWhereJsonDoesntContain('targeting', 'require_auth');
        });
    }
}
