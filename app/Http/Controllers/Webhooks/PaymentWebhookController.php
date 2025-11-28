<?php

namespace App\Http\Controllers\Webhooks;

use App\Enums\Payments\PaymentWebhookStatus;
use App\Http\Controllers\Controller;
use App\Jobs\Payments\ProcessPaymentWebhook;
use App\Models\Payments\PaymentWebhook;
use App\Services\Payments\CCBillWebhookProcessor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentWebhookController extends Controller
{
    public function store(Request $request, string $provider): JsonResponse
    {
        $payload = $request->json()->all() ?: $request->all();
        $rawPayload = $request->getContent();

        // Extract event type and signature based on provider
        [$event, $signature] = $this->extractEventAndSignature($request, $provider, $payload);

        // For CCBill, verify signature before storing
        if ($provider === 'ccbill') {
            $config = config('payments.webhooks.providers.ccbill', []);
            $processor = new CCBillWebhookProcessor($config);

            if (! $processor->verifySignature($rawPayload, $signature)) {
                return response()->json([
                    'error' => 'Invalid signature',
                ], JsonResponse::HTTP_UNAUTHORIZED);
            }
        }

        $webhook = PaymentWebhook::query()->create([
            'provider' => $provider,
            'event' => $event,
            'signature' => $signature,
            'headers' => $request->headers->all(),
            'payload' => $payload,
            'status' => PaymentWebhookStatus::Pending,
        ]);

        ProcessPaymentWebhook::dispatch($webhook);

        return response()->json([
            'id' => $webhook->id,
        ], JsonResponse::HTTP_ACCEPTED);
    }

    /**
     * Extract event type and signature from request based on provider.
     *
     * @param  array<string, mixed>  $payload
     * @return array{0: string, 1: string}
     */
    protected function extractEventAndSignature(Request $request, string $provider, array $payload): array
    {
        return match ($provider) {
            'ccbill' => [
                $payload['event'] ?? $payload['type'] ?? $request->input('event', 'unknown'),
                $request->header('X-CCBill-Signature') ?? $request->header('X-Signature') ?? '',
            ],
            'stripe' => [
                $payload['type'] ?? $request->input('event'),
                $request->header('stripe-signature') ?? '',
            ],
            default => [
                $payload['type'] ?? $payload['event'] ?? $request->input('event', 'unknown'),
                $request->header('x-signature') ?? '',
            ],
        };
    }
}
