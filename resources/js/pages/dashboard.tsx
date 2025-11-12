import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Clock3, Flame, Sparkles, Users } from 'lucide-react';
import { type ComponentType } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

type ScenePulseStat = {
    title: string;
    value: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
};

type FeedItem = {
    id: number;
    title: string;
    content: string;
    timestamp: string;
    media: string[];
};

type TrendingTag = {
    tag: string;
    heat: string;
    descriptor: string;
};

type CircleSpotlight = {
    name: string;
    members: string;
    status: string;
};

const ScenePulseCard = ({ items }: { items: ScenePulseStat[] }) => (
    <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
            <CardTitle className="text-base font-semibold">Scene pulse</CardTitle>
            <CardDescription className="text-white/60">
                Real-time signal for your network tonight.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
            {items.map(({ title, value, description, icon: Icon }) => (
                <div
                    key={title}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3"
                >
                    <div className="mt-1 rounded-full bg-gradient-to-br from-amber-400/30 via-rose-500/25 to-violet-600/25 p-2">
                        <Icon className="size-4 text-amber-300" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                            {title}
                        </p>
                        <p className="text-base font-semibold text-white">{value}</p>
                        <p className="text-xs text-white/60">{description}</p>
                    </div>
                </div>
            ))}
        </CardContent>
    </Card>
);

