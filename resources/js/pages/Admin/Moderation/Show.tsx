import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import adminRoutes from '@/routes/admin';
import { type SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { format, formatDistanceToNow } from 'date-fns';
import {
    CheckCircle2,
    Clock,
    FileText,
    MessageSquare,
    XCircle,
} from 'lucide-react';
import { type FormEvent, useState } from 'react';

type ContentMedia = {
    id: number;
    url: string;
    type: string;
};

type ContentUser = {
    id: number;
    name: string;
    username?: string | null;
};

type ContentData = {
    type: string;
    id: number;
    body?: string | null;
    user?: ContentUser;
    created_at: string;
    moderation_status?: string | null;
    moderation_notes?: string | null;
    rejection_reason?: string | null;
    media?: ContentMedia[];
    post?: {
        id: number;
        body?: string | null;
    } | null;
};

type QueueEntry = {
    id: number;
    status: string;
    moderated_at?: string | null;
    moderation_notes?: string | null;
    rejection_reason?: string | null;
    moderated_by?: {
        id: number;
        name: string;
        username: string;
    } | null;
} | null;

type AdminModerationShowPageProps = {
    content_type: string;
    content_id: number;
    content: ContentData;
    queue_entry: QueueEntry;
};

export default function AdminModerationShow() {
    const { auth } = usePage<SharedData>().props;
    const props = usePage<AdminModerationShowPageProps>().props;

    const [action, setAction] = useState<
        'approve' | 'reject' | 'dismiss' | null
    >(null);
    const approveForm = useForm({ notes: '' });
    const rejectForm = useForm({ rejection_reason: '', notes: '' });
    const dismissForm = useForm({ notes: '' });

    const handleApprove = (e: FormEvent) => {
        e.preventDefault();
        approveForm.post(
            adminRoutes.moderation.approve({
                type: props.content_type,
                id: props.content_id,
            }).url,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setAction(null);
                },
            },
        );
    };

    const handleReject = (e: FormEvent) => {
        e.preventDefault();
        rejectForm.post(
            adminRoutes.moderation.reject({
                type: props.content_type,
                id: props.content_id,
            }).url,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setAction(null);
                },
            },
        );
    };

    const handleDismiss = (e: FormEvent) => {
        e.preventDefault();
        dismissForm.post(
            adminRoutes.moderation.dismiss({
                type: props.content_type,
                id: props.content_id,
            }).url,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setAction(null);
                },
            },
        );
    };

    const getContentIcon = () => {
        switch (props.content.type.toLowerCase()) {
            case 'post':
                return <FileText className="size-5 text-blue-400" />;
            case 'story':
                return <Clock className="size-5 text-purple-400" />;
            case 'comment':
                return <MessageSquare className="size-5 text-green-400" />;
            default:
                return <FileText className="size-5" />;
        }
    };

    const statusConfig = props.queue_entry
        ? {
              pending: {
                  icon: Clock,
                  color: 'text-amber-400',
                  label: 'Pending',
              },
              approved: {
                  icon: CheckCircle2,
                  color: 'text-green-400',
                  label: 'Approved',
              },
              rejected: {
                  icon: XCircle,
                  color: 'text-red-400',
                  label: 'Rejected',
              },
              dismissed: {
                  icon: XCircle,
                  color: 'text-gray-400',
                  label: 'Dismissed',
              },
          }[props.queue_entry.status as keyof typeof props.queue_entry] || {
              icon: Clock,
              color: 'text-amber-400',
              label: 'Pending',
          }
        : null;

    const isPending = props.queue_entry?.status === 'pending';
    const StatusIcon = statusConfig?.icon || Clock;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Admin', href: adminRoutes.dashboard().url },
                {
                    title: 'Content Moderation',
                    href: adminRoutes.moderation.index().url,
                },
                {
                    title: `${props.content_type} #${props.content_id}`,
                    href: '#',
                },
            ]}
        >
            <Head
                title={`Moderate ${props.content_type} #${props.content_id}`}
            />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">
                            Moderate {props.content_type} #{props.content_id}
                        </h1>
                        <p className="mt-1 text-sm text-white/60">
                            Review and take action on this content
                        </p>
                    </div>
                    <Button
                        asChild
                        variant="outline"
                        className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                    >
                        <a href={adminRoutes.moderation.index().url}>
                            Back to Queue
                        </a>
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <Card className="border-white/10 bg-white/5">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    {getContentIcon()}
                                    <div>
                                        <CardTitle className="text-white capitalize">
                                            {props.content.type}
                                        </CardTitle>
                                        <CardDescription className="text-white/60">
                                            Created{' '}
                                            {formatDistanceToNow(
                                                new Date(
                                                    props.content.created_at,
                                                ),
                                                { addSuffix: true },
                                            )}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {props.content.user && (
                                    <div className="flex items-center gap-3">
                                        <Avatar className="size-10">
                                            <AvatarImage src={undefined} />
                                            <AvatarFallback>
                                                {props.content.user.name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-white">
                                                {props.content.user.name}
                                            </p>
                                            {props.content.user.username && (
                                                <p className="text-sm text-white/60">
                                                    @
                                                    {
                                                        props.content.user
                                                            .username
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-white">
                                        {props.content.body ||
                                            'No content body'}
                                    </p>
                                </div>

                                {props.content.media &&
                                    props.content.media.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2">
                                            {props.content.media.map(
                                                (media) => (
                                                    <div
                                                        key={media.id}
                                                        className="overflow-hidden rounded-lg border border-white/10 bg-white/5"
                                                    >
                                                        {media.type.startsWith(
                                                            'image/',
                                                        ) ? (
                                                            <img
                                                                src={media.url}
                                                                alt="Content media"
                                                                className="h-auto w-full object-cover"
                                                            />
                                                        ) : (
                                                            <video
                                                                src={media.url}
                                                                controls
                                                                className="h-auto w-full"
                                                            />
                                                        )}
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    )}

                                {props.content.type === 'comment' &&
                                    props.content.post && (
                                        <Alert className="border-blue-500/30 bg-blue-950/10">
                                            <MessageSquare className="size-4 text-blue-400" />
                                            <AlertTitle className="text-white">
                                                Comment on Post
                                            </AlertTitle>
                                            <AlertDescription className="text-white/80">
                                                <p className="line-clamp-2">
                                                    {props.content.post.body}
                                                </p>
                                            </AlertDescription>
                                        </Alert>
                                    )}
                            </CardContent>
                        </Card>

                        {props.queue_entry && !isPending && (
                            <Card className="border-white/10 bg-white/5">
                                <CardHeader>
                                    <CardTitle className="text-white">
                                        Moderation History
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <StatusIcon
                                            className={`size-5 ${statusConfig?.color}`}
                                        />
                                        <Badge
                                            className={`${statusConfig?.color.replace('text-', 'border-')}/30 ${statusConfig?.color.replace('text-', 'bg-')}/10 ${statusConfig?.color}`}
                                        >
                                            {statusConfig?.label}
                                        </Badge>
                                    </div>
                                    {props.queue_entry.moderated_by &&
                                        props.queue_entry.moderated_at && (
                                            <p className="text-sm text-white/60">
                                                Moderated by{' '}
                                                {
                                                    props.queue_entry
                                                        .moderated_by.name
                                                }{' '}
                                                on{' '}
                                                {format(
                                                    new Date(
                                                        props.queue_entry.moderated_at,
                                                    ),
                                                    "MMMM d, yyyy 'at' h:mm a",
                                                )}
                                            </p>
                                        )}
                                    {props.queue_entry.moderation_notes && (
                                        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                                            <p className="mb-1 text-xs text-white/50">
                                                Notes:
                                            </p>
                                            <p className="text-sm whitespace-pre-wrap text-white/80">
                                                {
                                                    props.queue_entry
                                                        .moderation_notes
                                                }
                                            </p>
                                        </div>
                                    )}
                                    {props.queue_entry.rejection_reason && (
                                        <Alert className="border-red-500/30 bg-red-950/10">
                                            <XCircle className="size-4 text-red-400" />
                                            <AlertTitle className="text-white">
                                                Rejection Reason
                                            </AlertTitle>
                                            <AlertDescription className="text-white/80">
                                                {
                                                    props.queue_entry
                                                        .rejection_reason
                                                }
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-6">
                        {isPending && (
                            <Card className="border-white/10 bg-white/5">
                                <CardHeader>
                                    <CardTitle className="text-white">
                                        Moderation Actions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {action === null ? (
                                        <div className="space-y-3">
                                            <Button
                                                onClick={() =>
                                                    setAction('approve')
                                                }
                                                className="w-full bg-green-600 hover:bg-green-700"
                                            >
                                                <CheckCircle2 className="mr-2 size-4" />
                                                Approve Content
                                            </Button>
                                            <Button
                                                onClick={() =>
                                                    setAction('reject')
                                                }
                                                variant="destructive"
                                                className="w-full"
                                            >
                                                <XCircle className="mr-2 size-4" />
                                                Reject Content
                                            </Button>
                                            <Button
                                                onClick={() =>
                                                    setAction('dismiss')
                                                }
                                                variant="outline"
                                                className="w-full"
                                            >
                                                Dismiss from Queue
                                            </Button>
                                        </div>
                                    ) : action === 'approve' ? (
                                        <form
                                            onSubmit={handleApprove}
                                            className="space-y-4"
                                        >
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="approve-notes"
                                                    className="text-white"
                                                >
                                                    Notes (Optional)
                                                </Label>
                                                <Textarea
                                                    id="approve-notes"
                                                    value={
                                                        approveForm.data.notes
                                                    }
                                                    onChange={(e) =>
                                                        approveForm.setData(
                                                            'notes',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Optional notes about approval..."
                                                    rows={3}
                                                    className="border-white/10 bg-white/5 text-white"
                                                />
                                                <InputError
                                                    message={
                                                        approveForm.errors.notes
                                                    }
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setAction(null);
                                                        approveForm.reset();
                                                    }}
                                                    className="flex-1"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    disabled={
                                                        approveForm.processing
                                                    }
                                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                                >
                                                    {approveForm.processing
                                                        ? 'Processing...'
                                                        : 'Confirm Approval'}
                                                </Button>
                                            </div>
                                        </form>
                                    ) : action === 'reject' ? (
                                        <form
                                            onSubmit={handleReject}
                                            className="space-y-4"
                                        >
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="reject-reason"
                                                    className="text-white"
                                                >
                                                    Rejection Reason{' '}
                                                    <span className="text-red-400">
                                                        *
                                                    </span>
                                                </Label>
                                                <Textarea
                                                    id="reject-reason"
                                                    value={
                                                        rejectForm.data
                                                            .rejection_reason
                                                    }
                                                    onChange={(e) =>
                                                        rejectForm.setData(
                                                            'rejection_reason',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Reason for rejection (visible to user)..."
                                                    rows={3}
                                                    required
                                                    className="border-white/10 bg-white/5 text-white"
                                                />
                                                <InputError
                                                    message={
                                                        rejectForm.errors
                                                            .rejection_reason
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="reject-notes"
                                                    className="text-white"
                                                >
                                                    Internal Notes (Optional)
                                                </Label>
                                                <Textarea
                                                    id="reject-notes"
                                                    value={
                                                        rejectForm.data.notes
                                                    }
                                                    onChange={(e) =>
                                                        rejectForm.setData(
                                                            'notes',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Optional internal notes..."
                                                    rows={2}
                                                    className="border-white/10 bg-white/5 text-white"
                                                />
                                                <InputError
                                                    message={
                                                        rejectForm.errors.notes
                                                    }
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setAction(null);
                                                        rejectForm.reset();
                                                    }}
                                                    className="flex-1"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    disabled={
                                                        rejectForm.processing ||
                                                        !rejectForm.data.rejection_reason.trim()
                                                    }
                                                    variant="destructive"
                                                    className="flex-1"
                                                >
                                                    {rejectForm.processing
                                                        ? 'Processing...'
                                                        : 'Confirm Rejection'}
                                                </Button>
                                            </div>
                                        </form>
                                    ) : action === 'dismiss' ? (
                                        <form
                                            onSubmit={handleDismiss}
                                            className="space-y-4"
                                        >
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="dismiss-notes"
                                                    className="text-white"
                                                >
                                                    Notes (Optional)
                                                </Label>
                                                <Textarea
                                                    id="dismiss-notes"
                                                    value={
                                                        dismissForm.data.notes
                                                    }
                                                    onChange={(e) =>
                                                        dismissForm.setData(
                                                            'notes',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Optional notes about dismissal..."
                                                    rows={3}
                                                    className="border-white/10 bg-white/5 text-white"
                                                />
                                                <InputError
                                                    message={
                                                        dismissForm.errors.notes
                                                    }
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setAction(null);
                                                        dismissForm.reset();
                                                    }}
                                                    className="flex-1"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    disabled={
                                                        dismissForm.processing
                                                    }
                                                    variant="outline"
                                                    className="flex-1"
                                                >
                                                    {dismissForm.processing
                                                        ? 'Processing...'
                                                        : 'Confirm Dismissal'}
                                                </Button>
                                            </div>
                                        </form>
                                    ) : null}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
