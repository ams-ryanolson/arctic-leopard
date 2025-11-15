<?php

namespace App\Http\Controllers\Radar;

use App\Http\Controllers\Controller;
use App\Http\Requests\Radar\StoreBoostRequest;
use App\Services\Radar\BoostService;
use Illuminate\Http\JsonResponse;

class BoostController extends Controller
{
    public function __construct(
        private readonly BoostService $boostService,
    ) {}

    /**
     * Store a new boost activation.
     */
    public function store(StoreBoostRequest $request): JsonResponse
    {
        $user = $request->user();

        if ($user === null) {
            return response()->json([
                'message' => 'You must be authenticated to boost.',
            ], 401);
        }

        $boost = $this->boostService->activateBoost($user);
        $boostInfo = $this->boostService->getBoostInfo($user);

        return response()->json([
            'message' => 'Boost activated successfully!',
            'boost' => [
                'id' => $boost->getKey(),
                'expires_at' => $boost->expires_at->toIso8601String(),
            ],
            'boost_info' => $boostInfo,
        ], 201);
    }
}
