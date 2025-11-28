<?php

namespace App\Payments\Gateways\CCBill;

use App\Payments\Exceptions\CCBillOAuthException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CCBillOAuthManager
{
    protected string $baseUrl;

    protected string $frontendAppId;

    protected string $frontendSecret;

    protected string $backendAppId;

    protected string $backendSecret;

    protected int $cacheTtl;

    protected int $retryAttempts;

    protected int $retryDelay;

    public function __construct(array $config)
    {
        $this->baseUrl = $config['api_base_url'] ?? 'https://api.ccbill.com';
        $this->frontendAppId = $config['frontend_app_id'] ?? '';
        $this->frontendSecret = $config['frontend_secret'] ?? '';
        $this->backendAppId = $config['backend_app_id'] ?? '';
        $this->backendSecret = $config['backend_secret'] ?? '';
        $this->cacheTtl = (int) ($config['oauth_cache_ttl'] ?? 3600);
        $this->retryAttempts = (int) ($config['retry_attempts'] ?? 3);
        $this->retryDelay = 1000; // milliseconds

        if (empty($this->backendAppId) || empty($this->backendSecret)) {
            throw new \InvalidArgumentException('CCBill backend credentials are required.');
        }

        if (empty($this->frontendAppId) || empty($this->frontendSecret)) {
            throw new \InvalidArgumentException('CCBill frontend credentials are required.');
        }
    }

    /**
     * Get a backend bearer token, using cache if available.
     * Backend tokens are cached and refreshed automatically.
     */
    public function getBackendToken(): string
    {
        $cacheKey = 'ccbill:oauth:backend:token';

        return Cache::remember($cacheKey, $this->cacheTtl, function () {
            return $this->fetchBackendToken();
        });
    }

    /**
     * Generate a fresh frontend bearer token for widget use.
     * Frontend tokens are NOT cached - generated on-demand for security.
     */
    public function generateFrontendToken(): string
    {
        return $this->fetchFrontendToken();
    }

    /**
     * Fetch a backend bearer token from CCBill API.
     *
     * @throws CCBillOAuthException
     */
    protected function fetchBackendToken(): string
    {
        $correlationId = Str::uuid()->toString();

        Log::info('CCBillOAuthManager: Fetching backend token', [
            'correlation_id' => $correlationId,
            'app_id_length' => strlen($this->backendAppId),
        ]);

        $attempt = 0;
        $lastException = null;

        while ($attempt < $this->retryAttempts) {
            try {
                $response = Http::timeout(10)
                    ->withHeaders([
                        'Accept' => 'application/json',
                        'Content-Type' => 'application/x-www-form-urlencoded',
                    ])
                    ->withBasicAuth($this->backendAppId, $this->backendSecret)
                    ->asForm()
                    ->post("{$this->baseUrl}/ccbill-auth/oauth/token", [
                        'grant_type' => 'client_credentials',
                    ]);

                if ($response->successful()) {
                    $data = $response->json();

                    if (isset($data['access_token'])) {
                        Log::info('CCBillOAuthManager: Backend token fetched successfully', [
                            'correlation_id' => $correlationId,
                            'expires_in' => $data['expires_in'] ?? null,
                        ]);

                        return $data['access_token'];
                    }

                    throw new CCBillOAuthException(
                        'Access token not found in response',
                        null,
                        $data,
                    );
                }

                $errorData = $response->json();
                $errorMessage = $errorData['error_description'] ?? $errorData['error'] ?? 'Unknown error';
                $errorCode = $errorData['error'] ?? null;

                throw new CCBillOAuthException(
                    "Failed to fetch backend token: {$errorMessage}",
                    $errorCode,
                    $errorData,
                );
            } catch (CCBillOAuthException $e) {
                $lastException = $e;
                throw $e; // Don't retry OAuth exceptions
            } catch (\Exception $e) {
                $attempt++;
                $lastException = $e;

                Log::warning('CCBillOAuthManager: Backend token fetch failed, retrying', [
                    'correlation_id' => $correlationId,
                    'attempt' => $attempt,
                    'max_attempts' => $this->retryAttempts,
                    'error' => $e->getMessage(),
                ]);

                if ($attempt < $this->retryAttempts) {
                    usleep($this->retryDelay * 1000 * $attempt); // Exponential backoff
                }
            }
        }

        Log::error('CCBillOAuthManager: Backend token fetch failed after retries', [
            'correlation_id' => $correlationId,
            'attempts' => $attempt,
        ]);

        throw new CCBillOAuthException(
            'Failed to fetch backend token after retries',
            null,
            null,
            $lastException,
        );
    }

    /**
     * Fetch a frontend bearer token from CCBill API.
     *
     * @throws CCBillOAuthException
     */
    protected function fetchFrontendToken(): string
    {
        $correlationId = Str::uuid()->toString();

        Log::info('CCBillOAuthManager: Generating frontend token', [
            'correlation_id' => $correlationId,
            'app_id_length' => strlen($this->frontendAppId),
        ]);

        try {
            $response = Http::timeout(10)
                ->withHeaders([
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/x-www-form-urlencoded',
                ])
                ->withBasicAuth($this->frontendAppId, $this->frontendSecret)
                ->asForm()
                ->post("{$this->baseUrl}/ccbill-auth/oauth/token", [
                    'grant_type' => 'client_credentials',
                ]);

            if ($response->successful()) {
                $data = $response->json();

                if (isset($data['access_token'])) {
                    Log::info('CCBillOAuthManager: Frontend token generated successfully', [
                        'correlation_id' => $correlationId,
                    ]);

                    return $data['access_token'];
                }

                throw new CCBillOAuthException(
                    'Access token not found in response',
                    null,
                    $data,
                );
            }

            $errorData = $response->json();
            $errorMessage = $errorData['error_description'] ?? $errorData['error'] ?? 'Unknown error';
            $errorCode = $errorData['error'] ?? null;

            throw new CCBillOAuthException(
                "Failed to generate frontend token: {$errorMessage}",
                $errorCode,
                $errorData,
            );
        } catch (CCBillOAuthException $e) {
            Log::error('CCBillOAuthManager: Frontend token generation failed', [
                'correlation_id' => $correlationId,
                'error' => $e->getMessage(),
                'error_code' => $e->errorCode,
            ]);

            throw $e;
        } catch (\Exception $e) {
            Log::error('CCBillOAuthManager: Frontend token generation exception', [
                'correlation_id' => $correlationId,
                'error' => $e->getMessage(),
            ]);

            throw new CCBillOAuthException(
                'Failed to generate frontend token',
                null,
                null,
                $e,
            );
        }
    }

    /**
     * Clear cached backend token (useful for testing or forced refresh).
     */
    public function clearBackendTokenCache(): void
    {
        Cache::forget('ccbill:oauth:backend:token');
    }
}
