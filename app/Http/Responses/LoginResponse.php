<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        /** @var Request $request */
        if ($request->wantsJson()) {
            return new JsonResponse([
                'redirect' => route('dashboard', absolute: false),
            ]);
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
