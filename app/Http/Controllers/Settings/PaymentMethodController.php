<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Services\Payments\PaymentMethodService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class PaymentMethodController extends Controller
{
    public function __construct(
        protected PaymentMethodService $paymentMethodService
    ) {}

    /**
     * Display payment methods settings page.
     */
    public function index(Request $request): InertiaResponse
    {
        $user = $request->user();
        $paymentMethods = $this->paymentMethodService->getUserPaymentMethods($user);

        $ccbillOptions = config('payments.gateways.ccbill.options', []);

        return Inertia::render('settings/payment-methods', [
            'payment_methods' => $paymentMethods,
            'ccbill_client_accnum' => $ccbillOptions['low_risk_non_recurring']['client_accnum'] ?? null,
            'ccbill_client_subacc' => $ccbillOptions['low_risk_non_recurring']['client_subacc'] ?? null,
            'user' => [
                'email' => $user->email,
                'name' => $user->name,
                'location_city' => $user->location_city,
                'location_region' => $user->location_region,
                'location_country' => $user->location_country,
            ],
        ]);
    }
}
