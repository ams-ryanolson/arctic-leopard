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
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    HelpCircle,
    MapPin,
    Plane,
    Radar as RadarIcon,
    Sparkles,
    Waves,
    Zap,
    Loader2,
    ChevronUp,
    ChevronDown,
} from 'lucide-react';
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

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
    is_boosting: boolean;
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

type RadarFilters = {
    hashtags: Array<{ id: number; name: string }>;
    circles: Array<{ id: number; name: string }>;
    lastActiveOptions: Array<{ label: string; value: string }>;
    distanceOptions: Array<{ label: string; value: number }>;
};

type ActiveFilters = {
    position_min?: number;
    position_max?: number;
    age_min?: number;
    age_max?: number;
    last_active?: string | null;
    hashtags?: number[];
    circles?: number[];
    distance_km?: number;
};

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
    boostInfo: {
        is_boosting: boolean;
        expires_at: string | null;
        boosts_used_today: number;
        daily_limit: number;
        can_boost: boolean;
    };
};

type RadarPageProps = SharedData & {
    viewer: ViewerContext;
    filters: RadarFilters;
    activeFilters?: ActiveFilters;
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
const RADAR_HEADER_COLLAPSED_KEY = 'rk:radar:header:collapsed';
const RADAR_FILTERS_COLLAPSED_KEY = 'rk:radar:filters:collapsed';

export default function RadarIndex() {
    const {
        viewer,
        filters,
        activeFilters: initialActiveFilters = {},
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

    const [boostInfo, setBoostInfo] = useState(viewer.boostInfo);
    const [isBoostLoading, setIsBoostLoading] = useState(false);
    const [boostError, setBoostError] = useState<string | null>(null);
    const [isBoostHelpOpen, setIsBoostHelpOpen] = useState(false);

    const [isHeaderCollapsed, setIsHeaderCollapsed] = useState<boolean>(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        try {
            const value = window.localStorage.getItem(RADAR_HEADER_COLLAPSED_KEY);
            return value === 'true';
        } catch {
            return false;
        }
    });

    const [isFiltersCollapsed, setIsFiltersCollapsed] = useState<boolean>(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        try {
            const value = window.localStorage.getItem(RADAR_FILTERS_COLLAPSED_KEY);
            return value === 'true';
        } catch {
            return false;
        }
    });

    // Filter state management
    const [activeFilters, setActiveFilters] = useState<ActiveFilters>(initialActiveFilters);

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
        if (typeof window === 'undefined') {
            return;
        }

        try {
            window.localStorage.setItem(
                RADAR_HEADER_COLLAPSED_KEY,
                String(isHeaderCollapsed),
            );
        } catch {
            // ignore storage errors
        }
    }, [isHeaderCollapsed]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            window.localStorage.setItem(
                RADAR_FILTERS_COLLAPSED_KEY,
                String(isFiltersCollapsed),
            );
        } catch {
            // ignore storage errors
        }
    }, [isFiltersCollapsed]);

     
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
        () => pages.flatMap((payload) => payload.data),
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

    const handleBoostClick = useCallback(async () => {
        if (isBoostLoading || !boostInfo.can_boost || boostInfo.is_boosting) {
            return;
        }

        setIsBoostLoading(true);
        setBoostError(null);

        try {
            const csrfToken = getCsrfToken();
            const response = await fetch('/radar/boost', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json',
                    ...(csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : {}),
                },
                credentials: 'include',
            });

            let payload: {
                message?: string;
                boost?: {
                    id: number;
                    expires_at: string;
                };
                boost_info?: typeof boostInfo;
                errors?: {
                    boost?: string[];
                };
            } | null = null;

            try {
                payload = (await response.json()) as typeof payload;
            } catch {
                payload = null;
            }

            if (!response.ok || payload === null) {
                const message =
                    payload?.message ??
                    payload?.errors?.boost?.[0] ??
                    'We could not activate your boost. Please try again.';
                throw new Error(message);
            }

            if (payload.boost_info) {
                setBoostInfo(payload.boost_info);
            }

            // Reload the page to update the radar with boosted profile
            router.reload({
                preserveScroll: true,
                preserveState: false,
            });
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'We could not activate your boost. Please try again.';
            setBoostError(message);
            console.error(error);
        } finally {
            setIsBoostLoading(false);
        }
    }, [isBoostLoading, boostInfo]);

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

            <div className="space-y-4 sm:space-y-6 md:space-y-8">
                <Collapsible
                    open={!isHeaderCollapsed}
                    onOpenChange={(open) => setIsHeaderCollapsed(!open)}
                >
                    <Card className="border-white/10 bg-white/5 text-white shadow-[0_32px_85px_-40px_rgba(249,115,22,0.55)]">
                        <CardHeader className="gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-6">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                                {isHeaderCollapsed ? (
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="inline-flex flex-wrap items-center gap-2 text-base font-semibold tracking-tight sm:text-lg">
                                            <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/30 via-rose-500/35 to-violet-600/30 text-amber-200 sm:size-7">
                                                <RadarIcon className="size-3.5 sm:size-4" />
                                            </span>
                                            Radar is live
                                            {travelBeaconActive ? (
                                                <Badge className="ml-1 flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.3em] text-white/75">
                                                    <Plane className="size-2.5" />
                                                    Visiting
                                                </Badge>
                                            ) : null}
                                        </CardTitle>
                                        <CardDescription className="mt-1 text-xs text-white/55 sm:text-sm">
                                            Calibrated to {locationLabel} • Stats, prompts, and traveler controls
                                        </CardDescription>
                                    </div>
                                ) : (
                                    <div className="flex-1 space-y-2 min-w-0">
                                        <CardTitle className="inline-flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
                                            <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/30 via-rose-500/35 to-violet-600/30 text-amber-200 sm:size-9">
                                                <RadarIcon className="size-4 sm:size-5" />
                                            </span>
                                            Radar is live
                                            {travelBeaconActive ? (
                                                <Badge className="ml-1 flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.3em] text-white/75 sm:px-3 sm:py-1 sm:text-xs">
                                                    <Plane className="size-2.5 sm:size-3" />
                                                    Visiting
                                                </Badge>
                                            ) : null}
                                        </CardTitle>
                                        <CardDescription className="text-sm text-white/65 sm:text-base sm:max-w-2xl">
                                            Calibrated to {locationLabel}.{' '}
                                            {travelBeaconActive
                                                ? 'Your traveler beacon is broadcasting so locals know you are visiting.'
                                                : 'Tune into who is pulsing within walking distance right now and queue a scene before midnight.'}
                                        </CardDescription>
                                    </div>
                                )}

                                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2 sm:flex-shrink-0">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="lg"
                                            onClick={handleBoostClick}
                                            disabled={isBoostLoading || !boostInfo.can_boost || boostInfo.is_boosting}
                                            className="flex-1 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-4 text-xs font-semibold text-white shadow-[0_18px_40px_-12px_rgba(249,115,22,0.55)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none sm:px-6 sm:text-sm"
                                        >
                                            {isBoostLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 inline size-3.5 animate-spin sm:size-4" />
                                                    <span className="hidden sm:inline">Activating…</span>
                                                    <span className="sm:hidden">Activating</span>
                                                </>
                                            ) : boostInfo.is_boosting ? (
                                                'Boosting'
                                            ) : (
                                                <>
                                                    <span className="hidden sm:inline">Boost me for 1 hour{boostInfo.daily_limit > 0 ? ` (${boostInfo.boosts_used_today}/${boostInfo.daily_limit})` : ''}</span>
                                                    <span className="sm:hidden">Boost{boostInfo.daily_limit > 0 ? ` (${boostInfo.boosts_used_today}/${boostInfo.daily_limit})` : ''}</span>
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsBoostHelpOpen(true)}
                                            className="flex-shrink-0 rounded-full border border-white/10 bg-white/5 p-2 text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white"
                                            aria-label="What is boost?"
                                        >
                                            <HelpCircle className="size-4" />
                                        </Button>
                                        <CollapsibleTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="flex-shrink-0 rounded-full border border-white/10 bg-white/5 p-2 text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white sm:hidden"
                                                aria-label={isHeaderCollapsed ? 'Expand section' : 'Collapse section'}
                                            >
                                                {isHeaderCollapsed ? (
                                                    <ChevronDown className="size-4" />
                                                ) : (
                                                    <ChevronUp className="size-4" />
                                                )}
                                            </Button>
                                        </CollapsibleTrigger>
                                    </div>
                                </div>
                                {boostError ? (
                                    <p className="mt-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200/90 backdrop-blur-sm">
                                        {boostError}
                                    </p>
                                ) : null}
                                
                                <CollapsibleTrigger asChild className="hidden sm:block">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-4 top-4 flex-shrink-0 rounded-full border border-white/10 bg-white/5 p-2 text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white"
                                        aria-label={isHeaderCollapsed ? 'Expand section' : 'Collapse section'}
                                    >
                                        {isHeaderCollapsed ? (
                                            <ChevronDown className="size-4" />
                                        ) : (
                                            <ChevronUp className="size-4" />
                                        )}
                                    </Button>
                                </CollapsibleTrigger>
                            </div>
                        </CardHeader>

                        <CollapsibleContent className="overflow-hidden transition-all duration-200 ease-in-out">
                            <div className="border-t border-white/10">
                                {/* Stats Section */}
                                <div className="border-b border-white/10 px-4 py-4 sm:px-6 sm:py-6">
                                    <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
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
                                </div>

                                {/* Main Content Section */}
                                <div className="grid gap-4 px-4 pb-4 pt-4 sm:gap-6 sm:px-6 sm:pb-6 sm:pt-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                                    {/* Left Column - Quick Prompts & Traveler Mode */}
                                    <div className="space-y-4 border-b border-white/10 pb-4 sm:space-y-6 sm:pb-0 lg:border-b-0 lg:pb-0">
                                        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                                            {/* Quick Prompts Card */}
                                            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-black/50 via-black/40 to-black/50 p-4 shadow-[0_8px_32px_-16px_rgba(0,0,0,0.4)] backdrop-blur-sm transition-all hover:border-white/20 hover:shadow-[0_12px_40px_-16px_rgba(249,115,22,0.25)] sm:rounded-3xl sm:p-6">
                                                <div className="relative">
                                                    <div className="mb-4 flex items-center gap-2 sm:mb-5 sm:gap-3">
                                                        <div className="flex size-8 items-center justify-center rounded-xl border border-amber-400/20 bg-gradient-to-br from-amber-400/20 via-amber-300/15 to-amber-400/10 text-amber-300 shadow-[0_4px_16px_-8px_rgba(251,191,36,0.3)] sm:size-10 sm:rounded-2xl">
                                                            <Zap className="size-4 sm:size-5" />
                                                        </div>
                                                        <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-white/85 sm:text-sm">
                                                            Quick prompts
                                                        </h3>
                                                    </div>
                                                    <div className="space-y-2 sm:space-y-2.5">
                                                        {quickPrompts.map((prompt) => (
                                                            <button
                                                                key={prompt}
                                                                type="button"
                                                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left text-xs font-medium text-white/80 backdrop-blur-sm transition-all hover:border-amber-400/30 hover:bg-gradient-to-r hover:from-amber-400/10 hover:via-transparent hover:to-transparent hover:text-white hover:shadow-[0_4px_16px_-8px_rgba(251,191,36,0.2)] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
                                                            >
                                                                {prompt}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Traveler Mode Card */}
                                            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-black/50 via-black/40 to-black/50 p-4 shadow-[0_8px_32px_-16px_rgba(0,0,0,0.4)] backdrop-blur-sm transition-all hover:border-white/20 hover:shadow-[0_12px_40px_-16px_rgba(139,92,246,0.25)] sm:rounded-3xl sm:p-6">
                                                <div className="relative">
                                                    <div className="mb-4 flex items-center gap-2 sm:mb-5 sm:gap-3">
                                                        <div className="flex size-8 items-center justify-center rounded-xl border border-violet-400/20 bg-gradient-to-br from-violet-400/20 via-violet-300/15 to-violet-400/10 text-violet-300 shadow-[0_4px_16px_-8px_rgba(139,92,246,0.3)] sm:size-10 sm:rounded-2xl">
                                                            <Plane className="size-4 sm:size-5" />
                                                        </div>
                                                        <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-white/85 sm:text-sm">
                                                            Traveler mode
                                                        </h3>
                                                    </div>
                                                    <p className="mb-4 text-xs leading-relaxed text-white/70 sm:mb-6 sm:text-sm">
                                                        {travelBeaconActive
                                                            ? 'Your beacon is live. Locals will spot the airplane on your profile while you are in town.'
                                                            : 'Let nearby players know you are dropping in. Toggle the beacon when you arrive and switch it off when you head home.'}
                                                    </p>
                                                    <div className="space-y-2 sm:space-y-2.5">
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/10 hover:text-white sm:px-4 sm:py-2.5 sm:text-sm"
                                                        >
                                                            <Waves className="mr-2 size-3.5 sm:size-4" />
                                                            <span className="hidden sm:inline">Schedule a beacon</span>
                                                            <span className="sm:hidden">Schedule</span>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            onClick={handleToggleTravelBeacon}
                                                            disabled={isTravelBeaconLoading}
                                                            className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/10 hover:text-white disabled:opacity-50 sm:px-4 sm:py-2.5 sm:text-sm"
                                                        >
                                                            {isTravelBeaconLoading ? (
                                                                <Loader2 className="mr-2 size-3.5 animate-spin sm:size-4" />
                                                            ) : (
                                                                <Plane className="mr-2 size-3.5 sm:size-4" />
                                                            )}
                                                            <span className="hidden sm:inline">{travelBeaconActive ? 'Disable traveler beacon' : 'Set a traveler beacon'}</span>
                                                            <span className="sm:hidden">{travelBeaconActive ? 'Disable' : 'Set beacon'}</span>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/10 hover:text-white sm:px-4 sm:py-2.5 sm:text-sm"
                                                        >
                                                            <MapPin className="mr-2 size-3.5 sm:size-4" />
                                                            <span className="hidden sm:inline">Share a meet-up window</span>
                                                            <span className="sm:hidden">Meet-up</span>
                                                        </Button>
                                                    </div>
                                                    {travelBeaconError ? (
                                                        <p className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200/90 backdrop-blur-sm sm:mt-4">
                                                            {travelBeaconError}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column - Spotlights */}
                                    <div className="hidden lg:block">
                                        <div className="space-y-6">
                                            {spotlights
                                                .filter((spotlight) => !spotlight.title.toLowerCase().includes('heat surge'))
                                                .map((spotlight) => (
                                                    <div
                                                        key={spotlight.title}
                                                        className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-black/50 via-black/40 to-black/50 p-6 shadow-[0_8px_32px_-16px_rgba(0,0,0,0.4)] backdrop-blur-sm transition-all hover:border-white/20 hover:shadow-[0_12px_40px_-16px_rgba(244,63,94,0.25)]"
                                                    >
                                                        <div className="relative">
                                                            <div className="mb-5 flex items-center gap-3">
                                                                <div className="flex size-10 items-center justify-center rounded-2xl border border-rose-400/20 bg-gradient-to-br from-rose-400/20 via-rose-300/15 to-rose-400/10 text-rose-300 shadow-[0_4px_16px_-8px_rgba(244,63,94,0.3)]">
                                                                    <Sparkles className="size-5" />
                                                                </div>
                                                                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/85">
                                                                    {spotlight.title}
                                                                </h3>
                                                            </div>
                                                            <p className="text-sm leading-relaxed text-white/70">
                                                                {spotlight.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Card>
                </Collapsible>

                <FiltersBar 
                    filters={filters}
                    activeFilters={activeFilters}
                    onFiltersChange={setActiveFilters}
                    isCollapsed={isFiltersCollapsed}
                    onCollapsedChange={setIsFiltersCollapsed}
                />

                <section className="space-y-4 sm:space-y-6">
                    <div className="space-y-4 sm:space-y-6">
                        {matches.length === 0 && !isLoadingMore ? (
                            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-black/50 via-black/40 to-black/50 p-8 text-center shadow-[0_8px_32px_-16px_rgba(0,0,0,0.4)] backdrop-blur-sm sm:rounded-3xl sm:p-12">
                                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl border border-amber-400/20 bg-gradient-to-br from-amber-400/20 via-amber-300/15 to-amber-400/10 text-amber-300 shadow-[0_4px_16px_-8px_rgba(251,191,36,0.3)] sm:size-16 sm:rounded-2xl">
                                    <RadarIcon className="size-6 sm:size-8" />
                                </div>
                                <h3 className="mb-2 text-lg font-semibold text-white sm:text-xl">
                                    No profiles available
                                </h3>
                                <p className="text-xs leading-relaxed text-white/65 sm:text-sm">
                                    There are no profiles matching your current filters. Try adjusting your filters or check back later.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {matches.map((profile) => (
                                        <ProfileCard
                                            key={`${profile.id}-${profile.username}-${profile.display_name}`}
                                            profile={profile}
                                        />
                                    ))}
                                </div>

                                {/* Intersection Observer sentinel for infinite scrolling - hidden visually */}
                                {matches.length > 0 ? (
                                    <div ref={sentinelRef} className="h-px w-full pointer-events-none" aria-hidden="true" />
                                ) : null}

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

                                {!hasMore && matches.length > 0 ? (
                                    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-black/50 via-black/40 to-black/50 p-6 text-center shadow-[0_8px_32px_-16px_rgba(0,0,0,0.4)] backdrop-blur-sm sm:rounded-3xl sm:p-8">
                                        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl border border-amber-400/20 bg-gradient-to-br from-amber-400/20 via-amber-300/15 to-amber-400/10 text-amber-300 shadow-[0_4px_16px_-8px_rgba(251,191,36,0.3)] sm:size-14 sm:rounded-2xl">
                                            <RadarIcon className="size-6 sm:size-7" />
                                        </div>
                                        <h3 className="mb-2 text-base font-semibold text-white sm:text-lg">
                                            Full radar pulse complete
                                        </h3>
                                        <p className="text-xs leading-relaxed text-white/65 sm:text-sm">
                                            You've seen all available profiles for tonight. Toggle traveler mode or boost to refresh sooner.
                                        </p>
                                    </div>
                                ) : null}
                            </>
                        )}
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

            {/* Boost Help Modal */}
            <Dialog
                open={isBoostHelpOpen}
                onOpenChange={setIsBoostHelpOpen}
            >
                <DialogContent className="border-white/10 bg-neutral-950 text-white sm:max-w-md">
                    <DialogHeader className="space-y-2 text-left">
                        <DialogTitle className="text-xl font-semibold">
                            What is Boost?
                        </DialogTitle>
                        <DialogDescription className="text-sm text-white/70">
                            <div className="space-y-4 pt-2">
                                <p>
                                    Boost puts your profile at the top of Radar for 1 hour, giving you maximum visibility to nearby players.
                                </p>
                                <div>
                                    <h4 className="mb-2 font-semibold text-white/90">Daily Limits:</h4>
                                    <ul className="ml-4 list-disc space-y-1 text-white/70">
                                        <li>Free users: 1 boost per day</li>
                                        <li>Paid members: 2 boosts per day</li>
                                        <li>Premium members: 3 boosts per day</li>
                                    </ul>
                                </div>
                                <p className="pt-2">
                                    When you're boosting, your profile gets a special gold glow that makes it stand out to others browsing Radar.
                                </p>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-4">
                        <Button
                            onClick={() => setIsBoostHelpOpen(false)}
                            className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-6 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_18px_40px_-12px_rgba(249,115,22,0.55)] hover:scale-[1.02]"
                        >
                            Got it
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
    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-black/50 via-black/40 to-black/50 px-4 py-3 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.4)] backdrop-blur-sm transition-all hover:border-white/20 hover:shadow-[0_8px_32px_-16px_rgba(249,115,22,0.2)] sm:rounded-2xl sm:px-5 sm:py-4">
        <div className="relative flex items-center gap-3 sm:gap-4">
            <div className="flex size-8 items-center justify-center rounded-lg border border-amber-400/20 bg-gradient-to-br from-amber-400/20 via-amber-300/15 to-amber-400/10 text-amber-300 shadow-[0_4px_16px_-8px_rgba(251,191,36,0.3)] transition-all group-hover:shadow-[0_6px_20px_-8px_rgba(251,191,36,0.4)] sm:size-10 sm:rounded-xl">
                <Icon className="size-4 sm:size-5" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="mb-1 text-[0.65rem] uppercase tracking-[0.3em] text-white/55 sm:text-xs">
                    {label}
                </p>
                <p className="text-sm font-semibold text-white/95 sm:text-base">{value}</p>
            </div>
        </div>
    </div>
);

const FiltersBar = ({ 
    filters,
    activeFilters,
    onFiltersChange,
    isCollapsed,
    onCollapsedChange,
}: { 
    filters: RadarFilters;
    activeFilters: ActiveFilters;
    onFiltersChange: (filters: ActiveFilters) => void;
    isCollapsed: boolean;
    onCollapsedChange: (collapsed: boolean) => void;
}) => {
    // Local state for filters (before applying)
    const [localFilters, setLocalFilters] = useState<ActiveFilters>(activeFilters);
    const hasChanges = useMemo(() => {
        return JSON.stringify(localFilters) !== JSON.stringify(activeFilters);
    }, [localFilters, activeFilters]);

    // Sync local filters when activeFilters change from props
    useEffect(() => {
        setLocalFilters(activeFilters);
    }, [activeFilters]);

    // Hashtags state
    const [hashtagSearch, setHashtagSearch] = useState('');
    const filteredHashtags = useMemo(() => {
        if (!hashtagSearch.trim()) {
            return filters.hashtags.slice(0, 20);
        }
        const search = hashtagSearch.toLowerCase();
        return filters.hashtags.filter((tag) => tag.name.toLowerCase().includes(search)).slice(0, 20);
    }, [filters.hashtags, hashtagSearch]);

    // Update local position values (inverted for display)
    // Default to full range: position_min=0, position_max=100 means no filter
    const displayPositionMin = localFilters.position_max !== undefined && localFilters.position_max < 100 
        ? 100 - localFilters.position_max 
        : 0;
    const displayPositionMax = localFilters.position_min !== undefined && localFilters.position_min > 0
        ? 100 - localFilters.position_min
        : 100;
    
    // Default to full age range: 18-100 means no filter
    const localAgeMin = localFilters.age_min !== undefined && localFilters.age_min > 18
        ? Math.max(18, Math.min(100, localFilters.age_min))
        : 18;
    const localAgeMax = localFilters.age_max !== undefined && localFilters.age_max < 100
        ? Math.max(18, Math.min(100, localFilters.age_max))
        : 100;

    const buildQueryParams = useCallback((filters: ActiveFilters): Record<string, string | number | (string | number)[]> => {
        const params: Record<string, string | number | (string | number)[]> = {};
        if (filters.position_min !== undefined && filters.position_min > 0) {
            params.position_min = filters.position_min;
        }
        if (filters.position_max !== undefined && filters.position_max < 100) {
            params.position_max = filters.position_max;
        }
        if (filters.age_min !== undefined && filters.age_min > 18) {
            params.age_min = filters.age_min;
        }
        if (filters.age_max !== undefined && filters.age_max < 100) {
            params.age_max = filters.age_max;
        }
        if (filters.last_active !== undefined && filters.last_active !== null && filters.last_active !== 'any') {
            params.last_active = filters.last_active;
        }
        if (filters.hashtags !== undefined && filters.hashtags.length > 0) {
            params.hashtags = filters.hashtags;
        }
        if (filters.circles !== undefined && filters.circles.length > 0) {
            params.circles = filters.circles;
        }
        if (filters.distance_km !== undefined && filters.distance_km > 0) {
            params.distance_km = filters.distance_km;
        }
        return params;
    }, []);

    const handleReset = useCallback(() => {
        setLocalFilters({});
        onFiltersChange({});
        router.get(radar.url(), {}, { preserveScroll: true, preserveState: false });
    }, [onFiltersChange]);

    const handleApply = useCallback(() => {
        onFiltersChange(localFilters);
        router.get(radar.url(), buildQueryParams(localFilters), { preserveScroll: true, preserveState: false });
    }, [localFilters, onFiltersChange, buildQueryParams]);

    const handlePositionMinChange = useCallback((value: number) => {
        // Convert display value (0-100 Dominant) to stored value (0-100 Submissive, inverted)
        const storedMax = 100 - value;
        setLocalFilters((prev) => ({ ...prev, position_max: storedMax }));
    }, []);

    const handlePositionMaxChange = useCallback((value: number) => {
        // Convert display value (0-100 Dominant) to stored value (0-100 Submissive, inverted)
        const storedMin = 100 - value;
        setLocalFilters((prev) => ({ ...prev, position_min: storedMin }));
    }, []);

    const handleAgeMinChange = useCallback((value: number) => {
        const constrained = Math.max(18, Math.min(localAgeMax - 1, value));
        setLocalFilters((prev) => ({ ...prev, age_min: constrained }));
    }, [localAgeMax]);

    const handleAgeMaxChange = useCallback((value: number) => {
        const constrained = Math.max(localAgeMin + 1, Math.min(100, value));
        setLocalFilters((prev) => ({ ...prev, age_max: constrained }));
    }, [localAgeMin]);

    const handleLastActiveChange = useCallback((value: string) => {
        setLocalFilters((prev) => {
            const newFilters = { ...prev };
            if (value === 'any') {
                delete newFilters.last_active;
            } else {
                newFilters.last_active = value;
            }
            return newFilters;
        });
    }, []);

    const toggleHashtag = useCallback((hashtagId: number) => {
        setLocalFilters((prev) => {
            const currentIds = prev.hashtags ?? [];
            const newIds = currentIds.includes(hashtagId)
                ? currentIds.filter((id) => id !== hashtagId)
                : [...currentIds, hashtagId];
            const newFilters = { ...prev, hashtags: newIds.length > 0 ? newIds : undefined };
            if (newIds.length === 0) {
                delete newFilters.hashtags;
            }
            return newFilters;
        });
    }, []);

    const toggleCircle = useCallback((circleId: number) => {
        setLocalFilters((prev) => {
            const currentIds = prev.circles ?? [];
            const newIds = currentIds.includes(circleId)
                ? currentIds.filter((id) => id !== circleId)
                : [...currentIds, circleId];
            const newFilters = { ...prev, circles: newIds.length > 0 ? newIds : undefined };
            if (newIds.length === 0) {
                delete newFilters.circles;
            }
            return newFilters;
        });
    }, []);

    // Update selected hashtag/circle IDs from local filters
    const localSelectedHashtagIds = useMemo(() => localFilters.hashtags ?? [], [localFilters.hashtags]);
    const localSelectedCircleIds = useMemo(() => localFilters.circles ?? [], [localFilters.circles]);
    const localLastActive = localFilters.last_active ?? 'any';
    const localDistanceKm = localFilters.distance_km ?? 50; // Default to 50km

    const handleDistanceChange = useCallback((value: string) => {
        setLocalFilters((prev) => {
            const newFilters = { ...prev };
            if (value === 'any' || value === '' || value === '0') {
                delete newFilters.distance_km;
            } else {
                newFilters.distance_km = Number(value);
            }
            return newFilters;
        });
    }, []);

    return (
        <Collapsible
            open={!isCollapsed}
            onOpenChange={(open) => onCollapsedChange(!open)}
        >
            <Card className="border-white/10 bg-black/35 text-white">
                <CardHeader className="gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        {isCollapsed ? (
                            <div className="flex-1 min-w-0">
                                <CardTitle className="inline-flex flex-wrap items-center gap-2 text-base font-semibold tracking-tight sm:text-lg">
                                    <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/30 via-rose-500/35 to-violet-600/30 text-amber-200 sm:size-7">
                                        <Zap className="size-3.5 sm:size-4" />
                                    </span>
                                    Tune the feed
                                </CardTitle>
                                <CardDescription className="mt-1 text-xs text-white/55 sm:text-sm">
                                    Dial in positions and filters for tonight's radar.
                                </CardDescription>
                            </div>
                        ) : (
                            <div className="flex-1 space-y-2 min-w-0">
                                <CardTitle className="inline-flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
                                    <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/30 via-rose-500/35 to-violet-600/30 text-amber-200 sm:size-9">
                                        <Zap className="size-4 sm:size-5" />
                                    </span>
                                    Tune the feed
                                </CardTitle>
                                <CardDescription className="text-sm text-white/65 sm:text-base sm:max-w-2xl">
                                    Dial in positions and filters for tonight's radar.
                                </CardDescription>
                            </div>
                        )}

                        <div className="flex items-center gap-2 sm:flex-shrink-0">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleReset}
                                className="flex-1 rounded-full border border-white/10 bg-white/5 px-3 text-xs text-white/80 hover:border-white/30 hover:bg-white/10 hover:text-white sm:flex-none sm:px-4"
                            >
                                Reset
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleApply}
                                disabled={!hasChanges}
                                className="flex-1 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-4 text-xs font-semibold text-white shadow-[0_4px_16px_-8px_rgba(249,115,22,0.55)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:px-5"
                            >
                                Apply
                            </Button>
                            <CollapsibleTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex-shrink-0 rounded-full border border-white/10 bg-white/5 p-2 text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white sm:hidden"
                                    aria-label={isCollapsed ? 'Expand filters' : 'Collapse filters'}
                                >
                                    {isCollapsed ? (
                                        <ChevronDown className="size-4" />
                                    ) : (
                                        <ChevronUp className="size-4" />
                                    )}
                                </Button>
                            </CollapsibleTrigger>
                        </div>

                        <CollapsibleTrigger asChild className="hidden sm:block">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-4 top-4 flex-shrink-0 rounded-full border border-white/10 bg-white/5 p-2 text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white"
                                aria-label={isCollapsed ? 'Expand filters' : 'Collapse filters'}
                            >
                                {isCollapsed ? (
                                    <ChevronDown className="size-4" />
                                ) : (
                                    <ChevronUp className="size-4" />
                                )}
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                </CardHeader>

                <CollapsibleContent className="overflow-hidden transition-all duration-200 ease-in-out">
                    <CardContent className="border-t border-white/10 px-4 py-4 sm:px-6 sm:py-6">
                        <div className="grid gap-3 sm:gap-4">
                            {/* Row 1: Position and Age Range */}
                            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                            {/* Position/Role Slider */}
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3 sm:rounded-3xl sm:p-5 sm:space-y-4">
                                <Label className="text-xs uppercase tracking-[0.3em] text-white/55">Position</Label>
                                <div className="space-y-3 sm:space-y-4">
                                    <div className="relative h-14 py-3 sm:h-12">
                                        {/* Background track */}
                                        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/10" />
                                        {/* Active range fill */}
                                        <div
                                            className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-500 will-change-[left,width] transition-all duration-150 pointer-events-none"
                                            style={{
                                                left: `${Math.min(displayPositionMin, displayPositionMax)}%`,
                                                width: `${Math.max(1, Math.abs(displayPositionMax - displayPositionMin))}%`,
                                            }}
                                        />
                                        {/* Min slider - positioned first so it's underneath */}
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            step="1"
                                            value={displayPositionMin}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                if (val <= displayPositionMax) {
                                                    handlePositionMinChange(val);
                                                }
                                            }}
                                            className="absolute inset-0 z-10 h-2 w-full appearance-none bg-transparent outline-none cursor-pointer touch-manipulation [&::-webkit-slider-runnable-track]:h-0 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/40 [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-amber-400 [&::-webkit-slider-thumb]:via-rose-500 [&::-webkit-slider-thumb]:to-violet-600 [&::-webkit-slider-thumb]:shadow-[0_4px_12px_rgba(249,115,22,0.6)] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:hover:border-white/60 [&::-webkit-slider-thumb]:hover:shadow-[0_6px_16px_rgba(249,115,22,0.8)] [&::-webkit-slider-thumb]:active:scale-105 sm:[&::-webkit-slider-thumb]:h-5 sm:[&::-webkit-slider-thumb]:w-5 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white/40 [&::-moz-range-thumb]:bg-gradient-to-br [&::-moz-range-thumb]:from-amber-400 [&::-moz-range-thumb]:via-rose-500 [&::-moz-range-thumb]:to-violet-600 [&::-moz-range-thumb]:shadow-[0_4px_12px_rgba(249,115,22,0.6)] [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-200 [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:hover:border-white/60 sm:[&::-moz-range-thumb]:h-5 sm:[&::-moz-range-thumb]:w-5"
                                        />
                                        {/* Max slider - positioned on top */}
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            step="1"
                                            value={displayPositionMax}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                if (val >= displayPositionMin) {
                                                    handlePositionMaxChange(val);
                                                }
                                            }}
                                            className="absolute inset-0 z-20 h-2 w-full appearance-none bg-transparent outline-none cursor-pointer touch-manipulation [&::-webkit-slider-runnable-track]:h-0 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-20 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/40 [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-amber-400 [&::-webkit-slider-thumb]:via-rose-500 [&::-webkit-slider-thumb]:to-violet-600 [&::-webkit-slider-thumb]:shadow-[0_4px_12px_rgba(249,115,22,0.6)] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:hover:border-white/60 [&::-webkit-slider-thumb]:hover:shadow-[0_6px_16px_rgba(249,115,22,0.8)] [&::-webkit-slider-thumb]:active:scale-105 sm:[&::-webkit-slider-thumb]:h-5 sm:[&::-webkit-slider-thumb]:w-5 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white/40 [&::-moz-range-thumb]:bg-gradient-to-br [&::-moz-range-thumb]:from-amber-400 [&::-moz-range-thumb]:via-rose-500 [&::-moz-range-thumb]:to-violet-600 [&::-moz-range-thumb]:shadow-[0_4px_12px_rgba(249,115,22,0.6)] [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-200 [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:hover:border-white/60 sm:[&::-moz-range-thumb]:h-5 sm:[&::-moz-range-thumb]:w-5"
                                        />
                                    </div>
                                    <div className="flex items-end justify-between gap-2 px-1 text-xs">
                                        <div className="flex flex-col items-start gap-1">
                                            <span className="font-semibold text-white">100% Dominant</span>
                                            <span className="text-white/60">Min: {displayPositionMin}%</span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="font-semibold text-white">100% Submissive</span>
                                            <span className="text-white/60">Max: {displayPositionMax}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Age Range Slider */}
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3 sm:rounded-3xl sm:p-5 sm:space-y-4">
                                <Label className="text-xs uppercase tracking-[0.3em] text-white/55">Age Range</Label>
                                <div className="space-y-3 sm:space-y-4">
                                    <div className="relative h-14 py-3 sm:h-12">
                                        {/* Background track */}
                                        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/10" />
                                        {/* Active range fill */}
                                        <div
                                            className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-500 will-change-[left,width] transition-all duration-150 pointer-events-none"
                                            style={{
                                                left: `${((Math.min(localAgeMin, localAgeMax) - 18) / (100 - 18)) * 100}%`,
                                                width: `${Math.max(1, ((Math.abs(localAgeMax - localAgeMin)) / (100 - 18)) * 100)}%`,
                                            }}
                                        />
                                        {/* Min slider - positioned first so it's underneath */}
                                        <input
                                            type="range"
                                            min="18"
                                            max="100"
                                            step="1"
                                            value={localAgeMin}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                if (val <= localAgeMax) {
                                                    handleAgeMinChange(val);
                                                }
                                            }}
                                            className="absolute inset-0 z-10 h-2 w-full appearance-none bg-transparent outline-none cursor-pointer touch-manipulation [&::-webkit-slider-runnable-track]:h-0 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/40 [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-amber-400 [&::-webkit-slider-thumb]:via-rose-500 [&::-webkit-slider-thumb]:to-violet-600 [&::-webkit-slider-thumb]:shadow-[0_4px_12px_rgba(249,115,22,0.6)] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:hover:border-white/60 [&::-webkit-slider-thumb]:hover:shadow-[0_6px_16px_rgba(249,115,22,0.8)] [&::-webkit-slider-thumb]:active:scale-105 sm:[&::-webkit-slider-thumb]:h-5 sm:[&::-webkit-slider-thumb]:w-5 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white/40 [&::-moz-range-thumb]:bg-gradient-to-br [&::-moz-range-thumb]:from-amber-400 [&::-moz-range-thumb]:via-rose-500 [&::-moz-range-thumb]:to-violet-600 [&::-moz-range-thumb]:shadow-[0_4px_12px_rgba(249,115,22,0.6)] [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-200 [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:hover:border-white/60 sm:[&::-moz-range-thumb]:h-5 sm:[&::-moz-range-thumb]:w-5"
                                        />
                                        {/* Max slider - positioned on top */}
                                        <input
                                            type="range"
                                            min="18"
                                            max="100"
                                            step="1"
                                            value={localAgeMax}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                if (val >= localAgeMin) {
                                                    handleAgeMaxChange(val);
                                                }
                                            }}
                                            className="absolute inset-0 z-20 h-2 w-full appearance-none bg-transparent outline-none cursor-pointer touch-manipulation [&::-webkit-slider-runnable-track]:h-0 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-20 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/40 [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-amber-400 [&::-webkit-slider-thumb]:via-rose-500 [&::-webkit-slider-thumb]:to-violet-600 [&::-webkit-slider-thumb]:shadow-[0_4px_12px_rgba(249,115,22,0.6)] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:hover:border-white/60 [&::-webkit-slider-thumb]:hover:shadow-[0_6px_16px_rgba(249,115,22,0.8)] [&::-webkit-slider-thumb]:active:scale-105 sm:[&::-webkit-slider-thumb]:h-5 sm:[&::-webkit-slider-thumb]:w-5 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white/40 [&::-moz-range-thumb]:bg-gradient-to-br [&::-moz-range-thumb]:from-amber-400 [&::-moz-range-thumb]:via-rose-500 [&::-moz-range-thumb]:to-violet-600 [&::-moz-range-thumb]:shadow-[0_4px_12px_rgba(249,115,22,0.6)] [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-200 [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:hover:border-white/60 sm:[&::-moz-range-thumb]:h-5 sm:[&::-moz-range-thumb]:w-5"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between px-1 text-xs">
                                        <span className="text-white/80">Min: {localAgeMin}</span>
                                        <span className="text-white/80">Max: {localAgeMax}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Last Active Dropdown */}
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2 sm:rounded-3xl sm:p-5 sm:space-y-3">
                                <Label className="text-xs uppercase tracking-[0.3em] text-white/55">Last Active</Label>
                                <Select value={localLastActive} onValueChange={handleLastActiveChange}>
                                    <SelectTrigger className="h-auto w-full border-white/20 bg-white/5 py-2.5 text-sm text-white placeholder:text-white/50 focus:border-white/35 focus:bg-white/10 focus:ring-amber-500/40">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-white/20 bg-neutral-900 text-white">
                                        {filters.lastActiveOptions.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
                                                className="focus:bg-white/10 focus:text-white"
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Distance Range Dropdown */}
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2 sm:rounded-3xl sm:p-5 sm:space-y-3">
                                <Label className="text-xs uppercase tracking-[0.3em] text-white/55">Distance Range</Label>
                                <Select 
                                    value={localDistanceKm?.toString() ?? '50'} 
                                    onValueChange={handleDistanceChange}
                                >
                                    <SelectTrigger className="h-auto w-full border-white/20 bg-white/5 py-2.5 text-sm text-white placeholder:text-white/50 focus:border-white/35 focus:bg-white/10 focus:ring-amber-500/40">
                                        <SelectValue placeholder="Select distance" />
                                    </SelectTrigger>
                                    <SelectContent className="border-white/20 bg-neutral-900 text-white">
                                        <SelectItem
                                            value="any"
                                            className="focus:bg-white/10 focus:text-white"
                                        >
                                            Any distance
                                        </SelectItem>
                                        {filters.distanceOptions.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value.toString()}
                                                className="focus:bg-white/10 focus:text-white"
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            </div>

                            {/* Row 3: Hashtags */}
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2 sm:rounded-3xl sm:p-5 sm:space-y-3">
                                <Label className="text-xs uppercase tracking-[0.3em] text-white/55">Hashtags</Label>
                                {localSelectedHashtagIds.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {localSelectedHashtagIds.map((hashtagId) => {
                                            const hashtag = filters.hashtags.find((tag) => tag.id === hashtagId);
                                            if (!hashtag) return null;
                                            return (
                                                <Badge
                                                    key={hashtagId}
                                                    className="flex items-center gap-1 rounded-full border border-amber-400/60 bg-amber-400/15 px-2.5 py-1 text-xs font-medium text-amber-200 sm:px-3"
                                                >
                                                    #{hashtag.name}
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleHashtag(hashtagId)}
                                                        className="ml-1 rounded-full p-0.5 hover:bg-amber-400/30 touch-manipulation"
                                                        aria-label="Remove hashtag"
                                                    >
                                                        <X className="size-3" />
                                                    </button>
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                )}
                                <Input
                                    type="text"
                                    placeholder="Search hashtags..."
                                    value={hashtagSearch}
                                    onChange={(e) => setHashtagSearch(e.target.value)}
                                    className="border-white/20 bg-white/5 text-sm text-white placeholder:text-white/50 focus:border-white/35 focus:bg-white/10"
                                />
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto touch-manipulation">
                                    {filteredHashtags.map((hashtag) => {
                                        const isSelected = localSelectedHashtagIds.includes(hashtag.id);
                                        return (
                                            <button
                                                key={hashtag.id}
                                                type="button"
                                                onClick={() => toggleHashtag(hashtag.id)}
                                                className={cn(
                                                    'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                                                    isSelected
                                                        ? 'border-amber-400/60 bg-amber-400/15 text-amber-200'
                                                        : 'border-white/20 bg-white/5 text-white/80 hover:border-white/35 hover:bg-white/10 hover:text-white',
                                                )}
                                            >
                                                #{hashtag.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Row 4: Circles */}
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2 sm:rounded-3xl sm:p-5 sm:space-y-3">
                                <Label className="text-xs uppercase tracking-[0.3em] text-white/55">Circles</Label>
                                {localSelectedCircleIds.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {localSelectedCircleIds.map((circleId) => {
                                            const circle = filters.circles.find((c) => c.id === circleId);
                                            if (!circle) return null;
                                            return (
                                                <Badge
                                                    key={circleId}
                                                    className="flex items-center gap-1 rounded-full border border-amber-400/60 bg-amber-400/15 px-2.5 py-1 text-xs font-medium text-amber-200 sm:px-3"
                                                >
                                                    {circle.name}
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleCircle(circleId)}
                                                        className="ml-1 rounded-full p-0.5 hover:bg-amber-400/30 touch-manipulation"
                                                        aria-label="Remove circle"
                                                    >
                                                        <X className="size-3" />
                                                    </button>
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto touch-manipulation">
                                    {filters.circles.slice(0, 30).map((circle) => {
                                        const isSelected = localSelectedCircleIds.includes(circle.id);
                                        return (
                                            <button
                                                key={circle.id}
                                                type="button"
                                                onClick={() => toggleCircle(circle.id)}
                                                className={cn(
                                                    'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                                                    isSelected
                                                        ? 'border-amber-400/60 bg-amber-400/15 text-amber-200'
                                                        : 'border-white/20 bg-white/5 text-white/80 hover:border-white/35 hover:bg-white/10 hover:text-white',
                                                )}
                                            >
                                                {circle.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
};

const ProfileCard = ({
    profile,
}: {
    profile: RadarProfile;
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
        <Card className={cn(
            "!py-2 group flex h-full flex-col border-white/10 bg-white/5 text-white shadow-[0_32px_85px_-40px_rgba(249,115,22,0.45)] transition hover:border-amber-400/35 hover:bg-white/10",
            profile.is_boosting && "border-amber-400/50 bg-gradient-to-br from-amber-400/10 via-amber-300/5 to-amber-400/10 shadow-[0_32px_85px_-40px_rgba(251,191,36,0.65)] ring-2 ring-amber-400/30 hover:border-amber-400/70 hover:shadow-[0_32px_85px_-40px_rgba(251,191,36,0.75)]"
        )}>
            <CardContent className="flex flex-1 flex-col gap-4 p-4">
                <Link 
                    href={profileRoutes.show.url(profile.username)}
                    className="relative block overflow-hidden rounded-3xl border border-white/10 bg-black/40 transition-all hover:border-white/20"
                >
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
                    {profile.is_boosting ? (
                        <div className="absolute top-4 right-4">
                            <Badge className="flex items-center gap-1 rounded-full border border-amber-400/60 bg-amber-400/15 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-amber-200 shadow-[0_4px_16px_-8px_rgba(251,191,36,0.4)]">
                                <Zap className="size-3" />
                                Boosted
                            </Badge>
                        </div>
                    ) : (
                        <div className="absolute top-4 right-4">
                            <Badge className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-white/80">
                                {profile.mutuals} mutuals
                            </Badge>
                        </div>
                    )}
                    <div className="absolute bottom-4 left-4 flex items-center gap-3">
                        <Link 
                            href={profileRoutes.show.url(profile.username)}
                            className={cn(
                                "relative block h-16 w-16 overflow-hidden rounded-3xl border-4 shadow-[0_18px_45px_-20px_rgba(249,115,22,0.5)] transition-transform hover:scale-105",
                                profile.is_boosting 
                                    ? "border-amber-400/60 shadow-[0_18px_45px_-20px_rgba(251,191,36,0.7)] ring-2 ring-amber-400/40" 
                                    : "border-neutral-950"
                            )}
                            onClick={(e) => e.stopPropagation()}
                        >
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
                        </Link>
                        <div>
                            <h3 className="text-base font-semibold text-white">
                                {profile.display_name}
                            </h3>
                            <span className="text-xs text-white/70">
                                @{profile.username}
                            </span>
                        </div>
                    </div>
                </Link>

                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        {profile.pronouns ? (
                            <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-white/80">
                                {profile.pronouns}
                            </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-white/80">
                            <RadarIcon className="size-3" />
                            {profile.distance_km.toFixed(1)} km
                        </span>
                        <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-white/80">
                            {profile.last_seen}
                        </span>
                        {profile.circles > 0 ? (
                            <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-white/80">
                                {profile.circles} {profile.circles === 1 ? 'circle' : 'circles'}
                            </span>
                        ) : null}
                        {profile.mutuals > 0 ? (
                            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-emerald-200">
                                {profile.mutuals} {profile.mutuals === 1 ? 'mutual' : 'mutuals'}
                            </span>
                        ) : null}
                    </div>
                    
                    {profile.vibe ? (
                        <p className="line-clamp-2 text-sm leading-relaxed text-white/70">
                            {profile.vibe}
                        </p>
                    ) : null}
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


