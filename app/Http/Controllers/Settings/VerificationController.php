<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Verification\StoreVerificationSessionRequest;
use App\Services\Verification\SumsubService;
use App\Services\Verification\VerificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Inertia\Inertia;
use Inertia\Response;

class VerificationController extends Controller
{
    public function __construct(
        private readonly VerificationService $verificationService,
        private readonly SumsubService $sumsubService,
    ) {}

    /**
     * Show the ID verification page.
     */
    public function show(Request $request): Response
    {
        $user = $request->user();
        $latest = $user->latestVerification;

        $verificationStatus = null;

        if ($latest !== null) {
            $verificationStatus = [
                'status' => $latest->status->value,
                'provider' => $latest->provider->value,
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

        return Inertia::render('settings/verification', [
            'verificationStatus' => $verificationStatus,
        ]);
    }

    /**
     * Create a verification session and return access token.
     */
    public function createSession(StoreVerificationSessionRequest $request): JsonResponse
    {
        \Log::info('VerificationController::createSession - START', [
            'user_id' => $request->user()?->getKey(),
        ]);

        try {
            $user = $request->user();

            \Log::info('VerificationController::createSession - Initiating verification', [
                'user_id' => $user->getKey(),
            ]);

            $verification = $this->verificationService->initiateVerification($user);

            \Log::info('VerificationController::createSession - Verification created', [
                'verification_id' => $verification->getKey(),
                'provider_applicant_id' => $verification->provider_applicant_id,
            ]);

            $accessToken = $this->sumsubService->generateAccessToken($verification->provider_applicant_id);

            \Log::info('VerificationController::createSession - Access token generated', [
                'verification_id' => $verification->getKey(),
                'access_token_length' => strlen($accessToken),
            ]);

            return response()->json([
                'access_token' => $accessToken,
                'applicant_id' => $verification->provider_applicant_id,
                'verification_id' => $verification->id,
            ]);
        } catch (\Exception $e) {
            \Log::error('VerificationController::createSession - ERROR', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }

    /**
     * Refresh access token for an existing verification session.
     */
    public function refreshToken(Request $request): JsonResponse
    {
        $user = $request->user();
        $latest = $user->latestVerification;

        if ($latest === null || $latest->provider_applicant_id === null) {
            return response()->json([
                'error' => 'No active verification session found',
            ], 404);
        }

        try {
            $accessToken = $this->sumsubService->generateAccessToken($latest->provider_applicant_id);

            return response()->json([
                'access_token' => $accessToken,
            ]);
        } catch (\Exception $e) {
            \Log::error('VerificationController::refreshToken - ERROR', [
                'user_id' => $user->getKey(),
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to refresh access token',
            ], 500);
        }
    }

    /**
     * Show the verification popup page.
     */
    public function popup(Request $request): Response
    {
        $user = $request->user();
        $latest = $user->latestVerification;

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

        // Force light mode for popup - override appearance
        View::share('appearance', 'light');

        return Inertia::render('verification/popup', [
            'verificationStatus' => $verificationStatus,
        ]);
    }

    /**
     * Get current verification status.
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();
        $latest = $user->latestVerification;

        if ($latest === null) {
            return response()->json([
                'status' => null,
            ]);
        }

        return response()->json([
            'status' => $latest->status->value,
            'provider' => $latest->provider->value,
            'verified_at' => $latest->verified_at?->toIso8601String(),
            'expires_at' => $latest->expires_at?->toIso8601String(),
            'renewal_required_at' => $latest->renewal_required_at?->toIso8601String(),
            'is_expired' => $latest->isExpired(),
            'is_in_grace_period' => $latest->isInGracePeriod(),
            'needs_renewal' => $latest->needsRenewal(),
        ]);
    }
}
