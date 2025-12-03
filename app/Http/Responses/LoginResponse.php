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
        $user = $request->user();

        // Determine the appropriate redirect URL
        $redirectUrl = $this->getRedirectUrl($user);

        if ($request->wantsJson()) {
            return new JsonResponse([
                'redirect' => $redirectUrl,
            ]);
        }

        // If user needs onboarding, don't use intended() as it might redirect elsewhere
        if ($user && ! $user->profile_completed_at && $user->email_verified_at) {
            return redirect($redirectUrl);
        }

        return redirect()->intended($redirectUrl);
    }

    /**
     * Get the appropriate redirect URL based on user state.
     */
    protected function getRedirectUrl($user): string
    {
        // If user hasn't completed their profile and has verified email, send to onboarding
        if ($user && ! $user->profile_completed_at && $user->email_verified_at) {
            return route('onboarding.start', absolute: false);
        }

        return route('dashboard', absolute: false);
    }
}
