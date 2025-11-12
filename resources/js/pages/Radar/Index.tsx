import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { radar } from '@/routes';
import profileRoutes from '@/routes/profile';
import usersRoutes from '@/routes/users';
import { getCsrfToken } from '@/lib/csrf';
import { type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Activity,
    MapPin,
    Plane,
    Radar as RadarIcon,
    Sparkles,
    Waves,
    Zap,
    Loader2,
} from 'lucide-react';
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

type RadarProfile = {
    id: number;
    display_name: string;
    username: string;
    avatar: string | null;
    distance_km: number;
    last_seen: string;
    pronouns: string | null;
    roles: string[];
    vibe: string;
    mutuals: number;
    circles: number;
    compatibility: number;
    intent: string[];
    badges: string[];
    gallery: string[];
    is_traveling: boolean;
    is_following: boolean;
    has_pending_follow_request: boolean;
    can_follow: boolean;
};

type RadarScrollPayload = {
    data: RadarProfile[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        next_page_url: string | null;
        prev_page_url: string | null;
    };
    links?: Array<Record<string, unknown>>;
};

type RadarFilters = Record<string, Array<{ label: string; value: string }>>;

type RadarSpotlight = {
    title: string;
    description: string;
};

type ViewerContext = {
    name: string;
    location: {
        city: string | null;
        region: string | null;
        country: string | null;
    };
    travelBeacon: boolean;
};

type RadarPageProps = SharedData & {
    viewer: ViewerContext;
    filters: RadarFilters;
    quickPrompts: string[];
    radar: RadarScrollPayload;
    pageName: string;
    perPage: number;
    stats: {
        online_now: string;
        signal_boosts: string;
        meetups_happening: string;
    };
    spotlights: RadarSpotlight[];
};

const LOCATION_PROMPT_COOKIE = 'rk_radar_geo_prompted';
const LOCATION_COOKIE_MAX_AGE = 60 * 60 * 24; // 1 day

const compatibilityGradient = [
    'bg-gradient-to-r from-emerald-400/80 via-amber-300/80 to-rose-400/80',
    'bg-gradient-to-r from-amber-300/80 via-rose-400/80 to-violet-400/80',
];

