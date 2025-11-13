<?php

namespace App\Listeners\Ads;

use App\Enums\Ads\AdStatus;
use App\Events\Payments\PaymentCaptured;
use App\Models\Ads\Ad;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Carbon;

class ActivateAdOnPaymentCaptured implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(PaymentCaptured $event): void
    {
        $payable = $event->payment->payable;

        if (! $payable instanceof Ad) {
            return;
        }

        // Auto-activate the ad when payment is captured
        $payable->forceFill([
            'status' => AdStatus::Active,
            'approved_at' => Carbon::now(),
            'approved_by' => $event->payment->payer_id, // Advertiser who paid
        ])->save();
    }
}
