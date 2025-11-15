<?php

namespace App\Jobs\Verification;

use App\Models\Verification;
use App\Services\Verification\VerificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessSumsubWebhook implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * Create a new job instance.
     *
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        public array $payload
    ) {}

    /**
     * Execute the job.
     */
    public function handle(VerificationService $verificationService): void
    {
        $eventType = $this->payload['type'] ?? '';

        if ($eventType !== 'applicantReviewed') {
            return;
        }

        $applicantId = $this->payload['payload']['applicant']['id'] ?? null;

        if ($applicantId === null) {
            return;
        }

        $verification = Verification::query()
            ->where('provider_applicant_id', $applicantId)
            ->first();

        if ($verification === null) {
            return;
        }

        $reviewResult = $this->payload['payload']['reviewResult']['reviewAnswer'] ?? '';

        if ($reviewResult === 'GREEN') {
            $verificationService->handleVerificationApproved($verification);
        } elseif ($reviewResult === 'RED') {
            $metadata = [
                'review_result' => $this->payload['payload']['reviewResult'] ?? [],
                'rejection_reason' => $this->payload['payload']['reviewResult']['reviewRejectType'] ?? null,
            ];
            $verificationService->handleVerificationRejected($verification, $metadata);
        }
    }
}
