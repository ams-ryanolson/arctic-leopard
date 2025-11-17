<?php

namespace App\Http\Controllers\Webhooks;

use App\Enums\Payments\PaymentWebhookStatus;
use App\Http\Controllers\Controller;
use App\Jobs\Payments\ProcessPaymentWebhook;
use App\Models\Payments\PaymentWebhook;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentWebhookController extends Controller
{
    public function store(Request $request, string $provider): JsonResponse
    {
        $payload = $request->json()->all();

        $webhook = PaymentWebhook::query()->create([
            'provider' => $provider,
            'event' => $payload['type'] ?? $request->input('event'),
            'signature' => $request->header('stripe-signature') ?? $request->header('x-signature'),
            'headers' => $request->headers->all(),
            'payload' => $payload ?: $request->all(),
            'status' => PaymentWebhookStatus::Pending,
        ]);

        ProcessPaymentWebhook::dispatch($webhook);

        return response()->json([
            'id' => $webhook->id,
        ], JsonResponse::HTTP_ACCEPTED);
    }
}
