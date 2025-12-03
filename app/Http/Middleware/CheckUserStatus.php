<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckUserStatus
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        // Allow logout and account status pages
        if ($request->routeIs('logout', 'account.banned', 'account.suspended', 'account.appeal.*')) {
            return $next($request);
        }

        // Allow admin routes for admins
        if ($request->routeIs('admin.*') && $user->hasRole(['admin', 'super admin'])) {
            return $next($request);
        }

        // Allow API routes
        if ($request->is('api/*')) {
            return $next($request);
        }

        // Allow broadcasting auth routes
        if ($request->is('broadcasting/*')) {
            if (app()->hasDebugModeEnabled()) {
                \Log::debug('CheckUserStatus: Allowing broadcasting route', [
                    'path' => $request->path(),
                    'user_id' => $user?->getKey(),
                ]);
            }

            return $next($request);
        }

        // Check if banned
        if ($user->isBanned()) {
            return redirect()->route('account.banned');
        }

        // Check if suspended
        if ($user->isSuspended()) {
            return redirect()->route('account.suspended');
        }

        return $next($request);
    }
}
