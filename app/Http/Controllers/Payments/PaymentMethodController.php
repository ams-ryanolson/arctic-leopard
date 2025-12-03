<?php

namespace App\Http\Controllers\Payments;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payments\StorePaymentMethodRequest;
use App\Models\Payments\PaymentMethod;
use App\Payments\PaymentGatewayManager;
use App\Services\Payments\PaymentMethodService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentMethodController extends Controller
{
    public function __construct(
        protected PaymentMethodService $paymentMethodService,
        protected PaymentGatewayManager $gateways
    ) {}

    /**
     * Get frontend bearer token for CCBill widget.
     * Generated server-side for security compliance.
     */
    public function getFrontendToken(Request $request): JsonResponse
    {
        $gateway = $request->input('gateway', 'ccbill');
        $driver = $this->gateways->driver($gateway);

        if (! method_exists($driver, 'generateFrontendToken')) {
            return response()->json([
                'error' => "Gateway [{$gateway}] does not support frontend tokens.",
            ], JsonResponse::HTTP_BAD_REQUEST);
        }

        try {
            $token = $driver->generateFrontendToken();

            // Include frontend application ID for widget initialization
            $applicationId = null;
            if ($gateway === 'ccbill' && method_exists($driver, 'getFrontendApplicationId')) {
                $applicationId = $driver->getFrontendApplicationId();
            } elseif ($gateway === 'ccbill') {
                // Fallback: get from config directly
                $applicationId = config('payments.gateways.ccbill.options.frontend_app_id');
            }

            return response()->json([
                'token' => $token,
                'gateway' => $gateway,
                'application_id' => $applicationId,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to generate frontend token.',
                'message' => $e->getMessage(),
            ], JsonResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * List user's payment methods.
     */
    public function index(Request $request): JsonResponse
    {
        $methods = $this->paymentMethodService->getUserPaymentMethods($request->user());

        return response()->json($methods);
    }

    /**
     * Vault a payment token (after widget creates it).
     */
    public function store(StorePaymentMethodRequest $request): JsonResponse
    {
        $user = $request->user();
        $gateway = $request->input('gateway', 'ccbill');

        try {
            // Build card details from request if provided
            // CCBill doesn't return card details via API, so we accept them from frontend
            $cardDetails = null;
            if ($request->filled('card_last_four')) {
                $cardDetails = \App\Payments\Data\CardDetails::fromArray([
                    'last_four' => $request->input('card_last_four'),
                    'brand' => $request->input('card_brand', 'unknown'),
                    'exp_month' => $request->input('card_exp_month', ''),
                    'exp_year' => $request->input('card_exp_year', ''),
                    'fingerprint' => null,
                ]);
            }

            // Vault the token
            $paymentMethod = $this->paymentMethodService->vaultToken(
                $user,
                $request->input('provider_token_id'),
                $gateway,
                $cardDetails
            );

            // Set as default if requested
            if ($request->boolean('is_default')) {
                $this->paymentMethodService->setDefaultPaymentMethod($user, $paymentMethod);
                $paymentMethod->refresh();
            }

            return response()->json($paymentMethod, JsonResponse::HTTP_CREATED);
        } catch (\App\Payments\Exceptions\PaymentTokenVaultingException $e) {
            return response()->json([
                'error' => 'Failed to vault payment token.',
                'message' => $e->getMessage(),
            ], JsonResponse::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An error occurred while vaulting the payment token.',
                'message' => $e->getMessage(),
            ], JsonResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete a payment method.
     */
    public function destroy(Request $request, PaymentMethod $paymentMethod): JsonResponse
    {
        // Verify ownership
        if ($paymentMethod->user_id !== $request->user()->id) {
            return response()->json([
                'error' => 'Payment method not found.',
            ], JsonResponse::HTTP_NOT_FOUND);
        }

        try {
            $this->paymentMethodService->deletePaymentMethod($paymentMethod);

            return response()->json(status: JsonResponse::HTTP_NO_CONTENT);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to delete payment method.',
                'message' => $e->getMessage(),
            ], JsonResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Set a payment method as default.
     */
    public function setDefault(Request $request, PaymentMethod $paymentMethod): JsonResponse
    {
        // Verify ownership
        if ($paymentMethod->user_id !== $request->user()->id) {
            return response()->json([
                'error' => 'Payment method not found.',
            ], JsonResponse::HTTP_NOT_FOUND);
        }

        try {
            $this->paymentMethodService->setDefaultPaymentMethod($request->user(), $paymentMethod);
            $paymentMethod->refresh();

            return response()->json($paymentMethod);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to set default payment method.',
                'message' => $e->getMessage(),
            ], JsonResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
