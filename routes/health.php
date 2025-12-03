<?php

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Health Check Routes
|--------------------------------------------------------------------------
|
| These routes are used by load balancers and container orchestrators to
| determine if the application is healthy and ready to receive traffic.
|
*/

Route::get('/health', function () {
    $checks = [
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
        'checks' => [],
    ];

    // Check database connection
    try {
        DB::connection()->getPdo();
        $checks['checks']['database'] = [
            'status' => 'ok',
            'connection' => config('database.default'),
        ];
    } catch (\Throwable $e) {
        $checks['status'] = 'error';
        $checks['checks']['database'] = [
            'status' => 'error',
            'message' => 'Database connection failed',
        ];
    }

    // Check Redis connection
    try {
        $cacheStore = config('cache.default');
        if ($cacheStore === 'redis') {
            Cache::store('redis')->put('health-check', true, 10);
            Cache::store('redis')->forget('health-check');
        }
        $checks['checks']['cache'] = [
            'status' => 'ok',
            'driver' => $cacheStore,
        ];
    } catch (\Throwable $e) {
        $checks['status'] = 'error';
        $checks['checks']['cache'] = [
            'status' => 'error',
            'message' => 'Cache connection failed',
        ];
    }

    // Return appropriate HTTP status
    $httpStatus = $checks['status'] === 'ok' ? 200 : 503;

    return response()->json($checks, $httpStatus);
})->name('health');

// Simple liveness probe (just checks if PHP is running)
Route::get('/health/live', function () {
    return response('OK', 200);
})->name('health.live');

// Readiness probe (full health check)
Route::get('/health/ready', function () {
    try {
        DB::connection()->getPdo();
        Cache::store(config('cache.default'))->get('readiness-probe');

        return response('OK', 200);
    } catch (\Throwable) {
        return response('Service Unavailable', 503);
    }
})->name('health.ready');