export default function Dashboard() {
    const { auth } = usePage<SharedData>().props;
    const user = auth?.user;

    const scenePulse: ScenePulseStat[] = [
        {
            title: 'Heat Index',
            value: '92%',
            description: 'Surging after sunset across your circles.',
            icon: Flame,
        },
        {
            title: 'Mentions',
            value: '+36',
            description: 'New name drops in the last 24 hours.',
            icon: Sparkles,
        },
        {
            title: 'Circle Invites',
            value: '3 pending',
            description: 'Waiting on your nod before the weekend.',
            icon: Users,
        },
    ];

    const feedItems: FeedItem[] = [
        {
            id: 1,
            title: 'New Drop: Ritual of Balance',
            timestamp: '2h ago',
            content:
                'Hybrid livestream featuring suspension, breath control, and a live consent check-in. Tip trains unlocked a bonus aftercare AMA.',
            media: [
                'https://images.unsplash.com/photo-1512619359442-39504be0177d?auto=format&fit=crop&w=900&q=80',
            ],
        },
        {
            id: 2,
            title: 'Circle Update: Silver Collar',
            timestamp: 'Yesterday',
            content:
                'Shared this week’s rigging diagrams and added a travel-mode schedule. Edge Guardians get early access to next week’s analytic reports.',
            media: [],
        },
        {
            id: 3,
            title: 'Pinned Tip Train Goal Met',
            timestamp: '3 days ago',
            content:
                'We smashed the weekend tip rally in 14 minutes. Unlocking the behind-the-scenes lighting breakdown for all subscribers on Friday.',
            media: [],
        },
    ];

    const trendingTags: TrendingTag[] = [
        {
            tag: '#ropephoria',
            heat: '🔥 3.2K sparks',
            descriptor: 'Suspensions & wax play mashups trending.',
        },
        {
            tag: '#pupplanes',
            heat: '🔥 2.8K sparks',
            descriptor: 'Flight harnesses + mosh pit energy.',
        },
        {
            tag: '#aftercareaudio',
            heat: '🔥 2.1K sparks',
            descriptor: 'Voice note rituals gaining traction.',
        },
    ];

    const circleSpotlights: CircleSpotlight[] = [
        {
            name: 'Switchcraft Syndicate',
            members: '1.9K members · NYC',
            status: 'Scene review live for 32 mins',
        },
        {
            name: 'Midnight Pups Collective',
            members: '860 members · Berlin',
            status: 'Traveler mode unlocked this week',
        },
        {
            name: 'Edge Guardians',
            members: '2.4K members · Digital',
            status: 'Consent drills scheduled tomorrow',
        },
    ];

    const toolkitPrompts = [
        'Drop a 60-second teaser to warm the feed before prime time.',
        'Schedule a tip train goal so circles can rally mid-scene.',
        `Bundle a download + aftercare note pack for ${user?.name?.split(' ')[0] ?? 'your'} biggest fans.`,
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="space-y-8">
                <div className="flex flex-col gap-6 xl:grid xl:grid-cols-3">
                    <section className="min-w- flex-1 space-y-6 col-span-2">
                        <Card className="border-white/10 bg-white/5 text-white shadow-[0_24px_65px_-35px_rgba(249,115,22,0.45)]">
                            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <CardTitle className="text-lg font-semibold">Share a scene</CardTitle>
                                    <CardDescription className="text-white/65">
                                        Pulse an update, preview a drop, or lock in aftercare plans.
                                    </CardDescription>
                                </div>
                                <Badge className="rounded-full border-white/20 bg-white/10 px-3 py-1 text-white/70">
                                    Draft autosaved 1m ago
                                </Badge>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <textarea
                                    placeholder="Relive last night's ritual, tease an upcoming drop, or ask for a circle collab..."
                                    className="min-h-[140px] w-full rounded-2xl border border-white/15 bg-black/30 px-5 py-4 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                />
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
                                        <Badge className="rounded-full border-white/15 bg-white/10 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.3em] text-white/70">
                                            Attach media
                                        </Badge>
                                        <Badge className="rounded-full border-white/15 bg-white/10 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.3em] text-white/70">
                                            Circle only
                                        </Badge>
                                        <Badge className="rounded-full border-white/15 bg-white/10 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.3em] text-white/70">
                                            Tip train
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="rounded-full border border-white/10 bg-white/5 px-4 text-white/80 hover:border-white/30 hover:bg-white/10 hover:text-white"
                                        >
                                            <Clock3 className="size-4" />
                                            Schedule
                                        </Button>
                                        <Button
                                            size="lg"
                                            className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-6 text-sm font-semibold text-white shadow-[0_18px_40px_-12px_rgba(249,115,22,0.45)] transition hover:scale-[1.02]"
                                        >
                                            Send it now
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-white/10 bg-white/5 text-white">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">Scene feed</CardTitle>
                                <CardDescription className="text-white/60">
                                    Latest drops, circle updates, and monetized moments.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {feedItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="rounded-3xl border border-white/10 bg-black/35 p-5"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                                            <span className="text-xs uppercase tracking-[0.3em] text-white/50">
                                                {item.timestamp}
                                            </span>
                                        </div>
                                        <p className="mt-3 text-sm text-white/70">{item.content}</p>
                                        {item.media.length > 0 && (
                                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                                {item.media.map((mediaUrl) => (
                                                    <div
                                                        key={mediaUrl}
                                                        className="relative overflow-hidden rounded-2xl border border-white/10"
                                                    >
                                                        <img
                                                            src={mediaUrl}
                                                            alt={item.title}
                                                            className="h-48 w-full object-cover sm:h-56"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="mt-4 flex flex-wrap items-center gap-2">
                                            <Button size="sm" className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-4 text-xs font-semibold">
                                                Unlock Scene
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="rounded-full px-4 text-xs text-white/75 hover:bg-white/10 hover:text-white"
                                            >
                                                Tip Train
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="border-white/10 bg-white/5 text-white">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold">Creator toolkit</CardTitle>
                                <CardDescription className="text-white/60">
                                    Prompts to keep your earnings aligned with the feed vibe.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {toolkitPrompts.map((prompt) => (
                                    <div
                                        key={prompt}
                                        className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/75"
                                    >
                                        {prompt}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </section>

                    <aside className="hidden w-full max-w-[320px] flex-col gap-4 lg:flex">
                        <Card className="border-white/10 bg-white/5 text-white shadow-[0_24px_65px_-35px_rgba(249,115,22,0.45)]">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold">Trending tags</CardTitle>
                                <CardDescription className="text-white/60">
                                    What the scene is amplifying right now.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {trendingTags.map(({ tag, heat, descriptor }) => (
                                    <div
                                        key={tag}
                                        className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-semibold text-white">{tag}</p>
                                            <Badge className="rounded-full border-white/15 bg-white/10 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.3em] text-white/70">
                                                {heat}
                                            </Badge>
                                        </div>
                                        <p className="mt-1 text-xs text-white/60">{descriptor}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <ScenePulseCard items={scenePulse} />

                        <Card className="border-white/10 bg-white/5 text-white">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold">Circle spotlights</CardTitle>
                                <CardDescription className="text-white/60">
                                    Rooms where your energy would pop.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {circleSpotlights.map(({ name, members, status }) => (
                                    <div
                                        key={name}
                                        className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3"
                                    >
                                        <p className="text-sm font-semibold text-white">{name}</p>
                                        <p className="text-xs text-white/55">{members}</p>
                                        <p className="mt-1 text-xs text-amber-300">{status}</p>
                                    </div>
                                ))}
                            </CardContent>
                            <div className="px-6 pb-6">
                                <Button
                                    variant="ghost"
                                    className="w-full rounded-full border border-white/10 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10 hover:text-white"
                                >
                                    View circle invites
                                </Button>
                            </div>
                        </Card>

                        <Card className="border-white/10 bg-white/5 text-white">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold">Need-to-know</CardTitle>
                                <CardDescription className="text-white/60">
                                    Consent and safety updates from moderators.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3 text-sm text-white/75">
                                    <li>
                                        <span className="font-semibold">-</span>{' '}
                                        Consensual kink week is live - tag scenes with <span className="text-white">#greenlight</span> to be featured on the welcome stream.
                                    </li>
                                    <li>
                                        <span className="font-semibold">-</span>{' '}
                                        New alias controls let you mask your handle during traveler mode. Toggle it in settings before IRL dungeons.
                                    </li>
                                    <li>
                                        <span className="font-semibold">-</span>{' '}
                                        Verification queue is averaging 4 hours. Upload your documents early if you plan to go live tonight.
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </AppLayout>
    );
}

