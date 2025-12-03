import {
    LocationAutocomplete,
    type LocationSuggestion,
} from '@/components/location-autocomplete';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useFrontendToken } from '@/hooks/use-frontend-token';
import {
    createPaymentToken3DS,
    initializeCCBillWidget,
    type CCBillWidgetInstance,
} from '@/lib/ccbill-widget';
import { COUNTRIES } from '@/lib/countries';
import { cn } from '@/lib/utils';
import {
    CheckCircle2,
    CreditCard,
    HelpCircle,
    Loader2,
    Lock,
    Shield,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export type CardDetails = {
    lastFour: string;
    brand: string;
    expMonth: string;
    expYear: string;
};

/**
 * Detect card brand from card number prefix.
 */
function detectCardBrand(cardNumber: string): string {
    const cleanNumber = cardNumber.replace(/\s/g, '');

    // Visa: starts with 4
    if (/^4/.test(cleanNumber)) {
        return 'visa';
    }

    // Mastercard: starts with 51-55 or 2221-2720
    if (
        /^5[1-5]/.test(cleanNumber) ||
        /^2(22[1-9]|2[3-9]\d|[3-6]\d{2}|7[01]\d|720)/.test(cleanNumber)
    ) {
        return 'mastercard';
    }

    // American Express: starts with 34 or 37
    if (/^3[47]/.test(cleanNumber)) {
        return 'amex';
    }

    // Discover: starts with 6011, 622126-622925, 644-649, 65
    if (
        /^6011|^65|^64[4-9]|^622(12[6-9]|1[3-9]\d|[2-8]\d{2}|9[01]\d|92[0-5])/.test(
            cleanNumber,
        )
    ) {
        return 'discover';
    }

    // JCB: starts with 3528-3589
    if (/^35(2[89]|[3-8]\d)/.test(cleanNumber)) {
        return 'jcb';
    }

    // Diners Club: starts with 300-305, 36, 38-39
    if (/^3(0[0-5]|[68]\d|9\d)/.test(cleanNumber)) {
        return 'diners';
    }

    return 'unknown';
}

type CCBillCardFormProps = {
    clientAccnum: number;
    clientSubacc: number;
    onTokenCreated: (
        tokenId: string,
        is3DS: boolean,
        cardDetails: CardDetails,
    ) => void;
    onError?: (error: string) => void;
    onCancel?: () => void;
    gateway?: string;
    className?: string;
    user?: {
        email?: string;
        name?: string;
        location_city?: string | null;
        location_region?: string | null;
        location_country?: string | null;
    };
};

export function CCBillCardForm({
    clientAccnum,
    clientSubacc,
    onTokenCreated,
    onError,
    onCancel,
    gateway = 'ccbill',
    className,
    user,
}: CCBillCardFormProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetRef = useRef<CCBillWidgetInstance | null>(null);
    const [isCreatingToken, setIsCreatingToken] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [is3DSChallenge, setIs3DSChallenge] = useState(false);
    const [widgetInitialized, setWidgetInitialized] = useState(false);
    const {
        token: bearerToken,
        applicationId,
        loading: tokenLoading,
        fetchToken,
    } = useFrontendToken();

    // Address autocomplete state
    const [addressQuery, setAddressQuery] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<string>(
        user?.location_country || '',
    );
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);

    // Field validation states
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

    // Format card number with spaces every 4 digits
    const formatCardNumber = (value: string): string => {
        const cleaned = value.replace(/\s/g, '');
        const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
        return formatted;
    };

    // Handle card number input with formatting
    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        const formatted = formatCardNumber(input.value);
        input.value = formatted;

        // Update CCBill widget field
        if (
            widgetRef.current?.fields &&
            typeof widgetRef.current.fields.setFieldValue === 'function'
        ) {
            widgetRef.current.fields.setFieldValue(
                'cardNumber',
                formatted.replace(/\s/g, ''),
            );
        }

        // Validate card number (basic check)
        if (formatted.replace(/\s/g, '').length < 13) {
            setFieldErrors((prev) => ({
                ...prev,
                cardNumber: 'Card number is too short',
            }));
        } else if (formatted.replace(/\s/g, '').length > 19) {
            setFieldErrors((prev) => ({
                ...prev,
                cardNumber: 'Card number is too long',
            }));
        } else {
            setFieldErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.cardNumber;
                return newErrors;
            });
        }
    };

    // Handle field blur for validation
    const handleFieldBlur = (fieldName: string, value: string) => {
        setTouchedFields((prev) => new Set(prev).add(fieldName));

        // Basic validation
        if (
            !value.trim() &&
            [
                'firstName',
                'lastName',
                'email',
                'cardNumber',
                'nameOnCard',
                'cvv2',
                'postalCode',
                'country',
            ].includes(fieldName)
        ) {
            setFieldErrors((prev) => ({
                ...prev,
                [fieldName]: 'This field is required',
            }));
        } else {
            setFieldErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        }
    };

    // Parse user name into first/last
    const userNameParts = user?.name?.split(' ') || [];
    const userFirstName = userNameParts[0] || '';
    const userLastName = userNameParts.slice(1).join(' ') || '';

    // Handle address autocomplete selection - extract detailed address components
    const handleAddressSelect = async (suggestion: LocationSuggestion) => {
        setIsLoadingAddress(true);
        setAddressQuery(suggestion.label);

        // Fetch detailed address information via reverse geocoding to get postal code and street address
        let streetAddress = '';
        let postalCode = '';
        let city = suggestion.city;
        let state = suggestion.region;
        let country =
            suggestion.country_code?.toUpperCase() || suggestion.country;

        try {
            // Use reverse geocoding to get more detailed address components
            const reverseUrl = new URL(
                'https://nominatim.openstreetmap.org/reverse',
            );
            reverseUrl.searchParams.set('format', 'json');
            reverseUrl.searchParams.set('lat', suggestion.latitude);
            reverseUrl.searchParams.set('lon', suggestion.longitude);
            reverseUrl.searchParams.set('addressdetails', '1');

            const reverseResponse = await fetch(reverseUrl.toString(), {
                headers: { Accept: 'application/json' },
            });

            if (reverseResponse.ok) {
                const reverseData: {
                    address?: {
                        house_number?: string;
                        road?: string;
                        street?: string;
                        postcode?: string;
                        city?: string;
                        town?: string;
                        village?: string;
                        state?: string;
                        region?: string;
                        country_code?: string;
                    };
                } = await reverseResponse.json();

                const address = reverseData.address || {};

                // Build street address from house number + road/street
                const houseNumber = address.house_number || '';
                const road = address.road || address.street || '';
                streetAddress = [houseNumber, road]
                    .filter(Boolean)
                    .join(' ')
                    .trim();

                // Get postal code
                postalCode = address.postcode || '';

                // Get city (prefer from reverse geocoding, fallback to suggestion)
                city =
                    address.city ||
                    address.town ||
                    address.village ||
                    suggestion.city ||
                    '';

                // Get state/region
                state =
                    address.state || address.region || suggestion.region || '';

                // Get country code
                if (address.country_code) {
                    country = address.country_code.toUpperCase();
                }
            }
        } catch (error) {
            console.warn('Failed to fetch detailed address:', error);
            // Fallback: try to parse street address from label
            // For addresses, label format is usually: "House Number Road, City, State, Country"
            const parts = suggestion.label.split(',').map((p) => p.trim());
            if (parts.length > 0) {
                // First part is usually the street address
                streetAddress = parts[0];
            }
        }

        // If we still don't have a street address, use the first part of the label
        if (!streetAddress && suggestion.label) {
            const parts = suggestion.label.split(',').map((p) => p.trim());
            streetAddress = parts[0] || suggestion.label;
        }

        // Verify country code exists in COUNTRIES array before using it
        const normalizedCountry = country ? country.toUpperCase().trim() : '';
        const validCountry =
            normalizedCountry &&
            COUNTRIES.some((c) => c.code === normalizedCountry)
                ? normalizedCountry
                : '';

        // Debug logging (can be removed later)
        if (country && !validCountry) {
            console.warn(
                'Country code not found in COUNTRIES:',
                normalizedCountry,
                'Available codes:',
                COUNTRIES.slice(0, 10).map((c) => c.code),
            );
        }

        // Update country state immediately (outside setTimeout for React state)
        if (validCountry) {
            console.log('Setting country to:', validCountry);
            setSelectedCountry(validCountry);
        } else if (country) {
            console.warn(
                'Invalid country code, not updating:',
                country,
                'normalized:',
                normalizedCountry,
            );
        }

        // Auto-fill address fields via widget if available
        // Use setTimeout to ensure fields are rendered
        setTimeout(() => {
            if (
                widgetRef.current?.fields &&
                typeof widgetRef.current.fields.setFieldValue === 'function'
            ) {
                const fields = widgetRef.current.fields;

                // Set address fields - users can still edit them
                if (streetAddress) {
                    fields.setFieldValue('address1', streetAddress);
                }
                if (city) {
                    fields.setFieldValue('city', city);
                }
                if (state) {
                    // CCBill requires state to be 1-3 characters, so truncate if longer
                    const stateValue = state
                        .trim()
                        .substring(0, 3)
                        .toUpperCase();
                    if (stateValue.length >= 1) {
                        fields.setFieldValue('state', stateValue);
                    }
                }
                if (postalCode) {
                    fields.setFieldValue('postalCode', postalCode);
                }
                if (validCountry) {
                    fields.setFieldValue('country', validCountry);
                }
            }

            // Set values directly on DOM elements
            const setFieldValue = (fieldId: string, value: string) => {
                const input = document.getElementById(fieldId) as
                    | HTMLInputElement
                    | HTMLSelectElement
                    | null;
                if (input) {
                    input.value = value;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            };

            if (streetAddress) setFieldValue('ccbill-address1', streetAddress);
            if (city) setFieldValue('ccbill-city', city);
            if (state) {
                // CCBill requires state to be 1-3 characters, so truncate if longer
                const stateValue = state.trim().substring(0, 3).toUpperCase();
                if (stateValue.length >= 1) {
                    setFieldValue('ccbill-state', stateValue);
                    // Also update widget
                    if (
                        widgetRef.current?.fields &&
                        typeof widgetRef.current.fields.setFieldValue ===
                            'function'
                    ) {
                        widgetRef.current.fields.setFieldValue(
                            'state',
                            stateValue,
                        );
                    }
                }
            }
            if (postalCode) setFieldValue('ccbill-postal-code', postalCode);
            if (validCountry) {
                setFieldValue('ccbill-country', validCountry);
                // Update the hidden select element
                const hiddenSelect = document.getElementById(
                    'ccbill-country',
                ) as HTMLSelectElement;
                if (hiddenSelect) {
                    hiddenSelect.value = validCountry;
                    hiddenSelect.dispatchEvent(
                        new Event('change', { bubbles: true }),
                    );
                }
                // Also update via widget if available
                if (
                    widgetRef.current?.fields &&
                    typeof widgetRef.current.fields.setFieldValue === 'function'
                ) {
                    widgetRef.current.fields.setFieldValue(
                        'country',
                        validCountry,
                    );
                }
            }

            setIsLoadingAddress(false);
        }, 300);

        // Update the address query to show just the street address
        setAddressQuery(streetAddress || suggestion.label);
    };

    // Initialize widget when bearer token is available
    useEffect(() => {
        if (
            !bearerToken ||
            !applicationId ||
            !containerRef.current ||
            !clientAccnum ||
            !clientSubacc
        ) {
            return;
        }

        let mounted = true;

        const initWidget = async () => {
            try {
                const widget = await initializeCCBillWidget({
                    applicationId, // Frontend application ID for widget constructor
                    clientAccnum,
                    clientSubacc,
                    onSuccess: (tokenId: string) => {
                        if (!mounted) {
                            return;
                        }
                        setIsCreatingToken(false);
                        setIs3DSChallenge(false);

                        // Extract card details from form for vaulting
                        const cardNumberInput = document.getElementById(
                            'ccbill-card-number',
                        ) as HTMLInputElement;
                        const expMonthSelect = document.getElementById(
                            'ccbill-exp-month',
                        ) as HTMLSelectElement;
                        const expYearSelect = document.getElementById(
                            'ccbill-exp-year',
                        ) as HTMLSelectElement;

                        const rawCardNumber =
                            cardNumberInput?.value?.replace(/\s/g, '') || '';
                        const cardDetails: CardDetails = {
                            lastFour: rawCardNumber.slice(-4),
                            brand: detectCardBrand(rawCardNumber),
                            expMonth: expMonthSelect?.value || '',
                            expYear: expYearSelect?.value || '',
                        };

                        onTokenCreated(tokenId, is3DSChallenge, cardDetails);
                    },
                    onError: (widgetError) => {
                        if (!mounted) {
                            return;
                        }
                        setIsCreatingToken(false);
                        setIs3DSChallenge(false);
                        const errorMessage =
                            widgetError.message || 'Failed to process card';
                        setError(errorMessage);
                        onError?.(errorMessage);
                    },
                    on3DSChallenge: () => {
                        if (!mounted) {
                            return;
                        }
                        setIs3DSChallenge(true);
                    },
                    on3DSComplete: (success: boolean) => {
                        if (!mounted) {
                            return;
                        }
                        setIs3DSChallenge(false);
                        if (!success) {
                            const errorMessage =
                                '3DS authentication failed. Please try again.';
                            setError(errorMessage);
                            onError?.(errorMessage);
                            setIsCreatingToken(false);
                        }
                    },
                });

                // CCBill Advanced Widget uses fields.setFieldId() to bind form fields
                // Set field IDs for all required CCBill fields
                if (containerRef.current && widget.fields) {
                    const fieldIds = {
                        cardNumber: 'ccbill-card-number',
                        expMonth: 'ccbill-exp-month',
                        expYear: 'ccbill-exp-year',
                        cvv: 'ccbill-cvv',
                        nameOnCard: 'ccbill-name-on-card',
                        firstName: 'ccbill-first-name',
                        lastName: 'ccbill-last-name',
                        address1: 'ccbill-address1',
                        address2: 'ccbill-address2',
                        city: 'ccbill-city',
                        state: 'ccbill-state',
                        postalCode: 'ccbill-postal-code',
                        country: 'ccbill-country',
                        email: 'ccbill-email',
                        phoneNumber: 'ccbill-phone',
                    };

                    // CCBill widget uses data-ccbill attributes, so fields should auto-attach
                    // But we can also set field IDs if the widget supports it
                    if (typeof widget.fields.setFieldId === 'function') {
                        // Payment fields (at bottom)
                        widget.fields.setFieldId(
                            'cardNumber',
                            fieldIds.cardNumber,
                        );
                        widget.fields.setFieldId(
                            'expMonth',
                            fieldIds.expMonth || 'ccbill-exp-month',
                        );
                        widget.fields.setFieldId(
                            'expYear',
                            fieldIds.expYear || 'ccbill-exp-year',
                        );
                        widget.fields.setFieldId('cvv2', fieldIds.cvv);
                        widget.fields.setFieldId(
                            'nameOnCard',
                            fieldIds.nameOnCard,
                        );

                        // Customer info fields
                        widget.fields.setFieldId(
                            'firstName',
                            fieldIds.firstName,
                        );
                        widget.fields.setFieldId('lastName', fieldIds.lastName);
                        widget.fields.setFieldId('address1', fieldIds.address1);
                        widget.fields.setFieldId('address2', fieldIds.address2);
                        widget.fields.setFieldId('city', fieldIds.city);
                        widget.fields.setFieldId('state', fieldIds.state);
                        widget.fields.setFieldId(
                            'postalCode',
                            fieldIds.postalCode,
                        );
                        widget.fields.setFieldId('country', fieldIds.country);
                        widget.fields.setFieldId('email', fieldIds.email);
                        widget.fields.setFieldId(
                            'phoneNumber',
                            fieldIds.phoneNumber,
                        );
                    }

                    // Try attaching widget to form if method exists (should be done first)
                    if (
                        typeof widget.attach === 'function' &&
                        formRef.current
                    ) {
                        try {
                            widget.attach(formRef.current);
                            console.log('Widget attached to form successfully');
                        } catch (attachError) {
                            console.warn('Widget attach warning:', attachError);
                        }
                    }

                    // Try widget-level render method
                    if (typeof widget.render === 'function') {
                        try {
                            widget.render();
                            console.log('Widget render called successfully');
                        } catch (renderError) {
                            console.warn('Widget render warning:', renderError);
                        }
                    }

                    // Log widget structure for debugging
                    const widgetMethods = Object.keys(widget).filter(
                        (k) => typeof (widget as any)[k] === 'function',
                    );
                    const fieldsMethods = widget.fields
                        ? Object.keys(widget.fields).filter(
                              (k) =>
                                  typeof (widget.fields as any)[k] ===
                                  'function',
                          )
                        : [];
                    console.log('CCBill widget methods:', widgetMethods);
                    console.log('CCBill widget.fields methods:', fieldsMethods);
                    console.log('CCBill widget.fields object:', widget.fields);
                    console.log(
                        'CCBill widget.fields.fieldIds:',
                        (widget.fields as any)?.fieldIds,
                    );
                    console.log(
                        'CCBill widget.fields.fieldPrefix:',
                        (widget.fields as any)?.fieldPrefix,
                    );

                    // Try calling fields.render() if it exists
                    if (
                        widget.fields &&
                        typeof (widget.fields as any).render === 'function'
                    ) {
                        try {
                            (widget.fields as any).render();
                            console.log(
                                'Widget fields.render() called successfully',
                            );
                        } catch (renderError) {
                            console.warn(
                                'Widget fields.render() warning:',
                                renderError,
                            );
                        }
                    }

                    // Log all available methods on widget and fields for debugging
                    console.log(
                        'Full widget object keys:',
                        Object.keys(widget),
                    );
                    if (widget.fields) {
                        console.log(
                            'Full widget.fields object keys:',
                            Object.keys(widget.fields),
                        );
                    }

                    // Check what fields are available
                    const ccbillFieldIds = (widget.fields as any)?.fieldIds;
                    if (ccbillFieldIds) {
                        console.log(
                            'Available CCBill field IDs:',
                            Object.keys(ccbillFieldIds),
                        );
                        console.log(
                            'CCBill field IDs mapping:',
                            ccbillFieldIds,
                        );
                    }

                    // Verify all required fields exist in DOM with data-ccbill attributes
                    setTimeout(() => {
                        const requiredFields = [
                            'firstName',
                            'lastName',
                            'email',
                            'cardNumber',
                            'expMonth',
                            'expYear',
                            'cvv2',
                            'nameOnCard',
                            'postalCode',
                            'country',
                            'address1',
                            'city',
                        ];

                        const foundFields: string[] = [];
                        const missingFields: string[] = [];

                        requiredFields.forEach((fieldName) => {
                            const element = document.querySelector(
                                `[data-ccbill="${fieldName}"]`,
                            );
                            if (element) {
                                foundFields.push(fieldName);
                                console.log(
                                    `✓ Found field: ${fieldName}`,
                                    element,
                                );
                            } else {
                                missingFields.push(fieldName);
                                console.warn(`✗ Missing field: ${fieldName}`);
                            }
                        });

                        console.log(
                            `Field verification: ${foundFields.length}/${requiredFields.length} fields found`,
                        );
                        if (missingFields.length > 0) {
                            console.warn(
                                'Missing required fields:',
                                missingFields,
                            );
                        } else {
                            console.log(
                                '✅ All required fields are present in DOM',
                            );
                        }

                        // Verify widget can read field values
                        if (
                            widget.fields &&
                            typeof (widget.fields as any).getFieldValue ===
                                'function'
                        ) {
                            const testField = document.querySelector(
                                '[data-ccbill="email"]',
                            ) as HTMLInputElement;
                            if (testField && testField.value) {
                                const widgetValue = (
                                    widget.fields as any
                                ).getFieldValue('email');
                                console.log('Widget can read field values:', {
                                    domValue: testField.value,
                                    widgetValue: widgetValue,
                                    match: testField.value === widgetValue,
                                });
                            }
                        }
                    }, 1000);

                    // Pre-fill user data if available
                    // Use setTimeout to ensure widget fields are fully rendered before setting values
                    setTimeout(() => {
                        if (
                            widget.fields &&
                            typeof widget.fields.setFieldValue === 'function'
                        ) {
                            if (user?.email) {
                                widget.fields.setFieldValue(
                                    'email',
                                    user.email,
                                );
                            }
                            if (userFirstName) {
                                widget.fields.setFieldValue(
                                    'firstName',
                                    userFirstName,
                                );
                            }
                            if (userLastName) {
                                widget.fields.setFieldValue(
                                    'lastName',
                                    userLastName,
                                );
                            }
                            if (user?.location_city) {
                                widget.fields.setFieldValue(
                                    'city',
                                    user.location_city,
                                );
                            }
                            if (user?.location_region) {
                                widget.fields.setFieldValue(
                                    'state',
                                    user.location_region,
                                );
                            }
                            if (user?.location_country) {
                                widget.fields.setFieldValue(
                                    'country',
                                    user.location_country,
                                );
                                setSelectedCountry(user.location_country);
                            }
                        }

                        // Set values directly on DOM elements (they're actual inputs now)
                        if (user?.email) {
                            const emailField = document.getElementById(
                                'ccbill-email',
                            ) as HTMLInputElement;
                            if (emailField) {
                                emailField.value = user.email;
                                // Email is already disabled in the JSX
                            }
                        }
                        if (userFirstName) {
                            const firstNameField = document.getElementById(
                                'ccbill-first-name',
                            ) as HTMLInputElement;
                            if (firstNameField)
                                firstNameField.value = userFirstName;
                        }
                        if (userLastName) {
                            const lastNameField = document.getElementById(
                                'ccbill-last-name',
                            ) as HTMLInputElement;
                            if (lastNameField)
                                lastNameField.value = userLastName;
                        }
                        if (user?.location_city) {
                            const cityField = document.getElementById(
                                'ccbill-city',
                            ) as HTMLInputElement;
                            if (cityField) cityField.value = user.location_city;
                        }
                        if (user?.location_region) {
                            const stateField = document.getElementById(
                                'ccbill-state',
                            ) as HTMLInputElement;
                            if (stateField)
                                stateField.value = user.location_region;
                        }
                        if (user?.location_country) {
                            const countryField = document.getElementById(
                                'ccbill-country',
                            ) as HTMLSelectElement;
                            if (countryField) {
                                countryField.value = user.location_country;
                                setSelectedCountry(user.location_country);
                            }
                        }
                    }, 500);

                    widgetRef.current = widget;
                    setWidgetInitialized(true);
                } else {
                    widgetRef.current = widget;
                    setWidgetInitialized(true);
                }
            } catch (err) {
                if (!mounted) {
                    return;
                }
                console.error('CCBill widget initialization error:', err);
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : 'Failed to initialize payment form';
                setError(errorMessage);
                onError?.(errorMessage);
            }
        };

        initWidget();

        return () => {
            mounted = false;
            if (widgetRef.current) {
                try {
                    if (typeof widgetRef.current.detach === 'function') {
                        widgetRef.current.detach();
                    }
                    if (typeof widgetRef.current.destroy === 'function') {
                        widgetRef.current.destroy();
                    }
                } catch (e) {
                    // Ignore cleanup errors
                }
                widgetRef.current = null;
                setWidgetInitialized(false);
            }
        };
    }, [
        bearerToken,
        applicationId,
        clientAccnum,
        clientSubacc,
        onTokenCreated,
        onError,
        user,
    ]);

    // Fetch bearer token on mount
    useEffect(() => {
        if (!bearerToken && !tokenLoading) {
            fetchToken(gateway).catch((err) => {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : 'Failed to load payment form';
                setError(errorMessage);
                onError?.(errorMessage);
            });
        }
    }, [bearerToken, tokenLoading, fetchToken, gateway, onError]);

    // State for client IP address
    const [clientIp, setClientIp] = useState<string>('');

    // Fetch IP address on mount (for fraud detection)
    useEffect(() => {
        // Try to get IP from backend first (more accurate)
        // If not available, use public API as fallback
        fetch('/api/client-ip')
            .then((res) => {
                if (res.ok) {
                    return res.json();
                }
                throw new Error('Backend IP endpoint not available');
            })
            .then((data) => {
                if (data.ip) {
                    setClientIp(data.ip);
                }
            })
            .catch(() => {
                // Fallback: Use public API (less reliable but better than nothing)
                fetch('https://api.ipify.org?format=json')
                    .then((res) => res.json())
                    .then((data) => {
                        if (data.ip) {
                            setClientIp(data.ip);
                        }
                    })
                    .catch(() => {
                        console.warn(
                            'Could not fetch IP address for fraud detection',
                        );
                    });
            });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (
            !widgetRef.current ||
            !bearerToken ||
            !clientAccnum ||
            !clientSubacc ||
            isCreatingToken
        ) {
            return;
        }

        // Validate all required fields before submission
        const requiredFields = {
            firstName: document.getElementById(
                'ccbill-first-name',
            ) as HTMLInputElement,
            lastName: document.getElementById(
                'ccbill-last-name',
            ) as HTMLInputElement,
            email: document.getElementById('ccbill-email') as HTMLInputElement,
            cardNumber: document.getElementById(
                'ccbill-card-number',
            ) as HTMLInputElement,
            expMonth: document.getElementById(
                'ccbill-exp-month',
            ) as HTMLSelectElement,
            expYear: document.getElementById(
                'ccbill-exp-year',
            ) as HTMLSelectElement,
            cvv2: document.getElementById('ccbill-cvv') as HTMLInputElement,
            nameOnCard: document.getElementById(
                'ccbill-name-on-card',
            ) as HTMLInputElement,
            postalCode: document.getElementById(
                'ccbill-postal-code',
            ) as HTMLInputElement,
            country: document.getElementById(
                'ccbill-country',
            ) as HTMLSelectElement,
            address1: document.getElementById(
                'ccbill-address1',
            ) as HTMLInputElement,
            city: document.getElementById('ccbill-city') as HTMLInputElement,
        };

        const missingFields: string[] = [];
        Object.entries(requiredFields).forEach(([fieldName, element]) => {
            if (!element || !element.value?.trim()) {
                missingFields.push(fieldName);
                setTouchedFields((prev) => new Set(prev).add(fieldName));
                setFieldErrors((prev) => ({
                    ...prev,
                    [fieldName]: 'This field is required',
                }));
            }
        });

        // Validate state field if provided (must be 1-3 characters)
        const stateField = document.getElementById(
            'ccbill-state',
        ) as HTMLInputElement;
        if (stateField && stateField.value.trim()) {
            const stateValue = stateField.value.trim();
            if (stateValue.length < 1 || stateValue.length > 3) {
                missingFields.push('state');
                setTouchedFields((prev) => new Set(prev).add('state'));
                setFieldErrors((prev) => ({
                    ...prev,
                    state: 'State must be 1-3 characters if provided',
                }));
            }
        }

        if (missingFields.length > 0) {
            setError(
                `Please fill in all required fields: ${missingFields.join(', ')}`,
            );
            return;
        }

        // Ensure expMonth and expYear are set on hidden selects
        const expMonthSelect = document.getElementById(
            'ccbill-exp-month',
        ) as HTMLSelectElement;
        const expYearSelect = document.getElementById(
            'ccbill-exp-year',
        ) as HTMLSelectElement;

        if (!expMonthSelect?.value || !expYearSelect?.value) {
            setError('Please select expiration month and year');
            return;
        }

        // Ensure expYear is 4 digits (yyyy format) as required by CCBill
        let expYearValue = expYearSelect.value.trim();
        const yearNum = parseInt(expYearValue, 10);
        if (!isNaN(yearNum)) {
            // If it's a 2-digit year, convert to 4 digits
            if (yearNum < 100) {
                // Assume years 0-50 are 2000-2050, years 51-99 are 1951-1999
                expYearValue =
                    yearNum <= 50
                        ? String(2000 + yearNum)
                        : String(1900 + yearNum);
                expYearSelect.value = expYearValue;
                // Also update widget field value
                if (
                    widgetRef.current?.fields &&
                    typeof widgetRef.current.fields.setFieldValue === 'function'
                ) {
                    widgetRef.current.fields.setFieldValue(
                        'expYear',
                        expYearValue,
                    );
                }
            } else {
                // Ensure it's a string with 4 digits
                expYearValue = String(yearNum);
                if (expYearValue.length !== 4) {
                    setError('Expiration year must be 4 digits (yyyy format)');
                    return;
                }
            }
        }

        // Ensure expMonth is 2 digits (mm format) as required by CCBill
        let expMonthValue = expMonthSelect.value.trim();
        const monthNum = parseInt(expMonthValue, 10);
        if (!isNaN(monthNum)) {
            expMonthValue = String(monthNum).padStart(2, '0');
            if (expMonthSelect.value !== expMonthValue) {
                expMonthSelect.value = expMonthValue;
                // Also update widget field value
                if (
                    widgetRef.current?.fields &&
                    typeof widgetRef.current.fields.setFieldValue === 'function'
                ) {
                    widgetRef.current.fields.setFieldValue(
                        'expMonth',
                        expMonthValue,
                    );
                }
            }
        }

        setIsCreatingToken(true);
        setError(null);

        try {
            // Strip spaces from card number in DOM before submission
            // CCBill requires card number without spaces
            const cardNumberInput = document.getElementById(
                'ccbill-card-number',
            ) as HTMLInputElement;
            if (cardNumberInput) {
                const cleanedCardNumber = cardNumberInput.value.replace(
                    /\s/g,
                    '',
                );
                cardNumberInput.value = cleanedCardNumber;

                // Also update widget field value to ensure consistency
                if (
                    widgetRef.current?.fields &&
                    typeof widgetRef.current.fields.setFieldValue === 'function'
                ) {
                    widgetRef.current.fields.setFieldValue(
                        'cardNumber',
                        cleanedCardNumber,
                    );
                }
            }

            // Clean postal code: remove spaces (CCBill requires no spaces)
            const postalCodeInput = document.getElementById(
                'ccbill-postal-code',
            ) as HTMLInputElement;
            if (postalCodeInput) {
                const cleanedPostalCode = postalCodeInput.value
                    .replace(/\s/g, '')
                    .toUpperCase();
                if (postalCodeInput.value !== cleanedPostalCode) {
                    postalCodeInput.value = cleanedPostalCode;
                    if (
                        widgetRef.current?.fields &&
                        typeof widgetRef.current.fields.setFieldValue ===
                            'function'
                    ) {
                        widgetRef.current.fields.setFieldValue(
                            'postalCode',
                            cleanedPostalCode,
                        );
                    }
                }
            }

            // Clean state: ensure it's 1-3 characters (prefer 2-letter code)
            const stateInput = document.getElementById(
                'ccbill-state',
            ) as HTMLInputElement;
            if (stateInput && stateInput.value.trim()) {
                let stateValue = stateInput.value.trim().toUpperCase();
                // If state is longer than 3 chars, try to extract 2-letter code or truncate
                if (stateValue.length > 3) {
                    // Try to extract first 2 letters if it looks like a code
                    const twoLetterMatch = stateValue.match(/^[A-Z]{2}/);
                    stateValue = twoLetterMatch
                        ? twoLetterMatch[0]
                        : stateValue.substring(0, 3);
                }
                if (stateInput.value !== stateValue) {
                    stateInput.value = stateValue;
                    if (
                        widgetRef.current?.fields &&
                        typeof widgetRef.current.fields.setFieldValue ===
                            'function'
                    ) {
                        widgetRef.current.fields.setFieldValue(
                            'state',
                            stateValue,
                        );
                    }
                }
            }

            // Clean city: ensure it's just the city name (max 50 chars, no commas)
            const cityInput = document.getElementById(
                'ccbill-city',
            ) as HTMLInputElement;
            if (cityInput && cityInput.value.trim()) {
                let cityValue = cityInput.value.trim();
                // Remove everything after first comma (city, state, country format)
                const commaIndex = cityValue.indexOf(',');
                if (commaIndex > 0) {
                    cityValue = cityValue.substring(0, commaIndex).trim();
                }
                // Truncate to 50 characters (CCBill max)
                if (cityValue.length > 50) {
                    cityValue = cityValue.substring(0, 50);
                }
                if (cityInput.value !== cityValue) {
                    cityInput.value = cityValue;
                    if (
                        widgetRef.current?.fields &&
                        typeof widgetRef.current.fields.setFieldValue ===
                            'function'
                    ) {
                        widgetRef.current.fields.setFieldValue(
                            'city',
                            cityValue,
                        );
                    }
                }
            }

            // Extract card details from form before submitting
            // We need these for vaulting since CCBill doesn't return card info
            // Note: cardNumberInput already declared above for cleaning
            const expMonthSelect = document.getElementById(
                'ccbill-exp-month',
            ) as HTMLSelectElement;
            const expYearSelect = document.getElementById(
                'ccbill-exp-year',
            ) as HTMLSelectElement;

            const rawCardNumber =
                cardNumberInput?.value?.replace(/\s/g, '') || '';
            const lastFour = rawCardNumber.slice(-4);
            const expMonth = expMonthSelect?.value || '';
            const expYear = expYearSelect?.value || '';

            // Detect card brand from card number
            const cardBrand = detectCardBrand(rawCardNumber);

            console.log('Card details extracted:', {
                lastFour,
                cardBrand,
                expMonth,
                expYear,
            });

            // Widget reads form data from DOM (elements with data-ccbill attributes)
            // Pass required parameters: authToken, clientAccnum, clientSubacc
            // Optionally pass form reference
            console.log('Calling createPaymentToken3DS...');
            const { tokenId, is3DS } = await createPaymentToken3DS(
                widgetRef.current,
                bearerToken,
                clientAccnum,
                clientSubacc,
                {
                    form: formRef.current || undefined,
                    ipAddress: clientIp, // Pass IP address for fraud detection
                },
            );
            console.log('✅ createPaymentToken3DS returned:', {
                tokenId,
                is3DS,
            });
            setIsCreatingToken(false);
            setIs3DSChallenge(false);

            const cardDetails: CardDetails = {
                lastFour,
                brand: cardBrand,
                expMonth,
                expYear,
            };

            console.log(
                'Calling onTokenCreated callback with tokenId:',
                tokenId,
                'cardDetails:',
                cardDetails,
            );
            onTokenCreated(tokenId, is3DS, cardDetails);
            console.log('✅ onTokenCreated callback completed');
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to process card';
            setError(errorMessage);
            onError?.(errorMessage);
            setIsCreatingToken(false);
            setIs3DSChallenge(false);
        }
    };

    if (tokenLoading || !bearerToken || !applicationId) {
        return (
            <div className={className}>
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-white/60" />
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                {/* Enhanced Security Badge */}
                <div className="rounded-lg border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/20">
                            <Shield className="size-5 text-amber-400" />
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                                <Lock className="size-4 text-amber-400" />
                                <h4 className="text-sm font-semibold text-white">
                                    Bank-Level Security & Encryption
                                </h4>
                            </div>
                            <div className="space-y-1.5 text-xs text-white/80">
                                <p>
                                    Your payment information is protected with
                                    industry-leading security measures:
                                </p>
                                <ul className="ml-4 list-disc space-y-1 text-white/70">
                                    <li>
                                        <strong>PCI DSS Compliant:</strong> We
                                        meet the highest payment card industry
                                        security standards (PCI DSS Level 1)
                                    </li>
                                    <li>
                                        <strong>End-to-End Encryption:</strong>{' '}
                                        All card data is encrypted using AES-256
                                        encryption before transmission
                                    </li>
                                    <li>
                                        <strong>Tokenization:</strong> Your card
                                        details are never stored on our servers.
                                        We use secure tokens for future
                                        transactions
                                    </li>
                                    <li>
                                        <strong>
                                            3D Secure Authentication:
                                        </strong>{' '}
                                        Additional verification through your
                                        bank's secure authentication system
                                    </li>
                                    <li>
                                        <strong>Fraud Detection:</strong>{' '}
                                        Advanced monitoring systems powered by
                                        Anton AI detect and prevent unauthorized
                                        transactions in real-time
                                    </li>
                                </ul>
                                <p className="pt-1 text-white/60">
                                    Your financial data is processed securely by
                                    CCBill, a trusted payment processor trusted
                                    by thousands of businesses worldwide. All
                                    transactions are continuously monitored by
                                    Anton AI for enhanced security and fraud
                                    prevention.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {is3DSChallenge && (
                    <Alert className="animate-in fade-in-0 slide-in-from-top-2">
                        <Shield className="size-4 animate-pulse" />
                        <AlertTitle>3D Secure Authentication</AlertTitle>
                        <AlertDescription>
                            Please complete the 3D Secure authentication in the
                            popup window.
                        </AlertDescription>
                    </Alert>
                )}

                {error && (
                    <Alert
                        className={cn(
                            'animate-in fade-in-0 slide-in-from-top-2',
                            (error as any)?.isCorsError &&
                                'border-amber-500/50 bg-amber-500/10',
                        )}
                    >
                        <AlertTitle className="flex items-center gap-2">
                            {(error as any)?.isCorsError && (
                                <Shield className="size-4 text-amber-400" />
                            )}
                            {(error as any)?.isCorsError
                                ? 'CORS Configuration Required'
                                : 'Payment Error'}
                        </AlertTitle>
                        <AlertDescription className="text-sm whitespace-pre-line">
                            {error}
                            {(error as any)?.isLocalhost && (
                                <div className="mt-3 space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs">
                                    <p className="font-semibold text-amber-300">
                                        Quick Development Solutions:
                                    </p>
                                    <ul className="ml-4 list-disc space-y-1 text-amber-200/80">
                                        <li>
                                            <strong>
                                                Use Herd/Laravel Valet:
                                            </strong>{' '}
                                            Access your site via{' '}
                                            <code className="rounded bg-black/20 px-1">
                                                realkinkmen.test
                                            </code>{' '}
                                            instead of{' '}
                                            <code className="rounded bg-black/20 px-1">
                                                localhost:8000
                                            </code>
                                        </li>
                                        <li>
                                            <strong>Contact CCBill:</strong> Ask
                                            them to whitelist{' '}
                                            <code className="rounded bg-black/20 px-1">
                                                localhost:8000
                                            </code>{' '}
                                            for development
                                        </li>
                                        <li>
                                            <strong>Production Testing:</strong>{' '}
                                            Deploy to a staging environment with
                                            a real domain
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </AlertDescription>
                    </Alert>
                )}

                <div
                    ref={containerRef}
                    id="ccbill-card-form"
                    className="space-y-6"
                >
                    {!widgetInitialized ? (
                        <div className="animate-pulse space-y-6">
                            <div className="space-y-3">
                                <div className="h-4 w-32 rounded bg-white/10"></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="h-12 rounded-lg bg-white/10"></div>
                                    <div className="h-12 rounded-lg bg-white/10"></div>
                                </div>
                                <div className="h-12 rounded-lg bg-white/10"></div>
                                <div className="h-12 rounded-lg bg-white/10"></div>
                            </div>
                            <div className="space-y-3 border-t border-white/10 pt-6">
                                <div className="h-4 w-40 rounded bg-white/10"></div>
                                <div className="h-12 rounded-lg bg-white/10"></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="h-12 rounded-lg bg-white/10"></div>
                                    <div className="h-12 rounded-lg bg-white/10"></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Billing Information Section - At Top */}
                            <div className="animate-in space-y-6 fade-in-0 slide-in-from-bottom-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10">
                                        <CreditCard className="size-4 text-amber-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white">
                                        Billing Information
                                    </h3>
                                </div>

                                {/* Contact Information */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label
                                                htmlFor="ccbill-first-name"
                                                className="text-sm font-medium text-white/90"
                                            >
                                                First Name{' '}
                                                <span className="text-red-400">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                type="text"
                                                id="ccbill-first-name"
                                                data-ccbill="firstName"
                                                defaultValue={userFirstName}
                                                placeholder="John"
                                                onBlur={(e) =>
                                                    handleFieldBlur(
                                                        'firstName',
                                                        e.target.value,
                                                    )
                                                }
                                                className={cn(
                                                    touchedFields.has(
                                                        'firstName',
                                                    ) &&
                                                        fieldErrors.firstName &&
                                                        'border-rose-400',
                                                    touchedFields.has(
                                                        'firstName',
                                                    ) &&
                                                        !fieldErrors.firstName &&
                                                        'border-green-400/50',
                                                )}
                                            />
                                            {touchedFields.has('firstName') &&
                                                fieldErrors.firstName && (
                                                    <p className="animate-in text-xs text-rose-400 fade-in-0">
                                                        {fieldErrors.firstName}
                                                    </p>
                                                )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label
                                                htmlFor="ccbill-last-name"
                                                className="text-sm font-medium text-white/90"
                                            >
                                                Last Name{' '}
                                                <span className="text-red-400">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                type="text"
                                                id="ccbill-last-name"
                                                data-ccbill="lastName"
                                                defaultValue={userLastName}
                                                placeholder="Doe"
                                                onBlur={(e) =>
                                                    handleFieldBlur(
                                                        'lastName',
                                                        e.target.value,
                                                    )
                                                }
                                                className={cn(
                                                    touchedFields.has(
                                                        'lastName',
                                                    ) &&
                                                        fieldErrors.lastName &&
                                                        'border-rose-400',
                                                    touchedFields.has(
                                                        'lastName',
                                                    ) &&
                                                        !fieldErrors.lastName &&
                                                        'border-green-400/50',
                                                )}
                                            />
                                            {touchedFields.has('lastName') &&
                                                fieldErrors.lastName && (
                                                    <p className="animate-in text-xs text-rose-400 fade-in-0">
                                                        {fieldErrors.lastName}
                                                    </p>
                                                )}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="ccbill-email"
                                            className="text-sm font-medium text-white/90"
                                        >
                                            Email{' '}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                type="email"
                                                id="ccbill-email"
                                                data-ccbill="email"
                                                defaultValue={user?.email || ''}
                                                disabled
                                                readOnly
                                                placeholder="email@example.com"
                                                className="pr-10"
                                            />
                                            {user?.email && (
                                                <div className="absolute top-1/2 right-3 -translate-y-1/2">
                                                    <CheckCircle2 className="size-4 text-green-400" />
                                                </div>
                                            )}
                                        </div>
                                        {user?.email && (
                                            <p className="flex items-center gap-1 text-xs text-white/50">
                                                <Lock className="size-3" />
                                                Using your account email (cannot
                                                be changed)
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="ccbill-phone"
                                            className="text-sm font-medium text-white/90"
                                        >
                                            Phone Number{' '}
                                            <span className="text-xs font-normal text-white/50">
                                                (Optional)
                                            </span>
                                        </Label>
                                        <Input
                                            type="tel"
                                            id="ccbill-phone"
                                            data-ccbill="phoneNumber"
                                            placeholder="+1 (555) 123-4567"
                                        />
                                    </div>
                                </div>

                                {/* Billing Address */}
                                <div className="space-y-4 border-t border-white/10 pt-6">
                                    <h4 className="text-sm font-semibold text-white/90">
                                        Billing Address
                                    </h4>

                                    <div className="relative space-y-2 rounded-lg border border-white/10 bg-white/5 p-4">
                                        <Label
                                            htmlFor="address-search"
                                            className="text-xs font-medium text-white/70"
                                        >
                                            Quick Address Search{' '}
                                            <span className="text-xs font-normal text-white/50">
                                                (Optional)
                                            </span>
                                        </Label>
                                        <LocationAutocomplete
                                            value={addressQuery}
                                            onChange={setAddressQuery}
                                            onSelect={handleAddressSelect}
                                            includeAddresses={true}
                                            error={error || undefined}
                                        />
                                        {isLoadingAddress && (
                                            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/50 backdrop-blur-sm">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="size-5 animate-spin text-amber-400" />
                                                    <p className="text-xs text-white/70">
                                                        Populating address
                                                        fields...
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        <p className="text-xs text-white/50">
                                            Search for your address to auto-fill
                                            the fields below. You can edit any
                                            field after selection.
                                        </p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="ccbill-address1"
                                            className="text-sm font-medium text-white/90"
                                        >
                                            Street Address{' '}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            type="text"
                                            id="ccbill-address1"
                                            data-ccbill="address1"
                                            placeholder="123 Main Street"
                                            onBlur={(e) =>
                                                handleFieldBlur(
                                                    'address1',
                                                    e.target.value,
                                                )
                                            }
                                            className={cn(
                                                touchedFields.has('address1') &&
                                                    fieldErrors.address1 &&
                                                    'border-rose-400',
                                                touchedFields.has('address1') &&
                                                    !fieldErrors.address1 &&
                                                    'border-green-400/50',
                                            )}
                                        />
                                        {touchedFields.has('address1') &&
                                            fieldErrors.address1 && (
                                                <p className="animate-in text-xs text-rose-400 fade-in-0">
                                                    {fieldErrors.address1}
                                                </p>
                                            )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="ccbill-address2"
                                            className="text-sm font-medium text-white/90"
                                        >
                                            Address Line 2{' '}
                                            <span className="text-xs font-normal text-white/50">
                                                (Optional)
                                            </span>
                                        </Label>
                                        <Input
                                            type="text"
                                            id="ccbill-address2"
                                            data-ccbill="address2"
                                            placeholder="Apartment, suite, etc."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label
                                                htmlFor="ccbill-city"
                                                className="text-sm font-medium text-white/90"
                                            >
                                                City{' '}
                                                <span className="text-red-400">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                type="text"
                                                id="ccbill-city"
                                                data-ccbill="city"
                                                defaultValue={
                                                    user?.location_city || ''
                                                }
                                                placeholder="New York"
                                                onBlur={(e) =>
                                                    handleFieldBlur(
                                                        'city',
                                                        e.target.value,
                                                    )
                                                }
                                                className={cn(
                                                    touchedFields.has('city') &&
                                                        fieldErrors.city &&
                                                        'border-rose-400',
                                                    touchedFields.has('city') &&
                                                        !fieldErrors.city &&
                                                        'border-green-400/50',
                                                )}
                                            />
                                            {touchedFields.has('city') &&
                                                fieldErrors.city && (
                                                    <p className="animate-in text-xs text-rose-400 fade-in-0">
                                                        {fieldErrors.city}
                                                    </p>
                                                )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label
                                                htmlFor="ccbill-state"
                                                className="text-sm font-medium text-white/90"
                                            >
                                                State/Province{' '}
                                                <span className="text-xs font-normal text-white/50">
                                                    (Optional, 1-3 chars)
                                                </span>
                                            </Label>
                                            <Input
                                                type="text"
                                                id="ccbill-state"
                                                data-ccbill="state"
                                                defaultValue={
                                                    user?.location_region || ''
                                                }
                                                placeholder="NY"
                                                maxLength={3}
                                                onChange={(e) => {
                                                    // Ensure state is 1-3 characters if provided, uppercase and truncate
                                                    let value = e.target.value
                                                        .trim()
                                                        .toUpperCase();
                                                    if (value.length > 3) {
                                                        value = value.substring(
                                                            0,
                                                            3,
                                                        );
                                                        e.target.value = value;
                                                    }
                                                    if (
                                                        value &&
                                                        (value.length < 1 ||
                                                            value.length > 3)
                                                    ) {
                                                        setFieldErrors(
                                                            (prev) => ({
                                                                ...prev,
                                                                state: 'State must be 1-3 characters',
                                                            }),
                                                        );
                                                    } else {
                                                        setFieldErrors(
                                                            (prev) => {
                                                                const newErrors =
                                                                    { ...prev };
                                                                delete newErrors.state;
                                                                return newErrors;
                                                            },
                                                        );
                                                    }
                                                    // Update widget field
                                                    if (
                                                        widgetRef.current
                                                            ?.fields &&
                                                        typeof widgetRef.current
                                                            .fields
                                                            .setFieldValue ===
                                                            'function'
                                                    ) {
                                                        widgetRef.current.fields.setFieldValue(
                                                            'state',
                                                            value,
                                                        );
                                                    }
                                                }}
                                                onBlur={(e) => {
                                                    const value =
                                                        e.target.value.trim();
                                                    // If state is provided, it must be 1-3 characters
                                                    if (
                                                        value &&
                                                        (value.length < 1 ||
                                                            value.length > 3)
                                                    ) {
                                                        setFieldErrors(
                                                            (prev) => ({
                                                                ...prev,
                                                                state: 'State must be 1-3 characters if provided',
                                                            }),
                                                        );
                                                    } else if (value) {
                                                        // If provided and valid, clear errors
                                                        setFieldErrors(
                                                            (prev) => {
                                                                const newErrors =
                                                                    { ...prev };
                                                                delete newErrors.state;
                                                                return newErrors;
                                                            },
                                                        );
                                                    }
                                                    handleFieldBlur(
                                                        'state',
                                                        value,
                                                    );
                                                }}
                                                className={cn(
                                                    touchedFields.has(
                                                        'state',
                                                    ) &&
                                                        fieldErrors.state &&
                                                        'border-rose-400',
                                                    touchedFields.has(
                                                        'state',
                                                    ) &&
                                                        !fieldErrors.state &&
                                                        'border-green-400/50',
                                                )}
                                            />
                                            {touchedFields.has('state') &&
                                                fieldErrors.state && (
                                                    <p className="animate-in text-xs text-rose-400 fade-in-0">
                                                        {fieldErrors.state}
                                                    </p>
                                                )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label
                                                htmlFor="ccbill-postal-code"
                                                className="text-sm font-medium text-white/90"
                                            >
                                                Postal Code{' '}
                                                <span className="text-red-400">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                type="text"
                                                id="ccbill-postal-code"
                                                data-ccbill="postalCode"
                                                placeholder="10001"
                                                onBlur={(e) =>
                                                    handleFieldBlur(
                                                        'postalCode',
                                                        e.target.value,
                                                    )
                                                }
                                                className={cn(
                                                    touchedFields.has(
                                                        'postalCode',
                                                    ) &&
                                                        fieldErrors.postalCode &&
                                                        'border-rose-400',
                                                    touchedFields.has(
                                                        'postalCode',
                                                    ) &&
                                                        !fieldErrors.postalCode &&
                                                        'border-green-400/50',
                                                )}
                                            />
                                            {touchedFields.has('postalCode') &&
                                                fieldErrors.postalCode && (
                                                    <p className="animate-in text-xs text-rose-400 fade-in-0">
                                                        {fieldErrors.postalCode}
                                                    </p>
                                                )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label
                                                htmlFor="ccbill-country"
                                                className="text-sm font-medium text-white/90"
                                            >
                                                Country{' '}
                                                <span className="text-red-400">
                                                    *
                                                </span>
                                            </Label>
                                            <div className="relative">
                                                {/* Hidden select for CCBill widget */}
                                                <select
                                                    id="ccbill-country"
                                                    data-ccbill="country"
                                                    defaultValue={
                                                        user?.location_country ||
                                                        selectedCountry ||
                                                        ''
                                                    }
                                                    className="sr-only"
                                                    onChange={(e) => {
                                                        if (
                                                            widgetRef.current
                                                                ?.fields &&
                                                            typeof widgetRef
                                                                .current.fields
                                                                .setFieldValue ===
                                                                'function'
                                                        ) {
                                                            widgetRef.current.fields.setFieldValue(
                                                                'country',
                                                                e.target.value,
                                                            );
                                                        }
                                                        handleFieldBlur(
                                                            'country',
                                                            e.target.value,
                                                        );
                                                    }}
                                                >
                                                    <option value="">
                                                        Select Country
                                                    </option>
                                                    {COUNTRIES.map(
                                                        (country) => (
                                                            <option
                                                                key={
                                                                    country.code
                                                                }
                                                                value={
                                                                    country.code
                                                                }
                                                            >
                                                                {country.name}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>

                                                {/* Visible Select component - controlled */}
                                                <Select
                                                    key={`country-select-${selectedCountry}`}
                                                    value={
                                                        selectedCountry || ''
                                                    }
                                                    onValueChange={(value) => {
                                                        setSelectedCountry(
                                                            value,
                                                        );
                                                        const hiddenSelect =
                                                            document.getElementById(
                                                                'ccbill-country',
                                                            ) as HTMLSelectElement;
                                                        if (hiddenSelect) {
                                                            hiddenSelect.value =
                                                                value;
                                                            hiddenSelect.dispatchEvent(
                                                                new Event(
                                                                    'change',
                                                                    {
                                                                        bubbles: true,
                                                                    },
                                                                ),
                                                            );
                                                        }
                                                        if (
                                                            widgetRef.current
                                                                ?.fields &&
                                                            typeof widgetRef
                                                                .current.fields
                                                                .setFieldValue ===
                                                                'function'
                                                        ) {
                                                            widgetRef.current.fields.setFieldValue(
                                                                'country',
                                                                value,
                                                            );
                                                        }
                                                        handleFieldBlur(
                                                            'country',
                                                            value,
                                                        );
                                                    }}
                                                >
                                                    <SelectTrigger
                                                        className={cn(
                                                            'h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition placeholder:text-white/40 focus-visible:border-white/40 focus-visible:ring-4 focus-visible:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                                                            touchedFields.has(
                                                                'country',
                                                            ) &&
                                                                fieldErrors.country &&
                                                                'border-rose-400',
                                                            touchedFields.has(
                                                                'country',
                                                            ) &&
                                                                !fieldErrors.country &&
                                                                'border-green-400/50',
                                                        )}
                                                    >
                                                        <SelectValue placeholder="Select Country" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {COUNTRIES.map(
                                                            (country) => (
                                                                <SelectItem
                                                                    key={
                                                                        country.code
                                                                    }
                                                                    value={
                                                                        country.code
                                                                    }
                                                                >
                                                                    {
                                                                        country.name
                                                                    }
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {touchedFields.has('country') &&
                                                fieldErrors.country && (
                                                    <p className="animate-in text-xs text-rose-400 fade-in-0">
                                                        {fieldErrors.country}
                                                    </p>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Hidden fields for CCBill - amount and currencyCode might be required even for vaulting */}
                            <input
                                type="hidden"
                                data-ccbill="amount"
                                value="100"
                                id="ccbill-amount"
                            />
                            <input
                                type="hidden"
                                data-ccbill="currencyCode"
                                value="USD"
                                id="ccbill-currency-code"
                            />

                            {/* Card Information Section - At Bottom */}
                            <div className="animate-in space-y-6 border-t border-white/10 pt-6 delay-100 fade-in-0 slide-in-from-bottom-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10">
                                        <CreditCard className="size-4 text-amber-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white">
                                        Card Information
                                    </h3>
                                </div>

                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="ccbill-name-on-card"
                                        className="text-sm font-medium text-white/90"
                                    >
                                        Name on Card{' '}
                                        <span className="text-red-400">*</span>
                                    </Label>
                                    <Input
                                        type="text"
                                        id="ccbill-name-on-card"
                                        data-ccbill="nameOnCard"
                                        autoComplete="cc-name"
                                        placeholder="John Doe"
                                        onBlur={(e) =>
                                            handleFieldBlur(
                                                'nameOnCard',
                                                e.target.value,
                                            )
                                        }
                                        className={cn(
                                            touchedFields.has('nameOnCard') &&
                                                fieldErrors.nameOnCard &&
                                                'border-rose-400',
                                            touchedFields.has('nameOnCard') &&
                                                !fieldErrors.nameOnCard &&
                                                'border-green-400/50',
                                        )}
                                    />
                                    {touchedFields.has('nameOnCard') &&
                                        fieldErrors.nameOnCard && (
                                            <p className="animate-in text-xs text-rose-400 fade-in-0">
                                                {fieldErrors.nameOnCard}
                                            </p>
                                        )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="ccbill-card-number"
                                        className="text-sm font-medium text-white/90"
                                    >
                                        Card Number{' '}
                                        <span className="text-red-400">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type="text"
                                            id="ccbill-card-number"
                                            data-ccbill="cardNumber"
                                            inputMode="numeric"
                                            autoComplete="cc-number"
                                            placeholder="1234 5678 9012 3456"
                                            maxLength={19}
                                            onChange={handleCardNumberChange}
                                            onBlur={(e) =>
                                                handleFieldBlur(
                                                    'cardNumber',
                                                    e.target.value,
                                                )
                                            }
                                            className={cn(
                                                'font-mono tracking-wider',
                                                touchedFields.has(
                                                    'cardNumber',
                                                ) &&
                                                    fieldErrors.cardNumber &&
                                                    'border-rose-400',
                                                touchedFields.has(
                                                    'cardNumber',
                                                ) &&
                                                    !fieldErrors.cardNumber &&
                                                    'border-green-400/50',
                                            )}
                                        />
                                        {touchedFields.has('cardNumber') &&
                                            !fieldErrors.cardNumber && (
                                                <div className="absolute top-1/2 right-3 -translate-y-1/2">
                                                    <CheckCircle2 className="size-4 animate-in text-green-400 fade-in-0 zoom-in-50" />
                                                </div>
                                            )}
                                    </div>
                                    {touchedFields.has('cardNumber') &&
                                        fieldErrors.cardNumber && (
                                            <p className="animate-in text-xs text-rose-400 fade-in-0">
                                                {fieldErrors.cardNumber}
                                            </p>
                                        )}
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="ccbill-exp-month"
                                            className="text-sm font-medium text-white/90"
                                        >
                                            Expiration Month{' '}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </Label>
                                        {/* Hidden select for CCBill widget */}
                                        <select
                                            id="ccbill-exp-month"
                                            data-ccbill="expMonth"
                                            className="sr-only"
                                            required
                                        >
                                            <option value="">Month</option>
                                            {Array.from(
                                                { length: 12 },
                                                (_, i) => i + 1,
                                            ).map((month) => (
                                                <option
                                                    key={month}
                                                    value={String(
                                                        month,
                                                    ).padStart(2, '0')}
                                                >
                                                    {String(month).padStart(
                                                        2,
                                                        '0',
                                                    )}
                                                </option>
                                            ))}
                                        </select>
                                        <Select
                                            onValueChange={(value) => {
                                                const monthField =
                                                    document.getElementById(
                                                        'ccbill-exp-month',
                                                    ) as HTMLSelectElement;
                                                if (monthField) {
                                                    monthField.value = value;
                                                    monthField.dispatchEvent(
                                                        new Event('change', {
                                                            bubbles: true,
                                                        }),
                                                    );
                                                    monthField.dispatchEvent(
                                                        new Event('input', {
                                                            bubbles: true,
                                                        }),
                                                    );
                                                }
                                                if (
                                                    widgetRef.current?.fields &&
                                                    typeof widgetRef.current
                                                        .fields
                                                        .setFieldValue ===
                                                        'function'
                                                ) {
                                                    widgetRef.current.fields.setFieldValue(
                                                        'expMonth',
                                                        value,
                                                    );
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition placeholder:text-white/40 focus-visible:border-white/40 focus-visible:ring-4 focus-visible:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm">
                                                <SelectValue placeholder="Month" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from(
                                                    { length: 12 },
                                                    (_, i) => i + 1,
                                                ).map((month) => (
                                                    <SelectItem
                                                        key={month}
                                                        value={String(
                                                            month,
                                                        ).padStart(2, '0')}
                                                    >
                                                        {String(month).padStart(
                                                            2,
                                                            '0',
                                                        )}{' '}
                                                        -{' '}
                                                        {new Date(
                                                            2000,
                                                            month - 1,
                                                        ).toLocaleString(
                                                            'default',
                                                            { month: 'short' },
                                                        )}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="ccbill-exp-year"
                                            className="text-sm font-medium text-white/90"
                                        >
                                            Expiration Year{' '}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </Label>
                                        {/* Hidden select for CCBill widget */}
                                        <select
                                            id="ccbill-exp-year"
                                            data-ccbill="expYear"
                                            className="sr-only"
                                            required
                                        >
                                            <option value="">Year</option>
                                            {Array.from(
                                                { length: 20 },
                                                (_, i) =>
                                                    new Date().getFullYear() +
                                                    i,
                                            ).map((year) => (
                                                <option
                                                    key={year}
                                                    value={String(year)}
                                                >
                                                    {year}
                                                </option>
                                            ))}
                                        </select>
                                        <Select
                                            onValueChange={(value) => {
                                                const yearField =
                                                    document.getElementById(
                                                        'ccbill-exp-year',
                                                    ) as HTMLSelectElement;
                                                if (yearField) {
                                                    // Ensure value is 4 digits (yyyy format) for CCBill
                                                    let yearValue =
                                                        value.trim();
                                                    const yearNum = parseInt(
                                                        yearValue,
                                                        10,
                                                    );
                                                    if (
                                                        !isNaN(yearNum) &&
                                                        yearNum < 100
                                                    ) {
                                                        // Convert 2-digit to 4-digit year
                                                        yearValue =
                                                            yearNum <= 50
                                                                ? String(
                                                                      2000 +
                                                                          yearNum,
                                                                  )
                                                                : String(
                                                                      1900 +
                                                                          yearNum,
                                                                  );
                                                    }
                                                    yearField.value = yearValue;
                                                    yearField.dispatchEvent(
                                                        new Event('change', {
                                                            bubbles: true,
                                                        }),
                                                    );
                                                    yearField.dispatchEvent(
                                                        new Event('input', {
                                                            bubbles: true,
                                                        }),
                                                    );
                                                }
                                                // Also update widget with 4-digit year
                                                const finalYearValue =
                                                    yearField?.value || value;
                                                if (
                                                    widgetRef.current?.fields &&
                                                    typeof widgetRef.current
                                                        .fields
                                                        .setFieldValue ===
                                                        'function'
                                                ) {
                                                    widgetRef.current.fields.setFieldValue(
                                                        'expYear',
                                                        finalYearValue,
                                                    );
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition placeholder:text-white/40 focus-visible:border-white/40 focus-visible:ring-4 focus-visible:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm">
                                                <SelectValue placeholder="Year" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from(
                                                    { length: 20 },
                                                    (_, i) =>
                                                        new Date().getFullYear() +
                                                        i,
                                                ).map((year) => (
                                                    <SelectItem
                                                        key={year}
                                                        value={String(year)}
                                                    >
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <Label
                                                htmlFor="ccbill-cvv"
                                                className="text-sm font-medium text-white/90"
                                            >
                                                CVV{' '}
                                                <span className="text-red-400">
                                                    *
                                                </span>
                                            </Label>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        type="button"
                                                        className="text-white/50 transition-colors hover:text-white/70"
                                                        onClick={(e) =>
                                                            e.preventDefault()
                                                        }
                                                    >
                                                        <HelpCircle className="size-3.5" />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent
                                                    side="right"
                                                    className="max-w-xs"
                                                >
                                                    <p className="text-xs">
                                                        The 3-4 digit security
                                                        code on the back of your
                                                        card (or front for
                                                        Amex).
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                        <Input
                                            type="text"
                                            id="ccbill-cvv"
                                            data-ccbill="cvv2"
                                            inputMode="numeric"
                                            autoComplete="cc-csc"
                                            maxLength={4}
                                            placeholder="123"
                                            onBlur={(e) =>
                                                handleFieldBlur(
                                                    'cvv2',
                                                    e.target.value,
                                                )
                                            }
                                            className={cn(
                                                'w-full font-mono',
                                                touchedFields.has('cvv2') &&
                                                    fieldErrors.cvv2 &&
                                                    'border-rose-400',
                                                touchedFields.has('cvv2') &&
                                                    !fieldErrors.cvv2 &&
                                                    'border-green-400/50',
                                            )}
                                        />
                                        {touchedFields.has('cvv2') &&
                                            fieldErrors.cvv2 && (
                                                <p className="animate-in text-xs text-rose-400 fade-in-0">
                                                    {fieldErrors.cvv2}
                                                </p>
                                            )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="space-y-4 pt-4">
                    {/* Comprehensive Disclaimer */}
                    <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-4">
                        <div className="flex items-start gap-2">
                            <Shield className="mt-0.5 size-4 shrink-0 text-amber-400" />
                            <div className="space-y-2 text-xs text-white/70">
                                <p className="font-medium text-white/90">
                                    Payment Terms & Legal Disclaimer
                                </p>
                                <p>
                                    By saving your payment method, you agree to
                                    our secure payment processing and
                                    acknowledge the following terms:
                                </p>
                                <ul className="ml-4 list-disc space-y-1.5">
                                    <li>
                                        <strong>Your Responsibility:</strong>{' '}
                                        You are solely responsible for all
                                        charges made using this payment method.
                                        You agree to ensure sufficient funds are
                                        available and that all transactions are
                                        authorized.
                                    </li>
                                    <li>
                                        <strong>Chargeback Policy:</strong>{' '}
                                        Unauthorized chargebacks or disputes
                                        will be contested to the fullest extent
                                        permitted by law. We maintain detailed
                                        transaction records and will pursue all
                                        available legal remedies, including but
                                        not limited to collection actions and
                                        reporting to credit bureaus.
                                    </li>
                                    <li>
                                        <strong>Fraud Reporting:</strong> All
                                        suspected fraudulent activity, including
                                        unauthorized chargebacks, will be
                                        reported to local law enforcement
                                        authorities and relevant financial
                                        institutions. We cooperate fully with
                                        fraud investigations and will pursue
                                        criminal charges when appropriate.
                                    </li>
                                    <li>
                                        <strong>Secure Processing:</strong> Your
                                        payment information is encrypted and
                                        securely processed by our payment
                                        partners. We never store your full card
                                        details on our servers.
                                    </li>
                                </ul>
                                <p className="pt-1 text-white/60">
                                    By proceeding, you confirm that you have
                                    read, understood, and agree to these terms.
                                    If you do not agree, please do not save your
                                    payment method.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Cancel and Save Buttons */}
                    <div className="grid grid-cols-5 gap-3">
                        {/* Cancel Button - 1/5 width */}
                        <Button
                            type="button"
                            onClick={onCancel}
                            disabled={isCreatingToken || is3DSChallenge}
                            className={cn(
                                'col-span-1 h-14 rounded-xl',
                                'border border-white/20 bg-white/10',
                                'text-base font-semibold text-white/90',
                                'transition-all duration-300',
                                'hover:border-white/30 hover:bg-white/15',
                                'hover:scale-[1.02]',
                                'active:scale-[0.98]',
                                'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100',
                            )}
                        >
                            <span className="flex items-center justify-center gap-1.5">
                                <X className="size-4" />
                                <span>Cancel</span>
                            </span>
                        </Button>

                        {/* Enhanced Submit Button - 4/5 width */}
                        <Button
                            type="submit"
                            disabled={
                                isCreatingToken ||
                                is3DSChallenge ||
                                !widgetInitialized
                            }
                            className={cn(
                                'group relative col-span-4 overflow-hidden',
                                'h-14 rounded-xl',
                                'bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600',
                                'text-base font-semibold text-white',
                                'shadow-lg shadow-amber-500/25',
                                'transition-all duration-300',
                                'hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/40',
                                'active:scale-[0.98]',
                                'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100',
                                'before:absolute before:inset-0 before:bg-gradient-to-r before:from-amber-400 before:via-amber-500 before:to-amber-600',
                                'before:opacity-0 before:transition-opacity before:duration-300',
                                'hover:before:opacity-100',
                            )}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {isCreatingToken ? (
                                    <>
                                        <Loader2 className="size-5 animate-spin" />
                                        <span>Processing Your Card...</span>
                                    </>
                                ) : is3DSChallenge ? (
                                    <>
                                        <Shield className="size-5 animate-pulse" />
                                        <span>
                                            Completing Authentication...
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Lock className="size-5 transition-transform group-hover:scale-110" />
                                        <span>Save Card Securely</span>
                                        <CheckCircle2 className="ml-1 size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                                    </>
                                )}
                            </span>
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
