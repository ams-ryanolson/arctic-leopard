import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import adminRoutes from '@/routes/admin';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Plus, Save, X } from 'lucide-react';
import { useState } from 'react';

type Role = {
    id: number;
    name: string;
};

type MembershipPlan = {
    id: number;
    uuid: string;
    name: string;
    slug: string;
    description: string | null;
    monthly_price: number;
    yearly_price: number;
    currency: string;
    role_to_assign: string;
    permissions_to_grant: string[];
    features: Record<string, string>;
    is_active: boolean;
    is_public: boolean;
    display_order: number;
    allows_recurring: boolean;
    allows_one_time: boolean;
    one_time_duration_days: number | null;
};

type AdminMembershipsEditProps = {
    plan: MembershipPlan;
    roles: Role[];
};

export default function AdminMembershipsPlansEdit({
    plan,
    roles,
}: AdminMembershipsEditProps) {
    const { data, setData, patch, processing, errors, transform } = useForm({
        name: plan.name,
        slug: plan.slug,
        description: plan.description || '',
        monthly_price: ((plan.monthly_price || 0) / 100).toFixed(2),
        yearly_price: ((plan.yearly_price || 0) / 100).toFixed(2),
        currency: plan.currency,
        role_to_assign: plan.role_to_assign,
        permissions_to_grant: plan.permissions_to_grant || [],
        features:
            plan.features &&
            typeof plan.features === 'object' &&
            !Array.isArray(plan.features)
                ? plan.features
                : {},
        is_active: plan.is_active,
        is_public: plan.is_public,
        display_order: plan.display_order,
        allows_recurring: plan.allows_recurring,
        allows_one_time: plan.allows_one_time,
        one_time_duration_days: plan.one_time_duration_days || 30,
    });

    const [featureKey, setFeatureKey] = useState('');
    const [featureValue, setFeatureValue] = useState('');

    // Helper to convert dollars to cents
    const dollarsToCents = (dollars: string): number => {
        const num = parseFloat(dollars) || 0;
        return Math.round(num * 100);
    };

    // Helper to format dollar input (remove $, allow decimals)
    const formatDollarInput = (value: string): string => {
        // Remove any $ signs and non-numeric characters except decimal point
        const cleaned = value.replace(/[^0-9.]/g, '');
        // Ensure only one decimal point
        const parts = cleaned.split('.');
        if (parts.length > 2) {
            return parts[0] + '.' + parts.slice(1).join('');
        }
        // Limit to 2 decimal places
        if (parts[1] && parts[1].length > 2) {
            return parts[0] + '.' + parts[1].slice(0, 2);
        }
        return cleaned;
    };

    // Helper to generate feature key from description
    const generateFeatureKey = (
        description: string,
        maxLength = 50,
    ): string => {
        if (!description.trim()) {
            return '';
        }

        // Convert to lowercase, replace spaces and special chars with underscores
        let key = description
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
            .replace(/\s+/g, '_') // Replace spaces with underscores
            .replace(/-+/g, '_') // Replace hyphens with underscores
            .replace(/_+/g, '_') // Replace multiple underscores with single
            .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores

        // Limit to maxLength
        if (key.length > maxLength) {
            key = key.substring(0, maxLength);
            // Remove trailing underscore if we cut off mid-word
            key = key.replace(/_+$/, '');
        }

        return key;
    };

    // Auto-generate key when description changes
    const handleFeatureValueChange = (value: string) => {
        setFeatureValue(value);
        // Only auto-generate if key is empty or matches a previously generated key
        if (
            !featureKey.trim() ||
            featureKey === generateFeatureKey(featureValue, 50)
        ) {
            setFeatureKey(generateFeatureKey(value, 50));
        }
    };

    const addFeature = () => {
        if (featureValue.trim()) {
            // Use generated key if key is empty, otherwise use provided key
            const key =
                featureKey.trim() || generateFeatureKey(featureValue, 50);

            if (key) {
                setData('features', {
                    ...data.features,
                    [key]: featureValue.trim(),
                });
                setFeatureKey('');
                setFeatureValue('');
            }
        }
    };

    const removeFeature = (key: string) => {
        const updated = { ...data.features };
        delete updated[key];
        setData('features', updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Ensure features is properly formatted as an object
        const featuresToSend =
            data.features &&
            typeof data.features === 'object' &&
            !Array.isArray(data.features)
                ? data.features
                : {};

        console.log('Submitting edit form - BEFORE transform:', {
            'data.features': data.features,
            featuresToSend: featuresToSend,
            featuresType: typeof featuresToSend,
            featuresKeys: Object.keys(featuresToSend),
        });

        // Transform data before submission - convert dollars to cents
        // IMPORTANT: Send features explicitly to ensure they're included
        transform((current) => {
            const transformed = {
                ...current,
                monthly_price: dollarsToCents(String(current.monthly_price)),
                yearly_price: dollarsToCents(String(current.yearly_price)),
                features: featuresToSend, // Explicitly include features
            };
            console.log('Transformed data for submission:', {
                ...transformed,
                featuresKeys: Object.keys(transformed.features),
                featuresCount: Object.keys(transformed.features).length,
            });
            return transformed;
        });

        // Log the actual data that will be sent
        console.log('About to send PATCH request with features:', {
            url: adminRoutes.memberships.update(plan.id).url,
            features: featuresToSend,
            featuresKeys: Object.keys(featuresToSend),
        });

        patch(adminRoutes.memberships.update(plan.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                router.visit(adminRoutes.memberships.index().url);
            },
            onError: (errors) => {
                console.error('Form validation errors:', errors);
            },
            onFinish: () => {
                transform((current) => current); // Reset transform
            },
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Admin', href: adminRoutes.dashboard().url },
                {
                    title: 'Memberships',
                    href: adminRoutes.memberships.index().url,
                },
                {
                    title: plan.name,
                    href: adminRoutes.memberships.edit(plan.id).url,
                },
            ]}
        >
            <Head title={`Edit ${plan.name}`} />

            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <a href={adminRoutes.memberships.index().url}>
                            <ArrowLeft className="mr-2 size-4" />
                            Back
                        </a>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">
                            Edit Membership Plan
                        </h1>
                        <p className="mt-2 text-sm text-white/70">
                            Update membership plan details and settings
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card className="border-white/10 bg-white/5">
                            <CardHeader>
                                <CardTitle className="text-white">
                                    Basic Information
                                </CardTitle>
                                <CardDescription className="text-white/60">
                                    Core details about the membership plan
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="name"
                                        className="text-white"
                                    >
                                        Name *
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                        className="border-white/10 bg-white/5 text-white"
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-400">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="slug"
                                        className="text-white"
                                    >
                                        Slug *
                                    </Label>
                                    <Input
                                        id="slug"
                                        value={data.slug}
                                        onChange={(e) =>
                                            setData(
                                                'slug',
                                                e.target.value
                                                    .toLowerCase()
                                                    .replace(/\s+/g, '-'),
                                            )
                                        }
                                        className="border-white/10 bg-white/5 text-white"
                                    />
                                    {errors.slug && (
                                        <p className="text-sm text-red-400">
                                            {errors.slug}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="description"
                                        className="text-white"
                                    >
                                        Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) =>
                                            setData(
                                                'description',
                                                e.target.value,
                                            )
                                        }
                                        className="border-white/10 bg-white/5 text-white"
                                        rows={4}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-red-400">
                                            {errors.description}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="role_to_assign"
                                        className="text-white"
                                    >
                                        Role to Assign *
                                    </Label>
                                    <Select
                                        value={data.role_to_assign}
                                        onValueChange={(value) =>
                                            setData('role_to_assign', value)
                                        }
                                    >
                                        <SelectTrigger className="border-white/10 bg-white/5 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((role) => (
                                                <SelectItem
                                                    key={role.id}
                                                    value={role.name}
                                                >
                                                    {role.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.role_to_assign && (
                                        <p className="text-sm text-red-400">
                                            {errors.role_to_assign}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-white/10 bg-white/5">
                            <CardHeader>
                                <CardTitle className="text-white">
                                    Pricing
                                </CardTitle>
                                <CardDescription className="text-white/60">
                                    Set pricing for monthly and yearly
                                    subscriptions
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="monthly_price"
                                        className="text-white"
                                    >
                                        Monthly Price *
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute top-1/2 left-3 -translate-y-1/2 text-white/60">
                                            $
                                        </span>
                                        <Input
                                            id="monthly_price"
                                            type="text"
                                            value={data.monthly_price}
                                            onChange={(e) => {
                                                const formatted =
                                                    formatDollarInput(
                                                        e.target.value,
                                                    );
                                                setData(
                                                    'monthly_price',
                                                    formatted,
                                                );
                                            }}
                                            className="border-white/10 bg-white/5 pl-8 text-white"
                                            placeholder="10.00"
                                        />
                                    </div>
                                    <p className="text-xs text-white/50">
                                        {data.monthly_price
                                            ? `$${parseFloat(data.monthly_price || '0').toFixed(2)} per month`
                                            : 'Enter the monthly subscription price'}
                                    </p>
                                    {errors.monthly_price && (
                                        <p className="text-sm text-red-400">
                                            {errors.monthly_price}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="yearly_price"
                                        className="text-white"
                                    >
                                        Yearly Price *
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute top-1/2 left-3 -translate-y-1/2 text-white/60">
                                            $
                                        </span>
                                        <Input
                                            id="yearly_price"
                                            type="text"
                                            value={data.yearly_price}
                                            onChange={(e) => {
                                                const formatted =
                                                    formatDollarInput(
                                                        e.target.value,
                                                    );
                                                setData(
                                                    'yearly_price',
                                                    formatted,
                                                );
                                            }}
                                            className="border-white/10 bg-white/5 pl-8 text-white"
                                            placeholder="100.00"
                                        />
                                    </div>
                                    <p className="text-xs text-white/50">
                                        {data.yearly_price
                                            ? `$${parseFloat(data.yearly_price || '0').toFixed(2)} per year`
                                            : 'Enter the yearly subscription price'}
                                        {data.monthly_price &&
                                            data.yearly_price && (
                                                <span className="ml-2 text-white/40">
                                                    (
                                                    {(
                                                        (parseFloat(
                                                            data.yearly_price,
                                                        ) /
                                                            parseFloat(
                                                                data.monthly_price,
                                                            )) *
                                                        100
                                                    ).toFixed(0)}
                                                    x monthly ={' '}
                                                    {(
                                                        12 -
                                                        parseFloat(
                                                            data.yearly_price,
                                                        ) /
                                                            parseFloat(
                                                                data.monthly_price,
                                                            )
                                                    ).toFixed(1)}{' '}
                                                    months free)
                                                </span>
                                            )}
                                    </p>
                                    {errors.yearly_price && (
                                        <p className="text-sm text-red-400">
                                            {errors.yearly_price}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="currency"
                                        className="text-white"
                                    >
                                        Currency *
                                    </Label>
                                    <Select
                                        value={data.currency}
                                        onValueChange={(value) =>
                                            setData('currency', value)
                                        }
                                    >
                                        <SelectTrigger className="border-white/10 bg-white/5 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="USD">
                                                USD
                                            </SelectItem>
                                            <SelectItem value="EUR">
                                                EUR
                                            </SelectItem>
                                            <SelectItem value="GBP">
                                                GBP
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-white/10 bg-white/5">
                            <CardHeader>
                                <CardTitle className="text-white">
                                    Features
                                </CardTitle>
                                <CardDescription className="text-white/60">
                                    Add features that come with this membership
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="feature_value"
                                        className="text-white"
                                    >
                                        Feature Description *
                                    </Label>
                                    <Input
                                        id="feature_value"
                                        value={featureValue}
                                        onChange={(e) =>
                                            handleFeatureValueChange(
                                                e.target.value,
                                            )
                                        }
                                        className="border-white/10 bg-white/5 text-white"
                                        placeholder="3 premium content drops every week"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addFeature();
                                            }
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="feature_key"
                                        className="text-white"
                                    >
                                        Feature Key (auto-generated, max 50
                                        chars)
                                    </Label>
                                    <Input
                                        id="feature_key"
                                        value={featureKey}
                                        onChange={(e) => {
                                            // Limit to 50 characters
                                            const value = e.target.value.slice(
                                                0,
                                                50,
                                            );
                                            setFeatureKey(value);
                                        }}
                                        className="border-white/10 bg-white/5 text-white"
                                        placeholder="Auto-generated from description"
                                        maxLength={50}
                                    />
                                    <p className="text-xs text-white/50">
                                        {featureKey.length}/50 characters
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addFeature}
                                    disabled={!featureValue.trim()}
                                >
                                    <Plus className="mr-2 size-4" />
                                    Add Feature
                                </Button>

                                {Object.keys(data.features).length > 0 && (
                                    <div className="space-y-2 pt-4">
                                        <Label className="text-white">
                                            Current Features
                                        </Label>
                                        <div className="space-y-2">
                                            {Object.entries(data.features).map(
                                                ([key, value]) => (
                                                    <div
                                                        key={key}
                                                        className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-2"
                                                    >
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-white">
                                                                {key}
                                                            </p>
                                                            <p className="text-xs text-white/60">
                                                                {value}
                                                            </p>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                removeFeature(
                                                                    key,
                                                                )
                                                            }
                                                            className="text-red-400 hover:text-red-300"
                                                        >
                                                            <X className="size-4" />
                                                        </Button>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-white/10 bg-white/5">
                            <CardHeader>
                                <CardTitle className="text-white">
                                    Settings
                                </CardTitle>
                                <CardDescription className="text-white/60">
                                    Configure plan availability and billing
                                    options
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="is_active"
                                        checked={data.is_active}
                                        onCheckedChange={(checked) =>
                                            setData(
                                                'is_active',
                                                checked === true,
                                            )
                                        }
                                    />
                                    <Label
                                        htmlFor="is_active"
                                        className="text-white"
                                    >
                                        Active
                                    </Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="is_public"
                                        checked={data.is_public}
                                        onCheckedChange={(checked) =>
                                            setData(
                                                'is_public',
                                                checked === true,
                                            )
                                        }
                                    />
                                    <Label
                                        htmlFor="is_public"
                                        className="text-white"
                                    >
                                        Public (visible to users)
                                    </Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="allows_recurring"
                                        checked={data.allows_recurring}
                                        onCheckedChange={(checked) =>
                                            setData(
                                                'allows_recurring',
                                                checked === true,
                                            )
                                        }
                                    />
                                    <Label
                                        htmlFor="allows_recurring"
                                        className="text-white"
                                    >
                                        Allow Recurring Billing
                                    </Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="allows_one_time"
                                        checked={data.allows_one_time}
                                        onCheckedChange={(checked) =>
                                            setData(
                                                'allows_one_time',
                                                checked === true,
                                            )
                                        }
                                    />
                                    <Label
                                        htmlFor="allows_one_time"
                                        className="text-white"
                                    >
                                        Allow One-Time Purchase
                                    </Label>
                                </div>

                                {data.allows_one_time && (
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="one_time_duration_days"
                                            className="text-white"
                                        >
                                            One-Time Duration (days)
                                        </Label>
                                        <Input
                                            id="one_time_duration_days"
                                            type="number"
                                            min="1"
                                            value={data.one_time_duration_days}
                                            onChange={(e) =>
                                                setData(
                                                    'one_time_duration_days',
                                                    Number.parseInt(
                                                        e.target.value,
                                                        10,
                                                    ),
                                                )
                                            }
                                            className="border-white/10 bg-white/5 text-white"
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="display_order"
                                        className="text-white"
                                    >
                                        Display Order
                                    </Label>
                                    <Input
                                        id="display_order"
                                        type="number"
                                        min="0"
                                        value={data.display_order}
                                        onChange={(e) =>
                                            setData(
                                                'display_order',
                                                Number.parseInt(
                                                    e.target.value,
                                                    10,
                                                ),
                                            )
                                        }
                                        className="border-white/10 bg-white/5 text-white"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                router.visit(
                                    adminRoutes.memberships.index().url,
                                )
                            }
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 size-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
