<?php

namespace App\Http\Controllers\Payments;

use App\Http\Controllers\Controller;
use App\Models\Memberships\MembershipPlan;
use App\Models\Payments\PaymentIntent;
use App\Models\Payments\PaymentMethod;
use App\Payments\Data\PaymentCaptureData;
use App\Services\Payments\PaymentService;
use App\Services\Toasts\ToastBus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PaymentController extends Controller
{
    public function __construct(
        private readonly PaymentService $paymentService,
        private readonly ToastBus $toastBus
    ) {}

    /**
     * Capture a payment intent using a saved payment method.
     */
    public function capture(Request $request): JsonResponse
    {
        $request->validate([
            'payment_intent_id' => ['required', 'integer', 'exists:payment_intents,id'],
            'payment_method_id' => ['required', 'integer', 'exists:payment_methods,id'],
        ]);

        $user = $request->user();
        $paymentIntent = PaymentIntent::findOrFail($request->integer('payment_intent_id'));
        $paymentMethod = PaymentMethod::findOrFail($request->integer('payment_method_id'));

        // Verify the payment intent belongs to the user
        if ($paymentIntent->payer_id !== $user->id) {
            throw ValidationException::withMessages([
                'payment_intent_id' => 'This payment intent does not belong to you.',
            ]);
        }

        // Verify the payment method belongs to the user
        if ($paymentMethod->user_id !== $user->id) {
            throw ValidationException::withMessages([
                'payment_method_id' => 'This payment method does not belong to you.',
            ]);
        }

        // Check payment intent status
        if (! in_array($paymentIntent->status, [
            \App\Enums\Payments\PaymentIntentStatus::RequiresMethod,
            \App\Enums\Payments\PaymentIntentStatus::RequiresConfirmation,
            \App\Enums\Payments\PaymentIntentStatus::Processing,
        ])) {
            throw ValidationException::withMessages([
                'payment_intent_id' => 'This payment intent cannot be captured. It may have already been processed or cancelled.',
            ]);
        }

        // Get description from payable if available
        $description = 'Payment';
        if ($paymentIntent->payable) {
            $payableName = class_basename($paymentIntent->payable);
            if (method_exists($paymentIntent->payable, 'name')) {
                $description = "{$payableName}: {$paymentIntent->payable->name}";
            } elseif (property_exists($paymentIntent->payable, 'name')) {
                $description = "{$payableName}: {$paymentIntent->payable->name}";
            } else {
                $description = $payableName;
            }
        }

        // Create capture data
        $captureData = new PaymentCaptureData(
            providerIntentId: $paymentIntent->provider_intent_id,
            amount: $paymentIntent->amountMoney(),
            metadata: array_merge($paymentIntent->metadata ?? [], [
                'payment_method_id' => $paymentMethod->id,
                'payment_method_token' => $paymentMethod->provider_method_id,
            ]),
            statementDescriptor: $description
        );

        try {
            $payment = $this->paymentService->capture(
                $paymentIntent,
                $captureData,
                $paymentIntent->provider,
                $paymentMethod->id
            );

            // Push a success toast for membership purchases
            if ($paymentIntent->payable instanceof MembershipPlan) {
                $planName = $paymentIntent->payable->name;
                $this->toastBus->success(
                    $user,
                    "Welcome to {$planName}! Your membership is now active.",
                    ['title' => 'Purchase Successful']
                );
            }

            return response()->json([
                'success' => true,
                'payment' => [
                    'id' => $payment->id,
                    'uuid' => $payment->uuid,
                    'status' => $payment->status->value,
                    'amount' => $payment->amount,
                    'currency' => $payment->currency,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to capture payment: '.$e->getMessage(),
            ], JsonResponse::HTTP_BAD_REQUEST);
        }
    }
}
