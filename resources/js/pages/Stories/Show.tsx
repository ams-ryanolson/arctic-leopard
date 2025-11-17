import { useCallback, useEffect, useState } from 'react';
import StoryViewer from '@/components/stories/story-viewer';
import { Head, router } from '@inertiajs/react';
import { dashboard } from '@/routes';
import type { SharedData } from '@/types';
import type { StoryResponse } from '@/lib/story-client';
import { show as storiesShow } from '@/routes/stories';
import { getCsrfToken } from '@/lib/csrf';

type StoriesShowProps = SharedData & {
    story: StoryResponse;
    nextStoryId?: number | null;
    previousStoryId?: number | null;
};

export default function StoriesShow({ story: initialStory, nextStoryId, previousStoryId }: StoriesShowProps) {
    // Ensure we have a valid story with an ID
    if (!initialStory?.id) {
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

    const [currentStoryId, setCurrentStoryId] = useState(initialStory.id);
    const [story, setStory] = useState<StoryResponse>(initialStory);

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
        if (currentStoryId !== initialStory.id) {
            // Fetch the new story
            fetch(storiesShow({ story: currentStoryId }).url, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(getCsrfToken() ? { 'X-XSRF-TOKEN': getCsrfToken()! } : {}),
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
    }, [currentStoryId, initialStory.id]);

    return (
        <>
            <Head title={`${story.author?.username ?? 'User'}'s Story`} />

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

