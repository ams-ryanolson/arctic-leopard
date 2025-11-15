<?php

namespace App\Models;

use App\Enums\VerificationProvider;
use App\Enums\VerificationStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

class Verification extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'provider',
        'provider_applicant_id',
        'status',
        'verified_at',
        'expires_at',
        'renewal_required_at',
        'creator_status_disabled_at',
        'compliance_note',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'provider' => VerificationProvider::class,
            'status' => VerificationStatus::class,
            'verified_at' => 'datetime',
            'expires_at' => 'datetime',
            'renewal_required_at' => 'datetime',
            'creator_status_disabled_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('status', VerificationStatus::Approved);
    }

    public function scopeExpired(Builder $query): Builder
    {
        $now = Carbon::now();

        return $query->where(function (Builder $builder): void {
            $builder->where('status', VerificationStatus::Expired)
                ->orWhere(function (Builder $expired): void {
                    $expired->where('status', VerificationStatus::Approved)
                        ->whereNotNull('expires_at')
                        ->where('expires_at', '<', Carbon::now());
                });
        });
    }

    public function scopeNeedsRenewal(Builder $query): Builder
    {
        return $query->where(function (Builder $builder): void {
            $builder->where('status', VerificationStatus::RenewalRequired)
                ->orWhereNotNull('renewal_required_at');
        });
    }

    public function scopeForProvider(Builder $query, VerificationProvider|string $provider): Builder
    {
        $providerValue = $provider instanceof VerificationProvider ? $provider->value : $provider;

        return $query->where('provider', $providerValue);
    }

    public function isApproved(): bool
    {
        return $this->status === VerificationStatus::Approved;
    }

    public function isExpired(): bool
    {
        if ($this->status === VerificationStatus::Expired) {
            return true;
        }

        if ($this->status === VerificationStatus::Approved && $this->expires_at !== null) {
            return $this->expires_at->isPast();
        }

        return false;
    }

    public function needsRenewal(): bool
    {
        return $this->status === VerificationStatus::RenewalRequired
            || $this->renewal_required_at !== null;
    }

    public function isInGracePeriod(): bool
    {
        if ($this->expires_at === null) {
            return false;
        }

        if ($this->status !== VerificationStatus::Approved && $this->status !== VerificationStatus::RenewalRequired) {
            return false;
        }

        $gracePeriodDays = (int) AdminSetting::get('id_verification_grace_period_days', 30);
        $gracePeriodEnd = $this->expires_at->copy()->addDays($gracePeriodDays);

        return Carbon::now()->isBefore($gracePeriodEnd);
    }
}
