<?php

namespace App\Payments\Gateways\CCBill;

use App\Payments\Exceptions\CCBill3DSFailedException;
use App\Payments\Exceptions\CCBill3DSNotSupportedException;
use App\Payments\Exceptions\CCBillApiException;
use App\ValueObjects\Money;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CCBillHttpClient
{
    protected string $baseUrl;

    protected CCBillOAuthManager $oauth;

    protected int $timeout;

    protected int $retryAttempts;

    protected int $retryDelay;

    public function __construct(
        CCBillOAuthManager $oauth,
        array $config
    ) {
        $this->oauth = $oauth;
        $this->baseUrl = $config['api_base_url'] ?? 'https://api.ccbill.com';
        $this->timeout = (int) ($config['http_timeout'] ?? 10);
        $this->retryAttempts = (int) ($config['retry_attempts'] ?? 3);
        $this->retryDelay = 1000; // milliseconds
    }

    /**
     * Create a payment token with 3DS authentication.
     *
     * @return array<string, mixed>
     *
     * @throws CCBill3DSNotSupportedException If bank doesn't support 3DS
     * @throws CCBill3DSFailedException If 3DS authentication fails
     * @throws CCBillApiException For other API errors
     */
    public function createPaymentToken3DS(
        string $frontendToken,
        int $clientAccnum,
        int $clientSubacc
    ): array {
        $correlationId = Str::uuid()->toString();

        Log::info('CCBillHttpClient: Creating 3DS payment token', [
            'correlation_id' => $correlationId,
            'client_accnum' => $clientAccnum,
            'client_subacc' => $clientSubacc,
        ]);

        try {
            $response = $this->makeRequest(
                'POST',
                '/payment-tokens',
                [
                    'clientAccnum' => $clientAccnum,
                    'clientSubacc' => $clientSubacc,
                    'use3DS' => true,
                ],
                $frontendToken,
                $correlationId
            );

            $data = $response->json();

            // Check for 3DS-specific errors
            if (isset($data['error'])) {
                $errorCode = $data['error']['code'] ?? null;
                $errorMessage = $data['error']['message'] ?? 'Unknown error';

                // Bank doesn't support 3DS
                if ($errorCode === '3DS_NOT_SUPPORTED' || str_contains($errorMessage, '3DS not supported')) {
                    throw new CCBill3DSNotSupportedException(
                        '3DS is not supported by the card issuer',
                        $errorCode,
                        $data
                    );
                }

                // 3DS authentication failed
                if ($errorCode === '3DS_FAILED' || str_contains($errorMessage, '3DS failed') || str_contains($errorMessage, 'authentication failed')) {
                    throw new CCBill3DSFailedException(
                        '3DS authentication failed',
                        $errorCode,
                        $data
                    );
                }

                throw CCBillApiException::fromResponse($errorMessage, $errorCode, $data);
            }

            if (! isset($data['paymentTokenId'])) {
                throw new CCBillApiException(
                    'Payment token ID not found in response',
                    null,
                    $data
                );
            }

            Log::info('CCBillHttpClient: 3DS payment token created successfully', [
                'correlation_id' => $correlationId,
                'payment_token_id' => $data['paymentTokenId'],
            ]);

            return $data;
        } catch (CCBill3DSNotSupportedException|CCBill3DSFailedException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('CCBillHttpClient: Failed to create 3DS payment token', [
                'correlation_id' => $correlationId,
                'error' => $e->getMessage(),
            ]);

            throw new CCBillApiException(
                'Failed to create 3DS payment token',
                null,
                null,
                $e
            );
        }
    }

    /**
     * Create a payment token without 3DS (fallback).
     *
     * @return array<string, mixed>
     *
     * @throws CCBillApiException
     */
    public function createPaymentToken(
        string $frontendToken,
        int $clientAccnum,
        int $clientSubacc
    ): array {
        $correlationId = Str::uuid()->toString();

        Log::info('CCBillHttpClient: Creating non-3DS payment token', [
            'correlation_id' => $correlationId,
            'client_accnum' => $clientAccnum,
            'client_subacc' => $clientSubacc,
        ]);

        try {
            $response = $this->makeRequest(
                'POST',
                '/payment-tokens',
                [
                    'clientAccnum' => $clientAccnum,
                    'clientSubacc' => $clientSubacc,
                    'use3DS' => false,
                ],
                $frontendToken,
                $correlationId
            );

            $data = $response->json();

            if (isset($data['error'])) {
                $errorCode = $data['error']['code'] ?? null;
                $errorMessage = $data['error']['message'] ?? 'Unknown error';

                throw CCBillApiException::fromResponse($errorMessage, $errorCode, $data);
            }

            if (! isset($data['paymentTokenId'])) {
                throw new CCBillApiException(
                    'Payment token ID not found in response',
                    null,
                    $data
                );
            }

            Log::info('CCBillHttpClient: Non-3DS payment token created successfully', [
                'correlation_id' => $correlationId,
                'payment_token_id' => $data['paymentTokenId'],
            ]);

            return $data;
        } catch (CCBillApiException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('CCBillHttpClient: Failed to create payment token', [
                'correlation_id' => $correlationId,
                'error' => $e->getMessage(),
            ]);

            throw new CCBillApiException(
                'Failed to create payment token',
                null,
                null,
                $e
            );
        }
    }

    /**
     * Charge a payment token.
     *
     * @return array<string, mixed>
     *
     * @throws CCBillApiException
     */
    public function chargePaymentToken(
        string $tokenId,
        int $clientAccnum,
        int $clientSubacc,
        Money $amount,
        int $initialPeriod = 30
    ): array {
        $correlationId = Str::uuid()->toString();

        Log::info('CCBillHttpClient: Charging payment token', [
            'correlation_id' => $correlationId,
            'token_id' => $this->sanitizeTokenId($tokenId),
            'client_accnum' => $clientAccnum,
            'client_subacc' => $clientSubacc,
            'amount' => $amount->amount(),
            'currency' => $amount->currency(),
        ]);

        try {
            $backendToken = $this->oauth->getBackendToken();

            $response = $this->makeRequestWithRetry(
                'POST',
                "/transactions/payment-tokens/{$tokenId}",
                [
                    'clientAccnum' => $clientAccnum,
                    'clientSubacc' => $clientSubacc,
                    'initialPrice' => $amount->toDecimal(2),
                    'initialPeriod' => $initialPeriod,
                    'currencyCode' => $this->mapCurrencyCode($amount->currency()),
                ],
                $backendToken,
                $correlationId
            );

            $data = $response->json();

            if (isset($data['error'])) {
                $errorCode = $data['error']['code'] ?? null;
                $errorMessage = $data['error']['message'] ?? 'Unknown error';

                throw CCBillApiException::fromResponse($errorMessage, $errorCode, $data);
            }

            if (! isset($data['transactionId'])) {
                throw new CCBillApiException(
                    'Transaction ID not found in response',
                    null,
                    $data
                );
            }

            Log::info('CCBillHttpClient: Payment token charged successfully', [
                'correlation_id' => $correlationId,
                'transaction_id' => $data['transactionId'],
            ]);

            return $data;
        } catch (CCBillApiException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('CCBillHttpClient: Failed to charge payment token', [
                'correlation_id' => $correlationId,
                'error' => $e->getMessage(),
            ]);

            throw new CCBillApiException(
                'Failed to charge payment token',
                null,
                null,
                $e
            );
        }
    }

    /**
     * Get payment token details including card information.
     *
     * @return array<string, mixed>
     *
     * @throws CCBillApiException
     */
    public function getPaymentTokenDetails(string $tokenId): array
    {
        $correlationId = Str::uuid()->toString();

        Log::info('CCBillHttpClient: Fetching payment token details', [
            'correlation_id' => $correlationId,
            'token_id' => $this->sanitizeTokenId($tokenId),
        ]);

        try {
            $backendToken = $this->oauth->getBackendToken();

            $response = $this->makeRequestWithRetry(
                'GET',
                "/payment-tokens/{$tokenId}",
                [],
                $backendToken,
                $correlationId
            );

            $data = $response->json();

            if (isset($data['error'])) {
                $errorCode = $data['error']['code'] ?? null;
                $errorMessage = $data['error']['message'] ?? 'Unknown error';

                throw CCBillApiException::fromResponse($errorMessage, $errorCode, $data);
            }

            Log::info('CCBillHttpClient: Payment token details fetched successfully', [
                'correlation_id' => $correlationId,
            ]);

            return $data;
        } catch (CCBillApiException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('CCBillHttpClient: Failed to fetch payment token details', [
                'correlation_id' => $correlationId,
                'error' => $e->getMessage(),
            ]);

            throw new CCBillApiException(
                'Failed to fetch payment token details',
                null,
                null,
                $e
            );
        }
    }

    /**
     * Refund a payment transaction.
     *
     * @return array<string, mixed>
     *
     * @throws CCBillApiException
     */
    public function refundPayment(
        string $transactionId,
        Money $amount
    ): array {
        $correlationId = Str::uuid()->toString();

        Log::info('CCBillHttpClient: Processing refund', [
            'correlation_id' => $correlationId,
            'transaction_id' => $transactionId,
            'amount' => $amount->amount(),
            'currency' => $amount->currency(),
        ]);

        try {
            $backendToken = $this->oauth->getBackendToken();

            $response = $this->makeRequestWithRetry(
                'POST',
                "/transactions/{$transactionId}/refund",
                [
                    'amount' => $amount->toDecimal(2),
                    'currencyCode' => $this->mapCurrencyCode($amount->currency()),
                ],
                $backendToken,
                $correlationId
            );

            $data = $response->json();

            if (isset($data['error'])) {
                $errorCode = $data['error']['code'] ?? null;
                $errorMessage = $data['error']['message'] ?? 'Unknown error';

                throw CCBillApiException::fromResponse($errorMessage, $errorCode, $data);
            }

            if (! isset($data['refundId'])) {
                throw new CCBillApiException(
                    'Refund ID not found in response',
                    null,
                    $data
                );
            }

            Log::info('CCBillHttpClient: Refund processed successfully', [
                'correlation_id' => $correlationId,
                'refund_id' => $data['refundId'],
            ]);

            return $data;
        } catch (CCBillApiException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('CCBillHttpClient: Failed to process refund', [
                'correlation_id' => $correlationId,
                'error' => $e->getMessage(),
            ]);

            throw new CCBillApiException(
                'Failed to process refund',
                null,
                null,
                $e
            );
        }
    }

    /**
     * Get transaction status.
     *
     * @return array<string, mixed>
     *
     * @throws CCBillApiException
     */
    public function getTransactionStatus(string $transactionId): array
    {
        $correlationId = Str::uuid()->toString();

        Log::info('CCBillHttpClient: Fetching transaction status', [
            'correlation_id' => $correlationId,
            'transaction_id' => $transactionId,
        ]);

        try {
            $backendToken = $this->oauth->getBackendToken();

            $response = $this->makeRequestWithRetry(
                'GET',
                "/transactions/{$transactionId}",
                [],
                $backendToken,
                $correlationId
            );

            $data = $response->json();

            if (isset($data['error'])) {
                $errorCode = $data['error']['code'] ?? null;
                $errorMessage = $data['error']['message'] ?? 'Unknown error';

                throw CCBillApiException::fromResponse($errorMessage, $errorCode, $data);
            }

            return $data;
        } catch (CCBillApiException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('CCBillHttpClient: Failed to fetch transaction status', [
                'correlation_id' => $correlationId,
                'error' => $e->getMessage(),
            ]);

            throw new CCBillApiException(
                'Failed to fetch transaction status',
                null,
                null,
                $e
            );
        }
    }

    /**
     * Make an HTTP request with retry logic.
     *
     * @param  array<string, mixed>  $data
     */
    protected function makeRequestWithRetry(
        string $method,
        string $path,
        array $data,
        string $bearerToken,
        string $correlationId
    ): \Illuminate\Http\Client\Response {
        $attempt = 0;
        $lastException = null;

        while ($attempt < $this->retryAttempts) {
            try {
                return $this->makeRequest($method, $path, $data, $bearerToken, $correlationId);
            } catch (CCBillApiException $e) {
                // Don't retry API exceptions (client errors)
                if ($e->errorCode !== null && str_starts_with((string) $e->errorCode, '4')) {
                    throw $e;
                }

                $attempt++;
                $lastException = $e;

                if ($attempt < $this->retryAttempts) {
                    Log::warning('CCBillHttpClient: Request failed, retrying', [
                        'correlation_id' => $correlationId,
                        'attempt' => $attempt,
                        'max_attempts' => $this->retryAttempts,
                        'error' => $e->getMessage(),
                    ]);

                    usleep($this->retryDelay * 1000 * $attempt); // Exponential backoff
                }
            } catch (\Exception $e) {
                $attempt++;
                $lastException = $e;

                if ($attempt < $this->retryAttempts) {
                    Log::warning('CCBillHttpClient: Request exception, retrying', [
                        'correlation_id' => $correlationId,
                        'attempt' => $attempt,
                        'max_attempts' => $this->retryAttempts,
                        'error' => $e->getMessage(),
                    ]);

                    usleep($this->retryDelay * 1000 * $attempt);
                }
            }
        }

        Log::error('CCBillHttpClient: Request failed after retries', [
            'correlation_id' => $correlationId,
            'attempts' => $attempt,
        ]);

        if ($lastException instanceof CCBillApiException) {
            throw $lastException;
        }

        throw new CCBillApiException(
            'Request failed after retries',
            null,
            null,
            $lastException
        );
    }

    /**
     * Make an HTTP request to CCBill API.
     *
     * @param  array<string, mixed>  $data
     */
    protected function makeRequest(
        string $method,
        string $path,
        array $data,
        string $bearerToken,
        string $correlationId
    ): \Illuminate\Http\Client\Response {
        $url = rtrim($this->baseUrl, '/').'/'.ltrim($path, '/');

        $sanitizedData = $this->sanitizeLogData($data);

        Log::info('CCBillHttpClient: Making request', [
            'correlation_id' => $correlationId,
            'method' => $method,
            'url' => $url,
            'data' => $sanitizedData,
        ]);

        $request = Http::timeout($this->timeout)
            ->withHeaders([
                'Accept' => 'application/vnd.mcn.transaction-service.api.v.2+json',
                'Authorization' => "Bearer {$bearerToken}",
                'Cache-Control' => 'no-cache',
                'Content-Type' => 'application/json',
                'X-Correlation-ID' => $correlationId,
            ]);

        $response = match (strtoupper($method)) {
            'GET' => $request->get($url, $data),
            'POST' => $request->post($url, $data),
            'PUT' => $request->put($url, $data),
            'PATCH' => $request->patch($url, $data),
            'DELETE' => $request->delete($url, $data),
            default => throw new \InvalidArgumentException("Unsupported HTTP method: {$method}"),
        };

        $sanitizedResponse = $this->sanitizeLogData($response->json() ?? []);

        Log::info('CCBillHttpClient: Response received', [
            'correlation_id' => $correlationId,
            'status' => $response->status(),
            'response' => $sanitizedResponse,
        ]);

        if (! $response->successful()) {
            $errorData = $response->json();
            $errorCode = $errorData['error']['code'] ?? null;
            $errorMessage = $errorData['error']['message'] ?? 'Unknown error';

            throw CCBillApiException::fromResponse(
                "API request failed: {$errorMessage}",
                $errorCode,
                $errorData
            );
        }

        return $response;
    }

    /**
     * Map currency code to CCBill currency code format.
     * CCBill uses numeric currency codes (e.g., 840 for USD).
     */
    protected function mapCurrencyCode(string $currency): int
    {
        return match (strtoupper($currency)) {
            'USD' => 840,
            'EUR' => 978,
            'GBP' => 826,
            'CAD' => 124,
            'AUD' => 36,
            'JPY' => 392,
            default => throw new \InvalidArgumentException("Unsupported currency: {$currency}"),
        };
    }

    /**
     * Sanitize sensitive data for logging.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function sanitizeLogData(array $data): array
    {
        $sanitized = $data;
        $sensitiveKeys = ['token', 'secret', 'password', 'cardNumber', 'cvv', 'card_number'];

        foreach ($sanitized as $key => $value) {
            if (is_array($value)) {
                $sanitized[$key] = $this->sanitizeLogData($value);
            } elseif (in_array(strtolower($key), $sensitiveKeys, true)) {
                $sanitized[$key] = '***REDACTED***';
            }
        }

        return $sanitized;
    }

    /**
     * Sanitize token ID for logging (show only last 4 characters).
     */
    protected function sanitizeTokenId(string $tokenId): string
    {
        if (strlen($tokenId) <= 4) {
            return '****';
        }

        return '****'.substr($tokenId, -4);
    }
}
