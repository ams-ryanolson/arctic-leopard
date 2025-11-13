import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import eventsRoute from '@/routes/events';
import { router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    type EventFilters,
    type EventMeta,
    formatEventModality,
    formatEventType,
} from '@/types/events';

type FilterState = {
    search: string;
    status: string;
    modality: string;
    type: string;
    tag: string;
    city: string;
};

type EventFilterBarProps = {
    filters: EventFilters;
    meta: Pick<EventMeta, 'modalities' | 'types' | 'tags'>;
    statuses?: string[];
    className?: string;
    onOpenSubmission?: () => void;
};

const defaultStatusOptions = [
    {
        value: 'all',
        label: 'All statuses',
    },
    {
        value: 'published',
        label: 'Published',
    },
    {
        value: 'pending',
        label: 'Pending',
    },
    {
        value: 'draft',
        label: 'Draft',
    },
    {
        value: 'cancelled',
        label: 'Cancelled',
    },
];

export function EventFilterBar({
    filters,
    meta,
    statuses = defaultStatusOptions.map((option) => option.value),
    className,
    onOpenSubmission,
}: EventFilterBarProps) {
    const ALL_OPTION = 'all';

    const [state, setState] = useState<FilterState>({
        search: filters.search ?? '',
        status: filters.status ?? '',
        modality: filters.modality ?? '',
        type: filters.type ?? '',
        tag: filters.tag ? String(filters.tag) : '',
        city: filters.city ?? '',
    });

    useEffect(() => {
        setState({
            search: filters.search ?? '',
            status: filters.status ?? '',
            modality: filters.modality ?? '',
            type: filters.type ?? '',
            tag: filters.tag ? String(filters.tag) : '',
            city: filters.city ?? '',
        });
    }, [filters]);

    const hasActiveFilters = useMemo(
        () =>
            Boolean(
                state.search ||
                    state.status ||
                    state.modality ||
                    state.type ||
                    state.tag ||
                    state.city,
            ),
        [state],
    );

    const handleApply = useCallback(() => {
        const query: Record<string, string> = {};

        if (state.search) query.search = state.search;
        if (state.status) query.status = state.status;
        if (state.modality) query.modality = state.modality;
        if (state.type) query.type = state.type;
        if (state.tag) query.tag = state.tag;
        if (state.city) query.city = state.city;

        router.visit(
            eventsRoute.index({
                query,
            }).url,
            {
                preserveScroll: true,
                only: ['events', 'pastEvents', 'filters'],
            },
        );
    }, [state]);

    const handleReset = useCallback(() => {
        setState({
            search: '',
            status: '',
            modality: '',
            type: '',
            tag: '',
            city: '',
        });

        router.visit(eventsRoute.index().url, {
            preserveScroll: true,
            only: ['events', 'pastEvents', 'filters'],
        });
    }, []);

    return (
        <div
            className={cn(
                'rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_40px_95px_-65px_rgba(249,115,22,0.5)]',
                className,
            )}
        >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,260px)_minmax(0,200px)_minmax(0,200px)_minmax(0,200px)] lg:items-center lg:gap-4">
                    <Input
                        value={state.search}
                        placeholder="Search events"
                        onChange={(event) =>
                            setState((prev) => ({
                                ...prev,
                                search: event.target.value,
                            }))
                        }
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                handleApply();
                            }
                        }}
                        className="rounded-full border-white/20 bg-black/25 text-sm text-white/85 placeholder:text-white/45 focus-visible:ring-amber-400/40"
                    />

                    <Select
                        value={state.status === '' ? ALL_OPTION : state.status}
                        onValueChange={(value) =>
                            setState((prev) => ({
                                ...prev,
                                status: value === ALL_OPTION ? '' : value,
                            }))
                        }
                    >
                        <SelectTrigger className="w-full rounded-full border-white/20 bg-black/25 text-sm text-white/80">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="w-[200px] rounded-2xl border border-white/10 bg-black/85 text-white shadow-[0_30px_70px_-50px_rgba(0,0,0,0.75)] backdrop-blur-xl">
                            <SelectItem value={ALL_OPTION} className="text-sm text-white/80">
                                All statuses
                            </SelectItem>
                            {statuses
                                .filter((status) => status !== ALL_OPTION)
                                .map((status) => (
                                    <SelectItem
                                        key={status}
                                        value={status}
                                        className="text-sm text-white/80 focus:bg-white/10 focus:text-white"
                                    >
                                        {status.charAt(0).toUpperCase() +
                                            status.slice(1)}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={state.type === '' ? ALL_OPTION : state.type}
                        onValueChange={(value) =>
                            setState((prev) => ({
                                ...prev,
                                type: value === ALL_OPTION ? '' : value,
                            }))
                        }
                    >
                        <SelectTrigger className="w-full rounded-full border-white/20 bg-black/25 text-sm text-white/80">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent className="w-[200px] rounded-2xl border border-white/10 bg-black/85 text-white shadow-[0_30px_70px_-50px_rgba(0,0,0,0.75)] backdrop-blur-xl">
                            <SelectItem value={ALL_OPTION} className="text-sm text-white/80">
                                All types
                            </SelectItem>
                            {meta.types.map((type) => (
                                <SelectItem
                                    key={type}
                                    value={type}
                                    className="text-sm text-white/80 focus:bg-white/10 focus:text-white"
                                >
                                    {formatEventType(type)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={state.modality === '' ? ALL_OPTION : state.modality}
                        onValueChange={(value) =>
                            setState((prev) => ({
                                ...prev,
                                modality: value === ALL_OPTION ? '' : value,
                            }))
                        }
                    >
                        <SelectTrigger className="w-full rounded-full border-white/20 bg-black/25 text-sm text-white/80">
                            <SelectValue placeholder="Modality" />
                        </SelectTrigger>
                        <SelectContent className="w-[200px] rounded-2xl border border-white/10 bg-black/85 text-white shadow-[0_30px_70px_-50px_rgba(0,0,0,0.75)] backdrop-blur-xl">
                            <SelectItem value={ALL_OPTION} className="text-sm text-white/80">
                                All modalities
                            </SelectItem>
                            {meta.modalities.map((modality) => (
                                <SelectItem
                                    key={modality}
                                    value={modality}
                                    className="text-sm text-white/80 focus:bg-white/10 focus:text-white"
                                >
                                    {formatEventModality(modality)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:max-w-xs">
                    <Select
                        value={state.tag === '' ? ALL_OPTION : state.tag}
                        onValueChange={(value) =>
                            setState((prev) => ({
                                ...prev,
                                tag: value === ALL_OPTION ? '' : value,
                            }))
                        }
                    >
                        <SelectTrigger className="w-full rounded-full border-white/20 bg-black/25 text-sm text-white/80">
                            <SelectValue placeholder="Tag" />
                        </SelectTrigger>
                        <SelectContent className="w-[220px] rounded-2xl border border-white/10 bg-black/85 text-white shadow-[0_30px_70px_-50px_rgba(0,0,0,0.75)] backdrop-blur-xl">
                            <SelectItem value={ALL_OPTION} className="text-sm text-white/80">
                                All tags
                            </SelectItem>
                            {meta.tags.map((tag) => (
                                <SelectItem
                                    key={tag.id}
                                    value={String(tag.id)}
                                    className="text-sm text-white/80 focus:bg-white/10 focus:text-white"
                                >
                                    {tag.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Input
                        value={state.city}
                        placeholder="City or region"
                        onChange={(event) =>
                            setState((prev) => ({
                                ...prev,
                                city: event.target.value,
                            }))
                        }
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                handleApply();
                            }
                        }}
                        className="rounded-full border-white/20 bg-black/25 text-sm text-white/85 placeholder:text-white/45 focus-visible:ring-amber-400/40"
                    />
                </div>
            </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        type="button"
                        onClick={handleApply}
                        className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-6 text-xs font-semibold uppercase tracking-[0.35em] text-white shadow-[0_28px_70px_-36px_rgba(249,115,22,0.65)] transition hover:scale-[1.02]"
                    >
                        Apply
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        disabled={!hasActiveFilters}
                        onClick={handleReset}
                        className="rounded-full border border-white/15 bg-white/10 px-5 text-xs font-semibold uppercase tracking-[0.35em] text-white/70 hover:border-white/30 hover:bg-white/15 hover:text-white disabled:border-white/10 disabled:text-white/40"
                    >
                        Reset
                    </Button>
                </div>

                <Button
                    type="button"
                    onClick={onOpenSubmission}
                    className="rounded-full bg-white/90 px-6 text-xs font-semibold uppercase tracking-[0.35em] text-black shadow-[0_30px_65px_-40px_rgba(255,255,255,0.6)] transition hover:scale-[1.02]"
                >
                    Suggest an event
                </Button>
            </div>
        </div>
    );
}

