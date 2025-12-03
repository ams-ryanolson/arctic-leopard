<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Memberships\MembershipPlan;
use App\Models\Payments\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MembershipController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Get current active membership
        $activeMembership = $user->activeMembership();
        $activeMembership?->load('plan');

        // Get all membership history (including expired/cancelled)
        $membershipHistory = $user->memberships()
            ->with(['plan', 'payment'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($membership) {
                return [
                    'id' => $membership->id,
                    'uuid' => $membership->uuid,
                    'plan' => [
                        'id' => $membership->plan->id,
                        'name' => $membership->plan->name,
                        'slug' => $membership->plan->slug,
                    ],
                    'status' => $membership->status,
                    'billing_type' => $membership->billing_type,
                    'starts_at' => $membership->starts_at?->toIso8601String(),
                    'ends_at' => $membership->ends_at?->toIso8601String(),
                    'next_billing_at' => $membership->next_billing_at?->toIso8601String(),
                    'cancelled_at' => $membership->cancelled_at?->toIso8601String(),
                    'cancellation_reason' => $membership->cancellation_reason,
                    'original_price' => $membership->original_price,
                    'discount_amount' => $membership->discount_amount,
                    'is_active' => $membership->isActive(),
                    'is_expired' => $membership->isExpired(),
                    'days_remaining' => $membership->daysRemaining(),
                    'payment' => $membership->payment ? [
                        'id' => $membership->payment->id,
                        'uuid' => $membership->payment->uuid,
                        'amount' => $membership->payment->amount,
                        'currency' => $membership->payment->currency,
                        'status' => $membership->payment->status->value,
                        'created_at' => $membership->payment->created_at?->toIso8601String(),
                    ] : null,
                    'created_at' => $membership->created_at?->toIso8601String(),
                ];
            });

        // Get payment history for membership purchases
        $paymentHistory = Payment::query()
            ->where('payer_id', $user->id)
            ->whereHasMorph('payable', [MembershipPlan::class])
            ->with(['payable', 'payee:id,username,display_name'])
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->map(function ($payment) {
                $isGift = $payment->metadata['is_gift'] ?? false;
                $giftRecipient = null;

                if ($isGift && $payment->payee) {
                    $giftRecipient = [
                        'id' => $payment->payee->id,
                        'username' => $payment->payee->username,
                        'display_name' => $payment->payee->display_name,
                    ];
                }

                return [
                    'id' => $payment->id,
                    'uuid' => $payment->uuid,
                    'amount' => $payment->amount,
                    'currency' => $payment->currency,
                    'status' => $payment->status->value,
                    'plan_name' => $payment->payable?->name ?? 'Unknown Plan',
                    'billing_type' => $payment->metadata['billing_type'] ?? null,
                    'billing_interval' => $payment->metadata['billing_interval'] ?? null,
                    'is_gift' => $isGift,
                    'gift_recipient' => $giftRecipient,
                    'gift_message' => $payment->metadata['gift_message'] ?? null,
                    'created_at' => $payment->created_at?->toIso8601String(),
                ];
            });

        return Inertia::render('settings/membership', [
            'activeMembership' => $activeMembership ? [
                'id' => $activeMembership->id,
                'uuid' => $activeMembership->uuid,
                'plan' => [
                    'id' => $activeMembership->plan->id,
                    'name' => $activeMembership->plan->name,
                    'slug' => $activeMembership->plan->slug,
                    'description' => $activeMembership->plan->description,
                ],
                'status' => $activeMembership->status,
                'billing_type' => $activeMembership->billing_type,
                'starts_at' => $activeMembership->starts_at?->toIso8601String(),
                'ends_at' => $activeMembership->ends_at?->toIso8601String(),
                'next_billing_at' => $activeMembership->next_billing_at?->toIso8601String(),
                'original_price' => $activeMembership->original_price,
                'discount_amount' => $activeMembership->discount_amount,
                'is_active' => $activeMembership->isActive(),
                'days_remaining' => $activeMembership->daysRemaining(),
            ] : null,
            'membershipHistory' => $membershipHistory,
            'paymentHistory' => $paymentHistory,
        ]);
    }
}
