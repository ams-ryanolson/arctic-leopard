import StoryCreatorModal from '@/components/stories/story-creator-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type StoryItem = {
    id: number;
    username: string;
    display_name: string;
    avatar_url: string | null;
    latest_story_preview: string | null;
    story_count: number;
    has_new_stories: boolean;
    first_story_id: number | null;
};

type StoriesSectionProps = {
    stories?: StoryItem[];
    onStoryClick?: (storyId: number) => void;
    audiences?: Array<{ value: string; label: string }>;
};

export default function StoriesSection({
    stories = [],
    onStoryClick,
    audiences,
}: StoriesSectionProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [isCreatorOpen, setIsCreatorOpen] = useState(false);

    const checkScrollPosition = () => {
        if (!scrollContainerRef.current) {
            return;
        }

        const { scrollLeft, scrollWidth, clientWidth } =
            scrollContainerRef.current;
        const isAtStart = scrollLeft <= 0;
        const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 1; // -1 for rounding errors

        setCanScrollLeft(!isAtStart);
        setCanScrollRight(!isAtEnd);
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) {
            return;
        }

        // Check initial position
        checkScrollPosition();

        // Check on scroll
        container.addEventListener('scroll', checkScrollPosition);

        // Check on resize (in case content changes or window resizes)
        const resizeObserver = new ResizeObserver(() => {
            checkScrollPosition();
        });
        resizeObserver.observe(container);

        return () => {
            container.removeEventListener('scroll', checkScrollPosition);
            resizeObserver.disconnect();
        };
    }, []);

    const handleScroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) {
            return;
        }

        const scrollAmount = 300;
        const currentScroll = scrollContainerRef.current.scrollLeft;
        const newScroll =
            direction === 'left'
                ? currentScroll - scrollAmount
                : currentScroll + scrollAmount;

        scrollContainerRef.current.scrollTo({
            left: newScroll,
            behavior: 'smooth',
        });
    };

    // Always show the section so users can create their own story

    return (
        <Card className="border-white/10 bg-white/5 text-white">
            <CardContent className="p-px">
                <div className="relative">
                    {/* Scroll buttons */}
                    {canScrollLeft && (
                        <button
                            onClick={() => {
                                handleScroll('left');
                            }}
                            className="absolute top-1/2 left-0 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/60 p-2 text-white/80 backdrop-blur-sm transition hover:bg-black/80 hover:text-white"
                            aria-label="Scroll left"
                        >
                            <svg
                                className="size-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </button>
                    )}
                    {canScrollRight && (
                        <button
                            onClick={() => {
                                handleScroll('right');
                            }}
                            className="absolute top-1/2 right-0 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/60 p-2 text-white/80 backdrop-blur-sm transition hover:bg-black/80 hover:text-white"
                            aria-label="Scroll right"
                        >
                            <svg
                                className="size-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </button>
                    )}

                    {/* Stories container */}
                    <div
                        ref={scrollContainerRef}
                        className="flex gap-3 overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] md:px-8 [&::-webkit-scrollbar]:hidden"
                    >
                        {/* Mobile: Circular avatars */}
                        <div className="flex gap-4 md:hidden">
                            {/* Create your story - Mobile */}
                            <button
                                type="button"
                                onClick={() => setIsCreatorOpen(true)}
                                className="flex shrink-0 flex-col items-center gap-2 transition hover:opacity-80"
                            >
                                <div className="relative">
                                    <div className="flex size-16 items-center justify-center rounded-full border-2 border-dashed border-white/30 bg-black/40">
                                        <Plus className="size-6 text-white/60" />
                                    </div>
                                </div>
                                <span className="max-w-[80px] truncate text-xs text-white/70">
                                    Your story
                                </span>
                            </button>

                            {/* Story items - Mobile */}
                            {stories.map((story) => (
                                <button
                                    key={story.id}
                                    onClick={() =>
                                        story.first_story_id &&
                                        onStoryClick?.(story.first_story_id)
                                    }
                                    disabled={!story.first_story_id}
                                    className="group flex shrink-0 flex-col items-center gap-2 transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <div className="relative">
                                        <div
                                            className={cn(
                                                'rounded-full p-0.5 transition',
                                                story.has_new_stories
                                                    ? 'bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600'
                                                    : 'bg-white/20',
                                            )}
                                        >
                                            <Avatar className="size-16 border-2 border-black">
                                                <AvatarImage
                                                    src={
                                                        story.avatar_url ??
                                                        undefined
                                                    }
                                                    alt={story.username}
                                                />
                                                <AvatarFallback className="bg-white/10 text-white/70">
                                                    {story.username[0].toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                        {story.story_count > 1 && (
                                            <div className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-2 border-black bg-amber-500 text-[10px] font-semibold text-black">
                                                {story.story_count}
                                            </div>
                                        )}
                                    </div>
                                    <span className="max-w-[80px] truncate text-xs text-white/70">
                                        {story.username}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Desktop: Vertical cards */}
                        <div className="hidden gap-3 md:flex">
                            {/* Create your story - Desktop */}
                            <button
                                type="button"
                                onClick={() => setIsCreatorOpen(true)}
                                className="group relative flex h-[200px] w-[120px] shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-white/30 bg-black/40 transition hover:border-white/50 hover:bg-black/60"
                            >
                                <Plus className="mb-2 size-8 text-white/60 transition group-hover:text-white/80" />
                                <span className="text-xs font-medium text-white/70 transition group-hover:text-white/90">
                                    Your story
                                </span>
                            </button>

                            {/* Story items - Desktop */}
                            {stories.map((story) => (
                                <button
                                    key={story.id}
                                    onClick={() =>
                                        story.first_story_id &&
                                        onStoryClick?.(story.first_story_id)
                                    }
                                    disabled={!story.first_story_id}
                                    className="group relative flex h-[200px] w-[120px] shrink-0 flex-col overflow-hidden rounded-xl transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {/* Border gradient for new stories */}
                                    <div
                                        className={cn(
                                            'absolute inset-0 rounded-xl transition',
                                            story.has_new_stories
                                                ? 'bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 p-0.5'
                                                : 'bg-white/20 p-0.5',
                                        )}
                                    >
                                        <div className="relative h-full w-full overflow-hidden rounded-[10px] bg-black">
                                            {/* Story preview image */}
                                            {story.latest_story_preview && (
                                                <img
                                                    src={
                                                        story.latest_story_preview
                                                    }
                                                    alt={`${story.username}'s story`}
                                                    className="h-full w-full object-cover"
                                                />
                                            )}

                                            {/* Gradient overlay at bottom for username */}
                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-8" />

                                            {/* User avatar in top corner */}
                                            <div className="absolute top-2 left-2">
                                                <Avatar className="size-8 border-2 border-black/50">
                                                    <AvatarImage
                                                        src={
                                                            story.avatar_url ??
                                                            undefined
                                                        }
                                                        alt={story.username}
                                                    />
                                                    <AvatarFallback className="bg-white/10 text-xs text-white/70">
                                                        {story.username[0].toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </div>

                                            {/* Story count badge */}
                                            {story.story_count > 1 && (
                                                <div className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full border-2 border-black/50 bg-amber-500 text-[10px] font-semibold text-black">
                                                    {story.story_count}
                                                </div>
                                            )}

                                            {/* Username at bottom */}
                                            <div className="absolute right-2 bottom-2 left-2">
                                                <span className="block truncate text-xs font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                                                    {story.username}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>

            {/* Story Creator Modal */}
            <StoryCreatorModal
                open={isCreatorOpen}
                onClose={() => setIsCreatorOpen(false)}
                audiences={audiences}
            />
        </Card>
    );
}
