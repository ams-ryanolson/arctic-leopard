import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePage, router, Link } from '@inertiajs/react';
import { Radio, Search, Eye, Users } from 'lucide-react';
import { type SharedData } from '@/types';
import { useState, useCallback } from 'react';

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

export default function Browse({ streams, pagination, categories, filters: initialFilters }: BrowseProps) {
    const { auth, features: sharedFeatures } = usePage<SharedData>().props;
    const features = (sharedFeatures ?? {}) as Record<string, boolean>;
    const liveStreamingEnabled = features?.live_streaming ?? false;
    const user = auth?.user;

    const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
    const [categoryFilter, setCategoryFilter] = useState(initialFilters.category || 'all');
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
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Live Streams</h1>
                            <p className="text-white/60">
                                {pagination.total} {pagination.total === 1 ? 'stream' : 'streams'} live now
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
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
                            <Input
                                type="search"
                                placeholder="Search streams..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                            />
                        </div>
                        <Select
                            value={categoryFilter}
                            onValueChange={setCategoryFilter}
                        >
                            <SelectTrigger className="w-full sm:w-[200px] bg-white/10 border-white/20 text-white">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map((category) => (
                                    <SelectItem key={category.value} value={category.value}>
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
                    <Card className="bg-white/5 border-white/10">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Radio className="size-16 text-white/20 mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">No Live Streams</h3>
                            <p className="text-white/60 text-center mb-6">
                                There are no streams live right now. Check back later or start your own stream!
                            </p>
                            {liveStreamingEnabled && user && (
                                <Link href="/live/broadcast/start">
                                    <Button>Go Live</Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {streams.map((stream) => (
                            <Link
                                key={stream.id}
                                href={`/live/${stream.uuid}`}
                                className="group"
                            >
                                <Card className="bg-white/5 border-white/10 hover:border-white/30 transition-all duration-200 hover:scale-[1.02] cursor-pointer overflow-hidden">
                                    <div className="relative aspect-video bg-gradient-to-br from-rose-500/20 to-violet-600/20 flex items-center justify-center">
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
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
                                                    alt={stream.user.display_name || stream.user.username}
                                                    className="size-10 rounded-full border border-white/20"
                                                />
                                            ) : (
                                                <div className="size-10 rounded-full bg-gradient-to-br from-amber-400/70 via-rose-500/70 to-violet-600/70 flex items-center justify-center border border-white/20">
                                                    <span className="text-xs font-semibold text-white">
                                                        {(stream.user.display_name || stream.user.username)
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-white group-hover:text-amber-400 transition-colors line-clamp-2">
                                                    {stream.title}
                                                </CardTitle>
                                                <CardDescription className="text-white/60 mt-1">
                                                    {stream.user.display_name || stream.user.username}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        {stream.description && (
                                            <CardDescription className="text-white/60 line-clamp-2 mt-2">
                                                {stream.description}
                                            </CardDescription>
                                        )}
                                        <div className="mt-2">
                                            <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-1 text-xs text-white/70 capitalize">
                                                {stream.category.replace('_', ' ')}
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
                            onClick={() => router.get('/live', { ...initialFilters, page: pagination.current_page - 1 })}
                        >
                            Previous
                        </Button>
                        <span className="flex items-center px-4 text-white/60">
                            Page {pagination.current_page} of {pagination.last_page}
                        </span>
                        <Button
                            variant="outline"
                            disabled={pagination.current_page === pagination.last_page}
                            onClick={() => router.get('/live', { ...initialFilters, page: pagination.current_page + 1 })}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

