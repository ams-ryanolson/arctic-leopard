<?php

namespace App\Models\Memberships;

use App\Models\Concerns\GeneratesUuid;
use App\ValueObjects\Money;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class MembershipPlan extends Model
{
    use GeneratesUuid;
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'monthly_price',
        'yearly_price',
        'currency',
        'role_to_assign',
        'permissions_to_grant',
        'features',
        'is_active',
        'is_public',
        'display_order',
        'allows_recurring',
        'allows_one_time',
        'one_time_duration_days',
        'metadata',
    ];

    protected $casts = [
        'permissions_to_grant' => 'array',
        'features' => 'array',
        'is_active' => 'boolean',
        'is_public' => 'boolean',
        'allows_recurring' => 'boolean',
        'allows_one_time' => 'boolean',
        'metadata' => 'array',
        'deleted_at' => 'datetime',
    ];

    public function userMemberships(): HasMany
    {
        return $this->hasMany(UserMembership::class);
    }

    public function discounts(): HasMany
    {
        return $this->hasMany(MembershipDiscount::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    public function scopeForRole($query, string $role)
    {
        return $query->where('role_to_assign', $role);
    }

    public function calculatePrice(string $billingType, ?int $discountAmount = null): int
    {
        $price = $billingType === 'yearly' ? $this->yearly_price : $this->monthly_price;

        if ($discountAmount !== null) {
            $price = max(0, $price - $discountAmount);
        }

        return $price;
    }

    public function isRecurringAvailable(): bool
    {
        return $this->allows_recurring && $this->is_active;
    }

    public function isOneTimeAvailable(): bool
    {
        return $this->allows_one_time && $this->is_active && $this->one_time_duration_days !== null;
    }

    public function monthlyPriceMoney(): Money
    {
        return new Money($this->monthly_price, $this->currency);
    }

    public function yearlyPriceMoney(): Money
    {
        return new Money($this->yearly_price, $this->currency);
    }
}
