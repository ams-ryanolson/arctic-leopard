import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { Eye, Radio, Search } from 'lucide-react';
import { useCallback, useState } from 'react';

interface Stream {
    id: number;
    uuid: string;
    title: string;
    description: string | null;
    category: string;
    viewer_count: number;
    started_at: string | null;
    user: {
        id: number;
        username: string;
        display_name: string | null;
        avatar_url: string | null;
    };
}

interface BrowseProps {
    streams: Stream[];
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    categories: Array<{ name: string; value: string }>;
    filters: {
        category?: string;
        search?: string;
        visibility?: string;
    };
}

export default function Browse({
    streams,
    pagination,
    categories,
    filters: initialFilters,
}: BrowseProps) {
    const { auth, features: sharedFeatures } = usePage<SharedData>().props;
    const features = (sharedFeatures ?? {}) as Record<string, boolean>;
    const liveStreamingEnabled = features?.live_streaming ?? false;
    const user = auth?.user;

    const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
    const [categoryFilter, setCategoryFilter] = useState(
        initialFilters.category || 'all',
    );
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = useCallback(() => {
        setIsSearching(true);
        router.get(
            '/live',
            {
                search: searchQuery || undefined,
                category: categoryFilter !== 'all' ? categoryFilter : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsSearching(false),
            },
        );
    }, [searchQuery, categoryFilter]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        },
        [handleSearch],
    );

    return (
        <AppLayout>
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h1 className="mb-2 text-3xl font-bold text-white">
                                Live Streams
                            </h1>
                            <p className="text-white/60">
                                {pagination.total}{' '}
                                {pagination.total === 1 ? 'stream' : 'streams'}{' '}
                                live now
                            </p>
                        </div>
                        {liveStreamingEnabled && user && (
                            <Link href="/live/broadcast/start">
                                <Button className="gap-2">
                                    <Radio className="size-4" />
                                    Go Live
                                </Button>
                            </Link>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
                            <Input
                                type="search"
                                placeholder="Search streams..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="border-white/20 bg-white/10 pl-10 text-white placeholder:text-white/40"
                            />
                        </div>
                        <Select
                            value={categoryFilter}
                            onValueChange={setCategoryFilter}
                        >
                            <SelectTrigger className="w-full border-white/20 bg-white/10 text-white sm:w-[200px]">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All Categories
                                </SelectItem>
                                {categories.map((category) => (
                                    <SelectItem
                                        key={category.value}
                                        value={category.value}
                                    >
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={handleSearch}
                            disabled={isSearching}
                            variant="secondary"
                        >
                            {isSearching ? 'Searching...' : 'Search'}
                        </Button>
                    </div>
                </div>

                {/* Streams Grid */}
                {streams.length === 0 ? (
                    <Card className="border-white/10 bg-white/5">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Radio className="mb-4 size-16 text-white/20" />
                            <h3 className="mb-2 text-xl font-semibold text-white">
                                No Live Streams
                            </h3>
                            <p className="mb-6 text-center text-white/60">
                                There are no streams live right now. Check back
                                later or start your own stream!
                            </p>
                            {liveStreamingEnabled && user && (
                                <Link href="/live/broadcast/start">
                                    <Button>Go Live</Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {streams.map((stream) => (
                            <Link
                                key={stream.id}
                                href={`/live/${stream.uuid}`}
                                className="group"
                            >
                                <Card className="cursor-pointer overflow-hidden border-white/10 bg-white/5 transition-all duration-200 hover:scale-[1.02] hover:border-white/30">
                                    <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-rose-500/20 to-violet-600/20">
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                            <Radio className="size-16 text-white/40" />
                                        </div>
                                        <div className="absolute top-2 left-2">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">
                                                <span className="relative flex size-2">
                                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                                                    <span className="relative inline-flex size-2 rounded-full bg-white"></span>
                                                </span>
                                                LIVE
                                            </span>
                                        </div>
                                        <div className="absolute bottom-2 left-2 flex items-center gap-2 text-white">
                                            <Eye className="size-4" />
                                            <span className="text-sm font-medium">
                                                {stream.viewer_count.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <CardHeader>
                                        <div className="flex items-start gap-3">
                                            {stream.user.avatar_url ? (
                                                <img
                                                    src={stream.user.avatar_url}
                                                    alt={
                                                        stream.user
                                                            .display_name ||
                                                        stream.user.username
                                                    }
                                                    className="size-10 rounded-full border border-white/20"
                                                />
                                            ) : (
                                                <div className="flex size-10 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-amber-400/70 via-rose-500/70 to-violet-600/70">
                                                    <span className="text-xs font-semibold text-white">
                                                        {(
                                                            stream.user
                                                                .display_name ||
                                                            stream.user.username
                                                        )
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <CardTitle className="line-clamp-2 text-white transition-colors group-hover:text-amber-400">
                                                    {stream.title}
                                                </CardTitle>
                                                <CardDescription className="mt-1 text-white/60">
                                                    {stream.user.display_name ||
                                                        stream.user.username}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        {stream.description && (
                                            <CardDescription className="mt-2 line-clamp-2 text-white/60">
                                                {stream.description}
                                            </CardDescription>
                                        )}
                                        <div className="mt-2">
                                            <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-1 text-xs text-white/70 capitalize">
                                                {stream.category.replace(
                                                    '_',
                                                    ' ',
                                                )}
                                            </span>
                                        </div>
                                    </CardHeader>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination.last_page > 1 && (
                    <div className="mt-8 flex justify-center gap-2">
                        <Button
                            variant="outline"
                            disabled={pagination.current_page === 1}
                            onClick={() =>
                                router.get('/live', {
                                    ...initialFilters,
                                    page: pagination.current_page - 1,
                                })
                            }
                        >
                            Previous
                        </Button>
                        <span className="flex items-center px-4 text-white/60">
                            Page {pagination.current_page} of{' '}
                            {pagination.last_page}
                        </span>
                        <Button
                            variant="outline"
                            disabled={
                                pagination.current_page === pagination.last_page
                            }
                            onClick={() =>
                                router.get('/live', {
                                    ...initialFilters,
                                    page: pagination.current_page + 1,
                                })
                            }
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
