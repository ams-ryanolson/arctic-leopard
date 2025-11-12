import { PreferenceToggle } from '@/components/signals/preference-toggle';
import { StatusBadge } from '@/components/signals/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type HeaderAction, type HeaderFilter, type HeaderQuickAction } from '@/types';
import { Head } from '@inertiajs/react';
import { CheckCircle2, ClipboardCheck, ShieldAlert, ShieldCheck } from 'lucide-react';

type WelcomeStep = {
    title: string;
    description: string;
    status: 'incomplete' | 'in-progress' | 'complete';
};

type WelcomeMessage = {
    headline: string;
    subheadline: string;
    steps: WelcomeStep[];
};

type ProfileContact = {
    name: string;
    role: string;
    email: string;
    phone: string;
};

type ProfileInfo = {
    legalName: string;
    taxClassification: string;
    country: string;
    kycStatus: 'verified' | 'requires-update';
    kycDue: string;
    contacts: ProfileContact[];
};

type NotificationPreference = {
    id: string;
    label: string;
    description: string;
    channels: string[];
    enabled: boolean;
};

type AutomationPreference = {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
};

interface SettingsPageProps {
    welcome: WelcomeMessage;
    profile: ProfileInfo;
    notifications: NotificationPreference[];
    automations: AutomationPreference[];
}

export default function SettingsPage({ welcome, profile, notifications, automations }: SettingsPageProps) {
    const headerActions: HeaderAction[] = [
        {
            id: 'upload-docs',
            label: 'Upload documents',
            icon: ShieldAlert,
            href: '/signals/settings',
            variant: 'primary',
        },
        {
            id: 'invite-teammate',
            label: 'Invite teammate',
            icon: ShieldCheck,
            href: '/signals/settings',
            variant: 'secondary',
        },
    ];

    const headerFilters: HeaderFilter[] = [
        {
            id: 'view',
            label: 'View',
            value: 'Profile',
            options: [
                { label: 'Profile', value: 'profile' },
                { label: 'Notifications', value: 'notifications' },
                { label: 'Automations', value: 'automations' },
            ],
        },
    ];

    const headerQuickActions: HeaderQuickAction[] = [
        {
            id: 'review-compliance',
            title: 'Review compliance guide',
            description: 'See how Signals uses your documents and how often to refresh them.',
            icon: ClipboardCheck,
            badge: 'Guide',
            href: '/signals/overview',
        },
        {
            id: 'open-log',
            title: 'View change log',
            description: 'Audit updates to settings, notifications, and automation toggles.',
            icon: CheckCircle2,
            badge: 'Audit',
            href: '/signals/settings',
        },
    ];

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Signals', href: '/signals' },
                { title: 'Settings', href: '/signals/settings' },
            ]}
            headerActions={headerActions}
            headerFilters={headerFilters}
            headerQuickActions={headerQuickActions}
        >
            <Head title="Signals · Settings" />

            <div className="space-y-8 text-white">
                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-2xl font-semibold">{welcome.headline}</CardTitle>
                            <CardDescription className="text-white/60">{welcome.subheadline}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {welcome.steps.map((step) => (
                                <div
                                    key={step.title}
                                    className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-sm transition hover:border-emerald-400/40 hover:bg-white/10"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="font-semibold text-white">{step.title}</p>
                                        <StatusBadge
                                            tone={
                                                step.status === 'complete'
                                                    ? 'emerald'
                                                    : step.status === 'in-progress'
                                                        ? 'amber'
                                                        : 'rose'
                                            }
                                        >
                                            {step.status}
                                        </StatusBadge>
                                    </div>
                                    <p className="mt-2 text-sm text-white/80">{step.description}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">Profile & KYC</CardTitle>
                            <CardDescription className="text-white/60">
                                Confirm entity details so payouts move without delay.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Legal entity</p>
                                <p className="mt-1 font-semibold text-white">{profile.legalName}</p>
                                <p className="text-xs text-white/60">
                                    {profile.taxClassification} · Registered in {profile.country}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.3em] text-white/50">KYC status</p>
                                        <p className="mt-1 font-semibold text-white">
                                            {profile.kycStatus === 'verified' ? 'Verified' : 'Requires update'}
                                        </p>
                                        <p className="text-xs text-white/60">
                                            Refresh before{' '}
                                            {new Date(profile.kycDue).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-full border-white/20 text-white/80 hover:border-white/40 hover:text-white"
                                    >
                                        Manage KYC
                                    </Button>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Contacts</p>
                                <div className="mt-3 space-y-3 text-xs text-white/70">
                                    {profile.contacts.map((contact) => (
                                        <div key={contact.email}>
                                            <p className="text-sm font-semibold text-white">
                                                {contact.name} · {contact.role}
                                            </p>
                                            <p>{contact.email}</p>
                                            <p>{contact.phone}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">Notification preferences</CardTitle>
                            <CardDescription className="text-white/60">
                                Decide where Signals alerts you about payout issues, chargebacks, and monetization surges.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {notifications.map((preference) => (
                                <div key={preference.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-white">{preference.label}</p>
                                            <p className="text-xs text-white/60">{preference.description}</p>
                                            <p className="mt-2 text-xs uppercase tracking-[0.3em] text-white/50">
                                                Channels: {preference.channels.join(', ')}
                                            </p>
                                        </div>
                                        <PreferenceToggle active={preference.enabled} />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">Automation playbooks</CardTitle>
                            <CardDescription className="text-white/60">
                                Toggle workflow recipes that keep supporters engaged and compliance tight.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {automations.map((automation) => (
                                <div key={automation.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-white">{automation.name}</p>
                                            <p className="text-xs text-white/60">{automation.description}</p>
                                        </div>
                                        <PreferenceToggle active={automation.enabled} />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}


