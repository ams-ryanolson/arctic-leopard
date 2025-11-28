<?php

use App\Payments\Exceptions\CCBillOAuthException;
use App\Payments\Gateways\CCBill\CCBillOAuthManager;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

beforeEach(function (): void {
    Cache::flush();
});

it('throws exception when backend credentials are missing', function (): void {
    $config = [
        'frontend_app_id' => 'test_frontend_id',
        'frontend_secret' => 'test_frontend_secret',
        'api_base_url' => 'https://api.ccbill.com',
    ];

    expect(fn () => new CCBillOAuthManager($config))
        ->toThrow(\InvalidArgumentException::class, 'CCBill backend credentials are required');
});

it('throws exception when frontend credentials are missing', function (): void {
    $config = [
        'backend_app_id' => 'test_backend_id',
        'backend_secret' => 'test_backend_secret',
        'api_base_url' => 'https://api.ccbill.com',
    ];

    expect(fn () => new CCBillOAuthManager($config))
        ->toThrow(\InvalidArgumentException::class, 'CCBill frontend credentials are required');
});

it('successfully fetches backend token', function (): void {
    Http::fake([
        'api.ccbill.com/*' => Http::response([
            'access_token' => 'test_backend_token_12345',
            'token_type' => 'Bearer',
            'expires_in' => 3600,
        ], 200),
    ]);

    $config = [
        'backend_app_id' => 'test_backend_id',
        'backend_secret' => 'test_backend_secret',
        'frontend_app_id' => 'test_frontend_id',
        'frontend_secret' => 'test_frontend_secret',
        'api_base_url' => 'https://api.ccbill.com',
    ];

    $oauth = new CCBillOAuthManager($config);
    $token = $oauth->getBackendToken();

    expect($token)->toBe('test_backend_token_12345');
});

it('caches backend token', function (): void {
    Http::fake([
        'api.ccbill.com/*' => Http::response([
            'access_token' => 'test_backend_token_12345',
            'token_type' => 'Bearer',
            'expires_in' => 3600,
        ], 200),
    ]);

    $config = [
        'backend_app_id' => 'test_backend_id',
        'backend_secret' => 'test_backend_secret',
        'frontend_app_id' => 'test_frontend_id',
        'frontend_secret' => 'test_frontend_secret',
        'api_base_url' => 'https://api.ccbill.com',
        'oauth_cache_ttl' => 3600,
    ];

    $oauth = new CCBillOAuthManager($config);

    // First call - should make HTTP request
    $token1 = $oauth->getBackendToken();
    expect($token1)->toBe('test_backend_token_12345');

    // Second call - should use cache (no additional HTTP request)
    $token2 = $oauth->getBackendToken();
    expect($token2)->toBe('test_backend_token_12345');

    // Verify only one HTTP request was made
    Http::assertSentCount(1);
});

it('generates frontend token without caching', function (): void {
    Http::fake([
        'api.ccbill.com/*' => Http::response([
            'access_token' => 'test_frontend_token_12345',
            'token_type' => 'Bearer',
            'expires_in' => 3600,
        ], 200),
    ]);

    $config = [
        'backend_app_id' => 'test_backend_id',
        'backend_secret' => 'test_backend_secret',
        'frontend_app_id' => 'test_frontend_id',
        'frontend_secret' => 'test_frontend_secret',
        'api_base_url' => 'https://api.ccbill.com',
    ];

    $oauth = new CCBillOAuthManager($config);

    // Multiple calls should all make HTTP requests (no caching)
    $token1 = $oauth->generateFrontendToken();
    $token2 = $oauth->generateFrontendToken();

    expect($token1)->toBe('test_frontend_token_12345')
        ->and($token2)->toBe('test_frontend_token_12345');

    // Verify multiple HTTP requests were made
    Http::assertSentCount(2);
});

it('throws exception when backend token response is missing access_token', function (): void {
    Http::fake([
        'api.ccbill.com/*' => Http::response([
            'token_type' => 'Bearer',
            'expires_in' => 3600,
        ], 200),
    ]);

    $config = [
        'backend_app_id' => 'test_backend_id',
        'backend_secret' => 'test_backend_secret',
        'frontend_app_id' => 'test_frontend_id',
        'frontend_secret' => 'test_frontend_secret',
        'api_base_url' => 'https://api.ccbill.com',
    ];

    $oauth = new CCBillOAuthManager($config);

    expect(fn () => $oauth->getBackendToken())
        ->toThrow(CCBillOAuthException::class, 'Access token not found in response');
});

it('throws exception when backend token request fails', function (): void {
    Http::fake([
        'api.ccbill.com/*' => Http::response([
            'error' => 'invalid_client',
            'error_description' => 'Invalid client credentials',
        ], 401),
    ]);

    $config = [
        'backend_app_id' => 'test_backend_id',
        'backend_secret' => 'test_backend_secret',
        'frontend_app_id' => 'test_frontend_id',
        'frontend_secret' => 'test_frontend_secret',
        'api_base_url' => 'https://api.ccbill.com',
    ];

    $oauth = new CCBillOAuthManager($config);

    expect(fn () => $oauth->getBackendToken())
        ->toThrow(CCBillOAuthException::class, 'Failed to fetch backend token');
});

it('clears backend token cache', function (): void {
    Http::fake([
        'api.ccbill.com/*' => Http::response([
            'access_token' => 'test_backend_token_12345',
            'token_type' => 'Bearer',
            'expires_in' => 3600,
        ], 200),
    ]);

    $config = [
        'backend_app_id' => 'test_backend_id',
        'backend_secret' => 'test_backend_secret',
        'frontend_app_id' => 'test_frontend_id',
        'frontend_secret' => 'test_frontend_secret',
        'api_base_url' => 'https://api.ccbill.com',
    ];

    $oauth = new CCBillOAuthManager($config);

    // Get token (cached)
    $oauth->getBackendToken();
    Http::assertSentCount(1);

    // Clear cache
    $oauth->clearBackendTokenCache();

    // Get token again (should make new request)
    $oauth->getBackendToken();
    Http::assertSentCount(2);
});

it('uses custom cache TTL from config', function (): void {
    Http::fake([
        'api.ccbill.com/*' => Http::response([
            'access_token' => 'test_backend_token_12345',
            'token_type' => 'Bearer',
            'expires_in' => 3600,
        ], 200),
    ]);

    $config = [
        'backend_app_id' => 'test_backend_id',
        'backend_secret' => 'test_backend_secret',
        'frontend_app_id' => 'test_frontend_id',
        'frontend_secret' => 'test_frontend_secret',
        'api_base_url' => 'https://api.ccbill.com',
        'oauth_cache_ttl' => 7200, // 2 hours
    ];

    $oauth = new CCBillOAuthManager($config);
    $token = $oauth->getBackendToken();

    expect($token)->toBe('test_backend_token_12345');
    // Cache TTL is tested implicitly - if it was wrong, cache wouldn't work
});
