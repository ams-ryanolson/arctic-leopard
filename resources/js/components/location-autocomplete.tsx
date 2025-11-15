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
    country_code?: string;
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
    includeAddresses?: boolean; // When true, includes addresses, venues, buildings. When false, only cities/regions.
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export function LocationAutocomplete({
    value,
    onChange,
    onSelect,
    error,
    status = 'idle',
    autoActive = false,
    includeAddresses = false,
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
                url.searchParams.set('limit', '10');
                url.searchParams.set('addressdetails', '1');
                url.searchParams.set('q', query);
                // Include various place types: addresses, amenities, buildings, etc.
                url.searchParams.set('dedupe', '1');

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
                            
                            // Extract city from various possible fields
                            const city =
                                address.city ??
                                address.town ??
                                address.village ??
                                address.hamlet ??
                                address.municipality ??
                                address.suburb ??
                                address.neighbourhood ??
                                '';
                            
                            // Extract region/state
                            const region = address.state ?? address.region ?? address.county ?? address.province ?? '';
                            
                            // Extract country
                            const country = address.country ?? '';
                            const countryCode = address.country_code?.toUpperCase() ?? undefined;
                            
                            // If includeAddresses is false, only return city/region results
                            if (!includeAddresses) {
                                // Filter out addresses, buildings, amenities - only cities/regions
                                if (address.road || address.house_number || address.building || address.amenity) {
                                    return null;
                                }
                                
                                // Require city for city-only mode
                                if (!city) {
                                    return null;
                                }
                                
                                const label = [city, region, country].filter(Boolean).join(', ');
                                
                                return {
                                    id: item.place_id,
                                    label: label || item.display_name,
                                    city,
                                    region,
                                    country,
                                    country_code: countryCode,
                                    latitude: item.lat,
                                    longitude: item.lon,
                                } satisfies LocationSuggestion;
                            }
                            
                            // Address mode: include addresses, venues, buildings
                            // Build label - use display_name for addresses/venues, or build from components
                            let label = item.display_name;
                            
                            // If it's a specific address or venue, use the display_name
                            // Otherwise, build from city, region, country
                            if (address.road || address.house_number || address.building || address.amenity) {
                                // It's an address or venue - use display_name as-is
                                label = item.display_name;
                            } else {
                                // It's a broader location - build from components
                                label = [city, region, country].filter(Boolean).join(', ');
                            }
                            
                            // For addresses/venues without explicit city, try to extract from display_name
                            let finalCity = city;
                            if (!finalCity && item.display_name) {
                                // Parse display_name which typically follows: "Name, City, Region, Country"
                                const parts = item.display_name.split(',').map(p => p.trim());
                                
                                // Usually city is the second-to-last or third-to-last part
                                // Skip the last part (country) and potentially region
                                for (let i = parts.length - 2; i >= 0; i--) {
                                    const part = parts[i];
                                    // Skip if it looks like a street address, postal code, or is too short
                                    if (
                                        !part.match(/^\d+/) && 
                                        !part.match(/^\d{4,}/) && // postal codes
                                        part.length > 2 &&
                                        !part.match(/^(street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|way|lane|ln)/i)
                                    ) {
                                        finalCity = part;
                                        break;
                                    }
                                }
                                
                                // Fallback: if still no city, use the first non-address part
                                if (!finalCity && parts.length > 1) {
                                    for (const part of parts.slice(0, -1)) {
                                        if (!part.match(/^\d+/) && part.length > 2) {
                                            finalCity = part;
                                            break;
                                        }
                                    }
                                }
                            }

                            // Require at least country for valid results
                            if (!country) {
                                return null;
                            }

                            return {
                                id: item.place_id,
                                label: label || item.display_name,
                                city: finalCity || city || '',
                                region,
                                country,
                                country_code: countryCode,
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
    }, [query, includeAddresses]);

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
                <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-black/80 backdrop-blur">
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

