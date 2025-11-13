<?php

use App\Enums\Ads\AdStatus;
use App\Events\Payments\PaymentCaptured;
use App\Models\Ads\Ad;
use App\Models\Payments\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

uses(RefreshDatabase::class);

it('activates ad when payment is captured', function (): void {
    Event::fake([PaymentCaptured::class]);

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

    Event::dispatch(new PaymentCaptured($payment));

    $ad->refresh();

    expect($ad->status)->toBe(AdStatus::Active)
        ->and($ad->approved_at)->not()->toBeNull();
});
