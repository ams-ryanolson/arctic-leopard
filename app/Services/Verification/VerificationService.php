<?php

namespace App\Services\Verification;

use App\Enums\VerificationProvider;
use App\Enums\VerificationStatus;
use App\Models\AdminSetting;
use App\Models\User;
use App\Models\Verification;
use App\Notifications\Verification\CreatorStatusDisabledNotification;
use App\Notifications\Verification\IdVerificationApprovedNotification;
use App\Notifications\Verification\IdVerificationRenewalRequiredNotification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class VerificationService
{
    public function __construct(
        private readonly SumsubService $sumsubService,
    ) {}

    /**
     * Initiate verification for a user.
     */
    public function initiateVerification(User $user, string $provider = 'sumsub'): Verification
    {
        \Log::info('VerificationService::initiateVerification - START', [
            'user_id' => $user->getKey(),
            'provider' => $provider,
        ]);

        try {
            $providerEnum = VerificationProvider::from($provider);

            // Check if user already has a pending or approved verification
            $existingVerification = $user->verifications()
                ->forProvider($providerEnum)
                ->whereIn('status', [
                    VerificationStatus::Pending,
                    VerificationStatus::Approved,
                    VerificationStatus::RenewalRequired,
                ])
                ->latest()
                ->first();

            if ($existingVerification !== null && $existingVerification->provider_applicant_id !== null) {
                \Log::info('VerificationService::initiateVerification - Reusing existing verification', [
                    'user_id' => $user->getKey(),
                    'verification_id' => $existingVerification->getKey(),
                    'applicant_id' => $existingVerification->provider_applicant_id,
                    'status' => $existingVerification->status->value,
                ]);

                // Reset status to pending if it was renewal required or expired
                if ($existingVerification->status === VerificationStatus::RenewalRequired) {
                    $existingVerification->update([
                        'status' => VerificationStatus::Pending,
                        'renewal_required_at' => null,
                    ]);
                }

                return $existingVerification;
            }

            \Log::info('VerificationService::initiateVerification - Creating Sumsub applicant', [
                'user_id' => $user->getKey(),
            ]);

            $applicantId = $this->sumsubService->createApplicant($user);

            \Log::info('VerificationService::initiateVerification - Applicant created', [
                'user_id' => $user->getKey(),
                'applicant_id' => $applicantId,
            ]);

            $verification = DB::transaction(function () use ($user, $providerEnum, $applicantId, $existingVerification): Verification {
                // If we have an existing verification record but no applicant ID, update it
                if ($existingVerification !== null && $existingVerification->provider_applicant_id === null) {
                    $existingVerification->update([
                        'provider_applicant_id' => $applicantId,
                        'status' => VerificationStatus::Pending,
                    ]);

                    \Log::info('VerificationService::initiateVerification - Verification record updated', [
                        'verification_id' => $existingVerification->getKey(),
                        'user_id' => $user->getKey(),
                        'applicant_id' => $applicantId,
                    ]);

                    return $existingVerification;
                }

                // Otherwise, create a new verification record
                $verification = Verification::query()->create([
                    'user_id' => $user->getKey(),
                    'provider' => $providerEnum,
                    'provider_applicant_id' => $applicantId,
                    'status' => VerificationStatus::Pending,
                ]);

                \Log::info('VerificationService::initiateVerification - Verification record created', [
                    'verification_id' => $verification->getKey(),
                    'user_id' => $user->getKey(),
                    'applicant_id' => $applicantId,
                ]);

                return $verification;
            });

            return $verification;
        } catch (\Exception $e) {
            \Log::error('VerificationService::initiateVerification - ERROR', [
                'user_id' => $user->getKey(),
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }

    /**
     * Handle verification approval.
     */
    public function handleVerificationApproved(Verification $verification): void
    {
        $expiresAfterYears = (int) AdminSetting::get('id_verification_expires_after_years', 1);
        $expiresAt = Carbon::now()->addYears($expiresAfterYears);

        DB::transaction(function () use ($verification, $expiresAt): void {
            $verification->update([
                'status' => VerificationStatus::Approved,
                'verified_at' => now(),
                'expires_at' => $expiresAt,
            ]);

            $this->grantCreatorRoleIfNeeded($verification->user);
        });

        $verification->user->notify(new IdVerificationApprovedNotification($verification));
    }

    /**
     * Handle verification rejection.
     *
     * @param  array<string, mixed>  $metadata
     */
    public function handleVerificationRejected(Verification $verification, array $metadata = []): void
    {
        DB::transaction(function () use ($verification, $metadata): void {
            $verification->update([
                'status' => VerificationStatus::Rejected,
                'metadata' => array_merge($verification->metadata ?? [], $metadata),
            ]);
        });
    }

    /**
     * Check for expiring verifications and set renewal required.
     */
    public function checkExpirations(): void
    {
        $gracePeriodDays = (int) AdminSetting::get('id_verification_grace_period_days', 30);
        $renewalThreshold = Carbon::now()->addDays($gracePeriodDays);

        $expiringVerifications = Verification::query()
            ->approved()
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', $renewalThreshold)
            ->whereNull('renewal_required_at')
            ->get();

        foreach ($expiringVerifications as $verification) {
            DB::transaction(function () use ($verification): void {
                $verification->update([
                    'status' => VerificationStatus::RenewalRequired,
                    'renewal_required_at' => now(),
                ]);
            });

            $verification->user->notify(new IdVerificationRenewalRequiredNotification($verification));
        }
    }

    /**
     * Disable creator status for expired verifications after grace period.
     */
    public function disableExpiredCreatorStatus(): void
    {
        $gracePeriodDays = (int) AdminSetting::get('id_verification_grace_period_days', 30);

        $expiredVerifications = Verification::query()
            ->where(function ($query): void {
                $query->where('status', VerificationStatus::Approved)
                    ->orWhere('status', VerificationStatus::RenewalRequired);
            })
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', Carbon::now()->subDays($gracePeriodDays))
            ->whereNull('creator_status_disabled_at')
            ->with('user')
            ->get();

        foreach ($expiredVerifications as $verification) {
            // Get fresh user instance to avoid relationship caching issues
            $user = User::find($verification->user_id);

            if ($user === null || $user->isCreatorStatusDisabled()) {
                continue;
            }

            DB::transaction(function () use ($verification, $user): void {
                // Update user's creator_status_disabled_at (not in fillable, so use forceFill)
                $user->forceFill(['creator_status_disabled_at' => now()])->save();

                // Update this specific verification's creator_status_disabled_at
                $verification->update(['creator_status_disabled_at' => now()]);
            });

            // Refresh to ensure we have the updated data
            $user->refresh();
            $verification->refresh();

            $user->notify(new CreatorStatusDisabledNotification($verification));
        }
    }

    /**
     * Require renewal for a user (admin-triggered).
     */
    public function requireRenewal(User $user, ?User $admin = null, ?string $note = null): void
    {
        // Query for the latest verification directly to avoid relationship caching issues
        $latest = Verification::query()
            ->where('user_id', $user->getKey())
            ->latest('id')
            ->first();

        if ($latest === null) {
            return;
        }

        DB::transaction(function () use ($latest, $note): void {
            $latest->update([
                'status' => VerificationStatus::RenewalRequired,
                'renewal_required_at' => now(),
                'compliance_note' => $note,
            ]);
        });

        // Refresh the latest verification to ensure we have the updated instance
        $latest->refresh();
        $latest->user->notify(new IdVerificationRenewalRequiredNotification($latest));
    }

    /**
     * Grant Creator role to user if they don't already have it.
     */
    private function grantCreatorRoleIfNeeded(User $user): void
    {
        $creatorRole = Role::query()->where('name', 'Creator')->first();

        if ($creatorRole === null) {
            return;
        }

        if (! $user->hasRole('Creator')) {
            $user->assignRole('Creator');
        }
    }
}
