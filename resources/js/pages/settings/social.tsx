import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Instagram, Music, Share2, Twitter } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Social settings',
        href: '/settings/social',
    },
];

type SocialPlatform = {
    id: string;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    color: string;
    gradient: string;
    shadow: string;
    isAvailable: boolean;
};

const platforms: SocialPlatform[] = [
    {
        id: 'twitter',
        name: 'X (Twitter)',
        icon: Twitter,
        description:
            'Connect your X account to cross-post updates and automatically share milestones like tips, new subscribers, and exclusive content.',
        color: 'rgba(0,0,0,0.45)',
        gradient: 'from-black/15 via-black/10 to-transparent',
        shadow: 'rgba(0,0,0,0.45)',
        isAvailable: false,
    },
    {
        id: 'instagram',
        name: 'Instagram',
        icon: Instagram,
        description:
            'Connect your Instagram account to cross-post your content and share your latest updates with your Instagram followers.',
        color: 'rgba(225,48,108,0.45)',
        gradient: 'from-pink-500/15 via-purple-500/10 to-transparent',
        shadow: 'rgba(225,48,108,0.45)',
        isAvailable: false,
    },
    {
        id: 'tiktok',
        name: 'TikTok',
        icon: Music,
        description:
            'Connect your TikTok account to share your content across platforms and reach a wider audience with cross-posting.',
        color: 'rgba(0,242,234,0.45)',
        gradient: 'from-cyan-500/15 via-rose-500/10 to-transparent',
        shadow: 'rgba(0,242,234,0.45)',
        isAvailable: false,
    },
];

export default function Social() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Social settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    {/* Social Overview Section */}
                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-black/20 shadow-[0_32px_85px_-40px_rgba(236,72,153,0.45)]">
                        <div className="pointer-events-none absolute inset-0">
                            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-rose-500/15 via-rose-400/5 to-transparent blur-2xl" />
                        </div>
                        <div className="relative p-5 sm:p-6">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center rounded-xl border border-rose-400/40 bg-gradient-to-br from-rose-400/30 to-rose-500/20 p-3 shadow-[0_12px_30px_-18px_rgba(236,72,153,0.65)]">
                                    <Share2 className="h-5 w-5 text-rose-300" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-white">
                                        Social connections
                                    </h2>
                                    <p className="text-sm text-white/65">
                                        Connect your social networks to
                                        cross-post content and automatically
                                        share milestones like tips, new
                                        subscribers, and exclusive content.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Platform Cards */}
                    <div className="space-y-4">
                        {platforms.map((platform) => {
                            const Icon = platform.icon;
                            const isComingSoon = !platform.isAvailable;

                            // Get platform-specific styles
                            let iconGradientClass = '';
                            let iconBorderClass = '';
                            let blurGradientClass = '';
                            let shadowClass = '';

                            if (platform.id === 'twitter') {
                                iconGradientClass =
                                    'from-slate-700/30 to-slate-900/20';
                                iconBorderClass = 'border-slate-600/40';
                                blurGradientClass =
                                    'from-slate-700/15 via-slate-900/10 to-transparent';
                                shadowClass =
                                    'shadow-[0_32px_85px_-40px_rgba(51,65,85,0.45)]';
                            } else if (platform.id === 'instagram') {
                                iconGradientClass =
                                    'from-pink-500/30 via-purple-500/20 to-rose-500/20';
                                iconBorderClass = 'border-pink-500/40';
                                blurGradientClass =
                                    'from-pink-500/15 via-purple-500/10 to-transparent';
                                shadowClass =
                                    'shadow-[0_32px_85px_-40px_rgba(225,48,108,0.45)]';
                            } else if (platform.id === 'tiktok') {
                                iconGradientClass =
                                    'from-cyan-500/30 via-rose-500/20 to-fuchsia-500/20';
                                iconBorderClass = 'border-cyan-500/40';
                                blurGradientClass =
                                    'from-cyan-500/15 via-rose-500/10 to-transparent';
                                shadowClass =
                                    'shadow-[0_32px_85px_-40px_rgba(0,242,234,0.45)]';
                            }

                            return (
                                <div
                                    key={platform.id}
                                    className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-black/20 ${shadowClass} transition-all duration-300 hover:border-white/20 hover:shadow-[0_40px_100px_-40px_rgba(236,72,153,0.55)]`}
                                >
                                    <div className="pointer-events-none absolute inset-0">
                                        <div
                                            className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${blurGradientClass} blur-2xl`}
                                        />
                                    </div>
                                    <div className="relative space-y-4 p-5 sm:p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex flex-1 items-start gap-4">
                                                <div
                                                    className={`flex items-center justify-center rounded-xl bg-gradient-to-br ${iconGradientClass} border ${iconBorderClass} p-3 shadow-[0_12px_30px_-18px_rgba(236,72,153,0.65)]`}
                                                >
                                                    <Icon className="h-6 w-6 text-white" />
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-xl font-semibold text-white">
                                                            {platform.name}
                                                        </h3>
                                                        {isComingSoon && (
                                                            <Badge className="rounded-full border-white/20 bg-white/10 text-[0.65rem] tracking-[0.3em] text-white/70 uppercase">
                                                                Coming Soon
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm leading-relaxed text-white/70">
                                                        {platform.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {isComingSoon && (
                                            <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                                                <p className="text-sm text-white/60">
                                                    This integration will be
                                                    available in a future
                                                    update. You'll be able to
                                                    connect your account, enable
                                                    cross-posting, and configure
                                                    automatic posting for
                                                    milestones like tips, new
                                                    subscribers, and exclusive
                                                    content.
                                                </p>
                                            </div>
                                        )}

                                        {!isComingSoon && (
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    disabled={isComingSoon}
                                                    className="rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_-4px_rgba(16,185,129,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_6px_16px_-4px_rgba(16,185,129,0.5)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                                                >
                                                    Connect {platform.name}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
