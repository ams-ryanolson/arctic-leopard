import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import { send } from '@/routes/verification';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, Link, useForm, usePage } from '@inertiajs/react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';
import circlesRoutes from '@/routes/circles';
import type { Circle } from '@/types/circles';

const numberFormatter = new Intl.NumberFormat();

const CircleMembershipCard = ({ circle }: { circle: Circle }) => {
    const rawFacets = circle.facets ?? [];
    const facets = Array.isArray(rawFacets) ? rawFacets : rawFacets.data ?? [];

    const defaultFacet =
        (circle.membership?.preferences?.facet as string | undefined) ??
        facets.find((facet) => facet.isDefault)?.value ??
        facets[0]?.value ??
        null;

    const form = useForm({
        role: 'member' as const,
        facet: defaultFacet,
    });

    const hasFacetOptions = facets.length > 1;

    const handleUpdate = () => {
        form.post(circlesRoutes.join.url(circle.slug), {
            preserveScroll: true,
        });
    };

    const handleLeave = () => {
        form.delete(circlesRoutes.leave.url(circle.slug), {
            preserveScroll: true,
        });
    };

    return (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                        <h3 className="text-base font-semibold">{circle.name}</h3>
                        <Badge className="rounded-full border-white/20 bg-white/10 text-[0.65rem] uppercase tracking-[0.3em] text-white/70">
                            {numberFormatter.format(circle.membersCount)} members
                        </Badge>
                    </div>
                    {circle.tagline && (
                        <p className="text-xs text-white/65">{circle.tagline}</p>
                    )}
                </div>
                <Link
                    href={circlesRoutes.show.url(circle.slug)}
                    className="text-xs text-white/70 underline-offset-4 transition hover:text-white hover:underline"
                >
                    View circle
                </Link>
            </div>

            {hasFacetOptions && (
                <div className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-[0.35em] text-white/45">
                        Preferred segment
                    </span>
                    <Select
                        value={form.data.facet ?? undefined}
                        onValueChange={(value) => form.setData('facet', value)}
                        disabled={form.processing}
                    >
                        <SelectTrigger className="w-full border-white/15 bg-black/30 text-sm text-white">
                            <SelectValue placeholder="Pick a segment" />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-black/90 text-white">
                            {facets.map((facet) => (
                                <SelectItem
                                    key={`${circle.id}-${facet.value}`}
                                    value={facet.value}
                                    className="text-sm"
                                >
                                    {facet.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
                {hasFacetOptions && (
                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-full border-white/15 bg-black/30 text-white hover:border-emerald-500/40 hover:bg-emerald-500/20 hover:text-emerald-50"
                        onClick={handleUpdate}
                        disabled={form.processing}
                    >
                        Update segment
                    </Button>
                )}
                <Button
                    type="button"
                    variant="secondary"
                    className="rounded-full border-white/15 bg-white/10 text-white hover:border-rose-500/40 hover:bg-rose-500/20"
                    onClick={handleLeave}
                    disabled={form.processing}
                >
                    Leave circle
                </Button>
            </div>
        </div>
    );
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: edit().url,
    },
];

export default function Profile({
    mustVerifyEmail,
    status,
    circleMemberships = [],
}: {
    mustVerifyEmail: boolean;
    status?: string;
    circleMemberships: Circle[];
}) {
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Profile information"
                        description="Update your name and email address"
                    />

                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>

                                    <Input
                                        id="name"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.name}
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder="Full name"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.name}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email address</Label>

                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="Email address"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.email}
                                    />
                                </div>

                                {mustVerifyEmail &&
                                    auth.user.email_verified_at === null && (
                                        <div>
                                            <p className="-mt-4 text-sm text-muted-foreground">
                                                Your email address is
                                                unverified.{' '}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                                >
                                                    Click here to resend the
                                                    verification email.
                                                </Link>
                                            </p>

                                            {status ===
                                                'verification-link-sent' && (
                                                <div className="mt-2 text-sm font-medium text-green-600">
                                                    A new verification link has
                                                    been sent to your email
                                                    address.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1">
                                            <Label
                                                htmlFor="requires_follow_approval"
                                                className="text-sm font-semibold text-white"
                                            >
                                                Follow approvals
                                            </Label>
                                            <p className="text-sm text-white/60">
                                                Require people to request permission before they can follow you.
                                                Pending requests appear in your notifications for review.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="hidden"
                                                name="requires_follow_approval"
                                                value="0"
                                            />
                                            <input
                                                id="requires_follow_approval"
                                                name="requires_follow_approval"
                                                type="checkbox"
                                                value="1"
                                                defaultChecked={Boolean(
                                                    auth.user.requires_follow_approval,
                                                )}
                                                className="h-5 w-5 rounded border-white/30 bg-white/10 accent-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0"
                                            />
                                        </div>
                                    </div>
                                    <InputError
                                        className="mt-1"
                                        message={errors.requires_follow_approval}
                                    />
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button
                                        disabled={processing}
                                        data-test="update-profile-button"
                                    >
                                        Save
                                    </Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">
                                            Saved
                                        </p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                <div className="space-y-6">
                    <HeadingSmall
                        title="Circle memberships"
                        description="Manage the communities you joined through onboarding."
                    />

                    {circleMemberships.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
                            You haven’t joined any circles yet. Select interests during onboarding or browse the{' '}
                            <Link
                                href={circlesRoutes.index.url()}
                                className="text-white underline underline-offset-4 transition hover:text-white/80"
                            >
                                circle directory
                            </Link>{' '}
                            to get started.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {circleMemberships.map((circle) => (
                                <CircleMembershipCard key={circle.id} circle={circle} />
                            ))}
                        </div>
                    )}
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
