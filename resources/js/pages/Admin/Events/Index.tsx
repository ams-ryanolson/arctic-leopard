import { EventStatusBadge } from '@/components/events/event-status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import AppLayout from '@/layouts/app-layout';
import adminEventsRoutes from '@/routes/admin/events';
import eventsRoutes from '@/routes/events';
import type { SharedData } from '@/types';
import {
    type Event,
    type EventCollection,
    type EventFilters,
    type EventMeta,
    formatEventDateRange,
    formatEventLocation,
} from '@/types/events';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

type AdminEventsIndexProps = {
    events: EventCollection;
    filters: EventFilters;
    meta: EventMeta;
};

type FilterFormState = {
    search: string;
    status: string;
    type: string;
    modality: string;
};

export default function AdminEventsIndex({
    events,
    filters,
    meta,
}: AdminEventsIndexProps) {
    const { auth } = usePage<SharedData>().props;
    const currentUserId = auth?.user?.id ?? null;

    const ALL_OPTION = 'all';

    const [formState, setFormState] = useState<FilterFormState>({
        search: filters.search ?? '',
        status: filters.status ?? '',
        type: filters.type ?? '',
        modality: filters.modality ?? '',
    });

    const paginationMeta = {
        currentPage: events.meta.current_page,
        perPage: events.meta.per_page,
        total: events.meta.total,
        hasMorePages: events.meta.current_page < events.meta.last_page,
    };

    const applyFilters = () => {
        const query: Record<string, string> = {};

        if (formState.search) query.search = formState.search;
        if (formState.status) query.status = formState.status;
        if (formState.type) query.type = formState.type;
        if (formState.modality) query.modality = formState.modality;

        router.visit(adminEventsRoutes.index({ query }).url, {
            preserveScroll: true,
            only: ['events', 'filters'],
        });
    };

    const resetFilters = () => {
        setFormState({
            search: '',
            status: '',
            type: '',
            modality: '',
        });

        router.visit(adminEventsRoutes.index().url, {
            preserveScroll: true,
            only: ['events', 'filters'],
        });
    };

    const handlePageChange = (page: number) => {
        const query: Record<string, string> = {};

        if (filters.search) query.search = filters.search;
        if (filters.status) query.status = filters.status;
        if (filters.type) query.type = filters.type;
        if (filters.modality) query.modality = filters.modality;

        query.page = page.toString();

        router.visit(adminEventsRoutes.index({ query }).url, {
            preserveScroll: true,
            only: ['events'],
        });
    };

    const statusOptions = meta.statuses ?? [
        'draft',
        'pending',
        'published',
        'cancelled',
        'archived',
    ];
    const typeOptions = meta.types ?? [];
    const modalityOptions = meta.modalities ?? [];

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Events', href: eventsRoutes.index().url },
                { title: 'Admin', href: adminEventsRoutes.index().url },
            ]}
        >
            <Head title="Manage Events · Admin" />

            <div className="space-y-8 text-white">
                <header className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Manage official events
                        </h1>
                        <p className="text-sm text-white/65">
                            Review submissions, assign managers, and keep the
                            calendar sharp.
                        </p>
                    </div>
                    <Button
                        onClick={() =>
                            router.visit(eventsRoutes.index().url, {
                                preserveScroll: true,
                            })
                        }
                        className="rounded-full bg-white px-5 text-xs font-semibold tracking-[0.35em] text-black uppercase shadow-[0_30px_70px_-45px_rgba(255,255,255,0.55)] hover:scale-[1.02]"
                    >
                        View member-facing page
                    </Button>
                </header>

                <Card className="border-white/10 bg-white/5">
                    <CardContent className="space-y-4 p-5">
                        <div className="grid gap-3 lg:grid-cols-[minmax(0,240px)_minmax(0,180px)_minmax(0,180px)_minmax(0,180px)] lg:items-center">
                            <Input
                                placeholder="Search events"
                                value={formState.search}
                                onChange={(event) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        search: event.target.value,
                                    }))
                                }
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        applyFilters();
                                    }
                                }}
                                className="rounded-full border-white/20 bg-black/25 text-sm text-white placeholder:text-white/40 focus-visible:ring-amber-400/40"
                            />

                            <Select
                                value={
                                    formState.status === ''
                                        ? ALL_OPTION
                                        : formState.status
                                }
                                onValueChange={(value) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        status:
                                            value === ALL_OPTION ? '' : value,
                                    }))
                                }
                            >
                                <SelectTrigger className="rounded-full border-white/20 bg-black/25 text-sm text-white focus-visible:ring-amber-400/40">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border border-white/10 bg-black/85 text-white shadow-[0_30px_70px_-50px_rgba(0,0,0,0.70)] backdrop-blur-xl">
                                    <SelectItem
                                        value={ALL_OPTION}
                                        className="text-sm text-white/75"
                                    >
                                        All statuses
                                    </SelectItem>
                                    {statusOptions.map((status) => (
                                        <SelectItem
                                            key={status}
                                            value={status}
                                            className="text-sm text-white/80 hover:bg-white/10 hover:text-white"
                                        >
                                            {status.charAt(0).toUpperCase() +
                                                status.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={
                                    formState.type === ''
                                        ? ALL_OPTION
                                        : formState.type
                                }
                                onValueChange={(value) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        type: value === ALL_OPTION ? '' : value,
                                    }))
                                }
                            >
                                <SelectTrigger className="rounded-full border-white/20 bg-black/25 text-sm text-white focus-visible:ring-amber-400/40">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border border-white/10 bg-black/85 text-white shadow-[0_30px_70px_-50px_rgba(0,0,0,0.70)] backdrop-blur-xl">
                                    <SelectItem
                                        value={ALL_OPTION}
                                        className="text-sm text-white/75"
                                    >
                                        All types
                                    </SelectItem>
                                    {typeOptions.map((type) => (
                                        <SelectItem
                                            key={type}
                                            value={type}
                                            className="text-sm text-white/80 hover:bg-white/10 hover:text-white"
                                        >
                                            {type.charAt(0).toUpperCase() +
                                                type.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={
                                    formState.modality === ''
                                        ? ALL_OPTION
                                        : formState.modality
                                }
                                onValueChange={(value) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        modality:
                                            value === ALL_OPTION ? '' : value,
                                    }))
                                }
                            >
                                <SelectTrigger className="rounded-full border-white/20 bg-black/25 text-sm text-white focus-visible:ring-amber-400/40">
                                    <SelectValue placeholder="Modality" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border border-white/10 bg-black/85 text-white shadow-[0_30px_70px_-50px_rgba(0,0,0,0.70)] backdrop-blur-xl">
                                    <SelectItem
                                        value={ALL_OPTION}
                                        className="text-sm text-white/75"
                                    >
                                        All modalities
                                    </SelectItem>
                                    {modalityOptions.map((modality) => (
                                        <SelectItem
                                            key={modality}
                                            value={modality}
                                            className="text-sm text-white/80 hover:bg-white/10 hover:text-white"
                                        >
                                            {modality.charAt(0).toUpperCase() +
                                                modality.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Button
                                type="button"
                                onClick={applyFilters}
                                className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-6 text-xs font-semibold tracking-[0.35em] text-white uppercase shadow-[0_25px_65px_-35px_rgba(249,115,22,0.6)] hover:scale-[1.02]"
                            >
                                Apply
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={resetFilters}
                                className="rounded-full border border-white/15 bg-white/10 px-5 text-xs font-semibold tracking-[0.35em] text-white/70 uppercase hover:border-white/30 hover:bg-white/15 hover:text-white"
                            >
                                Reset
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <section className="space-y-4">
                    {events.data.length === 0 ? (
                        <Card className="border-white/10 bg-white/5">
                            <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-white/70">
                                <div className="rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs tracking-[0.35em] text-white/60 uppercase">
                                    Nothing Found
                                </div>
                                <p>
                                    No events match the current filters. Adjust
                                    the filters or review archived events.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {events.data.map((event) => (
                                <AdminEventRow
                                    key={event.id}
                                    event={event}
                                    currentUserId={currentUserId}
                                />
                            ))}
                        </div>
                    )}

                    <Pagination
                        meta={paginationMeta}
                        onPageChange={handlePageChange}
                        className="border-white/10 bg-white/5"
                    />
                </section>
            </div>
        </AppLayout>
    );
}

type AdminEventRowProps = {
    event: Event;
    currentUserId: number | null;
};

function AdminEventRow({ event, currentUserId }: AdminEventRowProps) {
    const [processing, setProcessing] = useState(false);

    const handleAction = async (
        action: 'approve' | 'publish' | 'cancel' | 'assignSelf' | 'removeSelf',
    ) => {
        setProcessing(true);

        const options = {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        };

        switch (action) {
            case 'approve':
                router.post(
                    adminEventsRoutes.approve({ event: event.slug }).url,
                    {},
                    options,
                );
                break;
            case 'publish':
                router.post(
                    adminEventsRoutes.publish({ event: event.slug }).url,
                    {},
                    options,
                );
                break;
            case 'cancel':
                router.post(
                    adminEventsRoutes.cancel({ event: event.slug }).url,
                    {},
                    options,
                );
                break;
            case 'assignSelf':
                if (!currentUserId) {
                    setProcessing(false);
                    return;
                }

                router.put(
                    adminEventsRoutes.update({ event: event.slug }).url,
                    {
                        manager_id: currentUserId,
                    },
                    options,
                );
                break;
            case 'removeSelf':
                router.put(
                    adminEventsRoutes.update({ event: event.slug }).url,
                    {
                        manager_id: null,
                    },
                    options,
                );
                break;
        }
    };

    return (
        <Card className="border-white/10 bg-white/5 text-white shadow-[0_35px_85px_-65px_rgba(147,197,253,0.35)]">
            <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold">{event.title}</h3>
                        <EventStatusBadge status={event.status} />
                    </div>
                    <p className="text-sm text-white/70">
                        {formatEventDateRange(event)} ·{' '}
                        {formatEventLocation(event.location)}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs tracking-[0.3em] text-white/60 uppercase">
                        <Badge className="rounded-full border-white/20 bg-white/10 text-[0.65rem]">
                            {event.type}
                        </Badge>
                        <Badge className="rounded-full border-white/20 bg-white/10 text-[0.65rem]">
                            {event.modality}
                        </Badge>
                        <Badge className="rounded-full border-white/20 bg-white/10 text-[0.65rem]">
                            RSVPs{' '}
                            {event.rsvp_summary.going +
                                event.rsvp_summary.tentative}
                        </Badge>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {event.status === 'pending' && (
                        <Button
                            size="sm"
                            disabled={processing}
                            onClick={() => handleAction('approve')}
                            className="rounded-full bg-white/90 px-4 text-xs font-semibold tracking-[0.35em] text-black uppercase hover:scale-[1.02]"
                        >
                            Approve
                        </Button>
                    )}
                    {event.status !== 'published' &&
                        event.status !== 'cancelled' && (
                            <Button
                                size="sm"
                                disabled={processing}
                                onClick={() => handleAction('publish')}
                                className="rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 px-4 text-xs font-semibold tracking-[0.35em] text-white uppercase hover:scale-[1.02]"
                            >
                                Publish
                            </Button>
                        )}
                    {event.status === 'published' && (
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={processing}
                            onClick={() => handleAction('cancel')}
                            className="rounded-full border-white/25 bg-white/10 px-4 text-xs font-semibold tracking-[0.35em] text-white/75 uppercase hover:border-white/40 hover:bg-white/20"
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="ghost"
                        disabled={
                            processing ||
                            (!event.manager && currentUserId === null)
                        }
                        onClick={() =>
                            handleAction(
                                event.manager ? 'removeSelf' : 'assignSelf',
                            )
                        }
                        className="rounded-full border border-white/15 bg-white/10 px-4 text-xs font-semibold tracking-[0.35em] text-white/75 uppercase hover:border-white/30 hover:bg-white/20 hover:text-white"
                    >
                        {event.manager ? 'Unassign' : 'Assign self'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

AdminEventsIndex.Skeleton = function AdminEventsIndexSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-24 rounded-3xl bg-white/10" />
            <Skeleton className="h-80 rounded-3xl bg-white/10" />
        </div>
    );
};
