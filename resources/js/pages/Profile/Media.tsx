import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useLightbox } from '@/components/feed/lightbox-context';
import LightboxViewer from '@/components/feed/lightbox-viewer';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import profileRoutes from '@/routes/profile';
import type { FeedMedia, FeedPost } from '@/types/feed';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Loader2, Plane } from 'lucide-react';

type MediaItem = {
    id: number;
    url: string;
    thumbnail_url?: string | null;
    optimized_url?: string | null;
    blur_url?: string | null;
    mime_type?: string | null;
    is_video: boolean;
    post_id: number;
    width?: number | null;
    height?: number | null;
    post?: FeedPost | null;
};

type ProfileUser = {
    id: number;
    username: string;
    display_name?: string | null;
    avatar_url?: string | null;
};

type MediaPageProps = {
    user: ProfileUser;
    media: {
        data: MediaItem[];
        meta: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    };
    mediaPageName: string;
    mediaPerPage: number;
};

const ITEMS_PER_PAGE = 30;
const BUFFER_SIZE = 60; // Keep 60 items in memory (2 pages worth)
const CLEANUP_THRESHOLD = 90; // Clean up when we have more than 90 items

export default function ProfileMedia({
    user: initialUser,
    media: initialMedia,
    mediaPageName,
    mediaPerPage: _mediaPerPage,
}: MediaPageProps) {
    const { openLightbox: _openLightbox } = useLightbox();
    const { props } = usePage<{
        user: ProfileUser;
        media: typeof initialMedia;
    }>();
    const currentMedia = (props as any)?.media ?? initialMedia;
    const currentUser = (props as any)?.user ?? initialUser;

    const [pages, setPages] = useState<Array<{ data: MediaItem[]; meta: any }>>(
        [currentMedia],
    );
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxMedia, setLightboxMedia] = useState<FeedMedia[]>([]);
    const [lightboxStartIndex, setLightboxStartIndex] = useState(0);
    const [lightboxPost, setLightboxPost] = useState<FeedPost | null>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [visibleRange, setVisibleRange] = useState({
        start: 0,
        end: ITEMS_PER_PAGE,
    });
    const [imageDimensions, setImageDimensions] = useState<
        Map<number, { width: number; height: number }>
    >(new Map());
    const gridRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(1024);

    // Update pages when new media comes in from Inertia
    useEffect(() => {
        if (currentMedia && currentMedia.meta.current_page > 1) {
            setPages((prev) => {
                // Check if this page already exists
                const exists = prev.some(
                    (p) =>
                        p.meta.current_page === currentMedia.meta.current_page,
                );
                if (!exists) {
                    const updated = [...prev, currentMedia];
                    // Cleanup: remove oldest pages if we have too many
                    if (updated.length * ITEMS_PER_PAGE > CLEANUP_THRESHOLD) {
                        return updated.slice(
                            -Math.ceil(BUFFER_SIZE / ITEMS_PER_PAGE),
                        );
                    }
                    return updated;
                }
                return prev;
            });
        } else if (currentMedia && currentMedia.meta.current_page === 1) {
            // Reset to first page
            setPages([currentMedia]);
        }
    }, [currentMedia]);

    // Flatten all media items from all pages
    const allMedia = useMemo(() => {
        return pages.flatMap((page) => page.data);
    }, [pages]);

    const hasMore = useMemo(() => {
        const lastPage = pages[pages.length - 1];
        if (!lastPage) {
            return false;
        }
        return lastPage.meta.current_page < lastPage.meta.last_page;
    }, [pages]);

    // Virtualization: only render items in visible range
    const visibleMedia = useMemo(() => {
        return allMedia.slice(visibleRange.start, visibleRange.end);
    }, [allMedia, visibleRange]);

    // Convert MediaItem to FeedMedia format
    const convertToFeedMedia = useCallback((item: MediaItem): FeedMedia => {
        return {
            id: item.id,
            url: item.url,
            type:
                item.mime_type ?? (item.is_video ? 'video/mp4' : 'image/jpeg'),
            alt: null,
            thumbnail_url: item.thumbnail_url ?? null,
            optimized_url: item.optimized_url ?? null,
            blur_url: item.blur_url ?? null,
        };
    }, []);

    // Load more media
    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) {
            return;
        }

        setIsLoadingMore(true);

        try {
            const lastPage = pages[pages.length - 1];
            const nextPage = lastPage.meta.current_page + 1;

            await router.get(
                window.location.pathname,
                { [mediaPageName]: nextPage },
                {
                    only: ['media'],
                    preserveState: true,
                    preserveScroll: false,
                    onSuccess: (page) => {
                        const newPage = (page.props as any)?.media;
                        if (newPage) {
                            setPages((prev) => {
                                const updated = [...prev, newPage];
                                // Cleanup: remove oldest pages if we have too many
                                if (
                                    updated.length * ITEMS_PER_PAGE >
                                    CLEANUP_THRESHOLD
                                ) {
                                    return updated.slice(
                                        -Math.ceil(
                                            BUFFER_SIZE / ITEMS_PER_PAGE,
                                        ),
                                    );
                                }
                                return updated;
                            });
                        }
                    },
                },
            );
        } catch (error) {
            console.error('Failed to load more media:', error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [isLoadingMore, hasMore, pages, mediaPageName]);

    // Handle media click - open lightbox
    const handleMediaClick = useCallback(
        (index: number) => {
            const clickedItem = allMedia[index];
            if (!clickedItem) {
                return;
            }

            // Convert all media to FeedMedia format
            const feedMedia = allMedia.map(convertToFeedMedia);

            setLightboxMedia(feedMedia);
            setLightboxStartIndex(index);
            setLightboxPost(clickedItem.post ?? null);
            setLightboxOpen(true);
        },
        [allMedia, convertToFeedMedia],
    );

    // Intersection observer for infinite scroll
    useEffect(() => {
        if (!sentinelRef.current || !hasMore) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && !isLoadingMore) {
                    void loadMore();
                }
            },
            { rootMargin: '400px' },
        );

        const element = sentinelRef.current;
        observer.observe(element);

        return () => {
            observer.unobserve(element);
        };
    }, [hasMore, isLoadingMore, loadMore]);

    // Calculate item height based on aspect ratio
    const _getItemHeight = useCallback(
        (item: MediaItem, columnWidth: number): number => {
            if (item.width && item.height) {
                const aspectRatio = item.width / item.height;
                return columnWidth / aspectRatio;
            }
            // Fallback: assume square or common aspect ratios
            return columnWidth * 1.2; // Slightly taller than square
        },
        [],
    );

    // Handle image load to get actual dimensions
    const handleImageLoad = useCallback(
        (item: MediaItem, event: React.SyntheticEvent<HTMLImageElement>) => {
            const img = event.currentTarget;
            if (img.naturalWidth && img.naturalHeight) {
                setImageDimensions((prev) => {
                    const updated = new Map(prev);
                    updated.set(item.id, {
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                    });
                    return updated;
                });
            }
        },
        [],
    );

    // Track container width for responsive layout
    useEffect(() => {
        const updateWidth = () => {
            const grid = gridRef.current;
            if (!grid) {
                return;
            }

            // The grid has w-full class, so its offsetWidth should be the content width
            // But we need to account for the fact it's inside a padded container
            // Get the parent (the padded div) and calculate content width
            const parent = grid.parentElement;
            if (parent) {
                const styles = window.getComputedStyle(parent);
                const paddingLeft = parseFloat(styles.paddingLeft) || 0;
                const paddingRight = parseFloat(styles.paddingRight) || 0;
                // offsetWidth includes padding, so we get the content width
                const contentWidth =
                    parent.offsetWidth - paddingLeft - paddingRight;
                setContainerWidth(Math.max(contentWidth, 0));
            } else {
                // Fallback: use grid's own width
                setContainerWidth(Math.max(grid.offsetWidth, 0));
            }
        };

        // Initial update
        const timeoutId = setTimeout(updateWidth, 100);

        const resizeObserver = new ResizeObserver(updateWidth);
        const container = containerRef.current;
        if (container) {
            resizeObserver.observe(container);
        }

        window.addEventListener('resize', updateWidth);

        return () => {
            clearTimeout(timeoutId);
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateWidth);
        };
    }, []);

    // Calculate masonry layout positions
    const masonryLayout = useMemo(() => {
        if (allMedia.length === 0) {
            return new Map<
                number,
                { top: number; left: number; height: number; width: number }
            >();
        }

        const gap = 16; // gap-4 = 16px
        const columns =
            containerWidth >= 1024 ? 3 : containerWidth >= 640 ? 2 : 1;
        // Ensure we don't exceed container width
        const availableWidth = Math.max(containerWidth, 0);
        const columnWidth = Math.floor(
            (availableWidth - gap * (columns - 1)) / columns,
        );

        const columnHeights = new Array(columns).fill(0);
        const positions = new Map<
            number,
            { top: number; left: number; height: number; width: number }
        >();

        allMedia.forEach((item) => {
            // Find the shortest column
            const shortestColumnIndex = columnHeights.indexOf(
                Math.min(...columnHeights),
            );

            // Calculate height based on actual dimensions or aspect ratio
            const dimensions = imageDimensions.get(item.id);
            let height: number;
            if (dimensions) {
                const aspectRatio = dimensions.width / dimensions.height;
                height = columnWidth / aspectRatio;
            } else if (item.width && item.height) {
                const aspectRatio = item.width / item.height;
                height = columnWidth / aspectRatio;
            } else {
                // Fallback height
                height = columnWidth * 1.2;
            }

            // Minimum and maximum heights for better layout
            const minHeight = columnWidth * 0.8;
            const maxHeight = columnWidth * 2.5;
            height = Math.max(minHeight, Math.min(maxHeight, height));

            const top = columnHeights[shortestColumnIndex];
            const left = shortestColumnIndex * (columnWidth + gap);

            positions.set(item.id, { top, left, height, width: columnWidth });
            columnHeights[shortestColumnIndex] += height + gap;
        });

        return positions;
    }, [allMedia, imageDimensions, containerWidth]);

    // Scroll-based virtualization with masonry
    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        const handleScroll = () => {
            const scrollTop = container.scrollTop;
            const containerHeight = container.clientHeight;
            const viewportTop = scrollTop;
            const viewportBottom = scrollTop + containerHeight;

            // Calculate which items are visible based on masonry positions
            const visibleItems: number[] = [];
            masonryLayout.forEach((position, itemId) => {
                const itemTop = position.top;
                const itemBottom = itemTop + position.height;

                // Check if item intersects viewport (with buffer)
                const buffer = 500; // Render items 500px before and after viewport
                if (
                    itemBottom >= viewportTop - buffer &&
                    itemTop <= viewportBottom + buffer
                ) {
                    const index = allMedia.findIndex(
                        (item) => item.id === itemId,
                    );
                    if (index >= 0) {
                        visibleItems.push(index);
                    }
                }
            });

            if (visibleItems.length > 0) {
                const start = Math.max(0, Math.min(...visibleItems) - 10);
                const end = Math.min(
                    allMedia.length,
                    Math.max(...visibleItems) + 10,
                );
                setVisibleRange({ start, end });
            }
        };

        container.addEventListener('scroll', handleScroll);
        handleScroll(); // Initial calculation

        // Also recalculate on window resize
        const handleResize = () => {
            handleScroll();
        };
        window.addEventListener('resize', handleResize);

        return () => {
            container.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, [allMedia, masonryLayout]);

    return (
        <AppLayout>
            <Head
                title={`${currentUser.display_name ?? currentUser.username} - Media`}
            />

            <div className="flex min-h-screen flex-col">
                {/* Header */}
                <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur-xl">
                    <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                router.visit(
                                    profileRoutes.show.url(
                                        currentUser.username,
                                    ),
                                );
                            }}
                            className="text-white/70 hover:text-white"
                        >
                            <ArrowLeft className="mr-2 size-4" />
                            Back to Profile
                        </Button>
                        <div className="flex-1">
                            <h1 className="text-lg font-semibold text-white">
                                {currentUser.display_name ??
                                    currentUser.username}
                            </h1>
                            <p className="text-sm text-white/60">
                                Media Gallery
                            </p>
                        </div>
                    </div>
                </header>

                {/* Media Grid */}
                <div
                    ref={containerRef}
                    className="flex-1 overflow-x-hidden overflow-y-auto"
                    style={{ height: 'calc(100vh - 80px)' }}
                >
                    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                        {allMedia.length === 0 ? (
                            <div className="py-16 text-center">
                                <p className="text-white/60">
                                    No media available
                                </p>
                            </div>
                        ) : (
                            <div
                                ref={gridRef}
                                className="relative w-full overflow-hidden"
                                style={{
                                    minHeight:
                                        Math.max(
                                            ...Array.from(
                                                masonryLayout.values(),
                                            ).map(
                                                (pos) => pos.top + pos.height,
                                            ),
                                            0,
                                        ) || 'auto',
                                    maxWidth: '100%',
                                }}
                            >
                                {visibleMedia.map((item, relativeIndex) => {
                                    const absoluteIndex =
                                        visibleRange.start + relativeIndex;
                                    const isVideo = item.is_video;
                                    const position = masonryLayout.get(item.id);

                                    if (!position) {
                                        return null;
                                    }

                                    return (
                                        <button
                                            key={`${item.id}-${absoluteIndex}`}
                                            type="button"
                                            onClick={() => {
                                                handleMediaClick(absoluteIndex);
                                            }}
                                            className="group absolute overflow-hidden rounded-lg border border-white/10 bg-black/40 transition hover:border-white/20"
                                            style={{
                                                left: `${position.left}px`,
                                                top: `${position.top}px`,
                                                width: `${position.width}px`,
                                                height: `${position.height}px`,
                                            }}
                                        >
                                            {isVideo ? (
                                                <>
                                                    {item.thumbnail_url ? (
                                                        <img
                                                            src={
                                                                item.thumbnail_url
                                                            }
                                                            alt="Video thumbnail"
                                                            className="size-full object-cover"
                                                            loading="lazy"
                                                            onLoad={(e) => {
                                                                handleImageLoad(
                                                                    item,
                                                                    e,
                                                                );
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="flex size-full items-center justify-center bg-gradient-to-br from-black/50 to-black/30">
                                                            <Plane className="size-8 text-white/40" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                                                        <div className="rounded-full bg-black/60 p-3">
                                                            <Plane className="size-5 text-white" />
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <img
                                                    src={
                                                        item.optimized_url ??
                                                        item.thumbnail_url ??
                                                        item.url
                                                    }
                                                    alt="Media"
                                                    className="size-full object-cover transition group-hover:scale-105"
                                                    loading="lazy"
                                                    onLoad={(e) => {
                                                        handleImageLoad(
                                                            item,
                                                            e,
                                                        );
                                                    }}
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Loading sentinel */}
                        {hasMore && (
                            <div
                                ref={sentinelRef}
                                className="flex items-center justify-center py-8"
                            >
                                {isLoadingMore && (
                                    <Loader2 className="size-6 animate-spin text-white/60" />
                                )}
                            </div>
                        )}

                        {/* End of content indicator */}
                        {!hasMore && allMedia.length > 0 && (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-3">
                                    <CheckCircle2 className="size-5 text-white/60" />
                                    <p className="text-sm font-medium text-white/70">
                                        You've reached the end
                                    </p>
                                </div>
                                <p className="mt-3 text-sm text-white/50">
                                    {allMedia.length}{' '}
                                    {allMedia.length === 1 ? 'item' : 'items'}{' '}
                                    total
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lightbox Viewer */}
            <LightboxViewer
                media={lightboxMedia}
                open={lightboxOpen}
                onOpenChange={setLightboxOpen}
                startIndex={lightboxStartIndex}
                post={lightboxPost}
            />
        </AppLayout>
    );
}
