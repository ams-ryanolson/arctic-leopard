import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, Clock, Home, XCircle } from 'lucide-react';

type AppealShowPageProps = {
    appeal: {
        id: number;
        appeal_type: string;
        reason: string;
        status: string;
        reviewed_at?: string | null;
        review_notes?: string | null;
        reviewed_by?: {
            id: number;
            name: string;
            username: string;
        } | null;
        created_at: string;
    };
    user_status: {
        is_suspended: boolean;
        is_banned: boolean;
    };
};

const statusConfig = {
    pending: {
        icon: Clock,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/20',
        borderColor: 'border-amber-500/30',
        label: 'Pending Review',
    },
    approved: {
        icon: CheckCircle2,
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-500/30',
        label: 'Approved',
    },
    rejected: {
        icon: XCircle,
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30',
        label: 'Rejected',
    },
    dismissed: {
        icon: XCircle,
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/20',
        borderColor: 'border-gray-500/30',
        label: 'Dismissed',
    },
};

export default function AppealShow() {
    const { auth } = usePage<SharedData>().props;
    const props = usePage<AppealShowPageProps>().props;
    const { appeal } = props;

    const config =
        statusConfig[appeal.status as keyof typeof statusConfig] ||
        statusConfig.pending;
    const StatusIcon = config.icon;

    return (
        <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
            <Head title="Appeal Status" />

            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.22),_transparent_55%)]" />
            </div>

            <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-12 sm:px-8 lg:px-12">
                <header className="flex flex-col gap-3 text-xs tracking-[0.35em] text-white/55 uppercase">
                    <span>Account appeal</span>
                    <span>Appeal #{appeal.id}</span>
                </header>

                <main className="mt-12 flex flex-1 flex-col gap-8">
                    <Card
                        className={`border ${config.borderColor} ${config.bgColor}`}
                    >
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`rounded-full ${config.bgColor} p-3`}
                                    >
                                        <StatusIcon
                                            className={`size-6 ${config.color}`}
                                        />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl text-white">
                                            Appeal Status
                                        </CardTitle>
                                        <CardDescription className="text-white/60">
                                            Submitted{' '}
                                            {formatDistanceToNow(
                                                new Date(appeal.created_at),
                                                { addSuffix: true },
                                            )}
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge
                                    className={config.color}
                                    variant="outline"
                                >
                                    {config.label}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-white">
                                    Appeal Type
                                </h3>
                                <p className="text-sm text-white/70 capitalize">
                                    {appeal.appeal_type}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-white">
                                    Your Appeal
                                </h3>
                                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-white/80">
                                        {appeal.reason}
                                    </p>
                                </div>
                            </div>

                            {appeal.status !== 'pending' &&
                                appeal.reviewed_at && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-semibold text-white">
                                                Review Decision
                                            </h3>
                                            <p className="text-sm text-white/70">
                                                Reviewed{' '}
                                                {formatDistanceToNow(
                                                    new Date(
                                                        appeal.reviewed_at,
                                                    ),
                                                    { addSuffix: true },
                                                )}
                                                {appeal.reviewed_by && (
                                                    <>
                                                        {' '}
                                                        by{' '}
                                                        {
                                                            appeal.reviewed_by
                                                                .name
                                                        }
                                                    </>
                                                )}
                                            </p>
                                        </div>

                                        {appeal.review_notes && (
                                            <Alert
                                                className={`${config.borderColor} ${config.bgColor}`}
                                            >
                                                <StatusIcon
                                                    className={`size-4 ${config.color}`}
                                                />
                                                <AlertTitle className="text-white">
                                                    Review Notes
                                                </AlertTitle>
                                                <AlertDescription className="whitespace-pre-wrap text-white/80">
                                                    {appeal.review_notes}
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        {appeal.status === 'approved' && (
                                            <Alert className="border-green-500/30 bg-green-950/10">
                                                <CheckCircle2 className="size-4 text-green-400" />
                                                <AlertTitle className="text-white">
                                                    Appeal Approved
                                                </AlertTitle>
                                                <AlertDescription className="text-white/80">
                                                    {!props.user_status
                                                        .is_suspended &&
                                                    !props.user_status
                                                        .is_banned ? (
                                                        <>
                                                            Your appeal has been
                                                            approved and your
                                                            account has been
                                                            restored. You can
                                                            now return to using
                                                            the site.
                                                        </>
                                                    ) : (
                                                        <>
                                                            Your appeal has been
                                                            approved. Your
                                                            account status
                                                            should be restored
                                                            shortly.
                                                        </>
                                                    )}
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        {appeal.status === 'rejected' && (
                                            <Alert className="border-red-500/30 bg-red-950/10">
                                                <XCircle className="size-4 text-red-400" />
                                                <AlertTitle className="text-white">
                                                    Appeal Rejected
                                                </AlertTitle>
                                                <AlertDescription className="text-white/80">
                                                    Your appeal has been
                                                    reviewed and the decision to{' '}
                                                    {appeal.appeal_type} your
                                                    account has been upheld.
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </div>
                                )}

                            {appeal.status === 'pending' && (
                                <Alert className="border-amber-500/30 bg-amber-950/10">
                                    <Clock className="size-4 text-amber-400" />
                                    <AlertTitle className="text-white">
                                        Under Review
                                    </AlertTitle>
                                    <AlertDescription className="text-white/80">
                                        Your appeal is currently being reviewed
                                        by our moderation team. We will notify
                                        you once a decision has been made.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {appeal.status === 'approved' &&
                                !props.user_status.is_suspended &&
                                !props.user_status.is_banned && (
                                    <div className="border-t border-white/10 pt-4">
                                        <Button
                                            onClick={() => router.visit('/')}
                                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 sm:w-auto"
                                        >
                                            <Home className="mr-2 size-4" />
                                            Return to Site
                                        </Button>
                                    </div>
                                )}
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
}
