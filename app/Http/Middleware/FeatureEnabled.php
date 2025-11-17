<?php

namespace App\Http\Middleware;

use App\Models\AdminSetting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class FeatureEnabled
{
    /**
     * Handle an incoming request.
     *
     * Usage: ->middleware('feature:feature_key_name')
     */
    public function handle(Request $request, Closure $next, string $featureKey): Response
    {
        $enabled = (bool) AdminSetting::get($featureKey, true);

        if (! $enabled) {
            return redirect()->route('dashboard');
        }

        return $next($request);
    }
}
