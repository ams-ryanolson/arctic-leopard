import StoryViewer from '@/components/stories/story-viewer';
import { getCsrfToken } from '@/lib/csrf';
import type { StoryResponse } from '@/lib/story-client';
import { dashboard } from '@/routes';
import { show as storiesShow } from '@/routes/stories';
import type { SharedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

type StoriesShowProps = SharedData & {
    story: StoryResponse;
    nextStoryId?: number | null;
    previousStoryId?: number | null;
};

export default function StoriesShow({
    story: initialStory,
    nextStoryId,
    previousStoryId,
}: StoriesShowProps) {
    // All hooks must be called before any conditional returns
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [currentStoryId, setCurrentStoryId] = useState(initialStory?.id ?? 0);
    const [story, setStory] = useState<StoryResponse | null>(
        initialStory ?? null,
    );

    const handleNext = useCallback(() => {
        if (nextStoryId) {
            // Navigate to next story
            router.visit(storiesShow({ story: nextStoryId }).url, {
                preserveState: true,
                preserveScroll: true,
            });
        } else {
            // No more stories, go back to dashboard
            router.visit(dashboard().url);
        }
    }, [nextStoryId]);

    const handlePrevious = useCallback(() => {
        if (previousStoryId) {
            // Navigate to previous story
            router.visit(storiesShow({ story: previousStoryId }).url, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    }, [previousStoryId]);

    const handleClose = useCallback(() => {
        router.visit(dashboard().url);
    }, []);

    useEffect(() => {
        if (currentStoryId !== initialStory?.id && initialStory?.id) {
            // Fetch the new story
            fetch(storiesShow({ story: currentStoryId }).url, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(getCsrfToken()
                        ? { 'X-XSRF-TOKEN': getCsrfToken()! }
                        : {}),
                },
            })
                .then((response) => response.json())
                .then((data) => {
                    setStory(data.data as StoryResponse);
                })
                .catch((error) => {
                    console.error('Failed to fetch story:', error);
                });
        }
    }, [currentStoryId, initialStory?.id]);

    // Ensure we have a valid story with an ID
    if (!initialStory?.id || !story) {
        return (
            <>
                <Head title="Story Not Found" />
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
                    <div className="text-center text-white">
                        <p className="mb-4">Story not found</p>
                        <button
                            onClick={() => router.visit(dashboard().url)}
                            className="rounded bg-white px-4 py-2 text-black"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={`${story?.author?.username ?? 'User'}'s Story`} />

            <StoryViewer
                storyId={currentStoryId}
                onClose={handleClose}
                onNext={handleNext}
                onPrevious={handlePrevious}
                hasNext={!!nextStoryId}
                hasPrevious={!!previousStoryId}
            />
        </>
    );
}
