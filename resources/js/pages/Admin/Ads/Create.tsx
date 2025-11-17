import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Form, Head, router, useForm } from '@inertiajs/react';
import { Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';

type CreativeFormData = {
    placement: string;
    size: string;
    asset_type: string;
    asset_url: string;
    headline: string;
    body_text: string;
    cta_text: string;
    cta_url: string;
    display_order: number;
};

type AdFormData = {
    name: string;
    campaign_id: string;
    status: string;
    start_date: string;
    end_date: string;
    max_impressions: string;
    max_clicks: string;
    daily_impression_cap: string;
    daily_click_cap: string;
    budget_amount: string;
    budget_currency: string;
    pricing_model: string;
    pricing_rate: string;
    targeting: Record<string, unknown>;
    creatives: CreativeFormData[];
};

const PLACEMENTS = [
    { value: 'timeline_inline', label: 'Timeline Inline' },
    { value: 'dashboard_sidebar_small', label: 'Dashboard Sidebar Small' },
    { value: 'dashboard_sidebar_medium', label: 'Dashboard Sidebar Medium' },
    { value: 'dashboard_sidebar_large', label: 'Dashboard Sidebar Large' },
];

const SIZES = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'banner', label: 'Banner' },
    { value: 'square', label: 'Square' },
];

const ASSET_TYPES = [
    { value: 'image', label: 'Image' },
    { value: 'video', label: 'Video' },
    { value: 'html', label: 'HTML' },
];

const PRICING_MODELS = [
    { value: 'cpm', label: 'CPM (Cost Per Mille)' },
    { value: 'cpc', label: 'CPC (Cost Per Click)' },
    { value: 'cpa', label: 'CPA (Cost Per Action)' },
    { value: 'flat', label: 'Flat Rate' },
];

const STATUSES = [
    { value: 'draft', label: 'Draft' },
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'active', label: 'Active' },
];

