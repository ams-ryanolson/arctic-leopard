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
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { Head } from '@inertiajs/react';

type UpcomingEvent = {
    title: string;
    when: string;
    venue: string;
    location: string;
    spots: string;
    format: string;
    mode: string;
    image: string;
    host: {
        name: string;
        avatar: string;
    };
};

type PastEvent = {
    title: string;
    summary: string;
    image: string;
};

interface EventsPageProps {
    upcoming: UpcomingEvent[];
    past: PastEvent[];
}

export default function EventsIndex({ upcoming, past }: EventsPageProps) {
    const [headline, ...rest] = upcoming;
    const timelineEvents = [headline, ...rest].filter(
        Boolean,
    ) as UpcomingEvent[];
    const getInitials = useInitials();

    const activeFilters = {
        location: 'Global',
        format: 'Ritual',
        mode: 'Hybrid',
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Events', href: '/events' },
            ]}
        >
            <Head title="Events · Real Kink Men" />

            <div className="space-y-8">
                <section className="space-y-6 text-white">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight">
                                Rituals & experiences on deck
                            </h1>
                            <p className="text-sm text-white/65">
                                Coordinate hybrid productions, private dungeon nights, and travel pop-ups without losing the vibe.
                            </p>
                        </div>
                        <Badge className="rounded-full border-white/15 bg-white/10 text-xs text-white/70">
                            {upcoming.length} scheduled
                        </Badge>
                    </div>

                    {headline && (
                        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-amber-500/25 via-rose-500/10 to-violet-600/25 p-6 shadow-[0_45px_95px_-55px_rgba(249,115,22,0.6)] sm:p-8">
                            <div
                                className="absolute inset-0 -z-10 bg-cover bg-center opacity-60"
                                style={{
                                    backgroundImage: `url(${headline.image})`,
                                }}
                            />
                            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.35),_transparent_65%)]" />
                            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                                <div className="space-y-3">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.4em] text-white/70">
                                        Spotlight
                                    </div>
                                    <h2 className="text-2xl font-semibold sm:text-3xl">
                                        {headline.title}
                                    </h2>
                                    <div className="space-y-1 text-sm text-white/75">
                                        <p>{headline.when}</p>
                                        <p>{headline.venue}</p>
                                        <p>{headline.location}</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge className="rounded-full border-white/15 bg-white/10 text-xs text-white/70">
                                            {headline.format}
                                        </Badge>
                                        <Badge className="rounded-full border-white/15 bg-white/10 text-xs text-white/70">
                                            {headline.mode}
                                        </Badge>
                                    </div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200">
                                        {headline.spots}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="size-10 border border-white/20">
                                            <AvatarImage
                                                src={headline.host.avatar}
                                                alt={headline.host.name}
                                            />
                                            <AvatarFallback className="bg-white/20 text-white">
                                                {getInitials(headline.host.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="text-sm text-white/75">
                                            <p className="font-semibold text-white">
                                                Hosted by {headline.host.name}
                                            </p>
                                            <p>Scene concierge on standby</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="sm:w-80">
                                    <div className="rounded-2xl border border-white/15 bg-black/30 p-5">
                                        <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                                            Production checklist
                                        </p>
                                        <ul className="mt-3 space-y-2 text-sm text-white/75">
                                            <li>• Confirm rig team call at 6:30 PM</li>
                                            <li>• DM Edge Guardians with RSVP code</li>
                                            <li>• Drop aftercare script to backstage chat</li>
                                        </ul>
                                        <Button className="mt-4 w-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 text-sm font-semibold text-white shadow-[0_25px_65px_-35px_rgba(249,115,22,0.55)] hover:scale-[1.02]">
                                            Build run of show
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-white">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex flex-wrap gap-6">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                                        Location
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {['Global', 'Los Angeles, CA', 'Berlin, Germany', 'Digital'].map(
                                            (location) => {
                                                const active =
                                                    location === activeFilters.location;
                                                return (
                                                    <Button
                                                        key={location}
                                                        variant="outline"
                                                        className={`rounded-full border-white/20 bg-white/10 text-xs font-medium text-white/70 hover:border-white/40 hover:bg-white/20 ${
                                                            active
                                                                ? 'border-white/60 bg-white/25 text-white'
                                                                : ''
                                                        }`}
                                                    >
                                                        {location}
                                                    </Button>
                                                );
                                            },
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                                        Format
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {['Ritual', 'Workshop', 'Social', 'Mentorship'].map(
                                            (format) => {
                                                const active =
                                                    format === activeFilters.format;
                                                return (
                                                    <Button
                                                        key={format}
                                                        variant="outline"
                                                        className={`rounded-full border-white/20 bg-white/10 text-xs font-medium text-white/70 hover:border-white/40 hover:bg-white/20 ${
                                                            active
                                                                ? 'border-white/60 bg-white/25 text-white'
                                                                : ''
                                                        }`}
                                                    >
                                                        {format}
                                                    </Button>
                                                );
                                            },
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                                        Mode
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {['Hybrid', 'IRL', 'Digital'].map(
                                            (mode) => {
                                                const active =
                                                    mode === activeFilters.mode;
                                                return (
                                                    <Button
                                                        key={mode}
                                                        variant="outline"
                                                        className={`rounded-full border-white/20 bg-white/10 text-xs font-medium text-white/70 hover:border-white/40 hover:bg-white/20 ${
                                                            active
                                                                ? 'border-white/60 bg-white/25 text-white'
                                                                : ''
                                                        }`}
                                                    >
                                                        {mode}
                                                    </Button>
                                                );
                                            },
                                        )}
                                    </div>
                                </div>
                            </div>
                            <Button className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-6 text-sm font-semibold text-white shadow-[0_25px_65px_-35px_rgba(249,115,22,0.55)] hover:scale-[1.02]">
                                Create event
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <Card className="border-white/10 bg-white/5 text-white">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">
                                    Upcoming timeline
                                </CardTitle>
                                <CardDescription className="text-white/60">
                                    Scene-ready schedule built from your circles and co-hosts.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                {timelineEvents.map((event) => (
                                    <div
                                        key={event.title}
                                        className="grid gap-2 rounded-2xl border border-white/10 bg-black/35 px-5 py-4 sm:grid-cols-[180px_minmax(0,1fr)]"
                                    >
                                        <div className="flex flex-col gap-1 text-xs uppercase tracking-[0.3em] text-white/50">
                                            <span>{event.when}</span>
                                            <span>{event.spots}</span>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-white">
                                                {event.title}
                                            </p>
                                            <p className="text-xs text-white/70">
                                                {event.venue}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                <Badge className="rounded-full border-white/15 bg-white/10 text-[0.65rem] text-white/70">
                                                    {event.mode}
                                                </Badge>
                                                <Badge className="rounded-full border-white/15 bg-white/10 text-[0.65rem] text-white/70">
                                                    {event.format}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="border-white/10 bg-white/5 text-white">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">
                                    Filters
                                </CardTitle>
                                <CardDescription className="text-white/60">
                                    Slice events by format, monetization, or travel radius.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-wrap gap-2">
                                {['Hybrid', 'IRL', 'Circle-only', 'Public RSVP', 'Recorded', 'Consent Lab'].map(
                                    (label) => (
                                        <Badge
                                            key={label}
                                            variant="secondary"
                                            className="rounded-full border-white/15 bg-white/10 text-xs text-white/70"
                                        >
                                            {label}
                                        </Badge>
                                    ),
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-lg font-semibold text-white">
                        Past highlights
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        {past.map((event) => (
                            <Card
                                key={event.title}
                                className="border-white/10 bg-white/5 text-white"
                            >
                                <div
                                    className="h-40 w-full bg-cover bg-center"
                                    style={{ backgroundImage: `url(${event.image})` }}
                                />
                                <CardHeader>
                                    <CardTitle className="text-base font-semibold">
                                        {event.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-white/70">{event.summary}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}

