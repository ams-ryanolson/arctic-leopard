<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureProfileIsCompleted
{
    /**
     * Redirect verified users to the onboarding flow until their profile is complete.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        if ($request->routeIs('onboarding.*')) {
            return $next($request);
        }

        if (! $user->email_verified_at) {
            return $next($request);
        }

        if ($user->profile_completed_at) {
            return $next($request);
        }

        return redirect()->route('onboarding.start');
    }
}

