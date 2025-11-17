<?php

use App\Http\Middleware\FeatureEnabled;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\AdminSetting;
use Illuminate\Http\Request;

it('redirects to dashboard when feature is disabled', function () {
    AdminSetting::set('feature_radar_enabled', false);

    $request = Request::create('/radar', 'GET');
    $middleware = new FeatureEnabled;
    $next = static fn () => response('ok');

    $response = $middleware->handle($request, $next, 'feature_radar_enabled');

    expect($response->isRedirect())->toBeTrue()
        ->and($response->headers->get('Location'))->toBe(route('dashboard'));
});

it('shares feature flags via inertia', function () {
    AdminSetting::set('feature_events_enabled', false);

    $request = Request::create('/', 'GET');
    $shared = app(HandleInertiaRequests::class)->share($request);

    expect($shared['features']['feature_events_enabled'])->toBeFalse()
        ->and($shared['features']['feature_signals_enabled'])->toBeBool();
});
