import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import ReactDOMServer from 'react-dom/server';

import AppErrorBoundary from '@/components/errors/AppErrorBoundary';
import ToastProvider from '@/components/toasts/toast-provider';
import { AppErrorBoundaryFallback } from '@/pages/Errors/Unexpected';
import type { ToastPayload } from '@/types/toasts';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => (title ? `${title} - ${appName}` : appName),
        resolve: (name) =>
            resolvePageComponent(
                `./pages/${name}.tsx`,
                import.meta.glob('./pages/**/*.tsx'),
            ),
        setup: ({ App, props }) => {
            const initialToasts = (
                props.initialPage?.props as
                    | { toasts?: ToastPayload[] }
                    | undefined
            )?.toasts;
            const authUserId =
                (
                    props.initialPage?.props as
                        | { auth?: { user?: { id?: number | null } } }
                        | undefined
                )?.auth?.user?.id ?? null;
            const initialUnreadCount =
                (
                    props.initialPage?.props as
                        | {
                              notifications?: {
                                  unread_count?: number | string | null;
                              };
                          }
                        | undefined
                )?.notifications?.unread_count ?? 0;
            const initialMessagingUnreadCount =
                (
                    props.initialPage?.props as
                        | {
                              messaging?: {
                                  unread_count?: number | string | null;
                              };
                          }
                        | undefined
                )?.messaging?.unread_count ?? 0;

            return (
                <AppErrorBoundary
                    fallback={(context) => (
                        <AppErrorBoundaryFallback
                            context={context}
                            initialPage={props.initialPage}
                        />
                    )}
                >
                    <ToastProvider
                        initialToasts={initialToasts}
                        authUserId={authUserId}
                        initialUnreadCount={initialUnreadCount}
                        initialMessagingUnreadCount={
                            initialMessagingUnreadCount
                        }
                    >
                        <App {...props} />
                    </ToastProvider>
                </AppErrorBoundary>
            );
        },
    }),
);
