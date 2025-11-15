<?php

namespace App\Services\Memberships;

use App\Models\Memberships\MembershipDiscount;
use App\Models\Memberships\MembershipPlan;

class MembershipDiscountService
{
    /**
     * Validate a discount code.
     */
    public function validateCode(string $code, ?MembershipPlan $plan = null): ?MembershipDiscount
    {
        $discount = MembershipDiscount::where('code', $code)->first();

        if (! $discount) {
            return null;
        }

        if (! $discount->isValid()) {
            return null;
        }

        // If discount is plan-specific, check if it matches
        if ($discount->membership_plan_id !== null && $plan !== null) {
            if ($discount->membership_plan_id !== $plan->id) {
                return null;
            }
        }

        return $discount;
    }

    /**
     * Apply discount to a price.
     */
    public function applyDiscount(MembershipDiscount $discount, int $price): int
    {
        return $discount->calculateDiscount($price);
    }

    /**
     * Record usage of a discount code.
     */
    public function recordUsage(MembershipDiscount $discount): void
    {
        $discount->increment('used_count');
    }
}
