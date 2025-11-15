<?php

namespace App\Services\Verification;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SumsubService
{
    private string $appToken;

    private string $secretKey;

    private string $webhookSecret;

    private string $baseUrl;

    private string $levelName;

    public function __construct()
    {
        $config = config('verification.sumsub', []);

        $this->appToken = $config['app_token'] ?? '';
        $this->secretKey = $config['secret_key'] ?? '';
        $this->webhookSecret = $config['webhook_secret'] ?? '';
        $this->levelName = $config['level_name'] ?? 'id-and-liveness';
        $environment = $config['environment'] ?? 'sandbox';

        $this->baseUrl = match ($environment) {
            'sandbox' => 'https://api.sumsub.com',
            'production' => 'https://api.sumsub.com',
            default => $config['base_url'] ?? 'https://api.sumsub.com',
        };
    }

    /**
     * Create an applicant in Sumsub.
     *
     * @param  array<string, mixed>  $options
     */
    public function createApplicant(User $user, array $options = []): string
    {
        Log::info('SumsubService::createApplicant - START', [
            'user_id' => $user->getKey(),
            'app_token_length' => strlen($this->appToken),
            'secret_key_length' => strlen($this->secretKey),
            'base_url' => $this->baseUrl,
        ]);

        try {
            $externalUserId = (string) $user->getKey();

            $payload = array_merge([
                'externalUserId' => $externalUserId,
                'fixedInfo' => [
                    'firstName' => $user->name ?? $user->username,
                    'lastName' => $user->name ?? $user->username,
                    'dob' => $user->birthdate?->format('Y-m-d'),
                ],
            ], $options);

            Log::info('SumsubService::createApplicant - Payload prepared', [
                'user_id' => $user->getKey(),
                'payload' => $payload,
            ]);

            // Include levelName as query parameter (required by Sumsub)
            $endpoint = '/resources/applicants?levelName='.urlencode($this->levelName);
            $response = $this->makeRequest('POST', $endpoint, $payload);

            Log::info('SumsubService::createApplicant - Response received', [
                'user_id' => $user->getKey(),
                'status' => $response->status(),
                'headers' => $response->headers(),
            ]);

            if (! $response->successful()) {
                // Handle 409 Conflict - applicant already exists
                if ($response->status() === 409) {
                    $errorBody = $response->body();
                    Log::info('SumsubService::createApplicant - Applicant already exists (409)', [
                        'user_id' => $user->getKey(),
                        'error_body' => $errorBody,
                    ]);

                    // Try to extract applicant ID from error message
                    // Format: "Applicant with external user id '4' already exists: 691797f0b35339c6c966059c"
                    if (preg_match('/already exists:\s*([a-f0-9]{24})/i', $errorBody, $matches)) {
                        $applicantId = $matches[1];
                        Log::info('SumsubService::createApplicant - Extracted applicant ID from error', [
                            'user_id' => $user->getKey(),
                            'applicant_id' => $applicantId,
                        ]);
                        return $applicantId;
                    }

                    // Fallback: try to get applicant by externalUserId
                    try {
                        $applicantId = $this->getApplicantByExternalUserId($externalUserId);
                        if ($applicantId !== null) {
                            Log::info('SumsubService::createApplicant - Found existing applicant', [
                                'user_id' => $user->getKey(),
                                'applicant_id' => $applicantId,
                            ]);
                            return $applicantId;
                        }
                    } catch (\Exception $e) {
                        Log::warning('SumsubService::createApplicant - Failed to get existing applicant', [
                            'user_id' => $user->getKey(),
                            'error' => $e->getMessage(),
                        ]);
                    }

                    throw new \RuntimeException('Applicant already exists but could not retrieve applicant ID: '.$errorBody);
                }

                Log::error('SumsubService::createApplicant - FAILED', [
                    'user_id' => $user->getKey(),
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'headers' => $response->headers(),
                ]);

                throw new \RuntimeException('Failed to create Sumsub applicant: '.$response->body());
            }

            $data = $response->json();

            Log::info('SumsubService::createApplicant - SUCCESS', [
                'user_id' => $user->getKey(),
                'applicant_id' => $data['id'] ?? null,
            ]);

            return $data['id'] ?? '';
        } catch (\Exception $e) {
            Log::error('SumsubService::createApplicant - EXCEPTION', [
                'user_id' => $user->getKey(),
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            throw $e;
        }
    }

    /**
     * Generate an access token for the WebSDK.
     */
    public function generateAccessToken(string $applicantId, int $ttl = 1200): string
    {
        $payload = [
            'userId' => $applicantId,
            'ttlInSecs' => $ttl,
            'levelName' => $this->levelName,
        ];

        $response = $this->makeRequest('POST', '/resources/accessTokens/sdk', $payload);

        if (! $response->successful()) {
            Log::error('Sumsub access token generation failed', [
                'applicant_id' => $applicantId,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new \RuntimeException('Failed to generate Sumsub access token: '.$response->body());
        }

        $data = $response->json();

        return $data['token'] ?? '';
    }

    /**
     * Get applicant by externalUserId.
     */
    public function getApplicantByExternalUserId(string $externalUserId): ?string
    {
        // Sumsub API format: /resources/applicants/-/one?externalUserId={id}
        $response = $this->makeRequest('GET', "/resources/applicants/-/one?externalUserId=".urlencode($externalUserId));

        if (! $response->successful()) {
            if ($response->status() === 404) {
                return null;
            }

            Log::error('Sumsub get applicant by externalUserId failed', [
                'external_user_id' => $externalUserId,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new \RuntimeException('Failed to get Sumsub applicant by externalUserId: '.$response->body());
        }

        $data = $response->json();

        return $data['id'] ?? null;
    }

    /**
     * Get applicant status from Sumsub.
     *
     * @return array<string, mixed>
     */
    public function getApplicantStatus(string $applicantId): array
    {
        $response = $this->makeRequest('GET', "/resources/applicants/{$applicantId}/one");

        if (! $response->successful()) {
            Log::error('Sumsub applicant status fetch failed', [
                'applicant_id' => $applicantId,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new \RuntimeException('Failed to get Sumsub applicant status: '.$response->body());
        }

        return $response->json();
    }

    /**
     * Get all available applicant levels.
     *
     * @return array<string, mixed>
     */
    public function getApplicantLevels(): array
    {
        $response = $this->makeRequest('GET', '/resources/applicants/-/levels');

        if (! $response->successful()) {
            Log::error('Sumsub applicant levels fetch failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new \RuntimeException('Failed to get Sumsub applicant levels: '.$response->body());
        }

        return $response->json();
    }

    /**
     * Verify webhook signature from Sumsub.
     */
    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        $expectedSignature = hash_hmac('sha256', $payload, $this->webhookSecret);

        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Make an authenticated request to Sumsub API.
     *
     * @param  array<string, mixed>  $payload
     */
    private function makeRequest(string $method, string $endpoint, array $payload = []): \Illuminate\Http\Client\Response
    {
        // Parse endpoint to separate path and query string
        $parsedUrl = parse_url($endpoint);
        $path = $parsedUrl['path'] ?? $endpoint;
        $query = $parsedUrl['query'] ?? null;
        
        // Ensure path starts with /
        $path = '/'.ltrim($path, '/');
        
        // Reconstruct path with query for signature (if query exists)
        $pathForSignature = $query !== null ? $path.'?'.$query : $path;
        
        // Build full URL
        $url = rtrim($this->baseUrl, '/').$path.($query !== null ? '?'.$query : '');
        
        $timestamp = time();
        
        // Sort JSON payload keys to ensure consistent ordering for signature
        $body = '';
        if (! empty($payload)) {
            ksort($payload);
            // Recursively sort nested arrays
            array_walk_recursive($payload, function (&$value, $key) use (&$payload): void {
                if (is_array($value)) {
                    ksort($value);
                }
            });
            $body = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        }
        
        $signature = $this->createSignature($method, $pathForSignature, $timestamp, $body);

        // Comprehensive logging for debugging
        Log::info('SumsubService::makeRequest - Request details', [
            'method' => $method,
            'url' => $url,
            'path' => $path,
            'path_for_signature' => $pathForSignature,
            'query' => $query,
            'timestamp' => $timestamp,
            'body' => $body,
            'body_length' => strlen($body),
            'signature' => $signature,
            'signature_length' => strlen($signature),
            'signature_string' => (string) $timestamp.Str::upper($method).$pathForSignature.$body,
            'signature_string_length' => strlen((string) $timestamp.Str::upper($method).$pathForSignature.$body),
            'app_token' => $this->appToken,
            'app_token_length' => strlen($this->appToken),
            'secret_key_length' => strlen($this->secretKey),
            'secret_key_preview' => substr($this->secretKey, 0, 5).'...'.substr($this->secretKey, -5),
            'headers' => [
                'X-App-Token' => $this->appToken,
                'X-App-Access-Sig' => $signature,
                'X-App-Access-Ts' => (string) $timestamp,
            ],
        ]);

        $request = Http::withHeaders([
            'X-App-Token' => $this->appToken,
            'X-App-Access-Sig' => $signature,
            'X-App-Access-Ts' => (string) $timestamp,
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ]);

        // Send raw JSON body to match signature exactly
        return match (Str::upper($method)) {
            'GET' => $request->get($url),
            'POST' => $request->withBody($body, 'application/json')->post($url),
            'PUT' => $request->withBody($body, 'application/json')->put($url),
            'PATCH' => $request->withBody($body, 'application/json')->patch($url),
            'DELETE' => $request->withBody($body, 'application/json')->delete($url),
            default => throw new \InvalidArgumentException("Unsupported HTTP method: {$method}"),
        };
    }

    /**
     * Create HMAC signature for Sumsub API request.
     * Signature format: timestamp + METHOD + path_with_query + body
     * Based on Sumsub Postman collection: https://github.com/SumSubstance/AppTokenUsageExamples
     * 
     * Note: hash_hmac already returns hex-encoded string by default
     */
    private function createSignature(string $method, string $path, int $timestamp, string $body): string
    {
        $methodUpper = Str::upper($method);
        $timestampStr = (string) $timestamp;
        
        // Format: timestamp + METHOD + path + body
        // This matches the Postman collection's format: stamp + method.toUpperCase() + url + body
        $data = $timestampStr.$methodUpper.$path.$body;
        
        Log::info('SumsubService::createSignature - Signature generation', [
            'method' => $method,
            'method_upper' => $methodUpper,
            'timestamp' => $timestamp,
            'timestamp_str' => $timestampStr,
            'path' => $path,
            'body' => $body,
            'body_length' => strlen($body),
            'data_string' => $data,
            'data_string_length' => strlen($data),
            'signature_format' => 'timestamp + METHOD + path + body',
            'secret_key_length' => strlen($this->secretKey),
            'secret_key_preview' => substr($this->secretKey, 0, 10).'...'.substr($this->secretKey, -10),
        ]);
        
        // Based on the Postman collection, Sumsub uses the secret key as-is (raw)
        // No base64 or hex decoding is needed
        $signature = hash_hmac('sha256', $data, $this->secretKey);
        
        Log::info('SumsubService::createSignature - Signature created', [
            'signature' => $signature,
            'signature_length' => strlen($signature),
            'secret_key_length' => strlen($this->secretKey),
        ]);
        
        return $signature;
    }
}
