import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCard } from '@/components/users/user-card';
import { useInitials } from '@/hooks/use-initials';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    Calendar,
    Circle,
    Hash,
    Search,
    Sparkles,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useCallback } from 'react';

type SearchResult = {
    type: 'user' | 'event' | 'circle' | 'hashtag';
    id: number;
    username?: string;
    display_name?: string;
    avatar_url?: string;
    cover_url?: string;
    pronouns?: string | null;
    bio?: string | null;
    title?: string;
    slug?: string;
    description?: string;
    name?: string;
    tagline?: string;
    usage_count?: number;
    recent_usage_count?: number;
    starts_at?: string;
};

interface SearchIndexProps {
    query: string;
    type?: string | null;
    users: SearchResult[];
    events: SearchResult[];
    circles: SearchResult[];
    hashtags: SearchResult[];
}

export default function SearchIndex({
    query,
    type,
    users,
    events,
    circles,
    hashtags,
}: SearchIndexProps) {
    const getInitials = useInitials();
    const activeTab = type || 'all';

    const handleTabChange = useCallback(
        (value: string) => {
            const params = new URLSearchParams();
            if (query) {
                params.set('q', query);
            }
            if (value !== 'all') {
                params.set('type', value);
            }
            router.visit(`/search?${params.toString()}`, {
                preserveScroll: true,
            });
        },
        [query],
    );

    const hasResults =
        users.length > 0 ||
        events.length > 0 ||
        circles.length > 0 ||
        hashtags.length > 0;

    const allResultsCount =
        users.length + events.length + circles.length + hashtags.length;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Search', href: '/search' },
            ]}
            contentClassName="max-w-7xl"
        >
            <Head
                title={`Search${query ? `: ${query}` : ''} · Real Kink Men`}
            />

            <div className="flex gap-6 lg:gap-8">
                {/* Main Content - Center */}
                <div className="min-w-0 flex-1">
                    <div className="space-y-6">
                        {/* Search Header */}
                        <div className="sticky top-0 z-10 -mx-3 -mt-4 border-b border-white/10 bg-black/80 px-3 pt-4 pb-4 backdrop-blur-xl sm:-mx-4 sm:px-4 md:-mx-8 md:px-8">
                            <div className="space-y-4">
                                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                                    {query ? (
                                        <>
                                            Search results for{' '}
                                            <span className="text-amber-400">
                                                "{query}"
                                            </span>
                                        </>
                                    ) : (
                                        'Explore'
                                    )}
                                </h1>

                                {query && (
                                    <Tabs
                                        value={activeTab}
                                        onValueChange={handleTabChange}
                                    >
                                        <TabsList className="inline-flex h-10 items-center justify-start rounded-lg border border-white/10 bg-white/5 p-1">
                                            <TabsTrigger
                                                value="all"
                                                className="rounded-md px-4 text-sm font-medium data-[state=active]:bg-white/10 data-[state=active]:text-white"
                                            >
                                                All
                                                {allResultsCount > 0 && (
                                                    <span className="ml-2 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                                                        {allResultsCount}
                                                    </span>
                                                )}
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="users"
                                                className="rounded-md px-4 text-sm font-medium data-[state=active]:bg-white/10 data-[state=active]:text-white"
                                            >
                                                Users
                                                {users.length > 0 && (
                                                    <span className="ml-2 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                                                        {users.length}
                                                    </span>
                                                )}
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="events"
                                                className="rounded-md px-4 text-sm font-medium data-[state=active]:bg-white/10 data-[state=active]:text-white"
                                            >
                                                Events
                                                {events.length > 0 && (
                                                    <span className="ml-2 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                                                        {events.length}
                                                    </span>
                                                )}
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="circles"
                                                className="rounded-md px-4 text-sm font-medium data-[state=active]:bg-white/10 data-[state=active]:text-white"
                                            >
                                                Circles
                                                {circles.length > 0 && (
                                                    <span className="ml-2 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                                                        {circles.length}
                                                    </span>
                                                )}
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="hashtags"
                                                className="rounded-md px-4 text-sm font-medium data-[state=active]:bg-white/10 data-[state=active]:text-white"
                                            >
                                                Hashtags
                                                {hashtags.length > 0 && (
                                                    <span className="ml-2 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                                                        {hashtags.length}
                                                    </span>
                                                )}
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                )}
                            </div>
                        </div>

                        {/* Results Content */}
                        {query ? (
                            <Tabs
                                value={activeTab}
                                onValueChange={handleTabChange}
                            >
                                <TabsContent value="all" className="mt-0">
                                    {hasResults ? (
                                        <div className="space-y-8">
                                            {users.length > 0 && (
                                                <section>
                                                    <h2 className="mb-4 text-lg font-semibold text-white">
                                                        Users
                                                    </h2>
                                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                                                        {users.map((user) => (
                                                            <UserResultCard
                                                                key={`user-${user.id}`}
                                                                user={user}
                                                            />
                                                        ))}
                                                    </div>
                                                </section>
                                            )}

                                            {events.length > 0 && (
                                                <section>
                                                    <h2 className="mb-4 text-lg font-semibold text-white">
                                                        Events
                                                    </h2>
                                                    <div className="space-y-2">
                                                        {events.map((event) => (
                                                            <EventResultCard
                                                                key={`event-${event.id}`}
                                                                event={event}
                                                            />
                                                        ))}
                                                    </div>
                                                </section>
                                            )}

                                            {circles.length > 0 && (
                                                <section>
                                                    <h2 className="mb-4 text-lg font-semibold text-white">
                                                        Circles
                                                    </h2>
                                                    <div className="space-y-2">
                                                        {circles.map(
                                                            (circle) => (
                                                                <CircleResultCard
                                                                    key={`circle-${circle.id}`}
                                                                    circle={
                                                                        circle
                                                                    }
                                                                />
                                                            ),
                                                        )}
                                                    </div>
                                                </section>
                                            )}

                                            {hashtags.length > 0 && (
                                                <section>
                                                    <h2 className="mb-4 text-lg font-semibold text-white">
                                                        Hashtags
                                                    </h2>
                                                    <div className="space-y-2">
                                                        {hashtags.map(
                                                            (hashtag) => (
                                                                <HashtagResultCard
                                                                    key={`hashtag-${hashtag.id}`}
                                                                    hashtag={
                                                                        hashtag
                                                                    }
                                                                />
                                                            ),
                                                        )}
                                                    </div>
                                                </section>
                                            )}
                                        </div>
                                    ) : (
                                        <EmptyState query={query} />
                                    )}
                                </TabsContent>

                                <TabsContent value="users" className="mt-0">
                                    {users.length > 0 ? (
                                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                                            {users.map((user) => (
                                                <UserResultCard
                                                    key={`user-${user.id}`}
                                                    user={user}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <EmptyState
                                            query={query}
                                            type="users"
                                        />
                                    )}
                                </TabsContent>

                                <TabsContent value="events" className="mt-0">
                                    {events.length > 0 ? (
                                        <div className="space-y-2">
                                            {events.map((event) => (
                                                <EventResultCard
                                                    key={`event-${event.id}`}
                                                    event={event}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <EmptyState
                                            query={query}
                                            type="events"
                                        />
                                    )}
                                </TabsContent>

                                <TabsContent value="circles" className="mt-0">
                                    {circles.length > 0 ? (
                                        <div className="space-y-2">
                                            {circles.map((circle) => (
                                                <CircleResultCard
                                                    key={`circle-${circle.id}`}
                                                    circle={circle}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <EmptyState
                                            query={query}
                                            type="circles"
                                        />
                                    )}
                                </TabsContent>

                                <TabsContent value="hashtags" className="mt-0">
                                    {hashtags.length > 0 ? (
                                        <div className="space-y-2">
                                            {hashtags.map((hashtag) => (
                                                <HashtagResultCard
                                                    key={`hashtag-${hashtag.id}`}
                                                    hashtag={hashtag}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <EmptyState
                                            query={query}
                                            type="hashtags"
                                        />
                                    )}
                                </TabsContent>
                            </Tabs>
                        ) : (
                            <div className="space-y-8">
                                <div>
                                    <h2 className="mb-2 text-xl font-semibold text-white">
                                        Popular Now
                                    </h2>
                                    <p className="text-sm text-white/60">
                                        Discover trending users, events,
                                        circles, and hashtags
                                    </p>
                                </div>

                                {hasResults ? (
                                    <div className="space-y-8">
                                        {users.length > 0 && (
                                            <section>
                                                <h3 className="mb-4 text-lg font-semibold text-white/80">
                                                    Popular Users
                                                </h3>
                                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                                                    {users.map((user) => (
                                                        <UserResultCard
                                                            key={`user-${user.id}`}
                                                            user={user}
                                                        />
                                                    ))}
                                                </div>
                                            </section>
                                        )}

                                        {events.length > 0 && (
                                            <section>
                                                <h3 className="mb-4 text-lg font-semibold text-white/80">
                                                    Upcoming Events
                                                </h3>
                                                <div className="space-y-2">
                                                    {events.map((event) => (
                                                        <EventResultCard
                                                            key={`event-${event.id}`}
                                                            event={event}
                                                        />
                                                    ))}
                                                </div>
                                            </section>
                                        )}

                                        {circles.length > 0 && (
                                            <section>
                                                <h3 className="mb-4 text-lg font-semibold text-white/80">
                                                    Popular Circles
                                                </h3>
                                                <div className="space-y-2">
                                                    {circles.map((circle) => (
                                                        <CircleResultCard
                                                            key={`circle-${circle.id}`}
                                                            circle={circle}
                                                        />
                                                    ))}
                                                </div>
                                            </section>
                                        )}

                                        {hashtags.length > 0 && (
                                            <section>
                                                <h3 className="mb-4 text-lg font-semibold text-white/80">
                                                    Trending Hashtags
                                                </h3>
                                                <div className="space-y-2">
                                                    {hashtags.map((hashtag) => (
                                                        <HashtagResultCard
                                                            key={`hashtag-${hashtag.id}`}
                                                            hashtag={hashtag}
                                                        />
                                                    ))}
                                                </div>
                                            </section>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <Search className="mb-4 size-12 text-white/40" />
                                        <p className="text-lg text-white/60">
                                            No popular content available at the
                                            moment
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar */}
                <aside className="hidden w-80 shrink-0 lg:block">
                    <div className="sticky top-4 space-y-4">
                        {/* Search Tips - Moved to top */}
                        <Card className="border-white/10 bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-blue-500/10 backdrop-blur-xl">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
                                    <Sparkles className="size-4 text-amber-400" />
                                    Search Tips
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-2.5 text-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-amber-500/20 text-amber-400">
                                            <span className="text-xs font-semibold">
                                                @
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">
                                                Search users
                                            </p>
                                            <p className="mt-0.5 text-xs text-white/60">
                                                Type @username to find specific
                                                profiles
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-purple-500/20 text-purple-400">
                                            <Hash className="size-3.5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">
                                                Find hashtags
                                            </p>
                                            <p className="mt-0.5 text-xs text-white/60">
                                                Type #hashtag to discover
                                                trending topics
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-blue-500/20 text-blue-400">
                                            <Search className="size-3.5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">
                                                General search
                                            </p>
                                            <p className="mt-0.5 text-xs text-white/60">
                                                Search across users, events,
                                                circles, and hashtags
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Trending Hashtags */}
                        {hashtags.length > 0 && (
                            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
                                        <TrendingUp className="size-4 text-amber-400" />
                                        Trending Hashtags
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {hashtags.slice(0, 5).map((hashtag) => (
                                        <Link
                                            key={hashtag.id}
                                            href={`/hashtags/${hashtag.slug}`}
                                            className="group flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-white/5"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Hash className="size-4 shrink-0 text-purple-400" />
                                                    <span className="font-medium text-white">
                                                        #{hashtag.name}
                                                    </span>
                                                </div>
                                                {hashtag.recent_usage_count !==
                                                    undefined &&
                                                    hashtag.recent_usage_count >
                                                        0 && (
                                                        <p className="mt-1 text-xs text-white/60">
                                                            {
                                                                hashtag.recent_usage_count
                                                            }{' '}
                                                            posts in last 24h
                                                        </p>
                                                    )}
                                            </div>
                                            <ArrowRight className="ml-2 size-4 shrink-0 text-white/40 opacity-0 transition-opacity group-hover:opacity-100" />
                                        </Link>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Popular Users */}
                        {users.length > 0 && (
                            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
                                        <Users className="size-4 text-blue-400" />
                                        Popular Users
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {users.slice(0, 5).map((user) => {
                                        const displayName =
                                            user.display_name ||
                                            user.username ||
                                            'User';
                                        const initials =
                                            getInitials(displayName);
                                        return (
                                            <Link
                                                key={user.id}
                                                href={`/p/${user.username}`}
                                                className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-white/5"
                                            >
                                                <Avatar className="size-10 shrink-0 border border-white/10">
                                                    {user.avatar_url ? (
                                                        <AvatarImage
                                                            src={
                                                                user.avatar_url
                                                            }
                                                            alt={displayName}
                                                        />
                                                    ) : null}
                                                    <AvatarFallback className="bg-gradient-to-br from-amber-400/70 via-rose-500/70 to-violet-600/70 text-xs font-semibold text-white">
                                                        {initials}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium text-white">
                                                        {displayName}
                                                    </p>
                                                    {user.username && (
                                                        <p className="text-xs text-white/60">
                                                            @{user.username}
                                                        </p>
                                                    )}
                                                </div>
                                                <ArrowRight className="ml-2 size-4 shrink-0 text-white/40 opacity-0 transition-opacity group-hover:opacity-100" />
                                            </Link>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        )}

                        {/* Upcoming Events */}
                        {events.length > 0 && (
                            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
                                        <Calendar className="size-4 text-amber-400" />
                                        Upcoming Events
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {events.slice(0, 5).map((event) => (
                                        <Link
                                            key={event.id}
                                            href={`/events/${event.slug}`}
                                            className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-white/5"
                                        >
                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-amber-500/20 text-amber-400">
                                                <Calendar className="size-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-white">
                                                    {event.title}
                                                </p>
                                                {event.description && (
                                                    <p className="mt-1 line-clamp-2 text-xs text-white/60">
                                                        {event.description}
                                                    </p>
                                                )}
                                            </div>
                                            <ArrowRight className="mt-1 ml-2 size-4 shrink-0 text-white/40 opacity-0 transition-opacity group-hover:opacity-100" />
                                        </Link>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Popular Circles */}
                        {circles.length > 0 && (
                            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
                                        <Circle className="size-4 text-emerald-400" />
                                        Popular Circles
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {circles.slice(0, 5).map((circle) => (
                                        <Link
                                            key={circle.id}
                                            href={`/circles/${circle.slug}`}
                                            className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-white/5"
                                        >
                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-emerald-500/20 text-emerald-400">
                                                <Circle className="size-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-white">
                                                    {circle.name}
                                                </p>
                                                {circle.tagline && (
                                                    <p className="mt-1 line-clamp-2 text-xs text-white/60">
                                                        {circle.tagline}
                                                    </p>
                                                )}
                                            </div>
                                            <ArrowRight className="mt-1 ml-2 size-4 shrink-0 text-white/40 opacity-0 transition-opacity group-hover:opacity-100" />
                                        </Link>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </aside>
            </div>
        </AppLayout>
    );
}

function UserResultCard({ user }: { user: SearchResult }) {
    return (
        <UserCard
            user={{
                id: user.id,
                username: user.username || '',
                display_name: user.display_name || user.username || 'User',
                avatar_url: user.avatar_url || null,
                cover_url: user.cover_url || null,
                pronouns: user.pronouns || null,
                bio: user.bio || null,
            }}
            showFollowButton={true}
        />
    );
}

function EventResultCard({ event }: { event: SearchResult }) {
    return (
        <Link href={`/events/${event.slug}`}>
            <Card className="group border-white/10 bg-white/5 transition-all hover:border-white/20 hover:bg-white/10">
                <CardContent className="flex items-start gap-4 p-4">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border-2 border-white/20 bg-amber-500/20 text-amber-400">
                        <Calendar className="size-7" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white">
                            {event.title}
                        </p>
                        {event.description && (
                            <p className="mt-1.5 line-clamp-2 text-sm text-white/60">
                                {event.description}
                            </p>
                        )}
                    </div>
                    <ArrowRight className="mt-1 ml-auto size-5 shrink-0 text-white/40 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                </CardContent>
            </Card>
        </Link>
    );
}

function CircleResultCard({ circle }: { circle: SearchResult }) {
    return (
        <Link href={`/circles/${circle.slug}`}>
            <Card className="group border-white/10 bg-white/5 transition-all hover:border-white/20 hover:bg-white/10">
                <CardContent className="flex items-start gap-4 p-4">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border-2 border-white/20 bg-emerald-500/20 text-emerald-400">
                        <Circle className="size-7" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white">
                            {circle.name}
                        </p>
                        {circle.tagline && (
                            <p className="mt-1.5 line-clamp-2 text-sm text-white/60">
                                {circle.tagline}
                            </p>
                        )}
                    </div>
                    <ArrowRight className="mt-1 ml-auto size-5 shrink-0 text-white/40 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                </CardContent>
            </Card>
        </Link>
    );
}

function HashtagResultCard({ hashtag }: { hashtag: SearchResult }) {
    return (
        <Link href={`/hashtags/${hashtag.slug}`}>
            <Card className="group border-white/10 bg-white/5 transition-all hover:border-white/20 hover:bg-white/10">
                <CardContent className="flex items-start gap-4 p-4">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border-2 border-white/20 bg-purple-500/20 text-purple-400">
                        <Hash className="size-7" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white">
                            #{hashtag.name}
                        </p>
                        {hashtag.recent_usage_count !== undefined &&
                            hashtag.recent_usage_count > 0 && (
                                <div className="mt-1.5 flex items-center gap-1.5 text-sm text-white/60">
                                    <TrendingUp className="size-3.5" />
                                    <span>
                                        {hashtag.recent_usage_count} posts in
                                        last 24h
                                    </span>
                                </div>
                            )}
                    </div>
                    <ArrowRight className="mt-1 ml-auto size-5 shrink-0 text-white/40 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                </CardContent>
            </Card>
        </Link>
    );
}

function EmptyState({ query, type }: { query: string; type?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <Search className="size-8 text-white/40" />
            </div>
            <p className="text-lg font-semibold text-white">
                No {type ? type : 'results'} found
            </p>
            <p className="mt-2 text-sm text-white/60">
                Try searching for something else or check your spelling
            </p>
        </div>
    );
}
