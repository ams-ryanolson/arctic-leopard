import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import {
    LocationAutocomplete,
    type LocationSuggestion,
} from '@/components/location-autocomplete';
import profileRoutes from '@/routes/profile';

interface LocationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: {
        location_latitude?: number | null;
        location_longitude?: number | null;
        location_city?: string | null;
        location_region?: string | null;
        location_country?: string | null;
    };
}

export function LocationModal({
    open,
    onOpenChange,
    user,
}: LocationModalProps) {
    const [locationQuery, setLocationQuery] = useState(() => {
        // Build initial query from existing location data
        if (user.location_city && user.location_country) {
            return [
                user.location_city,
                user.location_region,
                user.location_country,
            ]
                .filter(Boolean)
                .join(', ');
        }
        return '';
    });

    const [locationStatus, setLocationStatus] = useState<
        'idle' | 'locating' | 'acquired' | 'denied'
    >('idle');
    const [locationError, setLocationError] = useState<string | null>(null);

    const form = useForm({
        location_city: user.location_city || '',
        location_region: user.location_region || '',
        location_country: user.location_country || '',
        location_latitude: user.location_latitude?.toString() || '',
        location_longitude: user.location_longitude?.toString() || '',
    });

    const handleLocationSelect = (suggestion: LocationSuggestion) => {
        form.setData({
            location_city: suggestion.city,
            location_region: suggestion.region ?? '',
            location_country: suggestion.country,
            location_latitude: suggestion.latitude,
            location_longitude: suggestion.longitude,
        });
        setLocationQuery(suggestion.label);
        setLocationStatus('acquired');
        setLocationError(null);
    };

    const handleLocationQueryChange = (value: string) => {
        setLocationQuery(value);
        form.setData({
            location_city: '',
            location_region: '',
            location_country: '',
            location_latitude: '',
            location_longitude: '',
        });
        setLocationStatus('idle');
        setLocationError(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.data.location_latitude || !form.data.location_longitude) {
            setLocationError('Please select a location from the suggestions');
            return;
        }

        form.patch(profileRoutes.location.update.url(), {
            preserveScroll: true,
            onSuccess: () => {
                onOpenChange(false);
                setLocationError(null);
            },
            onError: () => {
                setLocationError(
                    'Failed to save location. Please try again.',
                );
            },
        });
    };

    const handleSkip = () => {
        // Allow skipping - they can set it later
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Set Your Location</DialogTitle>
                    <DialogDescription>
                        Help us connect you with people nearby by setting your
                        location. This helps with features like Radar and local
                        events.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="location_search">
                                Where are you based?
                            </Label>
                            <LocationAutocomplete
                                value={locationQuery}
                                onChange={handleLocationQueryChange}
                                onSelect={handleLocationSelect}
                                error={
                                    form.errors.location_city ||
                                    form.errors.location_country ||
                                    locationError ||
                                    undefined
                                }
                                status={locationStatus}
                            />
                            <InputError
                                message={
                                    form.errors.location_city ||
                                    form.errors.location_country ||
                                    form.errors.location_latitude ||
                                    form.errors.location_longitude ||
                                    locationError
                                }
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleSkip}
                            disabled={form.processing}
                        >
                            Skip for now
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                form.processing ||
                                !form.data.location_latitude ||
                                !form.data.location_longitude
                            }
                        >
                            {form.processing ? 'Saving...' : 'Save Location'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

