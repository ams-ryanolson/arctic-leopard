import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import adminRoutes from '@/routes/admin';
import { type SharedData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { formatDistanceToNow, format } from 'date-fns';
import { AlertCircle, Ban, CheckCircle2, Clock, ShieldOff, XCircle } from 'lucide-react';
import { type FormEvent, useState } from 'react';

type AppealUser = {
    id: number;
    name: string;
    username?: string | null;
    email: string;
    is_suspended: boolean;
    is_banned: boolean;
    suspended_until?: string | null;
    suspended_reason?: string | null;
    banned_reason?: string | null;
};

type AppealReviewedBy = {
    id: number;
    name: string;
    username: string;
} | null;

type AdminAppealShowPageProps = {
    appeal: {
        id: number;
        user: AppealUser;
        appeal_type: string;
        reason: string;
        status: string;
        reviewed_at?: string | null;
        review_notes?: string | null;
        reviewed_by?: AppealReviewedBy;
        created_at: string;
    };
};

export default function AdminAppealShow() {
    const { auth } = usePage<SharedData>().props;
    const props = usePage<AdminAppealShowPageProps>().props;
    const { appeal } = props;

    const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'dismiss' | null>(null);
    const form = useForm({
        status: '',
        review_notes: '',
    });

    const handleReview = (action: 'approve' | 'reject' | 'dismiss') => {
        setReviewAction(action);
        form.setData('status', action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'dismissed');
    };

    const handleSubmitReview = (e: FormEvent) => {
        e.preventDefault();

        form.post(adminRoutes.appeals.review(appeal.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                setReviewAction(null);
            },
        });
    };

    const isPending = appeal.status === 'pending';
    const statusConfig = {
        pending: { icon: Clock, color: 'text-amber-400', label: 'Pending' },
        approved: { icon: CheckCircle2, color: 'text-green-400', label: 'Approved' },
        rejected: { icon: XCircle, color: 'text-red-400', label: 'Rejected' },
        dismissed: { icon: XCircle, color: 'text-gray-400', label: 'Dismissed' },
    }[appeal.status] || statusConfig.pending;

    return (
        <AppLayout>
            <Head title={`Appeal #${appeal.id}`} />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Appeal #{appeal.id}</h1>
                        <p className="mt-1 text-sm text-white/60">
                            Review and respond to user appeal
                        </p>
                    </div>
                    <Button
                        asChild
                        variant="outline"
                        className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                    >
                        <a href={adminRoutes.appeals.index().url}>Back to Appeals</a>
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-white/10 bg-white/5">
                            <CardHeader>
                                <CardTitle className="text-white">Appeal Details</CardTitle>
                                <CardDescription className="text-white/60">
                                    Submitted {formatDistanceToNow(new Date(appeal.created_at), { addSuffix: true })}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-2">
                                    {appeal.appeal_type === 'ban' ? (
                                        <Ban className="size-5 text-red-400" />
                                    ) : (
                                        <ShieldOff className="size-5 text-amber-400" />
                                    )}
                                    <Badge variant="outline" className="capitalize">
                                        {appeal.appeal_type} Appeal
                                    </Badge>
                                    <Badge className={`${statusConfig.color.replace('text-', 'border-')}/30 ${statusConfig.color.replace('text-', 'bg-')}/10 ${statusConfig.color}`}>
                                        {statusConfig.label}
                                    </Badge>
                                </div>

                                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                    <Label className="text-white/70">Appeal Reason</Label>
                                    <p className="mt-2 text-sm leading-relaxed text-white whitespace-pre-wrap">
                                        {appeal.reason}
                                    </p>
                                </div>

                                {!isPending && appeal.reviewed_at && (
                                    <Alert className="border-white/10 bg-white/5">
                                        <statusConfig.icon className="size-4" />
                                        <AlertTitle className="text-white">Review Decision</AlertTitle>
                                        <AlertDescription className="text-white/80">
                                            {appeal.reviewed_by && (
                                                <p className="mb-2">
                                                    Reviewed by {appeal.reviewed_by.name} on{' '}
                                                    {format(new Date(appeal.reviewed_at), 'MMMM d, yyyy \'at\' h:mm a')}
                                                </p>
                                            )}
                                            {appeal.review_notes && (
                                                <p className="whitespace-pre-wrap">{appeal.review_notes}</p>
                                            )}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-white/10 bg-white/5">
                            <CardHeader>
                                <CardTitle className="text-white">User Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="size-12">
                                        <AvatarImage src={appeal.user.avatar_url ?? undefined} />
                                        <AvatarFallback>
                                            {appeal.user.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-white">{appeal.user.name}</p>
                                        {appeal.user.username && (
                                            <p className="text-sm text-white/60">@{appeal.user.username}</p>
                                        )}
                                        <p className="text-xs text-white/50">{appeal.user.email}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-white/70">Current Status</Label>
                                    {appeal.user.is_banned && (
                                        <Alert className="border-red-500/30 bg-red-950/10">
                                            <Ban className="size-4 text-red-400" />
                                            <AlertTitle className="text-white">Banned</AlertTitle>
                                            {appeal.user.banned_reason && (
                                                <AlertDescription className="text-white/80">
                                                    {appeal.user.banned_reason}
                                                </AlertDescription>
                                            )}
                                        </Alert>
                                    )}
                                    {appeal.user.is_suspended && (
                                        <Alert className="border-amber-500/30 bg-amber-950/10">
                                            <ShieldOff className="size-4 text-amber-400" />
                                            <AlertTitle className="text-white">Suspended</AlertTitle>
                                            {appeal.user.suspended_reason && (
                                                <AlertDescription className="text-white/80">
                                                    {appeal.user.suspended_reason}
                                                </AlertDescription>
                                            )}
                                            {appeal.user.suspended_until && (
                                                <AlertDescription className="text-white/80">
                                                    Until {format(new Date(appeal.user.suspended_until), 'MMMM d, yyyy')}
                                                </AlertDescription>
                                            )}
                                        </Alert>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        {isPending && (
                            <Card className="border-white/10 bg-white/5">
                                <CardHeader>
                                    <CardTitle className="text-white">Review Appeal</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {reviewAction === null ? (
                                        <div className="space-y-3">
                                            <Button
                                                onClick={() => handleReview('approve')}
                                                className="w-full bg-green-600 hover:bg-green-700"
                                            >
                                                <CheckCircle2 className="size-4" />
                                                Approve Appeal
                                            </Button>
                                            <Button
                                                onClick={() => handleReview('reject')}
                                                variant="destructive"
                                                className="w-full"
                                            >
                                                <XCircle className="size-4" />
                                                Reject Appeal
                                            </Button>
                                            <Button
                                                onClick={() => handleReview('dismiss')}
                                                variant="outline"
                                                className="w-full"
                                            >
                                                Dismiss
                                            </Button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmitReview} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="review_notes" className="text-white">
                                                    Review Notes {reviewAction === 'reject' && <span className="text-red-400">*</span>}
                                                </Label>
                                                <Textarea
                                                    id="review_notes"
                                                    value={form.data.review_notes}
                                                    onChange={(e) => form.setData('review_notes', e.target.value)}
                                                    placeholder="Optional notes about your decision..."
                                                    rows={4}
                                                    className={form.errors.review_notes ? 'border-red-500' : ''}
                                                />
                                                <InputError message={form.errors.review_notes} />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setReviewAction(null);
                                                        form.reset();
                                                    }}
                                                    className="flex-1"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    disabled={form.processing}
                                                    variant={reviewAction === 'approve' ? 'default' : 'destructive'}
                                                    className="flex-1"
                                                >
                                                    {form.processing ? 'Processing...' : 'Confirm'}
                                                </Button>
                                            </div>
                                        </form>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

