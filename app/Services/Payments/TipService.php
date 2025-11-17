<?php

namespace App\Services\Payments;

use App\Enums\Payments\PaymentType;
use App\Enums\Payments\TipStatus;
use App\Models\Payments\Tip;
use App\Payments\Data\PaymentIntentData;
use App\Payments\Data\TipData;
use Illuminate\Support\Facades\DB;

class TipService
{
    public function __construct(
        protected readonly PaymentService $payments
    ) {}

    /**
     * Initiate a tip by creating the database record and payment intent.
     */
    public function initiate(TipData $data, ?string $gateway = null): array
    {
        return DB::transaction(function () use ($data, $gateway) {
            $tip = Tip::query()->create([
                'sender_id' => $data->senderId,
                'recipient_id' => $data->recipientId,
                'amount' => $data->amount->amount(),
                'currency' => $data->amount->currency(),
                'status' => TipStatus::Pending,
                'message' => $data->message,
                'metadata' => $data->metadata,
            ]);

            $intentData = new PaymentIntentData(
                payableType: Tip::class,
                payableId: $tip->getKey(),
                amount: $data->amount,
                payerId: $data->senderId,
                payeeId: $data->recipientId,
                type: PaymentType::OneTime,
                method: $data->method,
                metadata: $data->metadata,
                description: $data->message
            );

            $intent = $this->payments->createIntent($intentData, $gateway);

            $tip->payment_id = $intent->payment_id;
            $tip->save();

            return [$tip->fresh(), $intent];
        });
    }
}
