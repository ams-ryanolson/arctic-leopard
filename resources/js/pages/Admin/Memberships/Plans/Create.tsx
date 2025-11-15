import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import adminRoutes from '@/routes/admin';
import { Form, Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';

type Role = {
    id: number;
    name: string;
};

type AdminMembershipsCreateProps = {
    roles: Role[];
};

export default function AdminMembershipsPlansCreate({ roles }: AdminMembershipsCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        description: '',
        monthly_price: '',
        yearly_price: '',
        currency: 'USD',
        role_to_assign: '',
        permissions_to_grant: [] as string[],
        features: {} as Record<string, string>,
        is_active: true,
        is_public: true,
        display_order: 0,
        allows_recurring: true,
        allows_one_time: true,
        one_time_duration_days: 30,
    });

    const [featureKey, setFeatureKey] = useState('');
    const [featureValue, setFeatureValue] = useState('');

    const addFeature = () => {
        if (featureKey.trim() && featureValue.trim()) {
            setData('features', {
                ...data.features,
                [featureKey.trim()]: featureValue.trim(),
            });
            setFeatureKey('');
            setFeatureValue('');
        }
    };

    const removeFeature = (key: string) => {
        const updated = { ...data.features };
        delete updated[key];
        setData('features', updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(adminRoutes.memberships.store().url, {
            preserveScroll: true,
            onSuccess: () => {
                router.visit(adminRoutes.memberships.index().url);
            },
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Admin', href: adminRoutes.dashboard().url },
                { title: 'Memberships', href: adminRoutes.memberships.index().url },
                { title: 'Create Plan', href: adminRoutes.memberships.create().url },
            ]}
        >
            <Head title="Create Membership Plan" />

            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <a href={adminRoutes.memberships.index().url}>
                            <ArrowLeft className="mr-2 size-4" />
                            Back
                        </a>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Create Membership Plan</h1>
                        <p className="mt-2 text-sm text-white/70">
                            Create a new membership plan that users can purchase
                        </p>
                    </div>
                </div>

                <Form onSubmit={handleSubmit}>
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card className="border-white/10 bg-white/5">
                            <CardHeader>
                                <CardTitle className="text-white">Basic Information</CardTitle>
                                <CardDescription className="text-white/60">
                                    Core details about the membership plan
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-white">
                                        Name *
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="bg-white/5 border-white/10 text-white"
                                        placeholder="Premium"
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-400">{errors.name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="slug" className="text-white">
                                        Slug *
                                    </Label>
                                    <Input
                                        id="slug"
                                        value={data.slug}
                                        onChange={(e) => setData('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                        className="bg-white/5 border-white/10 text-white"
                                        placeholder="premium"
                                    />
                                    {errors.slug && (
                                        <p className="text-sm text-red-400">{errors.slug}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-white">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        className="bg-white/5 border-white/10 text-white"
                                        placeholder="Describe what this membership offers..."
                                        rows={4}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-red-400">{errors.description}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="role_to_assign" className="text-white">
                                        Role to Assign *
                                    </Label>
                                    <Select
                                        value={data.role_to_assign}
                                        onValueChange={(value) => setData('role_to_assign', value)}
                                    >
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((role) => (
                                                <SelectItem key={role.id} value={role.name}>
                                                    {role.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.role_to_assign && (
                                        <p className="text-sm text-red-400">{errors.role_to_assign}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-white/10 bg-white/5">
                            <CardHeader>
                                <CardTitle className="text-white">Pricing</CardTitle>
                                <CardDescription className="text-white/60">
                                    Set pricing for monthly and yearly subscriptions
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="monthly_price" className="text-white">
                                        Monthly Price (cents) *
                                    </Label>
                                    <Input
                                        id="monthly_price"
                                        type="number"
                                        min="0"
                                        value={data.monthly_price}
                                        onChange={(e) => setData('monthly_price', e.target.value)}
                                        className="bg-white/5 border-white/10 text-white"
                                        placeholder="1000"
                                    />
                                    <p className="text-xs text-white/50">
                                        ${(Number(data.monthly_price) / 100).toFixed(2)} per month
                                    </p>
                                    {errors.monthly_price && (
                                        <p className="text-sm text-red-400">{errors.monthly_price}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="yearly_price" className="text-white">
                                        Yearly Price (cents) *
                                    </Label>
                                    <Input
                                        id="yearly_price"
                                        type="number"
                                        min="0"
                                        value={data.yearly_price}
                                        onChange={(e) => setData('yearly_price', e.target.value)}
                                        className="bg-white/5 border-white/10 text-white"
                                        placeholder="10000"
                                    />
                                    <p className="text-xs text-white/50">
                                        ${(Number(data.yearly_price) / 100).toFixed(2)} per year (10x monthly = 2 months free)
                                    </p>
                                    {errors.yearly_price && (
                                        <p className="text-sm text-red-400">{errors.yearly_price}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="currency" className="text-white">
                                        Currency *
                                    </Label>
                                    <Select
                                        value={data.currency}
                                        onValueChange={(value) => setData('currency', value)}
                                    >
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="EUR">EUR</SelectItem>
                                            <SelectItem value="GBP">GBP</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-white/10 bg-white/5">
                            <CardHeader>
                                <CardTitle className="text-white">Features</CardTitle>
                                <CardDescription className="text-white/60">
                                    Add features that come with this membership
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="feature_key" className="text-white">
                                        Feature Key
                                    </Label>
                                    <Input
                                        id="feature_key"
                                        value={featureKey}
                                        onChange={(e) => setFeatureKey(e.target.value)}
                                        className="bg-white/5 border-white/10 text-white"
                                        placeholder="premium_content_drops"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addFeature();
                                            }
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="feature_value" className="text-white">
                                        Feature Description
                                    </Label>
                                    <Input
                                        id="feature_value"
                                        value={featureValue}
                                        onChange={(e) => setFeatureValue(e.target.value)}
                                        className="bg-white/5 border-white/10 text-white"
                                        placeholder="3 premium content drops every week"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addFeature();
                                            }
                                        }}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addFeature}
                                    disabled={!featureKey.trim() || !featureValue.trim()}
                                >
                                    <Plus className="mr-2 size-4" />
                                    Add Feature
                                </Button>

                                {Object.keys(data.features).length > 0 && (
                                    <div className="space-y-2 pt-4">
                                        <Label className="text-white">Current Features</Label>
                                        <div className="space-y-2">
                                            {Object.entries(data.features).map(([key, value]) => (
                                                <div
                                                    key={key}
                                                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-2"
                                                >
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-white">{key}</p>
                                                        <p className="text-xs text-white/60">{value}</p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeFeature(key)}
                                                        className="text-red-400 hover:text-red-300"
                                                    >
                                                        <X className="size-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-white/10 bg-white/5">
                            <CardHeader>
                                <CardTitle className="text-white">Settings</CardTitle>
                                <CardDescription className="text-white/60">
                                    Configure plan availability and billing options
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="is_active"
                                        checked={data.is_active}
                                        onCheckedChange={(checked) => setData('is_active', checked === true)}
                                    />
                                    <Label htmlFor="is_active" className="text-white">
                                        Active
                                    </Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="is_public"
                                        checked={data.is_public}
                                        onCheckedChange={(checked) => setData('is_public', checked === true)}
                                    />
                                    <Label htmlFor="is_public" className="text-white">
                                        Public (visible to users)
                                    </Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="allows_recurring"
                                        checked={data.allows_recurring}
                                        onCheckedChange={(checked) => setData('allows_recurring', checked === true)}
                                    />
                                    <Label htmlFor="allows_recurring" className="text-white">
                                        Allow Recurring Billing
                                    </Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="allows_one_time"
                                        checked={data.allows_one_time}
                                        onCheckedChange={(checked) => setData('allows_one_time', checked === true)}
                                    />
                                    <Label htmlFor="allows_one_time" className="text-white">
                                        Allow One-Time Purchase
                                    </Label>
                                </div>

                                {data.allows_one_time && (
                                    <div className="space-y-2">
                                        <Label htmlFor="one_time_duration_days" className="text-white">
                                            One-Time Duration (days)
                                        </Label>
                                        <Input
                                            id="one_time_duration_days"
                                            type="number"
                                            min="1"
                                            value={data.one_time_duration_days}
                                            onChange={(e) =>
                                                setData('one_time_duration_days', Number.parseInt(e.target.value, 10))
                                            }
                                            className="bg-white/5 border-white/10 text-white"
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="display_order" className="text-white">
                                        Display Order
                                    </Label>
                                    <Input
                                        id="display_order"
                                        type="number"
                                        min="0"
                                        value={data.display_order}
                                        onChange={(e) => setData('display_order', Number.parseInt(e.target.value, 10))}
                                        className="bg-white/5 border-white/10 text-white"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(adminRoutes.memberships.index().url)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 size-4" />
                                    Create Plan
                                </>
                            )}
                        </Button>
                    </div>
                </Form>
            </div>
        </AppLayout>
    );
}

