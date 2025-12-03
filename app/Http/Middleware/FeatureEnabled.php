<?php

namespace App\Http\Middleware;

use App\Services\FeatureFlagService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class FeatureEnabled
{
    public function __construct(
        private FeatureFlagService $featureFlags,
    ) {}

    /**
     * Handle an incoming request.
     *
     * Usage: ->middleware('feature:feature_ads_enabled')
     */
    public function handle(Request $request, Closure $next, string $feature): Response
    {
        $user = $request->user();
        $enabled = $this->featureFlags->isEnabled($user, $feature, true);

        if (! $enabled) {
            return redirect()->route('dashboard');
        }

        return $next($request);
    }
}
