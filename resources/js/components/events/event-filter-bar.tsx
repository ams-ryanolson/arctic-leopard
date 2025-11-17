import {
    LocationAutocomplete,
    type LocationSuggestion,
} from '@/components/location-autocomplete';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import eventsRoutes from '@/routes/events';
import {
    type EventFilters,
    type EventMeta,
    formatEventModality,
    formatEventType,
} from '@/types/events';
import { router } from '@inertiajs/react';
import { ChevronDown, ChevronUp, Filter, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

type ActiveFilters = {
    search?: string;
    type?: string;
    modality?: string;
    tags?: number[];
    location_city?: string;
    location_region?: string;
    location_country?: string;
    location_latitude?: number;
    location_longitude?: number;
};

type EventFilterBarProps = {
    filters: EventFilters;
    meta: Pick<EventMeta, 'modalities' | 'types' | 'tags'>;
    isCollapsed?: boolean;
    onCollapsedChange?: (collapsed: boolean) => void;
    className?: string;
};

const EVENTS_FILTERS_COLLAPSED_KEY = 'events_filters_collapsed';

export function EventFilterBar({
    filters,
    meta,
    isCollapsed: externalIsCollapsed,
    onCollapsedChange: externalOnCollapsedChange,
    className,
}: EventFilterBarProps) {
    const [internalCollapsed, setInternalCollapsed] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }
        try {
            const value = window.localStorage.getItem(
                EVENTS_FILTERS_COLLAPSED_KEY,
            );
            return value === 'true';
        } catch {
            return false;
        }
    });

    const isCollapsed = externalIsCollapsed ?? internalCollapsed;
    const setIsCollapsed = externalOnCollapsedChange ?? setInternalCollapsed;

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        try {
            window.localStorage.setItem(
                EVENTS_FILTERS_COLLAPSED_KEY,
                String(isCollapsed),
            );
        } catch {
            // ignore storage errors
        }
    }, [isCollapsed]);

    // Initialize active filters from URL params
    const initialActiveFilters = useMemo<ActiveFilters>(() => {
        const active: ActiveFilters = {};
        if (filters.search) active.search = filters.search;
        if (filters.type) active.type = filters.type;
        if (filters.modality) active.modality = filters.modality;
        if (filters.tags && Array.isArray(filters.tags)) {
            active.tags = filters.tags.map(Number).filter(Boolean);
        }
        if (filters.location_city) active.location_city = filters.location_city;
        if (filters.location_region)
            active.location_region = filters.location_region;
        if (filters.location_country)
            active.location_country = filters.location_country;
        if (filters.location_latitude)
            active.location_latitude = Number(filters.location_latitude);
        if (filters.location_longitude)
            active.location_longitude = Number(filters.location_longitude);
        return active;
    }, [filters]);

    const [localFilters, setLocalFilters] =
        useState<ActiveFilters>(initialActiveFilters);
    const [tagSearch, setTagSearch] = useState('');
    const [locationQuery, setLocationQuery] = useState(() => {
        if (filters.location_city && filters.location_country) {
            return [
                filters.location_city,
                filters.location_region,
                filters.location_country,
            ]
                .filter(Boolean)
                .join(', ');
        }
        return '';
    });

    useEffect(() => {
        setLocalFilters(initialActiveFilters);
        if (filters.location_city && filters.location_country) {
            setLocationQuery(
                [
                    filters.location_city,
                    filters.location_region,
                    filters.location_country,
                ]
                    .filter(Boolean)
                    .join(', '),
            );
        } else {
            setLocationQuery('');
        }
    }, [
        initialActiveFilters,
        filters.location_city,
        filters.location_region,
        filters.location_country,
    ]);

    const hasChanges = useMemo(() => {
        return (
            JSON.stringify(localFilters) !==
            JSON.stringify(initialActiveFilters)
        );
    }, [localFilters, initialActiveFilters]);

    const filteredTags = useMemo(() => {
        if (!tagSearch.trim()) {
            return meta.tags.slice(0, 30);
        }
        const search = tagSearch.toLowerCase();
        return meta.tags
            .filter((tag) => tag.name.toLowerCase().includes(search))
            .slice(0, 30);
    }, [meta.tags, tagSearch]);

    const selectedTagIds = useMemo(
        () => localFilters.tags ?? [],
        [localFilters.tags],
    );

    const buildQueryParams = useCallback(
        (
            filters: ActiveFilters,
        ): Record<string, string | number | (string | number)[]> => {
            const params: Record<
                string,
                string | number | (string | number)[]
            > = {};
            if (filters.search) params.search = filters.search;
            if (filters.type) params.type = filters.type;
            if (filters.modality) params.modality = filters.modality;
            if (filters.tags && filters.tags.length > 0) {
                params.tags = filters.tags;
            }
            if (filters.location_city)
                params.location_city = filters.location_city;
            if (filters.location_region)
                params.location_region = filters.location_region;
            if (filters.location_country)
                params.location_country = filters.location_country;
            if (filters.location_latitude)
                params.location_latitude = filters.location_latitude;
            if (filters.location_longitude)
                params.location_longitude = filters.location_longitude;
            return params;
        },
        [],
    );

    const handleReset = useCallback(() => {
        setLocalFilters({});
        setLocationQuery('');
        router.get(
            eventsRoutes.index().url,
            {},
            { preserveScroll: true, preserveState: false },
        );
    }, []);

    const handleApply = useCallback(() => {
        router.get(eventsRoutes.index().url, buildQueryParams(localFilters), {
            preserveScroll: true,
            preserveState: false,
        });
    }, [localFilters, buildQueryParams]);

    const toggleTag = useCallback((tagId: number) => {
        setLocalFilters((prev) => {
            const currentIds = prev.tags ?? [];
            const newIds = currentIds.includes(tagId)
                ? currentIds.filter((id) => id !== tagId)
                : [...currentIds, tagId];
            const newFilters = {
                ...prev,
                tags: newIds.length > 0 ? newIds : undefined,
            };
            if (newIds.length === 0) {
                delete newFilters.tags;
            }
            return newFilters;
        });
    }, []);

    const handleLocationSelect = useCallback(
        (suggestion: LocationSuggestion) => {
            setLocalFilters((prev) => ({
                ...prev,
                location_city: suggestion.city,
                location_region: suggestion.region || undefined,
                location_country: suggestion.country,
                location_latitude: Number(suggestion.latitude),
                location_longitude: Number(suggestion.longitude),
            }));
            setLocationQuery(suggestion.label);
        },
        [],
    );

    const handleLocationQueryChange = useCallback((value: string) => {
        setLocationQuery(value);
        setLocalFilters((prev) => {
            const newFilters = { ...prev };
            delete newFilters.location_city;
            delete newFilters.location_region;
            delete newFilters.location_country;
            delete newFilters.location_latitude;
            delete newFilters.location_longitude;
            return newFilters;
        });
    }, []);

    return (
        <Collapsible
            open={!isCollapsed}
            onOpenChange={(open) => setIsCollapsed(!open)}
            className={className}
        >
            <Card className="border-white/10 bg-black/35 text-white">
                <CardHeader className="gap-4">
                    <div className="flex items-center justify-between gap-4">
                        {isCollapsed ? (
                            <div className="flex-1">
                                <CardTitle className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight">
                                    <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/30 via-rose-500/35 to-violet-600/30 text-amber-200">
                                        <Filter className="size-4" />
                                    </span>
                                    Filter events
                                </CardTitle>
                                <CardDescription className="mt-1 text-sm text-white/55">
                                    Search, filter by type, modality, tags, and
                                    location.
                                </CardDescription>
                            </div>
                        ) : (
                            <div className="flex-1 space-y-2">
                                <CardTitle className="inline-flex items-center gap-2 text-2xl font-semibold tracking-tight">
                                    <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/30 via-rose-500/35 to-violet-600/30 text-amber-200">
                                        <Filter className="size-5" />
                                    </span>
                                    Filter events
                                </CardTitle>
                                <CardDescription className="max-w-2xl text-white/65">
                                    Search, filter by type, modality, tags, and
                                    location.
                                </CardDescription>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleReset}
                                className="rounded-full border border-white/10 bg-white/5 px-4 text-xs text-white/80 hover:border-white/30 hover:bg-white/10 hover:text-white"
                            >
                                Reset
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleApply}
                                disabled={!hasChanges}
                                className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-5 text-xs font-semibold text-white shadow-[0_4px_16px_-8px_rgba(249,115,22,0.55)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Apply
                            </Button>
                        </div>

                        <CollapsibleTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex-shrink-0 rounded-full border border-white/10 bg-white/5 p-2 text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white"
                                aria-label={
                                    isCollapsed
                                        ? 'Expand filters'
                                        : 'Collapse filters'
                                }
                            >
                                {isCollapsed ? (
                                    <ChevronDown className="size-4" />
                                ) : (
                                    <ChevronUp className="size-4" />
                                )}
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                </CardHeader>

                <CollapsibleContent className="overflow-visible transition-all duration-200 ease-in-out">
                    <CardContent className="overflow-visible border-t border-white/10 px-6 pt-6">
                        <div className="grid gap-4">
                            {/* Row 1: Text Search */}
                            <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5">
                                <Label className="flex items-center gap-2 text-xs tracking-[0.3em] text-white/55 uppercase">
                                    <Search className="size-3.5" />
                                    Search by title
                                </Label>
                                <Input
                                    value={localFilters.search ?? ''}
                                    onChange={(e) =>
                                        setLocalFilters((prev) => ({
                                            ...prev,
                                            search: e.target.value || undefined,
                                        }))
                                    }
                                    placeholder="Search event titles..."
                                    className="border-white/20 bg-white/5 text-white placeholder:text-white/50 focus:border-white/35 focus:bg-white/10"
                                />
                            </div>

                            {/* Row 2: Types and Modalities */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5">
                                    <Label className="text-xs tracking-[0.3em] text-white/55 uppercase">
                                        Event Type
                                    </Label>
                                    <Select
                                        value={localFilters.type ?? 'all'}
                                        onValueChange={(value) =>
                                            setLocalFilters((prev) => ({
                                                ...prev,
                                                type:
                                                    value === 'all'
                                                        ? undefined
                                                        : value,
                                            }))
                                        }
                                    >
                                        <SelectTrigger className="h-auto w-full border-white/20 bg-white/5 py-2.5 text-white placeholder:text-white/50 focus:border-white/35 focus:bg-white/10 focus:ring-amber-500/40">
                                            <SelectValue placeholder="All types" />
                                        </SelectTrigger>
                                        <SelectContent className="border-white/20 bg-neutral-900 text-white">
                                            <SelectItem
                                                value="all"
                                                className="focus:bg-white/10 focus:text-white"
                                            >
                                                All types
                                            </SelectItem>
                                            {meta.types.map((type) => (
                                                <SelectItem
                                                    key={type}
                                                    value={type}
                                                    className="focus:bg-white/10 focus:text-white"
                                                >
                                                    {formatEventType(type)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5">
                                    <Label className="text-xs tracking-[0.3em] text-white/55 uppercase">
                                        Modality
                                    </Label>
                                    <Select
                                        value={localFilters.modality ?? 'all'}
                                        onValueChange={(value) =>
                                            setLocalFilters((prev) => ({
                                                ...prev,
                                                modality:
                                                    value === 'all'
                                                        ? undefined
                                                        : value,
                                            }))
                                        }
                                    >
                                        <SelectTrigger className="h-auto w-full border-white/20 bg-white/5 py-2.5 text-white placeholder:text-white/50 focus:border-white/35 focus:bg-white/10 focus:ring-amber-500/40">
                                            <SelectValue placeholder="All modalities" />
                                        </SelectTrigger>
                                        <SelectContent className="border-white/20 bg-neutral-900 text-white">
                                            <SelectItem
                                                value="all"
                                                className="focus:bg-white/10 focus:text-white"
                                            >
                                                All modalities
                                            </SelectItem>
                                            {meta.modalities.map((modality) => (
                                                <SelectItem
                                                    key={modality}
                                                    value={modality}
                                                    className="focus:bg-white/10 focus:text-white"
                                                >
                                                    {formatEventModality(
                                                        modality,
                                                    )}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Row 3: Tags */}
                            <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5">
                                <Label className="text-xs tracking-[0.3em] text-white/55 uppercase">
                                    Tags
                                </Label>
                                {selectedTagIds.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedTagIds.map((tagId) => {
                                            const tag = meta.tags.find(
                                                (t) => t.id === tagId,
                                            );
                                            if (!tag) return null;
                                            return (
                                                <Badge
                                                    key={tagId}
                                                    className="flex items-center gap-1 rounded-full border border-amber-400/60 bg-amber-400/15 px-3 py-1 text-xs font-medium text-amber-200"
                                                >
                                                    {tag.name}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            toggleTag(tagId)
                                                        }
                                                        className="ml-1 rounded-full p-0.5 hover:bg-amber-400/30"
                                                    >
                                                        <X className="size-3" />
                                                    </button>
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                )}
                                <Input
                                    type="text"
                                    placeholder="Search tags..."
                                    value={tagSearch}
                                    onChange={(e) =>
                                        setTagSearch(e.target.value)
                                    }
                                    className="border-white/20 bg-white/5 text-white placeholder:text-white/50 focus:border-white/35 focus:bg-white/10"
                                />
                                <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                                    {filteredTags.map((tag) => {
                                        const isSelected =
                                            selectedTagIds.includes(tag.id);
                                        return (
                                            <button
                                                key={tag.id}
                                                type="button"
                                                onClick={() =>
                                                    toggleTag(tag.id)
                                                }
                                                className={cn(
                                                    'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                                                    isSelected
                                                        ? 'border-amber-400/60 bg-amber-400/15 text-amber-200'
                                                        : 'border-white/20 bg-white/5 text-white/80 hover:border-white/35 hover:bg-white/10 hover:text-white',
                                                )}
                                            >
                                                {tag.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Row 4: Location */}
                            <div className="relative space-y-3 overflow-visible rounded-3xl border border-white/10 bg-white/5 p-5">
                                <Label className="text-xs tracking-[0.3em] text-white/55 uppercase">
                                    Location
                                </Label>
                                <div className="relative overflow-visible">
                                    <LocationAutocomplete
                                        value={locationQuery}
                                        onChange={handleLocationQueryChange}
                                        onSelect={handleLocationSelect}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}
