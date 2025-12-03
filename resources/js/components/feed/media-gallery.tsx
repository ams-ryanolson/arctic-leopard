import { cn } from '@/lib/utils';
import type { FeedMedia, FeedPost } from '@/types/feed';
import { Play } from 'lucide-react';

type FeedMediaGalleryProps = {
    media: FeedMedia[];
    className?: string;
    post?: FeedPost | null;
    onMediaClick?: (index: number) => void;
};

const MAX_MEDIA_ITEMS = 6;

const isVideo = (media: FeedMedia): boolean =>
    typeof media.type === 'string' && media.type.startsWith('video/');

const layoutByCount: Record<number, string> = {
    1: 'grid-cols-1 sm:grid-cols-1 sm:auto-rows-fr',
    2: 'grid-cols-2 sm:grid-cols-2 sm:auto-rows-fr',
    3: 'grid-cols-2 sm:grid-cols-6 sm:auto-rows-[150px]',
    4: 'grid-cols-2 sm:grid-cols-2 sm:auto-rows-[180px]',
    5: 'grid-cols-2 sm:grid-cols-6 sm:auto-rows-[140px]',
    6: 'grid-cols-2 sm:grid-cols-6 sm:auto-rows-[140px]',
};

const figureLayout = (index: number, total: number): string => {
    // Mobile: 2-column layout, max 3 visible
    // Desktop: complex grid layout
    if (total <= 1) {
        return 'col-span-1 sm:col-span-1 sm:row-span-1 sm:aspect-[16/9]';
    }

    if (total === 2) {
        return 'col-span-1 sm:col-span-1 sm:row-span-1 sm:aspect-[4/5]';
    }

    // For 3 images (or when showing 3 on mobile even if more exist)
    if (total === 3) {
        // Mobile: first 2 side by side, 3rd spans full width below
        if (index === 0) {
            return 'col-span-1 sm:col-span-4 sm:row-span-2';
        }
        if (index === 1) {
            return 'col-span-1 sm:col-span-2 sm:row-span-2';
        }
        // 3rd image spans full width on mobile
        return 'col-span-2 sm:col-span-2 sm:row-span-1';
    }

    if (total === 4) {
        // Mobile: 2x2 grid
        return 'col-span-1 sm:col-span-1 sm:row-span-1 sm:aspect-[4/5]';
    }

    if (total === 5) {
        // Mobile: first 2 side by side, then 3 more in 2 columns
        if (index === 0) {
            return 'col-span-1 sm:col-span-4 sm:row-span-2';
        }
        if (index === 1) {
            return 'col-span-1 sm:col-span-2 sm:row-span-2';
        }
        return 'col-span-1 sm:col-span-2 sm:row-span-1';
    }

    if (total >= 6) {
        // Mobile: first 2 side by side, then 3 more in 2 columns
        if (index === 0) {
            return 'col-span-1 sm:col-span-4 sm:row-span-2';
        }
        if (index === 1) {
            return 'col-span-1 sm:col-span-2 sm:row-span-2';
        }
        return 'col-span-1 sm:col-span-2 sm:row-span-1';
    }

    return '';
};

