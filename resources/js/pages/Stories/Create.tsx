import StoryComposer from '@/components/stories/story-composer';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, SharedData } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Create Story',
    },
];

type StoriesCreateProps = SharedData & {
    audiences?: Array<{ value: string; label: string }>;
};

export default function StoriesCreate({ audiences }: StoriesCreateProps) {
    const defaultAudiences = [
        { value: 'public', label: 'Public' },
        { value: 'followers', label: 'Followers' },
        { value: 'subscribers', label: 'Subscribers' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Story" />

            <div className="mx-auto max-w-2xl">
                <StoryComposer
                    audiences={audiences ?? defaultAudiences}
                    onSubmitted={() => {
                        window.location.href = dashboard().url;
                    }}
                />
            </div>
        </AppLayout>
    );
}


