<?php

namespace App\Services\Memberships;

use App\Events\Memberships\MembershipCancelled;
use App\Events\Memberships\MembershipExpired;
use App\Events\Memberships\MembershipGifted;
use App\Events\Memberships\MembershipPurchased;
use App\Events\Memberships\MembershipRenewed;
use App\Events\Memberships\MembershipUpgraded;
use App\Models\Memberships\MembershipPlan;
use App\Models\Memberships\UserMembership;
use App\Models\Payments\Payment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class MembershipService
{
    /**
     * Create a membership from a successful payment.
     */
    public function purchase(
        User $user,
        MembershipPlan $plan,
        Payment $payment,
        string $billingType,
        int $discountAmount = 0
    ): UserMembership {
        return DB::transaction(function () use ($user, $plan, $payment, $billingType, $discountAmount) {
            // Cancel any existing active membership
            $this->cancelExistingMembership($user);

            $startsAt = now();
            $endsAt = null;
            $nextBillingAt = null;
            $billingInterval = $payment->metadata['billing_interval'] ?? 'monthly';

            if ($billingType === 'recurring') {
                if ($billingInterval === 'yearly') {
                    $endsAt = $startsAt->copy()->addYear();
                } else {
                    $endsAt = $startsAt->copy()->addMonth();
                }
                $nextBillingAt = $endsAt;
            } else {
                // one_time - use billing interval to determine duration
                if ($billingInterval === 'yearly') {
                    $endsAt = $startsAt->copy()->addYear();
                } else {
                    // Monthly one-time purchase = 30 days
                    $endsAt = $startsAt->copy()->addMonth();
                }
            }

            $membership = UserMembership::create([
                'user_id' => $user->id,
                'membership_plan_id' => $plan->id,
                'status' => 'active',
                'billing_type' => $billingType,
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'next_billing_at' => $nextBillingAt,
                'payment_id' => $payment->id,
                'original_price' => $payment->amount,
                'discount_amount' => $discountAmount,
            ]);

            event(new MembershipPurchased($membership));

            return $membership;
        });
    }

    /**
     * Handle membership upgrade with prorated pricing.
     */
    public function upgrade(
        User $user,
        UserMembership $currentMembership,
        MembershipPlan $newPlan,
        Payment $payment,
        string $billingType,
        int $discountAmount = 0
    ): UserMembership {
        return DB::transaction(function () use ($user, $currentMembership, $newPlan, $payment, $billingType, $discountAmount) {
            // Cancel current membership
            $currentMembership->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'cancellation_reason' => 'upgraded',
            ]);

            // Create new membership with same expiry date
            $startsAt = now();
            $endsAt = $currentMembership->ends_at;
            $nextBillingAt = null;

            if ($billingType === 'recurring') {
                $billingInterval = $payment->metadata['billing_interval'] ?? 'monthly';
                if ($billingInterval === 'yearly') {
                    $nextBillingAt = $endsAt ?? $startsAt->copy()->addYear();
                } else {
                    $nextBillingAt = $endsAt ?? $startsAt->copy()->addMonth();
                }
            }

            $newMembership = UserMembership::create([
                'user_id' => $user->id,
                'membership_plan_id' => $newPlan->id,
                'status' => 'active',
                'billing_type' => $billingType,
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'next_billing_at' => $nextBillingAt,
                'payment_id' => $payment->id,
                'original_price' => $payment->amount,
                'discount_amount' => $discountAmount,
            ]);

            event(new MembershipUpgraded($currentMembership, $newMembership));

            return $newMembership;
        });
    }

    /**
     * Process recurring renewal.
     */
    public function renew(UserMembership $membership, Payment $payment): UserMembership
    {
        return DB::transaction(function () use ($membership, $payment) {
            $metadata = $payment->metadata ?? [];
            $billingInterval = $metadata['billing_interval'] ?? 'monthly';

            $now = now();
            if ($billingInterval === 'yearly') {
                $endsAt = $now->copy()->addYear();
            } else {
                $endsAt = $now->copy()->addMonth();
            }

            $membership->update([
                'status' => 'active',
                'starts_at' => $now,
                'ends_at' => $endsAt,
                'next_billing_at' => $endsAt,
                'payment_id' => $payment->id,
                'original_price' => $payment->amount,
                'cancelled_at' => null,
                'cancellation_reason' => null,
            ]);

            event(new MembershipRenewed($membership));

            return $membership;
        });
    }

    /**
     * Cancel a membership.
     */
    public function cancel(UserMembership $membership, ?string $reason = null): UserMembership
    {
        return DB::transaction(function () use ($membership, $reason) {
            $membership->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'cancellation_reason' => $reason ?? 'user_requested',
            ]);

            event(new MembershipCancelled($membership));

            return $membership;
        });
    }

    /**
     * Handle membership expiration.
     */
    public function expire(UserMembership $membership): UserMembership
    {
        return DB::transaction(function () use ($membership) {
            $membership->update([
                'status' => 'expired',
            ]);

            event(new MembershipExpired($membership));

            return $membership;
        });
    }

    /**
     * Calculate prorated upgrade price.
     */
    public function calculateUpgradePrice(
        UserMembership $currentMembership,
        MembershipPlan $newPlan,
        string $billingType
    ): int {
        $daysRemaining = $currentMembership->daysRemaining();

        if ($daysRemaining <= 0) {
            return $billingType === 'yearly' ? $newPlan->yearly_price : $newPlan->monthly_price;
        }

        $currentPrice = $currentMembership->original_price;
        $currentEndsAt = $currentMembership->ends_at;

        if ($currentEndsAt === null) {
            return $billingType === 'yearly' ? $newPlan->yearly_price : $newPlan->monthly_price;
        }

        // Calculate total days in current membership period
        $totalDays = $currentMembership->starts_at->diffInDays($currentEndsAt);

        if ($totalDays <= 0) {
            return $billingType === 'yearly' ? $newPlan->yearly_price : $newPlan->monthly_price;
        }

        // Calculate prorated value of current membership
        $proratedCurrentPrice = (int) round(($currentPrice / $totalDays) * $daysRemaining);

        // Calculate new plan price
        $newPrice = $billingType === 'yearly' ? $newPlan->yearly_price : $newPlan->monthly_price;

        // Calculate difference
        $upgradePrice = $newPrice - $proratedCurrentPrice;

        return max(0, $upgradePrice);
    }

    /**
     * Assign role when membership starts.
     */
    public function assignRole(UserMembership $membership): void
    {
        $plan = $membership->plan;
        $user = $membership->user;

        $role = Role::findByName($plan->role_to_assign, 'web');

        if ($role && ! $user->hasRole($role)) {
            $user->assignRole($role);
        }

        // Grant additional permissions if specified
        if ($plan->permissions_to_grant) {
            foreach ($plan->permissions_to_grant as $permissionName) {
                if (! $user->hasPermissionTo($permissionName)) {
                    $user->givePermissionTo($permissionName);
                }
            }
        }
    }

    /**
     * Remove role when membership expires (check for other active memberships first).
     */
    public function removeRole(UserMembership $membership): void
    {
        $plan = $membership->plan;
        $user = $membership->user;

        // Check if user has other active memberships with the same role
        $hasOtherActiveMembership = UserMembership::query()
            ->where('user_id', $user->id)
            ->where('id', '!=', $membership->id)
            ->where('status', 'active')
            ->whereHas('plan', function ($query) use ($plan) {
                $query->where('role_to_assign', $plan->role_to_assign);
            })
            ->where(function ($query) {
                $query->whereNull('ends_at')
                    ->orWhere('ends_at', '>', now());
            })
            ->exists();

        if ($hasOtherActiveMembership) {
            return; // Don't remove role if user has another active membership with same role
        }

        $role = Role::findByName($plan->role_to_assign, 'web');

        if ($role && $user->hasRole($role)) {
            // Never remove base "User" role
            if ($role->name !== 'User') {
                $user->removeRole($role);
            }
        }

        // Remove additional permissions if specified
        if ($plan->permissions_to_grant) {
            foreach ($plan->permissions_to_grant as $permissionName) {
                if ($user->hasPermissionTo($permissionName)) {
                    $user->revokePermissionTo($permissionName);
                }
            }
        }
    }

    /**
     * Cancel existing active membership for a user.
     */
    protected function cancelExistingMembership(User $user): void
    {
        $activeMembership = $user->memberships()
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('ends_at')
                    ->orWhere('ends_at', '>', now());
            })
            ->first();

        if ($activeMembership) {
            $this->cancel($activeMembership, 'replaced_by_new_membership');
        }
    }

    /**
     * Create a gift membership from a successful payment.
     * Gift memberships are one-time only and cannot be given to users with active memberships.
     */
    public function gift(
        User $recipient,
        User $gifter,
        MembershipPlan $plan,
        Payment $payment,
        int $discountAmount = 0
    ): UserMembership {
        return DB::transaction(function () use ($recipient, $gifter, $plan, $payment, $discountAmount) {
            // Validate recipient doesn't have active membership
            $hasActiveMembership = $recipient->memberships()
                ->where('status', 'active')
                ->where(function ($query) {
                    $query->whereNull('ends_at')
                        ->orWhere('ends_at', '>', now());
                })
                ->exists();

            if ($hasActiveMembership) {
                throw new \Illuminate\Validation\ValidationException(
                    validator([], []),
                    ['recipient' => 'The recipient already has an active membership.']
                );
            }

            // Gift memberships are always one-time
            $billingType = 'one_time';
            $startsAt = now();
            $durationDays = $plan->one_time_duration_days ?? 30;
            $endsAt = $startsAt->copy()->addDays($durationDays);

            $membership = UserMembership::create([
                'user_id' => $recipient->id,
                'gifted_by_user_id' => $gifter->id,
                'membership_plan_id' => $plan->id,
                'status' => 'active',
                'billing_type' => $billingType,
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'next_billing_at' => null,
                'payment_id' => $payment->id,
                'original_price' => $payment->amount,
                'discount_amount' => $discountAmount,
            ]);

            // Assign role to recipient
            $this->assignRole($membership);

            event(new MembershipGifted($membership, $gifter));

            return $membership;
        });
    }

    /**
     * Grant a free membership to a user with an expiry date.
     */
    public function grantFreeMembership(
        User $user,
        MembershipPlan $plan,
        \Illuminate\Support\Carbon $expiresAt,
        ?string $reason = null,
        ?User $admin = null
    ): UserMembership {
        return DB::transaction(function () use ($user, $plan, $expiresAt, $reason, $admin) {
            // Cancel any existing active membership
            $this->cancelExistingMembership($user);

            // Create a free payment record
            $payment = \App\Models\Payments\Payment::create([
                'payable_type' => MembershipPlan::class,
                'payable_id' => $plan->id,
                'payer_id' => $user->id,
                'payee_id' => null,
                'type' => \App\Enums\Payments\PaymentType::OneTime,
                'status' => \App\Enums\Payments\PaymentStatus::Captured,
                'amount' => 0,
                'fee_amount' => 0,
                'net_amount' => 0,
                'currency' => $plan->currency ?? 'USD',
                'method' => 'free',
                'provider' => 'free',
                'metadata' => [
                    'reason' => $reason,
                    'granted_by_admin' => true,
                    'admin_id' => $admin?->id,
                ],
                'authorized_at' => now(),
                'captured_at' => now(),
            ]);

            $membership = UserMembership::create([
                'user_id' => $user->id,
                'membership_plan_id' => $plan->id,
                'status' => 'active',
                'billing_type' => 'one_time',
                'starts_at' => now(),
                'ends_at' => $expiresAt,
                'next_billing_at' => null,
                'payment_id' => $payment->id,
                'original_price' => 0,
                'discount_amount' => 0,
            ]);

            // Assign role
            $this->assignRole($membership);

            event(new \App\Events\Users\FreeMembershipGranted($user, $membership, $admin));

            return $membership;
        });
    }
}
