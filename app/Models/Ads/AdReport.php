<?php

namespace App\Models\Ads;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdReport extends Model
{
    /** @use HasFactory<\Database\Factories\Ads\AdReportFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'ad_id',
        'campaign_id',
        'placement',
        'report_date',
        'report_type',
        'impressions',
        'clicks',
        'spend',
        'ctr',
        'cpm',
        'cpc',
        'metadata',
        'generated_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'report_date' => 'date',
            'generated_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    /**
     * Ad this report is for.
     *
     * @return BelongsTo<Ad, self>
     */
    public function ad(): BelongsTo
    {
        return $this->belongsTo(Ad::class, 'ad_id');
    }

    /**
     * Campaign this report is for.
     *
     * @return BelongsTo<AdCampaign, self>
     */
    public function campaign(): BelongsTo
    {
        return $this->belongsTo(AdCampaign::class, 'campaign_id');
    }
}
