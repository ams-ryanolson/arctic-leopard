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

            return response()->json([
                'token' => $token,
                'gateway' => $gateway,
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
            // Vault the token
            $paymentMethod = $this->paymentMethodService->vaultToken(
                $user,
                $request->input('provider_token_id'),
                $gateway
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
