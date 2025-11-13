<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\LogoutResponse as LogoutResponseContract;

class LogoutResponse implements LogoutResponseContract
{
    public function toResponse($request)
    {
        /** @var Request $request */
        if ($request->wantsJson()) {
            return new JsonResponse([], 204);
        }

        return redirect()->route('home');
    }
}
