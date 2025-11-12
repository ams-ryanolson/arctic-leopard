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
    2: 'grid-cols-1 sm:grid-cols-2 sm:auto-rows-fr',
    3: 'grid-cols-1 sm:grid-cols-6 sm:auto-rows-[150px]',
    4: 'grid-cols-1 sm:grid-cols-2 sm:auto-rows-[180px]',
    5: 'grid-cols-1 sm:grid-cols-6 sm:auto-rows-[140px]',
    6: 'grid-cols-1 sm:grid-cols-6 sm:auto-rows-[140px]',
};

const figureLayout = (index: number, total: number): string => {
    if (total <= 1) {
        return 'sm:col-span-1 sm:row-span-1 sm:aspect-[16/9]';
    }

    if (total === 2) {
        return 'sm:col-span-1 sm:row-span-1 sm:aspect-[4/5]';
    }

    if (total === 3) {
        if (index === 0) {
            return 'sm:col-span-4 sm:row-span-2';
        }

        return 'sm:col-span-2 sm:row-span-1';
    }

    if (total === 4) {
        return 'sm:col-span-1 sm:row-span-1 sm:aspect-[4/5]';
    }

    if (total === 5) {
        if (index === 0) {
            return 'sm:col-span-4 sm:row-span-2';
        }

        if (index === 1) {
            return 'sm:col-span-2 sm:row-span-2';
        }

        return 'sm:col-span-2 sm:row-span-1';
    }

    if (total >= 6) {
        if (index === 0) {
            return 'sm:col-span-4 sm:row-span-2';
        }

        if (index === 1) {
            return 'sm:col-span-2 sm:row-span-2';
        }

        return 'sm:col-span-2 sm:row-span-1';
    }

    return '';
};

export default function FeedMediaGallery({
    media,
    className,
    post,
    onMediaClick,
}: FeedMediaGalleryProps) {
    if (!media.length) {
        return null;
    }

    const visibleMedia = media.slice(0, MAX_MEDIA_ITEMS);
    const visibleCount = visibleMedia.length;
    const overflowCount = media.length - visibleCount;

    if (!visibleCount) {
        return null;
    }

    const containerLayout = layoutByCount[visibleCount] ?? layoutByCount[MAX_MEDIA_ITEMS];
    const handleSelect = (index: number) => {
        if (typeof onMediaClick === 'function') {
            onMediaClick(index);
        }
    };

    return (
        <div className={cn('mt-4 grid gap-3 sm:grid-flow-dense', containerLayout, className)}>
            {visibleMedia.map((item, index) => {
                const clickable = typeof onMediaClick === 'function';
                const itemIsVideo = isVideo(item);
                const previewSource = itemIsVideo
                    ? item.thumbnail_url ?? item.url
                    : item.url;
                const label =
                    item.alt ??
                    `View ${post?.author?.display_name ?? 'media'} ${itemIsVideo ? 'clip' : 'image'} ${index + 1} of ${media.length}`;
                const showOverflowNotice = overflowCount > 0 && index === visibleMedia.length - 1;

                return (
                    <figure
                        key={item.id ?? item.url}
                        className={cn(
                            'group relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-black/30 sm:aspect-auto sm:h-full',
                            clickable &&
                                'cursor-zoom-in transition hover:border-white/30 hover:bg-white/10 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white/40',
                            figureLayout(index, visibleCount),
                        )}
                        role={clickable ? 'button' : undefined}
                        tabIndex={clickable ? 0 : undefined}
                        aria-label={clickable ? label : undefined}
                        onClick={clickable ? () => handleSelect(index) : undefined}
                        onKeyDown={
                            clickable
                                ? (event) => {
                                      if (event.key === 'Enter' || event.key === ' ') {
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
                                alt={item.alt ?? (itemIsVideo ? 'Post video thumbnail' : 'Post media')}
                                className={cn(
                                    'h-full w-full object-cover',
                                    clickable && 'pointer-events-none',
                                )}
                                loading="lazy"
                                draggable={false}
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-black/50 text-xs uppercase tracking-[0.3em] text-white/60">
                                No preview
                            </div>
                        )}

                        {itemIsVideo && (
                            // Temporary placeholder until inline video playback ships. This keeps drops visible.
                            <div className="absolute inset-0 flex items-end justify-start bg-gradient-to-t from-black/70 via-black/10 to-transparent p-3">
                                <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/60 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-white/80">
                                    <Play className="size-3" />
                                    Video
                                </span>
                            </div>
                        )}

                        {showOverflowNotice && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white/90">
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
