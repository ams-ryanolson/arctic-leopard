<?php

namespace App\Http\Controllers\Memberships;

use App\Http\Controllers\Controller;
use App\Models\Memberships\MembershipPlan;
use App\Models\Memberships\UserMembership;
use App\Payments\Data\PaymentIntentData;
use App\Services\Memberships\MembershipDiscountService;
use App\Services\Memberships\MembershipService;
use App\Services\Payments\PaymentService;
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
        private readonly MembershipDiscountService $discountService
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

    public function checkout(MembershipPlan $plan): Response
    {
        $user = request()->user();

        // Prevent admins, super admins, and moderators from accessing checkout
        if ($user && $user->hasRole(['Admin', 'Super Admin', 'Moderator'])) {
            abort(403, 'Administrators and moderators cannot purchase memberships.');
        }

        return Inertia::render('Memberships/Checkout', [
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
        ]);
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
                metadata: [
                    'membership_plan_id' => $plan->id,
                    'billing_type' => $billingType,
                    'billing_interval' => $billingInterval,
                    'discount_code' => $discount?->code,
                    'discount_amount' => $discountAmount,
                ]
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
                metadata: [
                    'membership_plan_id' => $newPlan->id,
                    'current_membership_id' => $membership->id,
                    'billing_type' => $billingType,
                    'billing_interval' => $billingInterval,
                    'discount_code' => $discount?->code,
                    'discount_amount' => $discountAmount,
                    'is_upgrade' => true,
                ]
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
