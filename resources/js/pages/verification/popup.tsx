import { useEffect, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import { Loader2, AlertCircle } from 'lucide-react';
import { getCsrfToken } from '@/lib/csrf';

type VerificationStatus = {
    status: string | null;
    provider?: string;
    provider_applicant_id?: string | null;
    verified_at?: string | null;
    expires_at?: string | null;
    renewal_required_at?: string | null;
    is_expired?: boolean;
    is_in_grace_period?: boolean;
    needs_renewal?: boolean;
} | null;

declare global {
    interface Window {
        snsWebSdk?: {
            init: (accessToken: string, updateAccessToken: () => Promise<string>) => {
                withConf?: (config: Record<string, unknown>) => unknown;
                withOptions?: (options: Record<string, unknown>) => unknown;
                on?: (event: string, handler: (data?: unknown) => void) => unknown;
                build: () => {
                    launch: (elementId: string) => void;
                };
            };
        };
        SumsubWebSDK?: {
            init: (accessToken: string, updateAccessToken: () => Promise<string>) => {
                withConf?: (config: Record<string, unknown>) => unknown;
                withOptions?: (options: Record<string, unknown>) => unknown;
                on?: (event: string, handler: (data?: unknown) => void) => unknown;
                build: () => {
                    launch: (elementId: string) => void;
                };
            };
        };
        Sumsub?: {
            init: (accessToken: string, updateAccessToken: () => Promise<string>) => {
                withConf?: (config: Record<string, unknown>) => unknown;
                withOptions?: (options: Record<string, unknown>) => unknown;
                on?: (event: string, handler: (data?: unknown) => void) => unknown;
                build: () => {
                    launch: (elementId: string) => void;
                };
            };
        };
    }
}

export default function VerificationPopup({
    verificationStatus: _verificationStatus, // eslint-disable-line @typescript-eslint/no-unused-vars
}: {
    verificationStatus: VerificationStatus;
}) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const sdkLoadedRef = useRef(false);

    const initializeSDK = async (): Promise<void> => {
        if (loading === false) {
            return;
        }

        try {
            // Get or create verification session
            // Use full URL to avoid relative path issues in popup
            const baseUrl = window.location.origin;
            const csrfToken = getCsrfToken();
            
            if (!csrfToken) {
                console.warn('CSRF token not found, request may fail');
            }

            // Log request details for debugging
            console.log('Fetching verification session:', {
                url: `${baseUrl}/api/settings/verification/session`,
                hasCsrfToken: !!csrfToken,
                cookies: document.cookie ? 'present' : 'missing',
                origin: window.location.origin,
            });

            const response = await fetch(`${baseUrl}/api/settings/verification/session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
                },
                credentials: 'include', // Include cookies - CRITICAL for popup windows
                mode: 'cors', // Explicitly set CORS mode
            }).catch((networkError) => {
                // Network errors (CORS, connection issues, etc.)
                console.error('Network error fetching verification session:', networkError);
                console.error('Error details:', {
                    message: networkError.message,
                    name: networkError.name,
                    stack: networkError.stack,
                });
                
                // More detailed error message
                let errorMsg = 'Unable to connect to the server. ';
                if (networkError.message?.includes('Failed to fetch')) {
                    errorMsg += 'This may be due to:\n';
                    errorMsg += '• Network connection issues\n';
                    errorMsg += '• Session/cookie authentication issues in popup\n';
                    errorMsg += '• CORS configuration\n\n';
                    errorMsg += 'Please try refreshing the popup or closing and starting again.';
                } else {
                    errorMsg += networkError.message || 'Unknown network error';
                }
                
                throw new Error(errorMsg);
            });

            if (!response.ok) {
                // Log response details for debugging
                console.error('Request failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries()),
                });

                const errorData = await response.json().catch(async () => {
                    // If response isn't JSON, try to get text
                    const text = await response.text().catch(() => '');
                    console.error('Non-JSON error response:', text);
                    return { message: text || `Server error (${response.status})` };
                });
                
                let errorMsg = errorData.message || errorData.error || `Request failed with status ${response.status}`;
                
                // Add helpful context for common errors
                if (response.status === 401 || response.status === 403) {
                    errorMsg += '\n\nThis may be a session authentication issue. Please try:\n';
                    errorMsg += '1. Close this popup\n';
                    errorMsg += '2. Refresh the main page\n';
                    errorMsg += '3. Try verification again';
                } else if (response.status === 419) {
                    errorMsg += '\n\nCSRF token expired. Please refresh the main page and try again.';
                } else if (response.status >= 500) {
                    errorMsg += '\n\nServer error. Please try again in a moment.';
                }
                
                throw new Error(errorMsg);
            }

            const data = await response.json();
            const { access_token: accessToken } = data;

            if (!accessToken) {
                throw new Error('Failed to get access token');
            }

            const sdk = window.SumsubWebSDK || window.snsWebSdk || (window as any).Sumsub;

            if (!sdk) {
                throw new Error('Sumsub SDK not loaded');
            }

            // Ensure container exists in DOM - create it if it doesn't exist
            const containerId = 'sumsub-container';
            let containerElement = document.getElementById(containerId);

            if (!containerElement) {
                // Container doesn't exist, create it
                containerElement = document.createElement('div');
                containerElement.id = containerId;
                containerElement.className = 'min-h-screen';
                
                // Append to body or a specific location
                const body = document.body;
                if (body) {
                    // Clear any loading/error states and append container
                    body.innerHTML = '';
                    body.appendChild(containerElement);
                } else {
                    throw new Error('Document body not found');
                }
            }

            // Update ref if available
            if (containerRef.current && containerRef.current !== containerElement) {
                containerRef.current = containerElement as HTMLDivElement;
            } else if (!containerRef.current && containerElement) {
                // Create a ref-like object
                const div = containerElement as HTMLDivElement;
                if (div) {
                    // Store reference
                    (window as any).__sumsubContainer = div;
                }
            }

            const containerSelector = `#${containerId}`;

            // Wait a bit more to ensure DOM is fully ready
            await new Promise((resolve) => setTimeout(resolve, 200));

            // Double-check element still exists
            const finalContainer = document.querySelector(containerSelector);
            if (!finalContainer) {
                throw new Error(`Container element with selector ${containerSelector} not found after creation`);
            }

            // Define updateAccessToken function
            const updateAccessToken = (): Promise<string> => {
                const baseUrl = window.location.origin;
                const csrfToken = getCsrfToken();

                // Use fetch to avoid request cancellation
                return fetch(`${baseUrl}/api/settings/verification/token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
                    },
                    credentials: 'include', // Include cookies
                }).catch((networkError) => {
                    console.error('Network error refreshing access token:', networkError);
                    throw new Error(
                        networkError.message?.includes('Failed to fetch') || networkError.message?.includes('NetworkError')
                            ? 'Unable to refresh verification session. Please reload the page.'
                            : `Network error: ${networkError.message || 'Unknown error'}`
                    );
                })
                    .then(async (response) => {
                        if (!response.ok) {
                            const errorData = await response.json().catch(() => ({}));
                            throw new Error(errorData.message || `Request failed with status ${response.status}`);
                        }
                        const data = await response.json();
                        const { access_token: newToken } = data;
                        if (newToken) {
                            return newToken;
                        }
                        throw new Error('No access token in response');
                    })
                    .catch((error) => {
                        console.error('Failed to refresh access token:', error);
                        throw error;
                    });
            };

            // Initialize SDK with light theme
            try {
                sdk.init(accessToken, updateAccessToken)
                    .withOptions({
                        theme: 'light', // Force light theme
                    })
                    .on('idCheck.onStepCompleted', () => {
                        // Send message to parent window
                        if (window.opener) {
                            window.opener.postMessage(
                                { type: 'verification.completed', status: 'completed' },
                                window.location.origin
                            );
                        }
                    })
                    .on('idCheck.onApplicantSubmitted', () => {
                        // Send message to parent window
                        if (window.opener) {
                            window.opener.postMessage(
                                { type: 'verification.submitted', status: 'submitted' },
                                window.location.origin
                            );
                        }
                    })
                    .on('idCheck.onError', (error: unknown) => {
                        const errorMessage = error instanceof Error ? error.message : 'Verification failed';
                        setError(errorMessage);
                        setLoading(false);

                        // Send error message to parent window
                        if (window.opener) {
                            window.opener.postMessage(
                                { type: 'verification.error', error: errorMessage },
                                window.location.origin
                            );
                        }
                    })
                    .build()
                    .launch(containerSelector);

                // Hide loading state and show container
                setLoading(false);
            } catch (sdkError) {
                console.error('SDK launch error:', sdkError);
                throw new Error(`Failed to launch verification SDK: ${sdkError instanceof Error ? sdkError.message : 'Unknown error'}`);
            }
        } catch (caught) {
            const errorMessage = caught instanceof Error ? caught.message : 'Failed to start verification';
            setError(errorMessage);
            setLoading(false);

            // Send error to parent window
            if (window.opener) {
                window.opener.postMessage(
                    { type: 'verification.error', error: errorMessage },
                    window.location.origin
                );
            }
        }
    };

    useEffect(() => {
        // Load Sumsub SDK
        const loadSDK = (): void => {
            if (sdkLoadedRef.current || window.SumsubWebSDK || window.snsWebSdk) {
                sdkLoadedRef.current = true;
                initializeSDK();
                return;
            }

            const existingScript = document.querySelector('script[src*="sns-websdk"]');
            if (existingScript) {
                const checkInterval = setInterval(() => {
                    if (window.SumsubWebSDK || window.snsWebSdk || (window as any).Sumsub) {
                        sdkLoadedRef.current = true;
                        clearInterval(checkInterval);
                        initializeSDK();
                    }
                }, 100);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://static.sumsub.com/idensic/static/sns-websdk-builder.js';
            script.async = true;

            let loadAttempts = 0;
            const maxAttempts = 20;

            script.onload = () => {
                const checkSdk = setInterval(() => {
                    loadAttempts++;

                    const sdk = window.SumsubWebSDK || window.snsWebSdk || (window as any).Sumsub;

                    if (sdk) {
                        sdkLoadedRef.current = true;
                        clearInterval(checkSdk);
                        initializeSDK();
                    } else if (loadAttempts >= maxAttempts) {
                        clearInterval(checkSdk);
                        setError('SDK loaded but not initialized. Please refresh the page and try again.');
                        setLoading(false);
                    }
                }, 100);
            };

            script.onerror = () => {
                setError('Failed to load verification SDK. Please check your internet connection and try again.');
                setLoading(false);
            };

            document.body.appendChild(script);
        };

        // Initialize immediately
        loadSDK();
    }, []);

    // Force light mode in popup - remove dark class if present
    useEffect(() => {
        // Remove dark class immediately
        document.documentElement.classList.remove('dark');
        
        // Watch for any attempts to add dark class and remove it
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (document.documentElement.classList.contains('dark')) {
                        document.documentElement.classList.remove('dark');
                    }
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        // Also set CSS to prevent dark mode background
        const style = document.createElement('style');
        style.textContent = `
            html { 
                background-color: white !important;
                color-scheme: light !important;
            }
            html.dark {
                background-color: white !important;
                color-scheme: light !important;
            }
            body {
                background-color: white !important;
            }
        `;
        document.head.appendChild(style);

        return () => {
            observer.disconnect();
            style.remove();
        };
    }, []);

    return (
        <>
            <Head title="Identity Verification" />
            <div className="min-h-screen bg-white">
                {loading && (
                    <div className="flex min-h-screen items-center justify-center">
                        <div className="text-center">
                            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-gray-600" />
                            <p className="text-sm text-gray-600">Loading verification...</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
                            <AlertCircle className="mx-auto mb-4 h-8 w-8 text-red-600" />
                            <h2 className="mb-3 text-lg font-semibold text-red-900 text-center">Verification Error</h2>
                            <div className="mb-4 rounded-md bg-red-100 p-3">
                                <p className="text-sm text-red-800 whitespace-pre-line text-left">{error}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => {
                                        // Notify parent window of error
                                        if (window.opener) {
                                            window.opener.postMessage(
                                                { type: 'verification.error', error },
                                                window.location.origin
                                            );
                                        }
                                        // Try to close - may not work due to browser security
                                        window.close();
                                    }}
                                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
                                >
                                    Close Window
                                </button>
                                <button
                                    onClick={() => {
                                        // Retry by reloading
                                        window.location.reload();
                                    }}
                                    className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition"
                                >
                                    Retry
                                </button>
                            </div>
                            <p className="mt-3 text-xs text-red-600 text-center">
                                If the window doesn't close automatically, you can close it manually using the browser controls.
                            </p>
                        </div>
                    </div>
                )}

                {/* Always render container, but hide when loading/error */}
                <div 
                    ref={containerRef} 
                    id="sumsub-container" 
                    className={`min-h-screen ${loading || error ? 'hidden' : ''}`}
                />
            </div>
        </>
    );
}