export default function RadarIndex() {
    const {
        viewer,
        filters,
        quickPrompts,
        radar: initialRadar,
        pageName,
        stats,
        spotlights,
    } = usePage<RadarPageProps>().props;

    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [isRequestingLocation, setIsRequestingLocation] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [travelBeaconActive, setTravelBeaconActive] = useState(viewer.travelBeacon);
    const [isTravelBeaconLoading, setIsTravelBeaconLoading] = useState(false);
    const [travelBeaconError, setTravelBeaconError] = useState<string | null>(null);

    const [pages, setPages] = useState<RadarScrollPayload[]>([initialRadar]);
    const [hasMore, setHasMore] = useState(
        initialRadar.meta.current_page < initialRadar.meta.last_page,
    );
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const appendRef = useRef(false);

    useEffect(() => {
        setTravelBeaconActive(viewer.travelBeacon);
    }, [viewer.travelBeacon]);

    useEffect(() => {
        if (typeof document === 'undefined') {
            return;
        }

        const hasPrompted = document.cookie
            .split('; ')
            .some((cookie) => cookie.trim().startsWith(`${LOCATION_PROMPT_COOKIE}=`));

        if (!hasPrompted) {
            document.cookie = `${LOCATION_PROMPT_COOKIE}=1;path=/;max-age=${LOCATION_COOKIE_MAX_AGE};SameSite=Lax`;
            setIsLocationModalOpen(true);
        }
    }, []);

    useEffect(() => {
        if (appendRef.current) {
            appendRef.current = false;

            setPages((previous) => {
                const exists = previous.some(
                    (payload) =>
                        payload.meta.current_page ===
                        initialRadar.meta.current_page,
                );

                if (exists) {
                    return previous;
                }

                return [...previous, initialRadar];
            });

            setHasMore(
                initialRadar.meta.current_page < initialRadar.meta.last_page,
            );
            setErrorMessage(null);

            return;
        }

        setPages([initialRadar]);
        setHasMore(
            initialRadar.meta.current_page < initialRadar.meta.last_page,
        );
        setErrorMessage(null);
    }, [initialRadar]);

    const matches = useMemo(
        () =>
            pages.flatMap((payload) =>
                payload.data.map((profile) => ({
                    ...profile,
                    compatibility: Math.min(
                        99,
                        Math.max(60, profile.compatibility),
                    ),
                })),
            ),
        [pages],
    );

    const loadMore = useCallback(() => {
        if (isLoadingMore || !hasMore) {
            return;
        }

        const currentPage =
            pages[pages.length - 1]?.meta.current_page ?? 1;
        const nextPage = currentPage + 1;

        appendRef.current = true;
        setIsLoadingMore(true);
        setErrorMessage(null);

        router.reload({
            data: { [pageName]: nextPage },
            only: ['radar'],
            preserveScroll: true,
            preserveState: true,
            preserveUrl: true,
            onError: () => {
                appendRef.current = false;
                setErrorMessage(
                    'Radar is taking a breather. Try loading more again in a moment.',
                );
            },
            onFinish: () => {
                setIsLoadingMore(false);
            },
        });
    }, [hasMore, isLoadingMore, pageName, pages]);

    const handleLocationModalDecline = useCallback(() => {
        if (isRequestingLocation) {
            return;
        }

        setIsLocationModalOpen(false);
        setLocationError(null);
    }, [isRequestingLocation]);

    const handleLocationModalConfirm = useCallback(() => {
        if (isRequestingLocation) {
            return;
        }

        setIsRequestingLocation(true);
        setLocationError(null);

        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            setLocationError(
                'Your browser does not support location sharing. We’ll keep using your saved location.',
            );
            setIsRequestingLocation(false);

            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;

                router.visit(profileRoutes.location.update().url, {
                    method: 'patch',
                    data: {
                        location_latitude: latitude,
                        location_longitude: longitude,
                    },
                    preserveScroll: true,
                    preserveState: false,
                    onSuccess: () => {
                        setIsLocationModalOpen(false);
                        setLocationError(null);
                    },
                    onError: () => {
                        setLocationError('We could not save your updated location. Please try again.');
                    },
                    onFinish: () => {
                        setIsRequestingLocation(false);
                    },
                });
            },
            (error) => {
                console.error('Geolocation error:', error);
                setLocationError(
                    'We could not access your location. We’ll keep using your last saved location.',
                );
                setIsRequestingLocation(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            },
        );
    }, [isRequestingLocation]);

    const handleToggleTravelBeacon = useCallback(() => {
        if (isTravelBeaconLoading) {
            return;
        }

        const next = !travelBeaconActive;

        setIsTravelBeaconLoading(true);
        setTravelBeaconError(null);

        router.visit(profileRoutes.travelBeacon.update().url, {
            method: 'patch',
            data: {
                traveling: next ? 1 : 0,
            },
            preserveScroll: true,
            preserveState: false,
            onSuccess: () => {
                setTravelBeaconActive(next);
                setTravelBeaconError(null);
            },
            onError: () => {
                setTravelBeaconError('We could not update your traveler beacon. Please try again.');
            },
            onFinish: () => {
                setIsTravelBeaconLoading(false);
            },
        });
    }, [isTravelBeaconLoading, travelBeaconActive]);

    useEffect(() => {
        const sentinel = sentinelRef.current;

        if (!sentinel || !hasMore) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        loadMore();
                    }
                });
            },
            {
                root: null,
                rootMargin: '320px 0px 0px 0px',
                threshold: 0.2,
            },
        );

        observer.observe(sentinel);

        return () => {
            observer.disconnect();
        };
    }, [hasMore, loadMore]);

    const locationLabel = useMemo(() => {
        const { city, region, country } = viewer.location;
        const segments = [city, region, country]
            .filter((segment): segment is string => Boolean(segment))
            .map((segment) => segment.trim());

        if (segments.length === 0) {
            return 'Somewhere nearby';
        }

        return segments.join(', ');
    }, [viewer.location]);

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Radar',
                    href: radar().url,
                },
            ]}
        >
            <Head title="Radar" />

            <div className="space-y-8">
                <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <Card className="border-white/10 bg-white/5 text-white shadow-[0_32px_85px_-40px_rgba(249,115,22,0.55)]">
                        <CardHeader className="gap-4 sm:flex sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-2">
                                <CardTitle className="inline-flex items-center gap-2 text-2xl font-semibold tracking-tight">
                                    <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/30 via-rose-500/35 to-violet-600/30 text-amber-200">
                                        <RadarIcon className="size-5" />
                                    </span>
                                    Radar is live
                                    {travelBeaconActive ? (
                                        <Badge className="ml-1 flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/75">
                                            <Plane className="size-3" />
                                            Visiting
                                        </Badge>
                                    ) : null}
                                </CardTitle>
                                <CardDescription className="max-w-2xl text-white/65">
                                    Calibrated to {locationLabel}.{' '}
                                    {travelBeaconActive
                                        ? 'Your traveler beacon is broadcasting so locals know you are visiting.'
                                        : 'Tune into who is pulsing within walking distance right now and queue a scene before midnight.'}
                                </CardDescription>
                            </div>
                            <Button
                                size="lg"
                                className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-6 text-sm font-semibold text-white shadow-[0_18px_40px_-12px_rgba(249,115,22,0.55)] transition hover:scale-[1.02]"
                            >
                                Boost me for 1 hour
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <StatTile
                                    icon={Activity}
                                    label="Online nearby"
                                    value={stats.online_now}
                                />
                                <StatTile
                                    icon={Sparkles}
                                    label="Active boosts"
                                    value={stats.signal_boosts}
                                />
                                <StatTile
                                    icon={Waves}
                                    label="Live scenes"
                                    value={stats.meetups_happening}
                                />
                            </div>
                        </CardContent>
                        <CardContent className="grid gap-4 lg:grid-cols-2">
                            <div className="rounded-3xl border border-white/10 bg-black/35 p-4">
                                <h3 className="text-xs uppercase tracking-[0.3em] text-white/55">
                                    Quick prompts
                                </h3>
                                <div className="mt-3 space-y-2 text-xs text-white/70">
                                    {quickPrompts.map((prompt) => (
                                        <div
                                            key={prompt}
                                            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
                                        >
                                            {prompt}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="rounded-3xl border border-white/10 bg-black/35 p-4">
                                <h3 className="text-xs uppercase tracking-[0.3em] text-white/55">
                                    Traveler mode
                                </h3>
                                <p className="mt-3 text-xs text-white/65">
                                    {travelBeaconActive
                                        ? 'Your beacon is live. Locals will spot the airplane on your profile while you are in town.'
                                        : 'Let nearby players know you are dropping in. Toggle the beacon when you arrive and switch it off when you head home.'}
                                </p>
                                <div className="mt-4 space-y-2">
                                    <Button
                                        variant="ghost"
                                        className="w-full rounded-full border border-white/10 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10 hover:text-white"
                                    >
                                        <Waves className="mr-2 size-4" />
                                        Schedule a beacon
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={handleToggleTravelBeacon}
                                        disabled={isTravelBeaconLoading}
                                        className="w-full rounded-full border border-white/10 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10 hover:text-white"
                                    >
                                        {isTravelBeaconLoading ? (
                                            <Loader2 className="mr-2 size-4 animate-spin" />
                                        ) : (
                                            <Plane className="mr-2 size-4" />
                                        )}
                                        {travelBeaconActive ? 'Disable traveler beacon' : 'Set a traveler beacon'}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="w-full rounded-full border border-white/10 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10 hover:text-white"
                                    >
                                        <MapPin className="mr-2 size-4" />
                                        Share a meet-up window
                                    </Button>
                                </div>
                                {travelBeaconError ? (
                                    <p className="mt-3 text-xs text-rose-200/80">{travelBeaconError}</p>
                                ) : null}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4">
                        {spotlights.map((spotlight) => (
                            <Card
                                key={spotlight.title}
                                className="border-white/10 bg-black/35 text-white"
                            >
                                <CardHeader className="space-y-1">
                                    <CardTitle className="text-sm font-semibold text-white/85">
                                        {spotlight.title}
                                    </CardTitle>
                                    <CardDescription className="text-white/60">
                                        {spotlight.description}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                </section>

                <FiltersBar filters={filters} />

                <section className="space-y-6">
                    <div className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {matches.map((profile, index) => (
                                <ProfileCard
                                    key={`${profile.id}-${profile.username}-${profile.display_name}`}
                                    profile={profile}
                                    gradientVariant={compatibilityGradient[index % compatibilityGradient.length]}
                                />
                            ))}
                        </div>

                        <div ref={sentinelRef} className="h-12 w-full rounded-3xl border border-dashed border-white/10 bg-white/5" />

                        {errorMessage ? (
                            <Card className="border border-rose-500/40 bg-rose-500/10 text-rose-100">
                                <CardContent className="py-4 text-sm">
                                    {errorMessage}
                                </CardContent>
                            </Card>
                        ) : null}

                        {isLoadingMore ? (
                            <div className="flex items-center justify-center gap-2 text-sm text-white/60">
                                <span className="size-2 animate-ping rounded-full bg-amber-400" />
                                Scanning more frequencies…
                            </div>
                        ) : null}

                        {!hasMore ? (
                            <Card className="border-white/10 bg-black/35 text-white/65">
                                <CardContent className="py-5 text-center text-sm">
                                    You’ve seen the full radar pulse for tonight. Toggle traveler mode or boost to refresh sooner.
                                </CardContent>
                            </Card>
                        ) : null}
                    </div>
                </section>
            </div>

            <Dialog
                open={isLocationModalOpen}
                onOpenChange={(open) => {
                    if (!open && isRequestingLocation) {
                        return;
                    }

                    setIsLocationModalOpen(open);

                    if (!open) {
                        setLocationError(null);
                    }
                }}
            >
                <DialogContent className="border-white/10 bg-neutral-950 text-white sm:max-w-md">
                    <DialogHeader className="space-y-2 text-left">
                        <DialogTitle className="text-xl font-semibold">
                            Share your location?
                        </DialogTitle>
                        <DialogDescription className="text-sm text-white/70">
                            We use your coordinates to tune Radar to the closest players. We will only update
                            your latitude and longitude on your profile. If you skip, we will keep using the
                            last saved location.
                        </DialogDescription>
                    </DialogHeader>
                    {locationError ? (
                        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                            {locationError}
                        </div>
                    ) : null}
                    <DialogFooter className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
                        <Button
                            variant="ghost"
                            disabled={isRequestingLocation}
                            onClick={handleLocationModalDecline}
                            className="rounded-full border border-white/10 bg-white/5 px-4 text-xs uppercase tracking-[0.3em] text-white/80 hover:border-white/30 hover:bg-white/10 hover:text-white"
                        >
                            Keep last location
                        </Button>
                        <Button
                            onClick={handleLocationModalConfirm}
                            disabled={isRequestingLocation}
                            className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-6 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_18px_40px_-12px_rgba(249,115,22,0.55)] hover:scale-[1.02] disabled:opacity-70"
                        >
                            {isRequestingLocation ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : null}
                            Share my location
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

const StatTile = ({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Activity;
    label: string;
    value: string;
}) => (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white">
        <div className="flex size-9 items-center justify-center rounded-full bg-white/10 text-amber-300">
            <Icon className="size-4" />
        </div>
        <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/45">
                {label}
            </p>
            <p className="text-sm font-semibold text-white/90">{value}</p>
        </div>
    </div>
);

const FiltersBar = ({ filters }: { filters: RadarFilters }) => {
    const groups = Object.entries(filters);

    return (
        <Card className="border-white/10 bg-black/35 text-white">
            <CardContent className="space-y-4 px-5 py-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="flex size-9 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-amber-300">
                            <Zap className="size-4" />
                        </span>
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-white/55">
                                Tune the feed
                            </p>
                            <p className="text-xs text-white/65">
                                Dial in positions and sort priority for tonight’s radar.
                            </p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full border border-white/10 bg-white/5 px-4 text-xs text-white/80 hover:border-white/30 hover:bg-white/10 hover:text-white"
                    >
                        Reset
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {groups.map(([groupKey, items]) => {
                        const title =
                            groupKey === 'positions'
                                ? 'Positions'
                                : 'Sort order';

                        return (
                            <div
                                key={groupKey}
                                className="rounded-3xl border border-white/10 bg-white/5 p-4"
                            >
                                <p className="text-xs uppercase tracking-[0.3em] text-white/55">
                                    {title}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {items.map((item, index) => (
                                        <Badge
                                            key={item.value}
                                            className={cn(
                                                'rounded-full border border-white/20 bg-transparent px-3 py-1 text-[0.65rem] uppercase tracking-[0.3em] text-white/70 hover:border-amber-300/40 hover:text-amber-200',
                                                index === 0 && 'border-amber-300/40 bg-amber-300/10 text-amber-200',
                                            )}
                                        >
                                            {item.label}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};

const ProfileCard = ({
    profile,
    gradientVariant,
}: {
    profile: RadarProfile;
    gradientVariant: string;
}) => {
    const coverImage = profile.gallery[0] ?? null;
    const initials = profile.display_name
        .split(' ')
        .map((piece) => piece.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase();
    const [isFollowing, setIsFollowing] = useState(profile.is_following);
    const [hasPendingFollowRequest, setHasPendingFollowRequest] = useState(
        profile.has_pending_follow_request,
    );
    const [isFollowProcessing, setIsFollowProcessing] = useState(false);
    const [followError, setFollowError] = useState<string | null>(null);
    const canFollow = profile.can_follow;

    const followButtonLabel = useMemo(() => {
        if (!canFollow) {
            return 'You';
        }

        if (isFollowProcessing) {
            return 'Updating…';
        }

        if (isFollowing) {
            return 'Following';
        }

        if (hasPendingFollowRequest) {
            return 'Requested';
        }

        return 'Follow';
    }, [canFollow, hasPendingFollowRequest, isFollowProcessing, isFollowing]);

    const handleFollowClick = useCallback(async () => {
        if (!canFollow || isFollowProcessing) {
            return;
        }

        const method = isFollowing || hasPendingFollowRequest ? 'DELETE' : 'POST';
        const endpoint =
            method === 'POST'
                ? usersRoutes.follow.store.url(profile.id)
                : usersRoutes.follow.destroy.url(profile.id);

        setIsFollowProcessing(true);
        setFollowError(null);

        try {
            const csrfToken = getCsrfToken();
            const response = await fetch(endpoint, {
                method,
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : {}),
                },
                credentials: 'include',
            });

            let payload: {
                status?: string;
                pending?: boolean;
                accepted?: boolean;
                message?: string;
            } | null = null;

            try {
                payload = (await response.json()) as typeof payload;
            } catch {
                payload = null;
            }

            if (!response.ok || payload === null) {
                const message =
                    payload?.message ?? 'We could not update follow settings. Please try again.';
                throw new Error(message);
            }

            const accepted = Boolean(payload.accepted) || payload.status === 'following';
            const pending = Boolean(payload.pending) && !accepted;

            setIsFollowing(accepted);
            setHasPendingFollowRequest(pending);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'We could not update follow settings. Please try again.';
            setFollowError(message);
            console.error(error);
        } finally {
            setIsFollowProcessing(false);
        }
    }, [canFollow, hasPendingFollowRequest, isFollowProcessing, isFollowing, profile.id]);

    return (
        <Card className="group flex h-full flex-col border-white/10 bg-white/5 text-white shadow-[0_32px_85px_-40px_rgba(249,115,22,0.45)] transition hover:border-amber-400/35 hover:bg-white/10">
            <CardContent className="flex flex-1 flex-col gap-5 p-5">
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40">
                    {coverImage ? (
                        <img
                            src={coverImage}
                            alt={`${profile.display_name} cover`}
                            className="h-40 w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="h-40 w-full bg-gradient-to-br from-amber-400/20 via-rose-500/25 to-violet-600/25" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/80" />
                    {profile.is_traveling ? (
                        <div className="absolute top-4 left-4">
                            <Badge className="flex items-center gap-1 rounded-full border border-emerald-400/60 bg-emerald-400/15 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-emerald-200">
                                <Plane className="size-3" />
                                Visiting
                            </Badge>
                        </div>
                    ) : null}
                    <div className="absolute top-4 right-4">
                        <Badge className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-white/80">
                            {profile.mutuals} mutuals
                        </Badge>
                    </div>
                    <div className="absolute bottom-4 left-4 flex items-center gap-3">
                        <div className="relative h-16 w-16 overflow-hidden rounded-3xl border-4 border-neutral-950 shadow-[0_18px_45px_-20px_rgba(249,115,22,0.5)]">
                            {profile.avatar ? (
                                <img
                                    src={profile.avatar}
                                    alt={profile.display_name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-400/70 via-rose-500/70 to-violet-600/70 text-base font-semibold text-white">
                                    {initials}
                                </div>
                            )}
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-white">
                                {profile.display_name}
                            </h3>
                            <span className="text-xs text-white/70">
                                @{profile.username}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-white/65">
                    {profile.pronouns ? (
                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
                            {profile.pronouns}
                        </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-1">
                        <RadarIcon className="size-3" />
                        {profile.distance_km.toFixed(1)} km
                    </span>
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
                        {profile.last_seen}
                    </span>
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
                        Circles {profile.circles}
                    </span>
                </div>
                <div className="space-y-3">
                    <div className="h-2 w-full overflow-hidden rounded-full border border-white/10 bg-black/40">
                        <div
                            className={cn(
                                'h-full rounded-full',
                                gradientVariant,
                            )}
                            style={{
                                width: `${profile.compatibility}%`,
                            }}
                        />
                    </div>
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/55">
                        <span>Compatibility</span>
                        <span>{profile.compatibility}% match</span>
                    </div>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="w-full rounded-full border border-white/10 bg-white/5 px-4 text-xs text-white/75 hover:border-white/25 hover:bg-white/10 hover:text-white"
                    >
                        Message
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleFollowClick}
                        disabled={!canFollow || isFollowProcessing}
                        className="w-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-4 text-xs font-semibold text-white shadow-[0_18px_40px_-12px_rgba(249,115,22,0.45)] transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isFollowProcessing ? (
                            <Loader2 className="mr-2 inline size-3.5 animate-spin" />
                        ) : null}
                        {followButtonLabel}
                    </Button>
                </div>
                {followError ? (
                    <p className="text-xs text-rose-200/80">{followError}</p>
                ) : null}
            </CardContent>
        </Card>
    );
};

