<?php

namespace App\Jobs\Payments;

use App\Enums\Payments\PaymentWebhookStatus;
use App\Models\Payments\PaymentWebhook;
use App\Services\Payments\CCBillWebhookProcessor;
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
        // Route to provider-specific processor
        match ($this->webhook->provider) {
            'ccbill' => $this->handleCCBill(),
            default => $this->handleDefault(),
        };
    }

    protected function handleCCBill(): void
    {
        $config = config('payments.webhooks.providers.ccbill', []);

        $processor = new CCBillWebhookProcessor($config);
        $processor->process($this->webhook);
    }

    protected function handleDefault(): void
    {
        // Placeholder for other providers. For now, simply mark as processed.
        $this->webhook->forceFill([
            'status' => PaymentWebhookStatus::Processed,
            'processed_at' => now(),
        ])->save();
    }
}
