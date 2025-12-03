<?php

use App\Http\Middleware\FeatureEnabled;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Http\Request;
use Laravel\Pennant\Feature;

it('redirects to dashboard when feature is disabled', function () {
    // Disable via Pennant
    Feature::for(null)->deactivate('radar');

    $request = Request::create('/radar', 'GET');
    $middleware = new FeatureEnabled;
    $next = static fn () => response('ok');

    $response = $middleware->handle($request, $next, 'radar');

    expect($response->isRedirect())->toBeTrue()
        ->and($response->headers->get('Location'))->toBe(route('dashboard'));
});

it('shares feature flags via inertia', function () {
    // Disable via Pennant
    Feature::for(null)->deactivate('events');

    $request = Request::create('/', 'GET');
    $shared = app(HandleInertiaRequests::class)->share($request);

    expect($shared['features']['events'])->toBeFalse()
        ->and($shared['features']['signals'])->toBeBool();
});
