<?php

namespace App\Http\Controllers\Toasts;

use App\Events\Toasts\ToastActionResolved;
use App\Http\Controllers\Controller;
use App\Http\Requests\Toasts\ResolveToastActionRequest;
use App\Services\Toasts\ToastBus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class ResolveToastActionController extends Controller
{
    public function __invoke(ResolveToastActionRequest $request, ToastBus $toastBus, string $toast): JsonResponse|Response
    {
        $user = $request->user();
        $payload = $toastBus->find($user, $toast);

        if (! $payload) {
            return response()->json([
                'message' => 'Toast expired.',
            ], Response::HTTP_GONE);
        }

        $actionKey = $request->string('action')->toString();
        $action = $payload->action($actionKey);

        if (! $action) {
            return response()->json([
                'message' => 'Action is no longer available.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $toastBus->forget($user, $toast);

        /** @var array<string, mixed> $input */
        $input = $request->validated()['payload'] ?? [];

        ToastActionResolved::dispatch($user, $payload, $actionKey, $input);

        return response()->json([
            'toast' => $payload->toArray(),
            'action' => $action,
            'input' => $input,
        ]);
    }
}
