import { useEffect, useMemo, useState } from 'react';

import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export interface LocationSuggestion {
    id: string;
    label: string;
    city: string;
    region: string;
    country: string;
    latitude: string;
    longitude: string;
}

interface LocationAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onSelect: (suggestion: LocationSuggestion) => void;
    error?: string;
    status?: 'idle' | 'locating' | 'acquired' | 'denied';
    autoActive?: boolean;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export function LocationAutocomplete({
    value,
    onChange,
    onSelect,
    error,
    status = 'idle',
    autoActive = false,
}: LocationAutocompleteProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<LocationSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        setQuery(value);
    }, [value]);

    useEffect(() => {
        if (!query || query.length < 3) {
            setResults([]);
            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const url = new URL(NOMINATIM_URL);
                url.searchParams.set('format', 'json');
                url.searchParams.set('limit', '5');
                url.searchParams.set('addressdetails', '1');
                url.searchParams.set('q', query);

                const response = await fetch(url.toString(), {
                    signal: controller.signal,
                    headers: {
                        Accept: 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch locations');
                }

                const data: Array<{
                    place_id: string;
                    display_name: string;
                    lat: string;
                    lon: string;
                    address?: Record<string, string>;
                }> = await response.json();

                setResults(
                    data
                        .map((item) => {
                            const address = item.address ?? {};
                            const city =
                                address.city ??
                                address.town ??
                                address.village ??
                                address.hamlet ??
                                address.municipality ??
                                '';
                            const region = address.state ?? address.region ?? address.county ?? '';
                            const country = address.country ?? '';
                            const label = [city, region, country].filter(Boolean).join(', ');

                            if (!city || !country) {
                                return null;
                            }

                            return {
                                id: item.place_id,
                                label: label || item.display_name,
                                city,
                                region,
                                country,
                                latitude: item.lat,
                                longitude: item.lon,
                            } satisfies LocationSuggestion;
                        })
                        .filter((value): value is LocationSuggestion => value !== null),
                );
            } catch (error_) {
                if (!(error_ instanceof DOMException && error_.name === 'AbortError')) {
                    console.error(error_);
                }
            } finally {
                setIsLoading(false);
            }
        }, 350);

        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [query]);

    const showDropdown = useMemo(
        () =>
            isFocused &&
            (results.length > 0 || isLoading || (query && query.length >= 3)),
        [isFocused, isLoading, query, results.length],
    );

    return (
        <div className="relative">
            <Input
                value={query}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                    // delay blur to allow click selection
                    setTimeout(() => setIsFocused(false), 150);
                }}
                onChange={(event) => {
                    const { value: nextValue } = event.target;
                    setQuery(nextValue);
                    onChange(nextValue);
                }}
                placeholder="Start typing your city"
                autoComplete="off"
                aria-autocomplete="list"
                aria-expanded={showDropdown ? 'true' : 'false'}
                aria-owns="location-suggestion-list"
                className={cn(
                    'pr-14',
                    autoActive &&
                        'border-white/35 ring-4 ring-emerald-500/20 shadow-[0_18px_45px_-30px_rgba(16,185,129,0.45)]',
                    error && 'border-destructive',
                )}
            />

            <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center">
                {status === 'locating' ? (
                    <Spinner className={cn('size-4', autoActive ? 'text-emerald-300' : 'text-white/60')} />
                ) : (
                    <span
                        className={cn(
                            'flex size-8 items-center justify-center rounded-full bg-white/8 text-white/60 transition',
                            autoActive &&
                                'bg-gradient-to-br from-emerald-400 via-emerald-500 to-violet-500 text-black shadow-[0_22px_55px_-32px_rgba(16,185,129,0.6)]',
                        )}
                    >
                        <MapPin className={cn('size-4', autoActive ? 'text-black' : undefined)} />
                    </span>
                )}
            </div>

            {showDropdown && (
                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-black/80 backdrop-blur">
                    {isLoading && (
                        <div className="flex items-center gap-2 px-4 py-3 text-sm text-white/60">
                            <Spinner className="size-4" />
                            Searching locations…
                        </div>
                    )}

                    {!isLoading && results.length > 0 && (
                        <ul id="location-suggestion-list" className="max-h-64 overflow-y-auto text-sm text-white/80">
                            {results.map((suggestion) => (
                                <li key={suggestion.id}>
                                    <button
                                        type="button"
                                        className="block w-full px-4 py-3 text-left transition hover:bg-white/10"
                                        onMouseDown={(event) => event.preventDefault()}
                                        onClick={() => {
                                            onSelect(suggestion);
                                            setQuery(suggestion.label);
                                            setResults([]);
                                            setIsFocused(false);
                                        }}
                                    >
                                        {suggestion.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {!isLoading && results.length === 0 && query.length >= 3 && (
                        <div className="px-4 py-3 text-sm text-white/60">
                            No results found. Try another phrase.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

