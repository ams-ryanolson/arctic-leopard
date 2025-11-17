import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
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
    type EventModality,
    type EventTag,
    type EventType,
    formatEventModality,
    formatEventType,
} from '@/types/events';
import { useForm } from '@inertiajs/react';
import { type PropsWithChildren, useCallback, useMemo, useState } from 'react';

type EventSubmissionDialogProps = {
    tags: EventTag[];
    modalities: EventModality[];
    types: EventType[];
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
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

export function EventSubmissionDialog({
    tags,
    modalities,
    types,
    trigger,
    children,
    open: controlledOpen,
    onOpenChange,
}: PropsWithChildren<EventSubmissionDialogProps>) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen ?? internalOpen;

    const setOpen = useCallback(
        (value: boolean) => {
            if (controlledOpen === undefined) {
                setInternalOpen(value);
            }

            onOpenChange?.(value);
        },
        [controlledOpen, onOpenChange],
    );
    const defaultModality = modalities.includes('in_person')
        ? 'in_person'
        : modalities[0];
    const defaultType = types[0] ?? 'other';
    const [selectedTags, setSelectedTags] = useState<number[]>([]);

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
        virtual_meeting_url: '',
        submission_notes: '',
        tags: [] as number[],
    });

    const handleToggleTag = useCallback(
        (tagId: number) => {
            setSelectedTags((prev) => {
                if (prev.includes(tagId)) {
                    return prev.filter((id) => id !== tagId);
                }

                return [...prev, tagId];
            });
        },
        [setSelectedTags],
    );

    const handleSubmit = useCallback(() => {
        form.setData((data) => ({
            ...data,
            tags: selectedTags,
        }));

        form.post(eventsRoutes.store().url, {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                setSelectedTags([]);
                form.reset();
            },
        });
    }, [form, selectedTags, setOpen]);

    const modalityIsVirtual = form.data.modality === 'virtual';

    const timezoneList = useMemo(() => {
        const tz = getDefaultTimezone();

        if (!timezoneOptions.includes(tz)) {
            return [tz, ...timezoneOptions];
        }

        return timezoneOptions;
    }, []);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button className="rounded-full bg-white px-6 text-xs font-semibold tracking-[0.35em] text-black uppercase">
                        Suggest an event
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-black/90 text-white shadow-[0_60px_120px_-70px_rgba(249,115,22,0.75)] backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold">
                        Suggest an official event
                    </DialogTitle>
                    <DialogDescription className="text-sm text-white/60">
                        Tell us what’s happening, where it’s located, and what
                        members should expect. We’ll review and follow up with
                        next steps.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
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
                                    form.setData(
                                        'starts_at',
                                        event.target.value,
                                    )
                                }
                                className="rounded-2xl border-white/20 bg-black/40 text-sm text-white focus-visible:ring-amber-400/40"
                            />
                            <InputError message={form.errors.starts_at} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="event-ends">
                                Ends{' '}
                                <span className="text-white/40">
                                    (optional)
                                </span>
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
                            <Label htmlFor="event-city">City / Region</Label>
                            <Input
                                id="event-city"
                                value={form.data.location_city}
                                disabled={modalityIsVirtual}
                                onChange={(event) =>
                                    form.setData(
                                        'location_city',
                                        event.target.value,
                                    )
                                }
                                placeholder="Berlin, Germany"
                                className={cn(
                                    'rounded-2xl border-white/20 bg-black/40 text-white placeholder:text-white/40 focus-visible:ring-amber-400/40',
                                    modalityIsVirtual && 'opacity-60',
                                )}
                            />
                            <InputError message={form.errors.location_city} />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="event-country">Country code</Label>
                            <Input
                                id="event-country"
                                value={form.data.location_country}
                                disabled={modalityIsVirtual}
                                onChange={(event) =>
                                    form.setData(
                                        'location_country',
                                        event.target.value.toUpperCase(),
                                    )
                                }
                                placeholder="DE"
                                maxLength={2}
                                className={cn(
                                    'rounded-2xl border-white/20 bg-black/40 text-white uppercase placeholder:text-white/40 focus-visible:ring-amber-400/40',
                                    modalityIsVirtual && 'opacity-60',
                                )}
                            />
                            <InputError
                                message={form.errors.location_country}
                            />
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
                            <InputError
                                message={form.errors.virtual_meeting_url}
                            />
                        </div>
                    </div>

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
                            <span className="ml-1 text-white/45">
                                (optional)
                            </span>
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

                    {children}

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
                        <div>
                            <p className="font-semibold text-white">
                                What makes an event official?
                            </p>
                            <ul className="mt-2 list-disc space-y-1 pl-4 text-white/70">
                                <li>Includes a vetted host or venue.</li>
                                <li>
                                    Has clear consent & safety expectations.
                                </li>
                                <li>Offers a plan for community follow-up.</li>
                            </ul>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Button
                                type="button"
                                disabled={form.processing}
                                onClick={handleSubmit}
                                className="rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 px-8 text-sm font-semibold tracking-[0.35em] text-white uppercase shadow-[0_35px_90px_-50px_rgba(16,185,129,0.65)] transition hover:scale-[1.02]"
                            >
                                Submit for review
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setOpen(false)}
                                className="rounded-full border border-white/15 bg-white/10 px-6 text-xs font-semibold tracking-[0.35em] text-white/70 uppercase hover:border-white/25 hover:bg-white/15 hover:text-white"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
