<?php

namespace App\Http\Controllers\Toasts;

use App\Events\Toasts\ToastAcknowledged;
use App\Http\Controllers\Controller;
use App\Http\Requests\Toasts\AcknowledgeToastRequest;
use App\Services\Toasts\ToastBus;
use Illuminate\Http\Response;

class AcknowledgeToastController extends Controller
{
    public function __invoke(AcknowledgeToastRequest $request, ToastBus $toastBus, string $toast): Response
    {
        $user = $request->user();

        $payload = $toastBus->forget($user, $toast);

        if ($payload) {
            ToastAcknowledged::dispatch($user, $payload);
        }

        return response()->noContent();
    }
}




