import { useCallback, useEffect, useMemo, useState } from 'react';

import { router } from '@inertiajs/react';
import {
    Hash,
    Search,
    Users,
    Calendar,
    Circle,
    ArrowRight,
    TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
// Using direct URL since wayfinder routes may not be generated yet

export interface SearchResult {
    type: 'user' | 'event' | 'circle' | 'hashtag';
    id: number;
    username?: string;
    display_name?: string;
    avatar_url?: string;
    title?: string;
    slug?: string;
    description?: string;
    name?: string;
    tagline?: string;
    usage_count?: number;
    recent_usage_count?: number;
}

interface SearchDropdownProps {
    query: string;
    isOpen: boolean;
    onClose: () => void;
    onSelect?: (result: SearchResult) => void;
}

const AUTocomplete_URL = '/api/search/autocomplete';

export function SearchDropdown({
    query,
    isOpen,
    onClose,
    onSelect,
}: SearchDropdownProps) {
    const getInitials = useInitials();
    const [results, setResults] = useState<{
        users: SearchResult[];
        events: SearchResult[];
        circles: SearchResult[];
        hashtags: SearchResult[];
    }>({
        users: [],
        events: [],
        circles: [],
        hashtags: [],
    });
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    useEffect(() => {
        if (!isOpen || query.length < 2) {
            setResults({
                users: [],
                events: [],
                circles: [],
                hashtags: [],
            });
            setSelectedIndex(-1);
            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const url = new URL(AUTocomplete_URL, window.location.origin);
                url.searchParams.set('q', query);

                const response = await fetch(url.toString(), {
                    signal: controller.signal,
                    headers: {
                        Accept: 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch search results');
                }

                const data = await response.json();
                setResults({
                    users: data.users?.data || [],
                    events: data.events?.data || [],
                    circles: data.circles?.data || [],
                    hashtags: data.hashtags?.data || [],
                });
                setSelectedIndex(-1);
            } catch (error) {
                if (error instanceof Error && error.name !== 'AbortError') {
                    console.error('Search error:', error);
                }
            } finally {
                setIsLoading(false);
            }
        }, 350);

        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [query, isOpen]);

    const allResults = useMemo(() => {
        const flat: Array<SearchResult & { section: string }> = [];
        if (results.users.length > 0) {
            flat.push(...results.users.map((r) => ({ ...r, section: 'users' })));
        }
        if (results.events.length > 0) {
            flat.push(...results.events.map((r) => ({ ...r, section: 'events' })));
        }
        if (results.circles.length > 0) {
            flat.push(...results.circles.map((r) => ({ ...r, section: 'circles' })));
        }
        if (results.hashtags.length > 0) {
            flat.push(...results.hashtags.map((r) => ({ ...r, section: 'hashtags' })));
        }
        return flat;
    }, [results]);

    const handleSelect = useCallback(
        (result: SearchResult) => {
            if (onSelect) {
                onSelect(result);
            }

            // Navigate to result
            if (result.type === 'user' && result.username) {
                router.visit(`/p/${result.username}`);
            } else if (result.type === 'event' && result.slug) {
                router.visit(`/events/${result.slug}`);
            } else if (result.type === 'circle' && result.slug) {
                router.visit(`/circles/${result.slug}`);
            } else if (result.type === 'hashtag' && result.slug) {
                router.visit(`/hashtags/${result.slug}`);
            }

            onClose();
        },
        [onClose, onSelect],
    );

    const handleViewAll = useCallback(() => {
        router.visit(`/search?q=${encodeURIComponent(query)}`);
        onClose();
    }, [query, onClose]);

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (!isOpen || allResults.length === 0) {
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSelectedIndex((prev) =>
                prev < allResults.length - 1 ? prev + 1 : prev,
            );
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        } else if (event.key === 'Enter' && selectedIndex >= 0) {
            event.preventDefault();
            handleSelect(allResults[selectedIndex]);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
        }
    };

    const hasResults =
        results.users.length > 0 ||
        results.events.length > 0 ||
        results.circles.length > 0 ||
        results.hashtags.length > 0;

    const showDropdown = isOpen && (hasResults || isLoading || query.length >= 2);

    if (!showDropdown) {
        return null;
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'user':
                return Users;
            case 'event':
                return Calendar;
            case 'circle':
                return Circle;
            case 'hashtag':
                return Hash;
            default:
                return Search;
        }
    };

    const getIconColor = (type: string) => {
        switch (type) {
            case 'user':
                return 'bg-blue-500/20 text-blue-400';
            case 'event':
                return 'bg-amber-500/20 text-amber-400';
            case 'circle':
                return 'bg-emerald-500/20 text-emerald-400';
            case 'hashtag':
                return 'bg-purple-500/20 text-purple-400';
            default:
                return 'bg-white/10 text-white/60';
        }
    };

    return (
        <div
            className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-amber-400/30 bg-black/95 backdrop-blur-xl shadow-[0_28px_85px_-58px_rgba(249,115,22,0.5)] ring-1 ring-amber-400/20"
            onKeyDown={handleKeyDown}
        >
            {isLoading && (
                <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-white/60">
                    <Spinner className="size-4" />
                    <span>Searching...</span>
                </div>
            )}

            {!isLoading && hasResults && (
                <div className="max-h-[28rem] overflow-y-auto">
                    {results.users.length > 0 && (
                        <div>
                            <div className="sticky top-0 border-b border-white/5 bg-black/50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white/50 backdrop-blur-sm">
                                Users
                            </div>
                            {results.users.map((result) => {
                                const globalIdx = allResults.findIndex(
                                    (r) => r.id === result.id && r.type === result.type,
                                );
                                const displayName =
                                    result.display_name || result.username || 'User';
                                const initials = getInitials(displayName);

                                return (
                                    <button
                                        key={`user-${result.id}`}
                                        type="button"
                                        className={cn(
                                            'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                                            selectedIndex === globalIdx
                                                ? 'bg-white/10'
                                                : 'hover:bg-white/5',
                                        )}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => handleSelect(result)}
                                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                                    >
                                        <Avatar className="size-10 shrink-0 border border-white/10">
                                            {result.avatar_url ? (
                                                <AvatarImage
                                                    src={result.avatar_url}
                                                    alt={displayName}
                                                />
                                            ) : null}
                                            <AvatarFallback className="bg-gradient-to-br from-amber-400/70 via-rose-500/70 to-violet-600/70 text-xs font-semibold text-white">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-semibold text-white">
                                                {displayName}
                                            </div>
                                            {result.username && (
                                                <div className="text-xs text-white/60">
                                                    @{result.username}
                                                </div>
                                            )}
                                        </div>
                                        <Users className="ml-auto size-4 shrink-0 text-white/40" />
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {results.events.length > 0 && (
                        <div>
                            <div className="sticky top-0 border-b border-white/5 bg-black/50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white/50 backdrop-blur-sm">
                                Events
                            </div>
                            {results.events.map((result) => {
                                const globalIdx = allResults.findIndex(
                                    (r) => r.id === result.id && r.type === result.type,
                                );
                                const Icon = getIcon(result.type);

                                return (
                                    <button
                                        key={`event-${result.id}`}
                                        type="button"
                                        className={cn(
                                            'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                                            selectedIndex === globalIdx
                                                ? 'bg-white/10'
                                                : 'hover:bg-white/5',
                                        )}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => handleSelect(result)}
                                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                                    >
                                        <div
                                            className={cn(
                                                'flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10',
                                                getIconColor(result.type),
                                            )}
                                        >
                                            <Icon className="size-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-semibold text-white">
                                                {result.title}
                                            </div>
                                            {result.description && (
                                                <div className="line-clamp-1 mt-0.5 text-xs text-white/60">
                                                    {result.description}
                                                </div>
                                            )}
                                        </div>
                                        <Calendar className="ml-auto size-4 shrink-0 text-white/40" />
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {results.circles.length > 0 && (
                        <div>
                            <div className="sticky top-0 border-b border-white/5 bg-black/50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white/50 backdrop-blur-sm">
                                Circles
                            </div>
                            {results.circles.map((result) => {
                                const globalIdx = allResults.findIndex(
                                    (r) => r.id === result.id && r.type === result.type,
                                );
                                const Icon = getIcon(result.type);

                                return (
                                    <button
                                        key={`circle-${result.id}`}
                                        type="button"
                                        className={cn(
                                            'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                                            selectedIndex === globalIdx
                                                ? 'bg-white/10'
                                                : 'hover:bg-white/5',
                                        )}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => handleSelect(result)}
                                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                                    >
                                        <div
                                            className={cn(
                                                'flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10',
                                                getIconColor(result.type),
                                            )}
                                        >
                                            <Icon className="size-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-semibold text-white">
                                                {result.name}
                                            </div>
                                            {result.tagline && (
                                                <div className="line-clamp-1 mt-0.5 text-xs text-white/60">
                                                    {result.tagline}
                                                </div>
                                            )}
                                        </div>
                                        <Circle className="ml-auto size-4 shrink-0 text-white/40" />
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {results.hashtags.length > 0 && (
                        <div>
                            <div className="sticky top-0 border-b border-white/5 bg-black/50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white/50 backdrop-blur-sm">
                                Hashtags
                            </div>
                            {results.hashtags.map((result) => {
                                const globalIdx = allResults.findIndex(
                                    (r) => r.id === result.id && r.type === result.type,
                                );
                                const Icon = getIcon(result.type);

                                return (
                                    <button
                                        key={`hashtag-${result.id}`}
                                        type="button"
                                        className={cn(
                                            'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                                            selectedIndex === globalIdx
                                                ? 'bg-white/10'
                                                : 'hover:bg-white/5',
                                        )}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => handleSelect(result)}
                                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                                    >
                                        <div
                                            className={cn(
                                                'flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10',
                                                getIconColor(result.type),
                                            )}
                                        >
                                            <Icon className="size-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-semibold text-white">
                                                #{result.name}
                                            </div>
                                            {result.recent_usage_count !== undefined &&
                                                result.recent_usage_count > 0 && (
                                                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-white/60">
                                                        <TrendingUp className="size-3" />
                                                        <span>
                                                            {result.recent_usage_count} posts
                                                            in last 24h
                                                        </span>
                                                    </div>
                                                )}
                                        </div>
                                        <Hash className="ml-auto size-4 shrink-0 text-white/40" />
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {query.length >= 2 && (
                        <div className="border-t border-white/10 bg-white/5">
                            <button
                                type="button"
                                onClick={handleViewAll}
                                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-white/10"
                            >
                                <div className="flex items-center gap-2">
                                    <Search className="size-4 text-white/60" />
                                    <span className="font-medium text-white">
                                        View all results for "{query}"
                                    </span>
                                </div>
                                <ArrowRight className="size-4 text-white/60" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {!isLoading && !hasResults && query.length >= 2 && (
                <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                    <Search className="mb-2 size-8 text-white/40" />
                    <p className="text-sm font-medium text-white/80">
                        No results found
                    </p>
                    <p className="mt-1 text-xs text-white/60">
                        Try searching for something else
                    </p>
                </div>
            )}
        </div>
    );
}
