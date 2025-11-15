<?php

use App\Enums\Ads\AdStatus;
use App\Events\Payments\PaymentCaptured;
use App\Models\Ads\Ad;
use App\Models\Payments\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

it('activates ad when payment is captured', function (): void {
    Queue::fake();

    $advertiser = User::factory()->create();
    $ad = Ad::factory()->create([
        'advertiser_id' => $advertiser->getKey(),
        'status' => AdStatus::PendingReview,
    ]);

    $payment = Payment::factory()->create([
        'payable_type' => Ad::class,
        'payable_id' => $ad->getKey(),
        'payer_id' => $advertiser->getKey(),
        'status' => 'captured',
    ]);

    $event = new PaymentCaptured($payment);
    Event::dispatch($event);

    // Manually run the listener since it's queued and won't run automatically in tests
    $listener = new \App\Listeners\Ads\ActivateAdOnPaymentCaptured;
    $listener->handle($event);

    $ad->refresh();

    expect($ad->status)->toBe(AdStatus::Active)
        ->and($ad->approved_at)->not()->toBeNull();
});
