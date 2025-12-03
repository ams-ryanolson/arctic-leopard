import InputError from '@/components/input-error';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import accountRoutes from '@/routes/account';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { AlertCircle, FileText } from 'lucide-react';

type AppealCreatePageProps = {
    appeal_type: string;
    user_status: {
        is_suspended: boolean;
        is_banned: boolean;
        suspended_until?: string | null;
        suspended_reason?: string | null;
        banned_reason?: string | null;
    };
};

export default function AppealCreate() {
    const props = usePage<AppealCreatePageProps>().props;

    const form = useForm({
        reason: '',
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        form.post(accountRoutes.appeal.store().url, {
            preserveScroll: true,
            onSuccess: () => {
                // Redirect handled by backend
            },
        });
    };

    const isBanned = props.user_status.is_banned;
    const statusType = isBanned ? 'ban' : 'suspension';
    const statusReason = isBanned
        ? props.user_status.banned_reason
        : props.user_status.suspended_reason;

    return (
        <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
            <Head title="Submit Appeal" />

            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.22),_transparent_55%)]" />
            </div>

            <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-12 sm:px-8 lg:px-12">
                <header className="flex flex-col gap-3 text-xs tracking-[0.35em] text-white/55 uppercase">
                    <span>Account appeal</span>
                    <span>Submit appeal</span>
                </header>

                <main className="mt-12 flex flex-1 flex-col gap-8">
                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-violet-500/20 p-3">
                                    <FileText className="size-6 text-violet-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl text-white">
                                        Appeal Your{' '}
                                        {statusType.charAt(0).toUpperCase() +
                                            statusType.slice(1)}
                                    </CardTitle>
                                    <CardDescription className="text-white/60">
                                        Provide a detailed explanation for why
                                        you believe this action should be
                                        reversed
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {statusReason && (
                                <Alert className="border-amber-500/30 bg-amber-950/10">
                                    <AlertCircle className="size-4 text-amber-400" />
                                    <AlertDescription className="text-white/80">
                                        <strong>
                                            Reason for {statusType}:
                                        </strong>{' '}
                                        {statusReason}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="reason"
                                        className="text-white"
                                    >
                                        Appeal reason{' '}
                                        <span className="text-red-400">*</span>
                                    </Label>
                                    <Textarea
                                        id="reason"
                                        value={form.data.reason}
                                        onChange={(e) =>
                                            form.setData(
                                                'reason',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Please provide a detailed explanation of why you believe this action should be reversed. Include any relevant context, evidence, or information that supports your appeal."
                                        rows={8}
                                        className={
                                            form.errors.reason
                                                ? 'border-red-500'
                                                : ''
                                        }
                                        aria-invalid={!!form.errors.reason}
                                    />
                                    <InputError message={form.errors.reason} />
                                    <p className="text-xs text-white/50">
                                        Minimum 10 characters. Please be
                                        thorough and respectful in your
                                        explanation.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-end">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() =>
                                            router.visit(
                                                statusType === 'ban'
                                                    ? accountRoutes.banned().url
                                                    : accountRoutes.suspended()
                                                          .url,
                                            )
                                        }
                                        disabled={form.processing}
                                        className="border-white/25 bg-white/10 text-white hover:bg-white/15"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={
                                            form.processing ||
                                            !form.data.reason.trim()
                                        }
                                        className="bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 text-white"
                                    >
                                        {form.processing
                                            ? 'Submitting...'
                                            : 'Submit Appeal'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
}
