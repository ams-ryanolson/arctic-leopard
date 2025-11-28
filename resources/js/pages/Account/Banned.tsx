import { Head, Link, router, usePage } from '@inertiajs/react';
import { AlertCircle, Ban, Clock, FileText } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type SharedData } from '@/types';
import { Head as InertiaHead } from '@inertiajs/react';
import accountRoutes from '@/routes/account';

type Warning = {
    id: number;
    reason: string;
    notes?: string | null;
    expires_at?: string | null;
    created_at: string;
};

type BannedPageProps = {
    reason?: string | null;
    banned_at?: string | null;
    banned_by?: {
        id: number;
        name: string;
        username: string;
    } | null;
    has_pending_appeal: boolean;
    can_appeal: boolean;
    active_warnings: Warning[];
};

export default function Banned() {
    const { auth } = usePage<SharedData>().props;
    const props = usePage<BannedPageProps>().props;

    const handleAppeal = () => {
        router.visit(accountRoutes.appeal.create().url);
    };

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
            <InertiaHead title="Account Banned" />

            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.22),_transparent_55%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(99,102,241,0.25),_transparent_60%)]" />
            </div>

            <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-12 sm:px-8 lg:px-12">
                <header className="flex flex-col gap-3 text-xs tracking-[0.35em] text-white/55 uppercase">
                    <span>Account status</span>
                    <span>Banned</span>
                </header>

                <main className="mt-12 flex flex-1 flex-col gap-8">
                    <Card className="border-red-500/20 bg-red-950/20">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-red-500/20 p-3">
                                    <Ban className="size-6 text-red-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl text-white">
                                        Your account has been banned
                                    </CardTitle>
                                    {props.banned_at && (
                                        <CardDescription className="text-white/60">
                                            Banned {formatDistanceToNow(new Date(props.banned_at), { addSuffix: true })}
                                        </CardDescription>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {props.reason && (
                                <Alert className="border-red-500/30 bg-red-950/10">
                                    <AlertCircle className="size-4 text-red-400" />
                                    <AlertTitle className="text-white">Reason for ban</AlertTitle>
                                    <AlertDescription className="text-white/80">
                                        {props.reason}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-4">
                                <p className="text-sm leading-relaxed text-white/70">
                                    Your account has been permanently banned from the platform. This action was taken due to a violation of our terms of service or community guidelines.
                                </p>

                                {props.can_appeal && !props.has_pending_appeal && (
                                    <div className="flex flex-col gap-3">
                                        <p className="text-sm text-white/60">
                                            If you believe this ban was issued in error, you may submit an appeal for review.
                                        </p>
                                        <Button
                                            onClick={handleAppeal}
                                            className="w-full sm:w-auto"
                                            variant="default"
                                        >
                                            <FileText className="size-4" />
                                            Submit Appeal
                                        </Button>
                                    </div>
                                )}

                                {props.has_pending_appeal && (
                                    <Alert className="border-amber-500/30 bg-amber-950/10">
                                        <Clock className="size-4 text-amber-400" />
                                        <AlertTitle className="text-white">Appeal pending</AlertTitle>
                                        <AlertDescription className="text-white/80">
                                            You have a pending appeal. Our team will review it shortly.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {props.active_warnings && props.active_warnings.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold text-white">Active Warnings</h3>
                                        <div className="space-y-2">
                                            {props.active_warnings.map((warning) => (
                                                <div
                                                    key={warning.id}
                                                    className="rounded-lg border border-amber-500/20 bg-amber-950/10 p-3"
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="text-sm text-white/80">{warning.reason}</p>
                                                        {warning.expires_at && (
                                                            <Badge variant="outline" className="text-xs">
                                                                Expires {formatDistanceToNow(new Date(warning.expires_at), { addSuffix: true })}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {warning.notes && (
                                                        <p className="mt-2 text-xs text-white/60">{warning.notes}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
                                <Button
                                    onClick={handleLogout}
                                    variant="outline"
                                    className="w-full sm:w-auto border-white/25 bg-white/10 text-white hover:bg-white/15"
                                >
                                    Logout
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
}

