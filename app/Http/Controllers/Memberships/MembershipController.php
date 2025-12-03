<?php

namespace App\Http\Controllers\Memberships;

use App\Http\Controllers\Controller;
use App\Http\Requests\Memberships\CompleteGiftMembershipRequest;
use App\Http\Requests\Memberships\GiftMembershipRequest;
use App\Models\Memberships\MembershipPlan;
use App\Models\Memberships\UserMembership;
use App\Models\Payments\PaymentIntent;
use App\Models\User;
use App\Payments\Data\PaymentCaptureData;
use App\Payments\Data\PaymentIntentData;
use App\Services\Memberships\MembershipDiscountService;
use App\Services\Memberships\MembershipService;
use App\Services\Payments\PaymentService;
use App\Services\Toasts\ToastBus;
use App\ValueObjects\Money;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class MembershipController extends Controller
{
    public function __construct(
        private readonly PaymentService $paymentService,
        private readonly MembershipService $membershipService,
        private readonly MembershipDiscountService $discountService,
        private readonly ToastBus $toastBus
    ) {}

    public function index(Request $request): Response
    {
        $plans = MembershipPlan::query()
            ->where('is_active', true)
            ->where('is_public', true)
            ->orderBy('display_order')
            ->orderBy('name')
            ->get()
            ->map(static function (MembershipPlan $plan) {
                return [
                    'id' => $plan->id,
                    'uuid' => $plan->uuid,
                    'name' => $plan->name,
                    'slug' => $plan->slug,
                    'description' => $plan->description,
                    'monthly_price' => $plan->monthly_price,
                    'yearly_price' => $plan->yearly_price,
                    'currency' => $plan->currency,
                    'role_to_assign' => $plan->role_to_assign,
                    'features' => $plan->features ?? [],
                    'allows_recurring' => $plan->allows_recurring,
                    'allows_one_time' => $plan->allows_one_time,
                    'one_time_duration_days' => $plan->one_time_duration_days,
                ];
            });

        $user = $request->user();
        $currentMembership = $user ? $user->activeMembership() : null;

        return Inertia::render('Memberships/Upgrade', [
            'plans' => $plans,
            'currentMembership' => $currentMembership ? [
                'id' => $currentMembership->id,
                'plan' => [
                    'id' => $currentMembership->plan->id,
                    'name' => $currentMembership->plan->name,
                    'slug' => $currentMembership->plan->slug,
                ],
                'status' => $currentMembership->status,
                'ends_at' => $currentMembership->ends_at?->toIso8601String(),
            ] : null,
        ]);
    }

    public function checkout(Request $request, MembershipPlan $plan): Response
    {
        $user = $request->user();

        // Prevent admins, super admins, and moderators from accessing checkout
        if ($user && $user->hasRole(['Admin', 'Super Admin', 'Moderator'])) {
            abort(403, 'Administrators and moderators cannot purchase memberships.');
        }

        $ccbillOptions = config('payments.gateways.ccbill.options', []);

        $paymentIntentId = $request->input('payment_intent_id');
        $isGift = false;
        $giftRecipient = null;
        $paymentIntent = null;
        $paymentIntentError = null;

        // If payment_intent_id is provided, check if it's a gift
        if ($paymentIntentId) {
            $paymentIntent = PaymentIntent::find($paymentIntentId);

            if ($paymentIntent && ($paymentIntent->metadata['is_gift'] ?? false)) {
                $isGift = true;
                // Get recipient from payment intent metadata or payee_id
                $recipientId = $paymentIntent->metadata['gifted_to_user_id'] ?? $paymentIntent->payee_id;
                if ($recipientId) {
                    $giftRecipient = User::find($recipientId);
                }

                // Validate payment intent is still valid
                if ($paymentIntent->expires_at && $paymentIntent->expires_at->isPast()) {
                    $paymentIntentError = [
                        'message' => 'This payment session has expired. Please create a new gift.',
                        'expired' => true,
                    ];
                } elseif (! in_array($paymentIntent->status, [
                    \App\Enums\Payments\PaymentIntentStatus::RequiresMethod,
                    \App\Enums\Payments\PaymentIntentStatus::RequiresConfirmation,
                    \App\Enums\Payments\PaymentIntentStatus::Processing,
                ])) {
                    $paymentIntentError = [
                        'message' => 'This payment intent cannot be completed. It may have already been processed or cancelled.',
                        'expired' => false,
                    ];
                } elseif ($user && $paymentIntent->payer_id !== $user->id) {
                    $paymentIntentError = [
                        'message' => 'This payment intent does not belong to you.',
                        'expired' => false,
                    ];
                }
            }
        }

        $checkoutData = [
            'plan' => [
                'id' => $plan->id,
                'name' => $plan->name,
                'slug' => $plan->slug,
                'description' => $plan->description,
                'monthly_price' => $plan->monthly_price,
                'yearly_price' => $plan->yearly_price,
                'currency' => $plan->currency,
                'features' => $plan->features ?? [],
                'allows_recurring' => $plan->allows_recurring,
                'allows_one_time' => $plan->allows_one_time,
            ],
            'payment_intent_id' => $paymentIntentId,
            'is_gift' => $isGift,
            'gift_recipient' => $giftRecipient ? [
                'id' => $giftRecipient->id,
                'username' => $giftRecipient->username,
                'display_name' => $giftRecipient->display_name,
            ] : null,
            'ccbill_client_accnum' => $ccbillOptions['low_risk_non_recurring']['client_accnum'] ?? null,
            'ccbill_client_subacc' => $ccbillOptions['low_risk_non_recurring']['client_subacc'] ?? null,
        ];

        // Add payment intent details if it's a gift and valid
        if ($isGift && $paymentIntent && ! $paymentIntentError) {
            $checkoutData['payment_intent'] = [
                'id' => $paymentIntent->id,
                'uuid' => $paymentIntent->uuid,
                'amount' => $paymentIntent->amount,
                'currency' => $paymentIntent->currency,
                'status' => $paymentIntent->status->value,
                'provider_intent_id' => $paymentIntent->provider_intent_id,
            ];
        }

        // Add error if payment intent is invalid
        if ($paymentIntentError) {
            $checkoutData['payment_intent_error'] = $paymentIntentError;
        }

        return Inertia::render('Memberships/Checkout', $checkoutData);
    }

    public function purchase(Request $request): JsonResponse
    {
        $request->validate([
            'plan_id' => ['required', 'integer', 'exists:membership_plans,id'],
            'billing_type' => ['required', 'string', 'in:recurring,one_time'],
            'billing_interval' => ['required', 'string', 'in:monthly,yearly'],
            'discount_code' => ['nullable', 'string'],
            'gateway' => ['nullable', 'string'],
            'method' => ['nullable', 'string'],
            'payment_method_id' => ['nullable', 'integer', 'exists:payment_methods,id'],
        ]);

        $user = $request->user();

        // Prevent admins, super admins, and moderators from purchasing memberships
        if ($user->hasRole(['Admin', 'Super Admin', 'Moderator'])) {
            throw ValidationException::withMessages([
                'plan_id' => 'Administrators and moderators cannot purchase memberships.',
            ]);
        }
        $plan = MembershipPlan::findOrFail($request->integer('plan_id'));

        if (! $plan->is_active || ! $plan->is_public) {
            throw ValidationException::withMessages(['plan_id' => 'This membership plan is not available.']);
        }

        $billingType = $request->string('billing_type')->toString();
        $billingInterval = $request->string('billing_interval')->toString();

        if ($billingType === 'recurring' && ! $plan->isRecurringAvailable()) {
            throw ValidationException::withMessages(['billing_type' => 'Recurring billing is not available for this plan.']);
        }

        if ($billingType === 'one_time' && ! $plan->isOneTimeAvailable()) {
            throw ValidationException::withMessages(['billing_type' => 'One-time purchase is not available for this plan.']);
        }

        if ($billingInterval === 'yearly' && $plan->yearly_price === 0) {
            throw ValidationException::withMessages(['billing_interval' => 'Yearly billing is not available for this plan.']);
        }

        $price = $billingInterval === 'yearly' ? $plan->yearly_price : $plan->monthly_price;
        $discountAmount = 0;
        $discount = null;

        if ($request->filled('discount_code')) {
            $discount = $this->discountService->validateCode($request->string('discount_code')->toString(), $plan);

            if ($discount === null) {
                throw ValidationException::withMessages(['discount_code' => 'Invalid or expired discount code.']);
            }

            $discountAmount = $this->discountService->applyDiscount($discount, $price);
        }

        $finalPrice = $price - $discountAmount;

        // If 100% discount (free), create membership directly without payment gateway
        if ($finalPrice <= 0) {
            // Create a free payment record
            $payment = \App\Models\Payments\Payment::create([
                'payable_type' => MembershipPlan::class,
                'payable_id' => $plan->id,
                'payer_id' => $user->id,
                'payee_id' => null,
                'type' => $billingType === 'recurring' ? \App\Enums\Payments\PaymentType::Recurring : \App\Enums\Payments\PaymentType::OneTime,
                'status' => \App\Enums\Payments\PaymentStatus::Captured,
                'amount' => 0,
                'fee_amount' => 0,
                'net_amount' => 0,
                'currency' => $plan->currency,
                'method' => 'free',
                'provider' => 'free',
                'metadata' => [
                    'membership_plan_id' => $plan->id,
                    'billing_type' => $billingType,
                    'billing_interval' => $billingInterval,
                    'discount_code' => $discount?->code,
                    'discount_amount' => $discountAmount,
                    'free_membership' => true,
                ],
                'authorized_at' => now(),
                'captured_at' => now(),
            ]);

            // Record discount usage if applicable
            if ($discount !== null) {
                $this->discountService->recordUsage($discount);
            }

            // Create membership directly
            $membership = $this->membershipService->purchase(
                $user,
                $plan,
                $payment,
                $billingType,
                $discountAmount
            );

            return response()->json([
                'free_membership' => true,
                'membership' => [
                    'id' => $membership->id,
                    'uuid' => $membership->uuid,
                    'plan' => [
                        'id' => $plan->id,
                        'name' => $plan->name,
                    ],
                ],
                'plan' => [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'price' => $finalPrice,
                    'original_price' => $price,
                    'discount_amount' => $discountAmount,
                ],
            ], JsonResponse::HTTP_CREATED);
        }

        $intent = $this->paymentService->createIntent(
            new PaymentIntentData(
                payableType: MembershipPlan::class,
                payableId: $plan->id,
                amount: Money::from($finalPrice, $plan->currency),
                payerId: $user->id,
                payeeId: null,
                type: $billingType === 'recurring' ? \App\Enums\Payments\PaymentType::Recurring : \App\Enums\Payments\PaymentType::OneTime,
                method: $request->input('method'),
                description: "Membership: {$plan->name}",
                metadata: array_merge([
                    'membership_plan_id' => $plan->id,
                    'billing_type' => $billingType,
                    'billing_interval' => $billingInterval,
                    'discount_code' => $discount?->code,
                    'discount_amount' => $discountAmount,
                    'payment_type' => $billingType === 'recurring' ? 'recurring' : 'one_time',
                ], $request->filled('payment_method_id') ? ['payment_method_id' => $request->input('payment_method_id')] : [])
            ),
            $request->input('gateway')
        );

        return response()->json([
            'payment_intent' => [
                'id' => $intent->id,
                'uuid' => $intent->uuid,
                'client_secret' => $intent->client_secret,
                'status' => $intent->status->value,
            ],
            'plan' => [
                'id' => $plan->id,
                'name' => $plan->name,
                'price' => $finalPrice,
                'original_price' => $price,
                'discount_amount' => $discountAmount,
            ],
        ], JsonResponse::HTTP_CREATED);
    }

    public function gift(GiftMembershipRequest $request): JsonResponse
    {
        $gifter = $request->user();
        $recipient = User::findOrFail($request->integer('recipient_id'));
        $plan = MembershipPlan::findOrFail($request->integer('plan_id'));

        // Prevent admins, super admins, and moderators from gifting memberships
        if ($gifter->hasRole(['Admin', 'Super Admin', 'Moderator'])) {
            throw ValidationException::withMessages([
                'plan_id' => 'Administrators and moderators cannot gift memberships.',
            ]);
        }

        if (! $plan->is_active || ! $plan->is_public) {
            throw ValidationException::withMessages(['plan_id' => 'This membership plan is not available.']);
        }

        // Gift memberships are one-time only
        if (! $plan->isOneTimeAvailable()) {
            throw ValidationException::withMessages(['plan_id' => 'This membership plan does not support one-time purchases.']);
        }

        $price = $plan->monthly_price; // Use monthly price for one-time gifts
        $discountAmount = 0;
        $discount = null;

        // Note: Discounts could be applied to gifts, but for now we'll skip them
        // If needed, add discount_code validation similar to purchase()

        $finalPrice = $price - $discountAmount;

        // If 100% discount (free), create membership directly without payment gateway
        if ($finalPrice <= 0) {
            // Create a free payment record
            $payment = \App\Models\Payments\Payment::create([
                'payable_type' => MembershipPlan::class,
                'payable_id' => $plan->id,
                'payer_id' => $gifter->id,
                'payee_id' => $recipient->id,
                'type' => \App\Enums\Payments\PaymentType::OneTime,
                'status' => \App\Enums\Payments\PaymentStatus::Captured,
                'amount' => 0,
                'fee_amount' => 0,
                'net_amount' => 0,
                'currency' => $plan->currency,
                'method' => 'free',
                'provider' => 'free',
                'metadata' => [
                    'membership_plan_id' => $plan->id,
                    'billing_type' => 'one_time',
                    'discount_amount' => $discountAmount,
                    'is_gift' => true,
                    'gifted_to_user_id' => $recipient->id,
                    'gifted_by_user_id' => $gifter->id,
                    'gift_message' => $request->input('message'),
                    'free_membership' => true,
                ],
                'authorized_at' => now(),
                'captured_at' => now(),
            ]);

            // Create gift membership directly
            $membership = $this->membershipService->gift(
                $recipient,
                $gifter,
                $plan,
                $payment,
                $discountAmount
            );

            return response()->json([
                'free_membership' => true,
                'membership' => [
                    'id' => $membership->id,
                    'uuid' => $membership->uuid,
                    'plan' => [
                        'id' => $plan->id,
                        'name' => $plan->name,
                    ],
                ],
                'plan' => [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'price' => $finalPrice,
                    'original_price' => $price,
                    'discount_amount' => $discountAmount,
                ],
            ], JsonResponse::HTTP_CREATED);
        }

        $intent = $this->paymentService->createIntent(
            new PaymentIntentData(
                payableType: MembershipPlan::class,
                payableId: $plan->id,
                amount: Money::from($finalPrice, $plan->currency),
                payerId: $gifter->id,
                payeeId: $recipient->id,
                type: \App\Enums\Payments\PaymentType::OneTime,
                method: $request->input('method'),
                description: "Gift Membership: {$plan->name}",
                metadata: array_merge([
                    'membership_plan_id' => $plan->id,
                    'billing_type' => 'one_time',
                    'discount_amount' => $discountAmount,
                    'is_gift' => true,
                    'gifted_to_user_id' => $recipient->id,
                    'gifted_by_user_id' => $gifter->id,
                    'gift_message' => $request->input('message'),
                    'payment_type' => 'one_time',
                ], $request->filled('payment_method_id') ? ['payment_method_id' => $request->input('payment_method_id')] : [])
            ),
            $request->input('gateway')
        );

        return response()->json([
            'payment_intent' => [
                'id' => $intent->id,
                'uuid' => $intent->uuid,
                'client_secret' => $intent->client_secret,
                'status' => $intent->status->value,
            ],
            'plan' => [
                'id' => $plan->id,
                'name' => $plan->name,
                'price' => $finalPrice,
                'original_price' => $price,
                'discount_amount' => $discountAmount,
            ],
            'recipient' => [
                'id' => $recipient->id,
                'username' => $recipient->username,
                'display_name' => $recipient->display_name,
            ],
        ], JsonResponse::HTTP_CREATED);
    }

    public function completeGift(CompleteGiftMembershipRequest $request): JsonResponse
    {
        $user = $request->user();
        $paymentIntent = PaymentIntent::with('payable')->findOrFail($request->integer('payment_intent_id'));

        $planName = $paymentIntent->payable instanceof MembershipPlan
            ? $paymentIntent->payable->name
            : 'Membership';

        // Create PaymentCaptureData from the payment intent
        $captureData = new PaymentCaptureData(
            providerIntentId: $paymentIntent->provider_intent_id,
            amount: $paymentIntent->amountMoney(),
            metadata: $paymentIntent->metadata ?? [],
            statementDescriptor: "Gift Membership: {$planName}"
        );

        // Capture the payment
        $payment = $this->paymentService->capture(
            $paymentIntent,
            $captureData,
            $paymentIntent->provider,
            $request->input('payment_method_id')
        );

        // Load the created membership (should be created by CreateMembershipOnPaymentCaptured listener)
        $membership = UserMembership::where('payment_id', $payment->id)
            ->whereNotNull('gifted_by_user_id')
            ->with(['plan', 'user'])
            ->first();

        // Get recipient info for toast
        $recipientName = $membership?->user?->display_name ?? $membership?->user?->username ?? 'your friend';

        // Push success toast for the gifter
        $this->toastBus->success(
            $user,
            "Your gift of {$planName} membership has been sent to {$recipientName}!",
            ['title' => 'Gift Sent Successfully']
        );

        return response()->json([
            'success' => true,
            'message' => 'Gift membership purchased successfully',
            'payment' => [
                'id' => $payment->id,
                'uuid' => $payment->uuid,
                'status' => $payment->status->value,
            ],
            'membership' => $membership ? [
                'id' => $membership->id,
                'uuid' => $membership->uuid,
                'plan' => [
                    'id' => $membership->plan->id,
                    'name' => $membership->plan->name,
                ],
            ] : null,
        ], JsonResponse::HTTP_OK);
    }

    public function upgrade(Request $request, UserMembership $membership): JsonResponse
    {
        Gate::authorize('update', $membership);

        $request->validate([
            'plan_id' => ['required', 'integer', 'exists:membership_plans,id'],
            'billing_type' => ['required', 'string', 'in:recurring,one_time'],
            'billing_interval' => ['required', 'string', 'in:monthly,yearly'],
            'discount_code' => ['nullable', 'string'],
            'gateway' => ['nullable', 'string'],
            'method' => ['nullable', 'string'],
        ]);

        $user = $request->user();
        $newPlan = MembershipPlan::findOrFail($request->integer('plan_id'));

        if (! $membership->canUpgrade()) {
            throw ValidationException::withMessages(['membership' => 'This membership cannot be upgraded.']);
        }

        $billingType = $request->string('billing_type')->toString();
        $billingInterval = $request->string('billing_interval')->toString();

        $upgradePrice = $this->membershipService->calculateUpgradePrice($membership, $newPlan, $billingInterval);
        $discountAmount = 0;
        $discount = null;

        if ($request->filled('discount_code')) {
            $discount = $this->discountService->validateCode($request->string('discount_code')->toString(), $newPlan);

            if ($discount === null) {
                throw ValidationException::withMessages(['discount_code' => 'Invalid or expired discount code.']);
            }

            $discountAmount = $this->discountService->applyDiscount($discount, $upgradePrice);
        }

        $finalPrice = max(0, $upgradePrice - $discountAmount);

        // If 100% discount (free upgrade), create membership directly without payment gateway
        if ($finalPrice <= 0) {
            // Create a free payment record
            $payment = \App\Models\Payments\Payment::create([
                'payable_type' => MembershipPlan::class,
                'payable_id' => $newPlan->id,
                'payer_id' => $user->id,
                'payee_id' => null,
                'type' => $billingType === 'recurring' ? \App\Enums\Payments\PaymentType::Recurring : \App\Enums\Payments\PaymentType::OneTime,
                'status' => \App\Enums\Payments\PaymentStatus::Captured,
                'amount' => 0,
                'fee_amount' => 0,
                'net_amount' => 0,
                'currency' => $newPlan->currency,
                'method' => 'free',
                'provider' => 'free',
                'metadata' => [
                    'membership_plan_id' => $newPlan->id,
                    'current_membership_id' => $membership->id,
                    'billing_type' => $billingType,
                    'billing_interval' => $billingInterval,
                    'discount_code' => $discount?->code,
                    'discount_amount' => $discountAmount,
                    'is_upgrade' => true,
                    'free_membership' => true,
                ],
                'authorized_at' => now(),
                'captured_at' => now(),
            ]);

            // Record discount usage if applicable
            if ($discount !== null) {
                $this->discountService->recordUsage($discount);
            }

            // Upgrade membership directly
            $newMembership = $this->membershipService->upgrade(
                $user,
                $membership,
                $newPlan,
                $payment,
                $billingType,
                $discountAmount
            );

            return response()->json([
                'free_membership' => true,
                'membership' => [
                    'id' => $newMembership->id,
                    'uuid' => $newMembership->uuid,
                    'plan' => [
                        'id' => $newPlan->id,
                        'name' => $newPlan->name,
                    ],
                ],
                'upgrade_price' => $finalPrice,
                'original_upgrade_price' => $upgradePrice,
                'discount_amount' => $discountAmount,
            ], JsonResponse::HTTP_CREATED);
        }

        $intent = $this->paymentService->createIntent(
            new PaymentIntentData(
                payableType: MembershipPlan::class,
                payableId: $newPlan->id,
                amount: Money::from($finalPrice, $newPlan->currency),
                payerId: $user->id,
                payeeId: null,
                type: $billingType === 'recurring' ? \App\Enums\Payments\PaymentType::Recurring : \App\Enums\Payments\PaymentType::OneTime,
                method: $request->input('method'),
                description: "Upgrade membership to {$newPlan->name}",
                metadata: array_merge([
                    'membership_plan_id' => $newPlan->id,
                    'current_membership_id' => $membership->id,
                    'billing_type' => $billingType,
                    'billing_interval' => $billingInterval,
                    'discount_code' => $discount?->code,
                    'discount_amount' => $discountAmount,
                    'is_upgrade' => true,
                    'payment_type' => $billingType === 'recurring' ? 'recurring' : 'one_time',
                ], $request->filled('payment_method_id') ? ['payment_method_id' => $request->input('payment_method_id')] : [])
            ),
            $request->input('gateway')
        );

        return response()->json([
            'payment_intent' => [
                'id' => $intent->id,
                'uuid' => $intent->uuid,
                'client_secret' => $intent->client_secret,
                'status' => $intent->status->value,
            ],
            'upgrade_price' => $finalPrice,
            'original_upgrade_price' => $upgradePrice,
            'discount_amount' => $discountAmount,
        ], JsonResponse::HTTP_CREATED);
    }

    public function cancel(Request $request, UserMembership $membership): JsonResponse
    {
        Gate::authorize('update', $membership);

        $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $this->membershipService->cancel($membership, $request->input('reason'));

        return response()->json([
            'message' => 'Membership cancelled successfully.',
        ]);
    }

    public function applyDiscount(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string'],
            'plan_id' => ['nullable', 'integer', 'exists:membership_plans,id'],
            'price' => ['required', 'integer', 'min:0'],
        ]);

        $plan = $request->filled('plan_id') ? MembershipPlan::findOrFail($request->integer('plan_id')) : null;
        $discount = $this->discountService->validateCode($request->string('code')->toString(), $plan);

        if ($discount === null) {
            return response()->json([
                'valid' => false,
                'message' => 'Invalid or expired discount code.',
            ], JsonResponse::HTTP_BAD_REQUEST);
        }

        $discountAmount = $this->discountService->applyDiscount($discount, $request->integer('price'));
        $finalPrice = max(0, $request->integer('price') - $discountAmount);

        return response()->json([
            'valid' => true,
            'discount' => [
                'code' => $discount->code,
                'type' => $discount->discount_type,
                'value' => $discount->discount_value,
                'amount' => $discountAmount,
            ],
            'original_price' => $request->integer('price'),
            'discount_amount' => $discountAmount,
            'final_price' => $finalPrice,
        ]);
    }
}
