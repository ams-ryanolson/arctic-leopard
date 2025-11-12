<?php

namespace App\Services\Geo;

use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Symfony\Component\Intl\Countries;
use Symfony\Component\Intl\Exception\MissingResourceException;
use Throwable;

class CountryResolver
{
    /**
     * Determine the ISO country code for a view event.
     *
     * @param  array<string, mixed>  $context
     */
    public function resolve(?User $viewer, ?string $ipAddress, array $context = []): ?string
    {
        if (($code = $this->countryFromContext($context)) !== null) {
            return $code;
        }

        if (($code = $this->countryFromViewer($viewer)) !== null) {
            return $code;
        }

        if (($code = $this->countryFromIp($ipAddress)) !== null) {
            return $code;
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function countryFromContext(array $context): ?string
    {
        $candidate = Arr::first(
            [
                Arr::get($context, 'country_code'),
                Arr::get($context, 'country'),
            ],
            fn ($value) => is_string($value) && $value !== ''
        );

        return $this->normalizeCountryCode(is_string($candidate) ? $candidate : null);
    }

    private function countryFromViewer(?User $viewer): ?string
    {
        if ($viewer === null) {
            return null;
        }

        return $this->normalizeCountryCode($viewer->location_country);
    }

    private function countryFromIp(?string $ipAddress): ?string
    {
        if ($ipAddress === null || $ipAddress === '') {
            return null;
        }

        $config = config('services.geoip', []);
        $driver = Arr::get($config, 'driver');

        if ($driver === 'array') {
            $mapping = Arr::get($config, 'mapping', []);
            $code = Arr::get($mapping, $ipAddress);

            return $this->normalizeCountryCode(is_string($code) ? $code : null)
                ?? $this->normalizeCountryCode(Arr::get($config, 'fallback_country_code'));
        }

        if ($driver === 'http') {
            return $this->countryFromHttpDriver($config, $ipAddress);
        }

        return $this->normalizeCountryCode(Arr::get($config, 'fallback_country_code'));
    }

    /**
     * @param  array<string, mixed>  $config
     */
    private function countryFromHttpDriver(array $config, string $ipAddress): ?string
    {
        $endpoint = Arr::get($config, 'endpoint');

        if (! is_string($endpoint) || $endpoint === '') {
            return $this->normalizeCountryCode(Arr::get($config, 'fallback_country_code'));
        }

        $method = Str::upper((string) Arr::get($config, 'method', 'GET'));
        $query = Arr::get($config, 'query', []);
        $headers = Arr::get($config, 'headers', []);

        if (! is_array($query)) {
            $query = [];
        }

        if (! is_array($headers)) {
            $headers = [];
        }

        $ipParameter = (string) Arr::get($config, 'ip_parameter', 'ip');
        $query[$ipParameter] = $ipAddress;

        try {
            $request = Http::timeout((int) Arr::get($config, 'timeout', 2))
                ->acceptJson()
                ->withHeaders($headers);

            $response = $method === 'POST'
                ? $request->post($endpoint, $query)
                : $request->get($endpoint, $query);

            if ($response->successful()) {
                $json = $response->json();
                $responseKey = Arr::get($config, 'response_key', 'country_code');
                $candidate = is_string($responseKey)
                    ? Arr::get($json, $responseKey)
                    : null;

                $normalized = $this->normalizeCountryCode(is_string($candidate) ? $candidate : null);

                if ($normalized !== null) {
                    return $normalized;
                }
            }
        } catch (Throwable) {
            // Intentionally swallow errors from external providers.
        }

        return $this->normalizeCountryCode(Arr::get($config, 'fallback_country_code'));
    }

    private function normalizeCountryCode(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $trimmed = trim($value);

        if ($trimmed === '') {
            return null;
        }

        if (strlen($trimmed) === 2 && ctype_alpha($trimmed)) {
            $candidate = Str::upper($trimmed);

            return Countries::exists($candidate) ? $candidate : null;
        }

        if (strlen($trimmed) === 3 && ctype_alpha($trimmed)) {
            try {
                $code = Countries::getAlpha2Code($trimmed);

                return $code !== null && Countries::exists($code) ? $code : null;
            } catch (MissingResourceException) {
                // Fall through to name search
            }
        }

        $upper = Str::upper($trimmed);
        $names = Countries::getNames();

        foreach ($names as $code => $name) {
            if (Str::upper($name) === $upper) {
                return $code;
            }
        }

        return null;
    }
}
