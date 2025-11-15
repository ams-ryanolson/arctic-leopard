import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Clock, Loader2, ShieldCheck } from 'lucide-react';

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
    created_at?: string | null;
    can_retry?: boolean;
} | null;

type VerificationFlowProps = {
    mode?: 'settings' | 'onboarding';
    verificationStatus: VerificationStatus;
    onComplete?: () => void;
};


export default function VerificationFlow({
    verificationStatus,
    onComplete,
}: VerificationFlowProps) {
    const [loading, setLoading] = useState(false);
    const [creatingSession, setCreatingSession] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const popupWindowRef = useRef<Window | null>(null);
    const messageListenerRef = useRef<((event: MessageEvent) => void) | null>(null);

    // Clean up message listener on unmount
    useEffect(() => {
        return () => {
            if (messageListenerRef.current) {
                window.removeEventListener('message', messageListenerRef.current);
            }
        };
    }, []);

    // Set up postMessage listener for communication from popup
    useEffect(() => {
        const handleMessage = (event: MessageEvent): void => {
            // Verify message origin for security
            if (event.origin !== window.location.origin) {
                return;
            }

            const { type, error: errorMessage } = event.data;

            if (type === 'verification.completed' || type === 'verification.submitted') {
                setLoading(false);
                setCreatingSession(false);

                // Close popup if still open
                if (popupWindowRef.current && !popupWindowRef.current.closed) {
                    popupWindowRef.current.close();
                }

                // Reload verification status
                router.reload({
                    only: ['verificationStatus'],
                });

                onComplete?.();
            } else if (type === 'verification.error') {
                setLoading(false);
                setCreatingSession(false);
                setError(errorMessage || 'Verification failed. Please try again.');

                // DON'T close popup on error - let user see the error and close it themselves
                // Popups can only be closed by user interaction or if opened by the script
                // We'll let the user see the error message in the popup
            }
        };

        messageListenerRef.current = handleMessage;
        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [onComplete]);

    const createSession = (): void => {
        if (creatingSession || loading) {
            return;
        }

        setCreatingSession(true);
        setError(null);
        setLoading(true);

        try {
            // Popup window features - sized to fit verification flow nicely
            const popupWidth = 650;
            const popupHeight = 760;
            const left = (window.innerWidth - popupWidth) / 2 + window.screenX;
            const top = (window.innerHeight - popupHeight) / 2 + window.screenY;

            const popupFeatures = `width=${popupWidth},height=${popupHeight},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes,status=no`;

            // Open popup window
            const popup = window.open('/verification/popup', 'SumsubVerification', popupFeatures);

            // Check if popup was blocked
            if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                setError(
                    'Popup blocked! Please allow popups for this site and try again. You can usually do this in your browser settings or by clicking the popup icon in your address bar.'
                );
                setLoading(false);
                setCreatingSession(false);
                return;
            }

            popupWindowRef.current = popup;
            popup.focus();

            // Monitor popup closure (user manually closed)
            const checkClosed = setInterval(() => {
                if (popup.closed) {
                    clearInterval(checkClosed);
                    if (loading) {
                        setLoading(false);
                        setCreatingSession(false);
                        // Only show message if verification wasn't completed
                        if (!verificationStatus?.status || verificationStatus.status !== 'approved') {
                            setError(null); // Don't show error if user just closed the window
                        }
                    }
                }
            }, 500);

            // Clean up interval after 5 minutes (safety timeout)
            setTimeout(() => {
                clearInterval(checkClosed);
            }, 5 * 60 * 1000);
        } catch (caught) {
            const errorMessage = caught instanceof Error ? caught.message : 'Failed to open verification window. Please try again.';
            setError(errorMessage);
            setLoading(false);
            setCreatingSession(false);
        }
    };

    if (verificationStatus?.status === 'approved') {
        const expiresAt = verificationStatus.expires_at
            ? new Date(verificationStatus.expires_at)
            : null;

        return (
            <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-8">
                <div className="flex items-start gap-4">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-400/20 border border-emerald-400/40">
                        <CheckCircle2 className="size-6 text-emerald-300" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <h3 className="text-lg font-semibold text-white">Verification Approved</h3>
                        <p className="text-sm text-white/70">
                            Your ID verification has been successfully approved.
                        </p>
                        {expiresAt && (
                            <p className="text-xs text-white/60">
                                Expires: {expiresAt.toLocaleDateString()}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (verificationStatus?.status === 'renewal_required' || verificationStatus?.needs_renewal) {
        const gracePeriodEnd = verificationStatus.expires_at
            ? new Date(new Date(verificationStatus.expires_at).getTime() + 30 * 24 * 60 * 60 * 1000)
            : null;

        return (
            <div className="space-y-6">
                <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-8">
                    <div className="flex items-start gap-4">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-400/20 border border-amber-400/40">
                            <Clock className="size-6 text-amber-300" />
                        </div>
                        <div className="flex-1 space-y-3">
                            <h3 className="text-lg font-semibold text-white">Renewal Required</h3>
                            <p className="text-sm text-white/70">
                                Your ID verification needs to be renewed. Please complete a new verification to continue using creator features.
                            </p>
                            {gracePeriodEnd && verificationStatus.is_in_grace_period && (
                                <p className="text-xs text-white/60">
                                    Grace period ends: {gracePeriodEnd.toLocaleDateString()}
                                </p>
                            )}
                            {verificationStatus.is_expired && !verificationStatus.is_in_grace_period && (
                                <p className="text-xs text-red-300">
                                    Your creator status has been disabled. Renew your verification to restore access.
                                </p>
                            )}
                        </div>
                    </div>
                </div>


                <Button
                    onClick={createSession}
                    disabled={creatingSession || loading}
                    className="w-full"
                >
                    {creatingSession || loading ? (
                        <>
                            <Loader2 className="size-4 animate-spin" />
                            Starting Verification...
                        </>
                    ) : (
                        <>
                            <ShieldCheck className="size-4" />
                            Renew Verification
                        </>
                    )}
                </Button>

                {error && (
                    <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="size-5 text-red-400" />
                            <p className="text-sm text-red-300">{error}</p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (verificationStatus?.status === 'rejected') {
        return (
            <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-8">
                <div className="flex items-start gap-4">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-red-400/20 border border-red-400/40">
                        <AlertCircle className="size-6 text-red-300" />
                    </div>
                    <div className="flex-1 space-y-3">
                        <h3 className="text-lg font-semibold text-white">Verification Rejected</h3>
                        <p className="text-sm text-white/70">
                            Your verification was rejected. Please review your documents and try again.
                        </p>
                        <Button onClick={createSession} disabled={creatingSession || loading} className="mt-4">
                            {creatingSession || loading ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Starting Verification...
                                </>
                            ) : (
                                'Try Again'
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (verificationStatus?.status === 'pending') {
        // Calculate time since verification was created
        const getTimeInfo = () => {
            if (!verificationStatus.created_at) {
                return null;
            }
            const created = new Date(verificationStatus.created_at);
            const now = new Date();
            const minutesSinceCreated = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
            const hoursSinceCreated = Math.floor(minutesSinceCreated / 60);
            const daysSinceCreated = Math.floor(hoursSinceCreated / 24);

            if (daysSinceCreated > 0) {
                return { text: `${daysSinceCreated} day${daysSinceCreated > 1 ? 's' : ''}`, minutes: minutesSinceCreated };
            }
            if (hoursSinceCreated > 0) {
                return { text: `${hoursSinceCreated} hour${hoursSinceCreated > 1 ? 's' : ''}`, minutes: minutesSinceCreated };
            }
            return { text: `${minutesSinceCreated} minute${minutesSinceCreated !== 1 ? 's' : ''}`, minutes: minutesSinceCreated };
        };

        const timeInfo = getTimeInfo();
        const minutesSinceCreated = timeInfo?.minutes ?? 0;
        const hasApplicantId = !!verificationStatus.provider_applicant_id;
        
        // If they have an applicant ID and it's been more than 15 minutes, they likely submitted it
        // If they don't have an applicant ID or it's been a long time, they probably didn't complete it
        const likelySubmitted = hasApplicantId && minutesSinceCreated >= 15;
        const probablyIncomplete = !hasApplicantId || minutesSinceCreated >= 30;

        return (
            <div className="space-y-6">
                <div className="rounded-3xl border border-blue-400/20 bg-blue-400/10 p-8">
                    <div className="flex items-start gap-4">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-400/20 border border-blue-400/40">
                            <Loader2 className="size-6 text-blue-300 animate-spin" />
                        </div>
                        <div className="flex-1 space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Verification In Progress</h3>
                                {timeInfo && (
                                    <p className="text-xs text-white/60 mt-1">
                                        Started {timeInfo.text} ago
                                    </p>
                                )}
                            </div>

                            {likelySubmitted ? (
                                // They likely submitted - it's being reviewed
                                <div className="space-y-3">
                                    <p className="text-sm text-white/80 leading-relaxed">
                                        Your verification has been submitted and is currently being reviewed by our security team. 
                                        This process typically takes a few minutes to a few hours.
                                    </p>
                                    <div className="rounded-xl border border-blue-400/20 bg-blue-400/5 p-4">
                                        <p className="text-xs text-blue-200/90 leading-relaxed">
                                            <span className="font-semibold">What happens next?</span> Our automated system will review your documents 
                                            and identity verification. You'll receive an email notification once the review is complete.
                                        </p>
                                    </div>
                                </div>
                            ) : probablyIncomplete ? (
                                // They probably didn't complete it
                                <div className="space-y-3">
                                    <p className="text-sm text-white/80 leading-relaxed">
                                        It looks like you may have started the verification process but didn't complete it. 
                                        Don't worry—this happens sometimes if the verification window was closed or there was an interruption.
                                    </p>
                                    <div className="rounded-xl border border-violet-400/20 bg-violet-400/10 p-4">
                                        <p className="text-xs text-violet-200/90 leading-relaxed">
                                            <span className="font-semibold">Ready to continue?</span> You can pick up where you left off 
                                            and complete your verification. The process only takes a few minutes.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                // Recent, likely in progress
                                <div className="space-y-3">
                                    <p className="text-sm text-white/80 leading-relaxed">
                                        Your verification is currently in progress. This typically takes just a few minutes to complete.
                                    </p>
                                    {minutesSinceCreated >= 10 && (
                                        <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
                                            <p className="text-xs text-amber-200/90 leading-relaxed">
                                                If you haven't completed the verification steps yet, make sure to finish the process 
                                                in the verification window.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {probablyIncomplete && (
                    <Button
                        onClick={createSession}
                        disabled={creatingSession || loading}
                        className="w-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600 px-8 py-6 text-lg font-semibold text-white shadow-[0_20px_50px_-20px_rgba(124,58,237,0.5)] transition hover:scale-[1.01] hover:shadow-[0_25px_60px_-20px_rgba(124,58,237,0.6)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {creatingSession || loading ? (
                            <>
                                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                Opening Verification...
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="mr-3 h-5 w-5" />
                                {hasApplicantId ? 'Continue Verification' : 'Start Verification'}
                            </>
                        )}
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Enhanced Description Card */}
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-violet-500/10 p-8 backdrop-blur-sm">
                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400/30 to-violet-500/20 border border-violet-400/40 p-3">
                            <ShieldCheck className="size-6 text-violet-300" />
                        </div>
                        <div className="flex-1 space-y-4">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">What to Expect</h3>
                                <p className="text-base leading-relaxed text-white/90 font-medium">
                                    To become a creator and start earning, you'll need to verify your identity. The process is quick and secure, taking just a few minutes.
                                </p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
                                <h4 className="text-sm font-semibold text-white/90 uppercase tracking-wide">Verification Steps</h4>
                                <ul className="space-y-3 text-sm text-white/80">
                                    <li className="flex items-start gap-3">
                                        <div className="flex size-6 items-center justify-center rounded-lg bg-violet-400/20 border border-violet-400/40 flex-shrink-0 mt-0.5">
                                            <span className="text-xs font-bold text-violet-300">1</span>
                                        </div>
                                        <span className="pt-0.5">Have a valid government-issued ID ready (driver's license, passport, or national ID)</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="flex size-6 items-center justify-center rounded-lg bg-violet-400/20 border border-violet-400/40 flex-shrink-0 mt-0.5">
                                            <span className="text-xs font-bold text-violet-300">2</span>
                                        </div>
                                        <span className="pt-0.5">Take a quick selfie to confirm your identity (liveness check)</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="flex size-6 items-center justify-center rounded-lg bg-violet-400/20 border border-violet-400/40 flex-shrink-0 mt-0.5">
                                            <span className="text-xs font-bold text-violet-300">3</span>
                                        </div>
                                        <span className="pt-0.5">Complete the process—verification typically takes just a few minutes</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                                <p className="text-xs leading-relaxed text-emerald-200/90">
                                    <span className="font-semibold text-emerald-200">Your Privacy Matters:</span>{' '}
                                    All information is processed by Sumsub with bank-level encryption. We never see your documents—only that your verification was successful. 
                                    Your data is protected by GDPR, SOC 2 compliance, and end-to-end encryption.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Start Verification Button */}
            <Button
                onClick={createSession}
                disabled={creatingSession || loading}
                className="w-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600 px-8 py-6 text-lg font-semibold text-white shadow-[0_20px_50px_-20px_rgba(124,58,237,0.5)] transition hover:scale-[1.01] hover:shadow-[0_25px_60px_-20px_rgba(124,58,237,0.6)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
                {creatingSession || loading ? (
                    <>
                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                        {loading ? 'Opening Verification Window...' : 'Starting Verification...'}
                    </>
                ) : (
                    <>
                        <ShieldCheck className="mr-3 h-5 w-5" />
                        Start Identity Verification
                    </>
                )}
            </Button>

            {error && (
                <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="size-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-red-300">Verification Error</p>
                            <p className="text-xs text-red-200/80 mt-1">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {loading && !error && (
                <div className="rounded-xl border border-blue-400/20 bg-blue-400/10 p-4">
                    <div className="flex items-start gap-2">
                        <Loader2 className="size-5 text-blue-400 animate-spin flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-blue-300">Verification Window Open</p>
                            <p className="text-xs text-blue-200/80 mt-1">
                                Please complete the verification in the popup window. If the window didn't open, please check your popup blocker settings.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

