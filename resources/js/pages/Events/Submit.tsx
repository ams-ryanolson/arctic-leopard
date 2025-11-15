import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import InputError from '@/components/input-error';
import eventsRoutes from '@/routes/events';
import { useForm, Head, Link } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';
import {
    type EventModality,
    type EventTag,
    type EventType,
    formatEventModality,
    formatEventType,
} from '@/types/events';
import { cn } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { LocationAutocomplete, type LocationSuggestion } from '@/components/location-autocomplete';
import { LocationMapPreview } from '@/components/location-map-preview';

type EventSubmitProps = {
    tags: EventTag[];
    modalities: EventModality[];
    types: EventType[];
};

const timezoneOptions = [
    'UTC',
    'America/Los_Angeles',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'Europe/London',
    'Europe/Berlin',
    'Europe/Paris',
    'Australia/Sydney',
];

function getDefaultTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
        return 'UTC';
    }
}

export default function EventSubmit({
    tags,
    modalities,
    types,
}: EventSubmitProps) {
    const defaultModality = modalities.includes('in_person')
        ? 'in_person'
        : modalities[0];
    const defaultType = types[0] ?? 'other';

    const form = useForm({
        title: '',
        subtitle: '',
        description: '',
        type: defaultType,
        modality: defaultModality,
        starts_at: '',
        ends_at: '',
        timezone: getDefaultTimezone(),
        location_name: '',
        location_city: '',
        location_region: '',
        location_country: '',
        location_latitude: '',
        location_longitude: '',
        virtual_meeting_url: '',
        submission_notes: '',
        tags: [] as number[],
    });

    const [selectedTags, setSelectedTags] = useState<number[]>([]);
    const [locationQuery, setLocationQuery] = useState(() => {
        // Build location query from existing form data
        if (form.data.location_city && form.data.location_country) {
            return [
                form.data.location_city,
                form.data.location_region,
                form.data.location_country,
            ]
                .filter(Boolean)
                .join(', ');
        }
        return '';
    });

    const handleLocationSelect = useCallback(
        (suggestion: LocationSuggestion) => {
            form.setData({
                ...form.data,
                location_city: suggestion.city,
                location_region: suggestion.region || '',
                location_country: suggestion.country_code || suggestion.country,
                location_latitude: suggestion.latitude,
                location_longitude: suggestion.longitude,
            });
            setLocationQuery(suggestion.label);
        },
        [form],
    );

    const handleLocationQueryChange = useCallback(
        (value: string) => {
            setLocationQuery(value);
            // Clear location fields if query is cleared
            if (!value.trim()) {
                form.setData({
                    ...form.data,
                    location_city: '',
                    location_region: '',
                    location_country: '',
                    location_latitude: '',
                    location_longitude: '',
                });
            }
        },
        [form],
    );

    const handleToggleTag = useCallback(
        (tagId: number) => {
            setSelectedTags((prev) => {
                if (prev.includes(tagId)) {
                    return prev.filter((id) => id !== tagId);
                }

                return [...prev, tagId];
            });
        },
        [],
    );

    const handleSubmit = useCallback(() => {
        form.setData((data) => ({
            ...data,
            tags: selectedTags,
        }));

        form.post(eventsRoutes.store().url, {
            // Backend redirects to events.index on success
        });
    }, [form, selectedTags]);

    const modalityIsVirtual = form.data.modality === 'virtual';

    const timezoneList = useMemo(() => {
        const tz = getDefaultTimezone();

        if (!timezoneOptions.includes(tz)) {
            return [tz, ...timezoneOptions];
        }

        return timezoneOptions;
    }, []);

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Events',
                    href: eventsRoutes.index().url,
                },
                {
                    title: 'Suggest an event',
                    href: eventsRoutes.submit().url,
                },
            ]}
        >
            <Head title="Suggest an Event" />

            <div className="mx-auto max-w-4xl space-y-8">
                <div className="flex items-center gap-4">
                    <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="rounded-full border border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white"
                    >
                        <Link href={eventsRoutes.index().url}>
                            <ArrowLeft className="mr-2 size-4" />
                            Back to events
                        </Link>
                    </Button>
                </div>

                <Card className="border-white/10 bg-black/40 text-white shadow-[0_60px_120px_-70px_rgba(249,115,22,0.75)]">
                    <CardHeader className="space-y-2">
                        <CardTitle className="text-3xl font-semibold">
                            Suggest an official event
                        </CardTitle>
                        <CardDescription className="text-base text-white/65">
                            Tell us what's happening, where it's located, and what
                            members should expect. We'll review and follow up with
                            next steps.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-8 pt-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="event-title">Event title</Label>
                                <Input
                                    id="event-title"
                                    value={form.data.title}
                                    onChange={(event) =>
                                        form.setData('title', event.target.value)
                                    }
                                    className="rounded-2xl border-white/20 bg-black/40 text-white placeholder:text-white/40 focus-visible:ring-amber-400/40"
                                    placeholder="Leather Atlas · Field Trip"
                                />
                                <InputError message={form.errors.title} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="event-subtitle">
                                    Short description
                                </Label>
                                <Input
                                    id="event-subtitle"
                                    value={form.data.subtitle}
                                    onChange={(event) =>
                                        form.setData('subtitle', event.target.value)
                                    }
                                    className="rounded-2xl border-white/20 bg-black/40 text-white placeholder:text-white/40 focus-visible:ring-amber-400/40"
                                    placeholder="Warehouse pop-up · RSVP required"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="event-description">Description</Label>
                            <textarea
                                id="event-description"
                                value={form.data.description}
                                onChange={(event) =>
                                    form.setData('description', event.target.value)
                                }
                                rows={5}
                                placeholder="Share the focus of the event, who can attend, safety requirements, and any hosts or co-organizers involved."
                                className="min-h-[140px] w-full rounded-3xl border border-white/20 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/40 focus-visible:ring-amber-400/40"
                            />
                            <InputError message={form.errors.description} />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label>Event type</Label>
                                <Select
                                    value={form.data.type}
                                    onValueChange={(value) =>
                                        form.setData('type', value as EventType)
                                    }
                                >
                                    <SelectTrigger className="rounded-2xl border-white/20 bg-black/40 text-sm text-white focus:ring-amber-400/40">
                                        <SelectValue placeholder="Choose type" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border border-white/10 bg-black/85 text-white shadow-[0_30px_80px_-45px_rgba(0,0,0,0.75)] backdrop-blur-xl">
                                        {types.map((type) => (
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
                                <InputError message={form.errors.type} />
                            </div>

                            <div className="space-y-2">
                                <Label>Modality</Label>
                                <Select
                                    value={form.data.modality}
                                    onValueChange={(value) =>
                                        form.setData(
                                            'modality',
                                            value as EventModality,
                                        )
                                    }
                                >
                                    <SelectTrigger className="rounded-2xl border-white/20 bg-black/40 text-sm text-white focus:ring-amber-400/40">
                                        <SelectValue placeholder="Choose modality" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border border-white/10 bg-black/85 text-white shadow-[0_30px_80px_-45px_rgba(0,0,0,0.75)] backdrop-blur-xl">
                                        {modalities.map((modality) => (
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
                                <InputError message={form.errors.modality} />
                            </div>

                            <div className="space-y-2">
                                <Label>Timezone</Label>
                                <Select
                                    value={form.data.timezone}
                                    onValueChange={(value) =>
                                        form.setData('timezone', value)
                                    }
                                >
                                    <SelectTrigger className="rounded-2xl border-white/20 bg-black/40 text-sm text-white focus:ring-amber-400/40">
                                        <SelectValue placeholder="Timezone" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-56 rounded-2xl border border-white/10 bg-black/85 text-white shadow-[0_30px_80px_-45px_rgba(0,0,0,0.75)] backdrop-blur-xl">
                                        {timezoneList.map((timezone) => (
                                            <SelectItem
                                                key={timezone}
                                                value={timezone}
                                                className="text-sm text-white/80 focus:bg-white/10 focus:text-white"
                                            >
                                                {timezone}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.timezone} />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="event-starts">Starts</Label>
                                <Input
                                    id="event-starts"
                                    type="datetime-local"
                                    value={form.data.starts_at}
                                    onChange={(event) =>
                                        form.setData('starts_at', event.target.value)
                                    }
                                    className="rounded-2xl border-white/20 bg-black/40 text-sm text-white focus-visible:ring-amber-400/40"
                                />
                                <InputError message={form.errors.starts_at} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="event-ends">
                                    Ends <span className="text-white/40">(optional)</span>
                                </Label>
                                <Input
                                    id="event-ends"
                                    type="datetime-local"
                                    value={form.data.ends_at ?? ''}
                                    onChange={(event) =>
                                        form.setData('ends_at', event.target.value)
                                    }
                                    className="rounded-2xl border-white/20 bg-black/40 text-sm text-white focus-visible:ring-amber-400/40"
                                />
                                <InputError message={form.errors.ends_at} />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="event-location">
                                    Venue / location name
                                    <span className="ml-1 text-white/45">(optional)</span>
                                </Label>
                                <Input
                                    id="event-location"
                                    value={form.data.location_name}
                                    disabled={modalityIsVirtual}
                                    onChange={(event) =>
                                        form.setData(
                                            'location_name',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Warehouse District Pop-up"
                                    className={cn(
                                        'rounded-2xl border-white/20 bg-black/40 text-white placeholder:text-white/40 focus-visible:ring-amber-400/40',
                                        modalityIsVirtual && 'opacity-60',
                                    )}
                                />
                                <InputError message={form.errors.location_name} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="event-virtual-url">
                                    Virtual meeting link
                                </Label>
                                <Input
                                    id="event-virtual-url"
                                    value={form.data.virtual_meeting_url}
                                    onChange={(event) =>
                                        form.setData(
                                            'virtual_meeting_url',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="https://"
                                    className="rounded-2xl border-white/20 bg-black/40 text-white placeholder:text-white/40 focus-visible:ring-amber-400/40"
                                />
                                <InputError message={form.errors.virtual_meeting_url} />
                            </div>
                        </div>

                        {!modalityIsVirtual && (
                            <div className="space-y-2">
                                <Label htmlFor="event-address">
                                    Address / Location
                                </Label>
                                <div className={cn('relative', modalityIsVirtual && 'opacity-60')}>
                                    <LocationAutocomplete
                                        value={locationQuery}
                                        onChange={handleLocationQueryChange}
                                        onSelect={handleLocationSelect}
                                        includeAddresses={true}
                                        error={
                                            form.errors.location_city ||
                                            form.errors.location_country ||
                                            undefined
                                        }
                                    />
                                </div>
                                <InputError
                                    message={
                                        form.errors.location_city ||
                                        form.errors.location_country ||
                                        form.errors.location_latitude ||
                                        form.errors.location_longitude
                                    }
                                />
                                {form.data.location_city && form.data.location_country && (
                                    <div className="mt-2 space-y-3">
                                        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
                                            <p className="font-medium text-white/90">Selected location:</p>
                                            <p>
                                                {[
                                                    form.data.location_city,
                                                    form.data.location_region,
                                                    form.data.location_country,
                                                ]
                                                    .filter(Boolean)
                                                    .join(', ')}
                                            </p>
                                        </div>
                                        {form.data.location_latitude &&
                                            form.data.location_longitude && (
                                                <LocationMapPreview
                                                    latitude={form.data.location_latitude}
                                                    longitude={form.data.location_longitude}
                                                    label={locationQuery || undefined}
                                                    className="h-[300px]"
                                                />
                                            )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-3">
                            <Label>Tags (optional)</Label>
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag) => {
                                    const checked = selectedTags.includes(tag.id);

                                    return (
                                        <button
                                            key={tag.id}
                                            type="button"
                                            onClick={() => handleToggleTag(tag.id)}
                                            className={cn(
                                                'flex items-center gap-2 rounded-full border px-3 py-2 text-xs transition',
                                                checked
                                                    ? 'border-amber-400/50 bg-amber-500/20 text-amber-100 shadow-[0_18px_55px_-30px_rgba(249,115,22,0.55)]'
                                                    : 'border-white/15 bg-black/25 text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white',
                                            )}
                                        >
                                            <Checkbox
                                                checked={checked}
                                                onCheckedChange={() =>
                                                    handleToggleTag(tag.id)
                                                }
                                                className="border-white/40 data-[state=checked]:border-amber-400 data-[state=checked]:bg-amber-500"
                                            />
                                            {tag.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="event-notes">
                                Additional context for admins
                                <span className="ml-1 text-white/45">(optional)</span>
                            </Label>
                            <textarea
                                id="event-notes"
                                rows={3}
                                value={form.data.submission_notes}
                                onChange={(event) =>
                                    form.setData(
                                        'submission_notes',
                                        event.target.value,
                                    )
                                }
                                placeholder="Share technical requirements, collaborator contacts, or anything else we should know during review."
                                className="w-full rounded-3xl border border-white/20 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/40 focus-visible:ring-amber-400/40"
                            />
                            <InputError message={form.errors.submission_notes} />
                        </div>

                        <div className="flex flex-wrap items-start justify-between gap-6 rounded-3xl border border-white/10 bg-white/5 px-6 py-5">
                            <div className="flex-1 min-w-0">
                                <p className="mb-3 font-semibold text-white">
                                    What makes an event official?
                                </p>
                                <ul className="space-y-1.5 text-sm text-white/70">
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-400" />
                                        Includes a vetted host or venue.
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-400" />
                                        Has clear consent & safety expectations.
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-400" />
                                        Offers a plan for community follow-up.
                                    </li>
                                </ul>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    asChild
                                    className="rounded-full border border-white/15 bg-white/10 px-6 text-xs font-semibold uppercase tracking-[0.35em] text-white/70 hover:border-white/25 hover:bg-white/15 hover:text-white"
                                >
                                    <Link href={eventsRoutes.index().url}>
                                        Cancel
                                    </Link>
                                </Button>
                                <Button
                                    type="button"
                                    disabled={form.processing}
                                    onClick={handleSubmit}
                                    className="rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 px-8 text-sm font-semibold uppercase tracking-[0.35em] text-white shadow-[0_35px_90px_-50px_rgba(16,185,129,0.65)] transition hover:scale-[1.02]"
                                >
                                    {form.processing ? 'Submitting...' : 'Submit for review'}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

