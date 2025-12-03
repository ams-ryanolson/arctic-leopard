import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { router, useForm, usePage } from '@inertiajs/react';
import messagesRoutes from '@/routes/messages';
import type { SharedData } from '@/types';
import type { MessagingPreferences } from './types';
import { useEffect } from 'react';

type MessagesSettingsProps = {
    onBack?: () => void;
    showBackButton?: boolean;
};

type MessagesSettingsPageProps = SharedData & {
    messagingPreferences?: MessagingPreferences;
    success?: string;
};

export default function MessagesSettings({
    onBack,
    showBackButton = false,
}: MessagesSettingsProps) {
    const pageProps = usePage<MessagesSettingsPageProps>().props;
    const { features: sharedFeatures, messagingPreferences, success } = pageProps;
    const features = (sharedFeatures ?? {}) as Record<string, boolean>;
    const signalsEnabled = features.feature_signals_enabled ?? false;

    // Initialize form data from props with defaults
    const defaultPreferences: MessagingPreferences = {
        message_request_mode: 'everyone',
        allow_subscriber_messages: true,
        filter_low_quality: true,
    };

    const preferences = messagingPreferences ?? defaultPreferences;

    const form = useForm({
        message_request_mode: preferences.message_request_mode,
        allow_subscriber_messages: preferences.allow_subscriber_messages,
        filter_low_quality: preferences.filter_low_quality,
    });

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.visit(messagesRoutes.index.url());
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/messages/settings', {
            preserveScroll: true,
            onSuccess: () => {
                // Form will automatically reload the page with updated preferences
            },
        });
    };

    // Show success message if present
    useEffect(() => {
        if (success) {
            // Could show a toast here if needed
            console.log('Success:', success);
        }
    }, [success]);

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-neutral-950 text-white">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3 sm:px-6 sm:py-4">
                {showBackButton && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleBack}
                        className="flex-shrink-0 rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
                        aria-label="Back"
                    >
                        <ArrowLeft className="size-5" />
                    </Button>
                )}
                <h1 className="text-base font-semibold text-white sm:text-lg">
                    Settings
                </h1>
            </div>

            {/* Settings Content */}
            <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
                <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-8">
                    {/* Allow message requests from */}
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-base font-semibold text-white">
                                Allow message requests from:
                            </h2>
                            <p className="mt-1 text-sm text-white/60">
                                People you follow will always be able to message
                                you.{' '}
                                <button
                                    type="button"
                                    className="text-amber-400 hover:text-amber-300 underline"
                                >
                                    Learn more
                                </button>
                            </p>
                        </div>
                        <div className="space-y-3">
                            <label className="flex items-center justify-between gap-4 cursor-pointer">
                                <span className="text-sm text-white">No one</span>
                                <input
                                    type="radio"
                                    name="message_request_mode"
                                    value="no-one"
                                    checked={form.data.message_request_mode === 'no-one'}
                                    onChange={(e) => form.setData('message_request_mode', e.target.value as MessagingPreferences['message_request_mode'])}
                                    className="h-4 w-4 border-white/20 bg-white/5 text-amber-400 focus:ring-amber-400/40 focus:ring-offset-0"
                                />
                            </label>
                            <label className="flex items-center justify-between gap-4 cursor-pointer">
                                <span className="text-sm text-white">
                                    Verified users
                                </span>
                                <input
                                    type="radio"
                                    name="message_request_mode"
                                    value="verified"
                                    checked={form.data.message_request_mode === 'verified'}
                                    onChange={(e) => form.setData('message_request_mode', e.target.value as MessagingPreferences['message_request_mode'])}
                                    className="h-4 w-4 border-white/20 bg-white/5 text-amber-400 focus:ring-amber-400/40 focus:ring-offset-0"
                                />
                            </label>
                            <label className="flex items-center justify-between gap-4 cursor-pointer">
                                <span className="text-sm text-white">
                                    Following
                                </span>
                                <input
                                    type="radio"
                                    name="message_request_mode"
                                    value="following"
                                    checked={form.data.message_request_mode === 'following'}
                                    onChange={(e) => form.setData('message_request_mode', e.target.value as MessagingPreferences['message_request_mode'])}
                                    className="h-4 w-4 border-white/20 bg-white/5 text-amber-400 focus:ring-amber-400/40 focus:ring-offset-0"
                                />
                            </label>
                            <label className="flex items-center justify-between gap-4 cursor-pointer">
                                <span className="text-sm text-white">
                                    Verified users & Following
                                </span>
                                <input
                                    type="radio"
                                    name="message_request_mode"
                                    value="verified-and-following"
                                    checked={form.data.message_request_mode === 'verified-and-following'}
                                    onChange={(e) => form.setData('message_request_mode', e.target.value as MessagingPreferences['message_request_mode'])}
                                    className="h-4 w-4 border-white/20 bg-white/5 text-amber-400 focus:ring-amber-400/40 focus:ring-offset-0"
                                />
                            </label>
                            <label className="flex items-center justify-between gap-4 cursor-pointer">
                                <span className="text-sm text-white">
                                    Everyone
                                </span>
                                <input
                                    type="radio"
                                    name="message_request_mode"
                                    value="everyone"
                                    checked={form.data.message_request_mode === 'everyone'}
                                    onChange={(e) => form.setData('message_request_mode', e.target.value as MessagingPreferences['message_request_mode'])}
                                    className="h-4 w-4 border-white/20 bg-white/5 text-amber-400 focus:ring-amber-400/40 focus:ring-offset-0"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Allow messages from subscribers */}
                    {signalsEnabled && (
                        <div className="space-y-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <h2 className="text-base font-semibold text-white">
                                        Allow messages from my subscribers
                                    </h2>
                                    <p className="mt-1 text-sm text-white/60">
                                        Your subscribers will always be able to
                                        send you messages independent of other
                                        messaging settings.{' '}
                                        <button
                                            type="button"
                                            className="text-amber-400 hover:text-amber-300 underline"
                                        >
                                            Learn more
                                        </button>
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.data.allow_subscriber_messages}
                                        onChange={(e) => form.setData('allow_subscriber_messages', e.target.checked)}
                                        className="peer sr-only"
                                    />
                                    <div className="h-6 w-11 rounded-full border border-white/20 bg-white/5 transition-colors peer-checked:bg-amber-400 peer-checked:border-amber-400 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-400/40">
                                        <div className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Filter low-quality messages */}
                    <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <h2 className="text-base font-semibold text-white">
                                    Filter low-quality messages
                                </h2>
                                <p className="mt-1 text-sm text-white/60">
                                    Hide message requests that have been
                                    detected as being potentially spam or
                                    low-quality. These will be sent to a
                                    separate inbox at the bottom of your message
                                    requests. You can still access them if you
                                    want.{' '}
                                    <button
                                        type="button"
                                        className="text-amber-400 hover:text-amber-300 underline"
                                    >
                                        Learn more
                                    </button>
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.data.filter_low_quality}
                                    onChange={(e) => form.setData('filter_low_quality', e.target.checked)}
                                    className="peer sr-only"
                                />
                                <div className="h-6 w-11 rounded-full border border-white/20 bg-white/5 transition-colors peer-checked:bg-amber-400 peer-checked:border-amber-400 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-400/40">
                                    <div className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="w-full sm:w-auto"
                        >
                            {form.processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
