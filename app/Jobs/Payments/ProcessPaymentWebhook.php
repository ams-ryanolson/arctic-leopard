<?php

namespace App\Jobs\Payments;

use App\Enums\Payments\PaymentWebhookStatus;
use App\Models\Payments\PaymentWebhook;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessPaymentWebhook implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public PaymentWebhook $webhook
    ) {}

    public function handle(): void
    {
        // Placeholder for provider specific logic. For now, simply mark as processed.
        $this->webhook->forceFill([
            'status' => PaymentWebhookStatus::Processed,
            'processed_at' => now(),
        ])->save();
    }
}
