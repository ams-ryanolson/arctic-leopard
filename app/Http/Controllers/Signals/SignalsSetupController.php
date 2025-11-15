<?php

namespace App\Http\Controllers\Signals;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SignalsSetupController extends Controller
{
    /**
     * Display the creator setup/onboarding page.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $latest = $user->latestVerification;

        // Build verification status
        $verificationStatus = null;
        if ($latest !== null) {
            $verificationStatus = [
                'status' => $latest->status->value,
                'provider' => $latest->provider->value,
                'provider_applicant_id' => $latest->provider_applicant_id,
                'verified_at' => $latest->verified_at?->toIso8601String(),
                'expires_at' => $latest->expires_at?->toIso8601String(),
                'renewal_required_at' => $latest->renewal_required_at?->toIso8601String(),
                'is_expired' => $latest->isExpired(),
                'is_in_grace_period' => $latest->isInGracePeriod(),
                'needs_renewal' => $latest->needsRenewal(),
                'created_at' => $latest->created_at?->toIso8601String(),
                'can_retry' => $latest->status === \App\Enums\VerificationStatus::Pending
                    && $latest->created_at !== null
                    && $latest->created_at->addMinutes(15)->isPast(),
            ];
        }

        // TODO: Check payout details, subscription rates, and wishlist items
        // For now, returning mock/placeholder data
        $stepsStatus = [
            'id_verification' => [
                'completed' => $user->isIdVerified(),
                'required' => true,
            ],
            'payout_details' => [
                'completed' => false, // TODO: Check if payout details are set
                'required' => true,
            ],
            'subscription_rates' => [
                'completed' => false, // TODO: Check if subscription plans are created
                'required' => true,
            ],
            'wishlist_items' => [
                'completed' => $user->wishlistItems()->count() >= 3,
                'required' => true,
                'current_count' => $user->wishlistItems()->count(),
                'required_count' => 3,
            ],
        ];

        return Inertia::render('Signals/Setup', [
            'verificationStatus' => $verificationStatus,
            'stepsStatus' => $stepsStatus,
        ]);
    }
}
