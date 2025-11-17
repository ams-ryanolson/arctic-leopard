<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\AdminSetting;
use Illuminate\Http\Request;

it('shares site settings via inertia middleware', function () {
    AdminSetting::set('site_name', 'My Custom Site');

    $request = Request::create('/', 'GET');
    $middleware = app(HandleInertiaRequests::class);

    $shared = $middleware->share($request);

    expect($shared['name'])->toBe('My Custom Site')
        ->and($shared['site']['name'])->toBe('My Custom Site')
        ->and($shared['site']['logo']['url'])->toBeString();
});

it('invalidates cached setting values on update', function () {
    AdminSetting::set('site_name', 'Old Name');
    expect(AdminSetting::get('site_name'))->toBe('Old Name');

    $setting = AdminSetting::query()->where('key', 'site_name')->firstOrFail();
    $setting->setValue('New Name');
    $setting->save();

    expect(AdminSetting::get('site_name'))->toBe('New Name');
});
