<?php

namespace App\Listeners\Payments;

use App\Enums\ActivityType;
use App\Events\Payments\PaymentCaptured;
use App\Events\Payments\PaymentRefunded;
use App\Models\Ads\Ad;
use App\Models\Memberships\MembershipPlan;
use App\Models\Payments\Payment;
use App\Models\Payments\PaymentSubscription;
use App\Models\Payments\Tip;
use App\Models\Post;
use App\Models\Wishlists\WishlistPurchase;
use App\Services\ActivityLogService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Http\Request;
use Illuminate\Queue\InteractsWithQueue;

class LogPaymentActivity implements ShouldQueue
{
    use InteractsWithQueue;

    public function __construct(
        private readonly ActivityLogService $activityLog,
        private readonly Request $request
    ) {}

    public function handlePaymentCaptured(PaymentCaptured $event): void
    {
        $payment = $event->payment;
        $activityType = $this->determineActivityType($payment);

        if ($activityType === null) {
            return; // Skip if not a purchase type we log
        }

        $this->activityLog->log(
            $activityType,
            $this->getPaymentDescription($payment, 'purchased'),
            $payment->payer,
            $payment->payer,
            $this->getPaymentProperties($payment),
            $this->request
        );
    }

    public function handlePaymentRefunded(PaymentRefunded $event): void
    {
        $payment = $event->payment;

        $this->activityLog->log(
            ActivityType::PaymentRefunded,
            $this->getPaymentDescription($payment, 'refunded'),
            $payment->payer,
            $payment->payer,
            $this->getPaymentProperties($payment),
            $this->request
        );
    }

    private function determineActivityType(Payment $payment): ?ActivityType
    {
        $payableType = $payment->payable_type;

        return match ($payableType) {
            Tip::class => ActivityType::PurchaseTip,
            WishlistPurchase::class => ActivityType::PurchaseWishlist,
            Post::class => ActivityType::PurchasePost,
            MembershipPlan::class => ActivityType::PurchaseMembership,
            PaymentSubscription::class => ActivityType::PurchaseSubscription,
            Ad::class => ActivityType::PurchaseAd,
            default => null,
        };
    }

    private function getPaymentDescription(Payment $payment, string $action): string
    {
        $payableType = class_basename($payment->payable_type);
        $payerName = $payment->payer?->name ?? 'Unknown';

        return "User {$payerName} {$action} {$payableType}";
    }

    /**
     * @return array<string, mixed>
     */
    private function getPaymentProperties(Payment $payment): array
    {
        return [
            'payment_id' => $payment->id,
            'payment_uuid' => $payment->uuid,
            'amount' => $payment->amount,
            'currency' => $payment->currency,
            'status' => $payment->status->value,
            'type' => $payment->type->value,
            'payable_type' => $payment->payable_type,
            'payable_id' => $payment->payable_id,
            'payee_id' => $payment->payee_id,
        ];
    }
}
