import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import AppErrorBoundary from '@/components/errors/AppErrorBoundary';
import { LightboxProvider } from '@/components/feed/lightbox-context';
import ToastProvider from '@/components/toasts/toast-provider';
import ToastViewport from '@/components/toasts/toast-viewport';
import type { ToastPayload } from '@/types/toasts';

import { initializeTheme } from './hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';
const LazyAppErrorBoundaryFallback = lazy(async () => {
    const module = await import('./pages/Errors/Unexpected.tsx');

    return { default: module.AppErrorBoundaryFallback };
});

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        const initialToasts =
            (props.initialPage?.props as { toasts?: ToastPayload[] } | undefined)?.toasts;
        const authUserId =
            (props.initialPage?.props as { auth?: { user?: { id?: number | null } } } | undefined)?.auth?.user
                ?.id ?? null;
        const initialUnreadCount =
            (props.initialPage?.props as { notifications?: { unread_count?: number | string | null } } | undefined)
                ?.notifications?.unread_count ?? 0;
        const initialMessagingUnreadCount =
            (props.initialPage?.props as { messaging?: { unread_count?: number | string | null } } | undefined)
                ?.messaging?.unread_count ?? 0;

        root.render(
            <StrictMode>
                <AppErrorBoundary
                    fallback={(context) => (
                        <Suspense fallback={null}>
                            <LazyAppErrorBoundaryFallback
                                context={context}
                                initialPage={props.initialPage}
                            />
                        </Suspense>
                    )}
                >
                    <ToastProvider
                        initialToasts={initialToasts}
                        authUserId={authUserId}
                        initialUnreadCount={initialUnreadCount}
                        initialMessagingUnreadCount={initialMessagingUnreadCount}
                    >
                        <LightboxProvider>
                            <App {...props} />
                            <ToastViewport />
                        </LightboxProvider>
                    </ToastProvider>
                </AppErrorBoundary>
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