export default function AdminAdsCreate() {
    const { data, setData, post, processing, errors } = useForm<AdFormData>({
        name: '',
        campaign_id: '',
        status: 'draft',
        start_date: '',
        end_date: '',
        max_impressions: '',
        max_clicks: '',
        daily_impression_cap: '',
        daily_click_cap: '',
        budget_amount: '',
        budget_currency: 'USD',
        pricing_model: 'cpm',
        pricing_rate: '',
        targeting: {},
        creatives: [
            {
                placement: 'timeline_inline',
                size: 'medium',
                asset_type: 'image',
                asset_url: '',
                headline: '',
                body_text: '',
                cta_text: 'Learn More',
                cta_url: '',
                display_order: 0,
            },
        ],
    });

    const addCreative = () => {
        setData('creatives', [
            ...data.creatives,
            {
                placement: 'timeline_inline',
                size: 'medium',
                asset_type: 'image',
                asset_url: '',
                headline: '',
                body_text: '',
                cta_text: 'Learn More',
                cta_url: '',
                display_order: data.creatives.length,
            },
        ]);
    };

    const removeCreative = (index: number) => {
        setData(
            'creatives',
            data.creatives.filter((_, i) => i !== index),
        );
    };

    const updateCreative = (index: number, field: keyof CreativeFormData, value: string | number) => {
        const updated = [...data.creatives];
        updated[index] = { ...updated[index], [field]: value };
        setData('creatives', updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            ...data,
            campaign_id: data.campaign_id ? Number.parseInt(data.campaign_id, 10) : null,
            budget_amount: Number.parseInt(data.budget_amount, 10),
            pricing_rate: Number.parseInt(data.pricing_rate, 10),
            max_impressions: data.max_impressions ? Number.parseInt(data.max_impressions, 10) : null,
            max_clicks: data.max_clicks ? Number.parseInt(data.max_clicks, 10) : null,
            daily_impression_cap: data.daily_impression_cap
                ? Number.parseInt(data.daily_impression_cap, 10)
                : null,
            daily_click_cap: data.daily_click_cap ? Number.parseInt(data.daily_click_cap, 10) : null,
            creatives: data.creatives.map((creative) => ({
                ...creative,
                display_order: creative.display_order,
            })),
        };

        post('/admin/ads', payload, {
            preserveScroll: true,
            onSuccess: () => {
                router.visit('/admin/ads');
            },
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Admin', href: '/admin' },
                { title: 'Ads', href: '/admin/ads' },
                { title: 'Create', href: '/admin/ads/create' },
            ]}
        >
            <Head title="Create Ad · Admin" />

            <div className="space-y-8 text-white">
                <header>
                    <h1 className="text-2xl font-semibold tracking-tight">Create Ad</h1>
                    <p className="text-sm text-white/65">Create a new advertising campaign.</p>
                </header>

                <Form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription className="text-white/60">
                                General ad settings and configuration.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Ad Name *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Summer Sale Campaign"
                                    className="border-white/10 bg-black/30 text-white"
                                />
                                {errors.name && <p className="text-sm text-rose-400">{errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                        <SelectTrigger className="border-white/10 bg-black/30 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {STATUSES.map((status) => (
                                                <SelectItem key={status.value} value={status.value}>
                                                    {status.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="budget_currency">Currency *</Label>
                                    <Select
                                        value={data.budget_currency}
                                        onValueChange={(value) => setData('budget_currency', value)}
                                    >
                                        <SelectTrigger className="border-white/10 bg-black/30 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="EUR">EUR</SelectItem>
                                            <SelectItem value="GBP">GBP</SelectItem>
                                            <SelectItem value="CAD">CAD</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="start_date">Start Date</Label>
                                    <Input
                                        id="start_date"
                                        type="datetime-local"
                                        value={data.start_date}
                                        onChange={(e) => setData('start_date', e.target.value)}
                                        className="border-white/10 bg-black/30 text-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="end_date">End Date</Label>
                                    <Input
                                        id="end_date"
                                        type="datetime-local"
                                        value={data.end_date}
                                        onChange={(e) => setData('end_date', e.target.value)}
                                        className="border-white/10 bg-black/30 text-white"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle>Budget & Pricing</CardTitle>
                            <CardDescription className="text-white/60">
                                Set your budget and pricing model.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="budget_amount">Budget Amount (cents) *</Label>
                                    <Input
                                        id="budget_amount"
                                        type="number"
                                        min="1"
                                        value={data.budget_amount}
                                        onChange={(e) => setData('budget_amount', e.target.value)}
                                        placeholder="10000"
                                        className="border-white/10 bg-black/30 text-white"
                                    />
                                    {errors.budget_amount && (
                                        <p className="text-sm text-rose-400">{errors.budget_amount}</p>
                                    )}
                                    <p className="text-xs text-white/50">
                                        Enter amount in cents (e.g., 10000 = $100.00)
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="pricing_model">Pricing Model *</Label>
                                    <Select
                                        value={data.pricing_model}
                                        onValueChange={(value) => setData('pricing_model', value)}
                                    >
                                        <SelectTrigger className="border-white/10 bg-black/30 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PRICING_MODELS.map((model) => (
                                                <SelectItem key={model.value} value={model.value}>
                                                    {model.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pricing_rate">Pricing Rate (cents) *</Label>
                                <Input
                                    id="pricing_rate"
                                    type="number"
                                    min="1"
                                    value={data.pricing_rate}
                                    onChange={(e) => setData('pricing_rate', e.target.value)}
                                    placeholder="500"
                                    className="border-white/10 bg-black/30 text-white"
                                />
                                {errors.pricing_rate && (
                                    <p className="text-sm text-rose-400">{errors.pricing_rate}</p>
                                )}
                                <p className="text-xs text-white/50">
                                    For CPM: cost per 1000 impressions. For CPC: cost per click.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="max_impressions">Max Impressions</Label>
                                    <Input
                                        id="max_impressions"
                                        type="number"
                                        min="1"
                                        value={data.max_impressions}
                                        onChange={(e) => setData('max_impressions', e.target.value)}
                                        placeholder="100000"
                                        className="border-white/10 bg-black/30 text-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="max_clicks">Max Clicks</Label>
                                    <Input
                                        id="max_clicks"
                                        type="number"
                                        min="1"
                                        value={data.max_clicks}
                                        onChange={(e) => setData('max_clicks', e.target.value)}
                                        placeholder="1000"
                                        className="border-white/10 bg-black/30 text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="daily_impression_cap">Daily Impression Cap</Label>
                                    <Input
                                        id="daily_impression_cap"
                                        type="number"
                                        min="1"
                                        value={data.daily_impression_cap}
                                        onChange={(e) => setData('daily_impression_cap', e.target.value)}
                                        placeholder="10000"
                                        className="border-white/10 bg-black/30 text-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="daily_click_cap">Daily Click Cap</Label>
                                    <Input
                                        id="daily_click_cap"
                                        type="number"
                                        min="1"
                                        value={data.daily_click_cap}
                                        onChange={(e) => setData('daily_click_cap', e.target.value)}
                                        placeholder="100"
                                        className="border-white/10 bg-black/30 text-white"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Creatives *</CardTitle>
                                    <CardDescription className="text-white/60">
                                        Add one or more ad creatives for different placements.
                                    </CardDescription>
                                </div>
                                <Button
                                    type="button"
                                    onClick={addCreative}
                                    variant="outline"
                                    size="sm"
                                    className="border-white/10 bg-black/30 text-white hover:bg-white/10"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Creative
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {data.creatives.map((creative, index) => (
                                <Card key={index} className="border-white/5 bg-black/20">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                        <CardTitle className="text-base">Creative {index + 1}</CardTitle>
                                        {data.creatives.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeCreative(index)}
                                                className="text-white/60 hover:text-white"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            <div className="space-y-2">
                                                <Label>Placement *</Label>
                                                <Select
                                                    value={creative.placement}
                                                    onValueChange={(value) =>
                                                        updateCreative(index, 'placement', value)
                                                    }
                                                >
                                                    <SelectTrigger className="border-white/10 bg-black/30 text-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {PLACEMENTS.map((placement) => (
                                                            <SelectItem
                                                                key={placement.value}
                                                                value={placement.value}
                                                            >
                                                                {placement.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Size *</Label>
                                                <Select
                                                    value={creative.size}
                                                    onValueChange={(value) =>
                                                        updateCreative(index, 'size', value)
                                                    }
                                                >
                                                    <SelectTrigger className="border-white/10 bg-black/30 text-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {SIZES.map((size) => (
                                                            <SelectItem key={size.value} value={size.value}>
                                                                {size.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Asset Type *</Label>
                                                <Select
                                                    value={creative.asset_type}
                                                    onValueChange={(value) =>
                                                        updateCreative(index, 'asset_type', value)
                                                    }
                                                >
                                                    <SelectTrigger className="border-white/10 bg-black/30 text-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {ASSET_TYPES.map((type) => (
                                                            <SelectItem key={type.value} value={type.value}>
                                                                {type.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Asset URL *</Label>
                                            <Input
                                                value={creative.asset_url}
                                                onChange={(e) =>
                                                    updateCreative(index, 'asset_url', e.target.value)
                                                }
                                                placeholder="https://example.com/image.jpg"
                                                className="border-white/10 bg-black/30 text-white"
                                            />
                                            {errors[`creatives.${index}.asset_url`] && (
                                                <p className="text-sm text-rose-400">
                                                    {errors[`creatives.${index}.asset_url`]}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Headline</Label>
                                            <Input
                                                value={creative.headline}
                                                onChange={(e) =>
                                                    updateCreative(index, 'headline', e.target.value)
                                                }
                                                placeholder="Amazing Product"
                                                className="border-white/10 bg-black/30 text-white"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Body Text</Label>
                                            <textarea
                                                value={creative.body_text}
                                                onChange={(e) =>
                                                    updateCreative(index, 'body_text', e.target.value)
                                                }
                                                placeholder="Description of your ad"
                                                className="min-h-[80px] w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                                                rows={3}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>CTA Text</Label>
                                                <Input
                                                    value={creative.cta_text}
                                                    onChange={(e) =>
                                                        updateCreative(index, 'cta_text', e.target.value)
                                                    }
                                                    placeholder="Learn More"
                                                    className="border-white/10 bg-black/30 text-white"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>CTA URL *</Label>
                                                <Input
                                                    value={creative.cta_url}
                                                    onChange={(e) =>
                                                        updateCreative(index, 'cta_url', e.target.value)
                                                    }
                                                    placeholder="https://example.com"
                                                    className="border-white/10 bg-black/30 text-white"
                                                />
                                                {errors[`creatives.${index}.cta_url`] && (
                                                    <p className="text-sm text-rose-400">
                                                        {errors[`creatives.${index}.cta_url`]}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {errors.creatives && (
                                <p className="text-sm text-rose-400">{errors.creatives}</p>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/admin/ads')}
                            className="border-white/10 bg-black/30 text-white hover:bg-white/10"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-white text-black hover:bg-white/90"
                        >
                            {processing ? 'Creating...' : 'Create Ad'}
                        </Button>
                    </div>
                </Form>
            </div>
        </AppLayout>
    );
}
