import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Monitor, Smartphone, Tablet, AlertCircle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import HeadingSmall from '@/components/heading-small';
import { type SharedData, type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';

type Session = {
    id: string;
    ip_address: string;
    user_agent: string;
    is_current: boolean;
    last_activity: string;
    last_activity_human: string;
    device_info: {
        browser: string;
        os: string;
        is_mobile: boolean;
        is_tablet: boolean;
        is_desktop: boolean;
        raw: string;
    };
};

type SessionsPageProps = {
    sessions: Session[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Active Sessions',
        href: '/settings/security/sessions',
    },
];

export default function SessionsPage({ sessions }: SessionsPageProps) {
    const { flash } = usePage<SharedData>().props;

    const handleDelete = (sessionId: string) => {
        if (confirm('Are you sure you want to delete this session?')) {
            router.delete(`/settings/security/sessions/${sessionId}`);
        }
    };

    const handleDeleteAll = () => {
        if (confirm('Are you sure you want to delete all other sessions? This will log you out of all devices except this one.')) {
            router.delete('/settings/security/sessions');
        }
    };

    const getDeviceIcon = (session: Session) => {
        if (session.device_info.is_mobile) {
            return <Smartphone className="h-4 w-4" />;
        }
        if (session.device_info.is_tablet) {
            return <Tablet className="h-4 w-4" />;
        }
        return <Monitor className="h-4 w-4" />;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Active Sessions" />
            <SettingsLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <HeadingSmall
                            title="Active Sessions"
                            description="Manage and monitor your active sessions across devices"
                        />
                        {sessions.length > 1 && (
                            <Button
                                variant="destructive"
                                onClick={handleDeleteAll}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                End All Other Sessions
                            </Button>
                        )}
                    </div>

                    {flash?.status && (
                        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 text-green-800 dark:text-green-200">
                            {flash.status}
                        </div>
                    )}

                    <div className="space-y-4">
                        {sessions.map((session) => (
                            <Card key={session.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {getDeviceIcon(session)}
                                            <div>
                                                <CardTitle className="text-base">
                                                    {session.device_info.os} - {session.device_info.browser}
                                                </CardTitle>
                                                <CardDescription>
                                                    {session.ip_address} • {session.last_activity_human}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {session.is_current && (
                                                <Badge variant="default">Current</Badge>
                                            )}
                                            {!session.is_current && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(session.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>

                    <Card className="border-amber-200 dark:border-amber-800">
                        <CardHeader>
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                                <div>
                                    <CardTitle className="text-sm">Security Tip</CardTitle>
                                    <CardDescription className="text-xs mt-1">
                                        If you see a session you don't recognize, delete it immediately and consider changing your password.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}


