<?php

use App\Models\User;
use App\Services\Geo\CountryResolver;

it('prioritizes context country code when available', function (): void {
    $resolver = new CountryResolver;

    $result = $resolver->resolve(
        viewer: null,
        ipAddress: null,
        context: ['country_code' => 'ca']
    );

    expect($result)->toBe('CA');
});

it('falls back to viewer profile country when context is missing', function (): void {
    $resolver = new CountryResolver;

    $user = new User([
        'location_country' => 'United States',
    ]);

    $result = $resolver->resolve(
        viewer: $user,
        ipAddress: null,
        context: []
    );

    expect($result)->toBe('US');
});

it('uses array driver for ip lookups when configured', function (): void {
    config([
        'services.geoip.driver' => 'array',
        'services.geoip.mapping' => [
            '203.0.113.1' => 'DE',
        ],
    ]);

    $resolver = new CountryResolver;

    $result = $resolver->resolve(
        viewer: null,
        ipAddress: '203.0.113.1',
        context: []
    );

    expect($result)->toBe('DE');
});

it('returns fallback country code when no data source resolves the country', function (): void {
    config([
        'services.geoip.driver' => 'array',
        'services.geoip.mapping' => [],
        'services.geoip.fallback_country_code' => 'GB',
    ]);

    $resolver = new CountryResolver;

    $result = $resolver->resolve(
        viewer: null,
        ipAddress: '198.51.100.5',
        context: []
    );

    expect($result)->toBe('GB');
});