export default function FeedMediaGallery({
    media,
    className,
    post,
    onMediaClick,
}: FeedMediaGalleryProps) {
    if (!media || !Array.isArray(media) || media.length === 0) {
        return null;
    }

    // On mobile, show max 3 images (2 wide + 1 with overlay)
    // On desktop, show up to MAX_MEDIA_ITEMS
    const mobileMaxItems = 3;
    const visibleMedia = media.slice(0, MAX_MEDIA_ITEMS);
    const mobileVisibleMedia = media.slice(0, mobileMaxItems);
    const visibleCount = visibleMedia.length;
    const mobileVisibleCount = Math.min(visibleCount, mobileMaxItems);
    const overflowCount = media.length - visibleCount;
    const mobileOverflowCount =
        media.length > mobileMaxItems ? media.length - mobileMaxItems : 0;

    if (!visibleCount) {
        return null;
    }

    // Use mobile count for layout, but show all items on desktop
    const containerLayout =
        layoutByCount[mobileVisibleCount] ?? layoutByCount[mobileMaxItems];
    const handleSelect = (index: number) => {
        if (typeof onMediaClick === 'function') {
            onMediaClick(index);
        }
    };

    return (
        <div
            className={cn(
                'mt-3 grid gap-2 sm:mt-4 sm:grid-flow-dense sm:gap-3',
                containerLayout,
                className,
            )}
        >
            {visibleMedia.map((item, index) => {
                const clickable = typeof onMediaClick === 'function';
                const itemIsVideo = isVideo(item);
                const previewSource = itemIsVideo
                    ? (item.thumbnail_url ?? item.url)
                    : (item.optimized_url ?? item.url);
                const label =
                    item.alt ??
                    `View ${post?.author?.display_name ?? 'media'} ${itemIsVideo ? 'clip' : 'image'} ${index + 1} of ${media.length}`;

                // Show overflow notice on desktop (last visible item)
                const showOverflowNotice =
                    overflowCount > 0 && index === visibleMedia.length - 1;

                // Show mobile overflow notice on 3rd image if there are more than 3 images
                const showMobileOverflowNotice =
                    mobileOverflowCount > 0 && index === mobileMaxItems - 1;

                // Hide items beyond 3 on mobile
                const isMobileHidden = index >= mobileMaxItems;
                // Use mobileVisibleCount for layout (which caps at 3 for mobile)
                const layoutCount = mobileVisibleCount;
                // On mobile, if this is the 3rd image (index 2) and there are more images, make it full width
                const isLastMobileImage =
                    index === mobileMaxItems - 1 && mobileOverflowCount > 0;

                return (
                    <figure
                        key={item.id ?? item.url}
                        className={cn(
                            'group relative aspect-[16/9] max-h-[230px] overflow-hidden rounded-xl border border-white/10 bg-black/30 sm:aspect-auto sm:h-full sm:max-h-none sm:rounded-2xl',
                            clickable &&
                                'cursor-zoom-in transition hover:border-white/30 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-hidden active:scale-[0.98]',
                            figureLayout(index, layoutCount),
                            isLastMobileImage && 'col-span-2 sm:col-span-2',
                            isMobileHidden && 'hidden sm:block',
                        )}
                        role={clickable ? 'button' : undefined}
                        tabIndex={clickable ? 0 : undefined}
                        aria-label={clickable ? label : undefined}
                        onClick={
                            clickable ? () => handleSelect(index) : undefined
                        }
                        onKeyDown={
                            clickable
                                ? (event) => {
                                      if (
                                          event.key === 'Enter' ||
                                          event.key === ' '
                                      ) {
                                          event.preventDefault();
                                          handleSelect(index);
                                      }
                                  }
                                : undefined
                        }
                    >
                        {previewSource ? (
                            <img
                                src={previewSource}
                                alt={
                                    item.alt ??
                                    (itemIsVideo
                                        ? 'Post video thumbnail'
                                        : 'Post media')
                                }
                                className={cn(
                                    'h-full w-full object-cover',
                                    clickable && 'pointer-events-none',
                                )}
                                loading="lazy"
                                draggable={false}
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-black/50 text-xs tracking-[0.3em] text-white/60 uppercase">
                                No preview
                            </div>
                        )}

                        {itemIsVideo && (
                            // Temporary placeholder until inline video playback ships. This keeps drops visible.
                            <div className="absolute inset-0 flex items-end justify-start bg-gradient-to-t from-black/70 via-black/10 to-transparent p-2 sm:p-3">
                                <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/60 px-1.5 py-0.5 text-[0.6rem] font-semibold tracking-[0.25em] text-white/80 uppercase sm:px-2 sm:py-1 sm:text-[0.65rem] sm:tracking-[0.3em]">
                                    <Play className="size-2.5 sm:size-3" />
                                    Video
                                </span>
                            </div>
                        )}

                        {showMobileOverflowNotice && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white/90 sm:hidden">
                                <span className="rounded-full border border-white/30 bg-black/60 px-3 py-1.5 text-xs font-semibold">
                                    +{mobileOverflowCount}
                                </span>
                            </div>
                        )}
                        {showOverflowNotice && (
                            <div className="absolute inset-0 hidden items-center justify-center bg-black/70 text-white/90 sm:flex">
                                <span className="rounded-full border border-white/30 bg-black/60 px-4 py-2 text-sm font-semibold">
                                    +{overflowCount}
                                </span>
                            </div>
                        )}
                    </figure>
                );
            })}
        </div>
    );
}
