<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Jobs\Verification\ProcessSumsubWebhook;
use App\Services\Verification\SumsubService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SumsubWebhookController extends Controller
{
    public function __construct(
        private readonly SumsubService $sumsubService,
    ) {}

    /**
     * Handle webhook from Sumsub.
     */
    public function handle(Request $request): JsonResponse
    {
        $payload = $request->getContent();
        $signature = $request->header('X-Payload-Digest') ?? $request->header('X-Sumsub-Signature') ?? '';

        if ($signature !== '' && ! $this->sumsubService->verifyWebhookSignature($payload, $signature)) {
            return response()->json([
                'error' => 'Invalid signature',
            ], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($payload, true);

        ProcessSumsubWebhook::dispatch($data);

        return response()->json([
            'status' => 'accepted',
        ], JsonResponse::HTTP_ACCEPTED);
    }
}
