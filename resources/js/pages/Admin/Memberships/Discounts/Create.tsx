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
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useMemo } from 'react';

type Plan = {
    id: number;
    name: string;
    slug: string;
};

type AdminDiscountsCreateProps = {
    plans: Plan[];
};

export default function AdminDiscountsCreate({
    plans,
}: AdminDiscountsCreateProps) {
    // Calculate default end date using useMemo to avoid calling Date.now() during render
    const defaultEndDate = useMemo(() => {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);
        return endDate.toISOString().split('T')[0];
    }, []);

    const { data, setData, post, processing, errors } = useForm({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 0,
        membership_plan_id: null as number | null,
        starts_at: new Date().toISOString().split('T')[0],
        ends_at: defaultEndDate,
        max_uses: null as number | null,
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Ensure discount_value is a valid integer
        if (!data.discount_value || data.discount_value < 1) {
            alert('Please enter a valid discount value');
            return;
        }

        console.log('Submitting discount with data:', data);

        post(adminRoutes.memberships.discounts.store().url, {
            preserveScroll: true,
            onSuccess: () => {
                console.log('Discount created successfully');
                router.visit(adminRoutes.memberships.discounts.index().url);
            },
            onError: (errors) => {
                console.error('Validation errors:', errors);
                // Errors will be displayed automatically by Inertia
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
                    title: 'Discounts',
                    href: adminRoutes.memberships.discounts.index().url,
                },
                {
                    title: 'Create Discount',
                    href: adminRoutes.memberships.discounts.create().url,
                },
            ]}
        >
            <Head title="Create Discount Code" />

            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <a href={adminRoutes.memberships.discounts.index().url}>
                            <ArrowLeft className="mr-2 size-4" />
                            Back
                        </a>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">
                            Create Discount Code
                        </h1>
                        <p className="mt-2 text-sm text-white/70">
                            Create a new discount code for membership plans
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
                                    Core details about the discount code
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="code"
                                        className="text-white"
                                    >
                                        Code *
                                    </Label>
                                    <Input
                                        id="code"
                                        value={data.code}
                                        onChange={(e) =>
                                            setData(
                                                'code',
                                                e.target.value.toUpperCase(),
                                            )
                                        }
                                        className="border-white/10 bg-white/5 text-white"
                                        placeholder="SAVE20"
                                    />
                                    {errors.code && (
                                        <p className="text-sm text-red-400">
                                            {errors.code}
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
                                        placeholder="Black Friday 20% off"
                                        rows={3}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-red-400">
                                            {errors.description}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="membership_plan_id"
                                        className="text-white"
                                    >
                                        Applies To
                                    </Label>
                                    <Select
                                        value={
                                            data.membership_plan_id
                                                ? String(
                                                      data.membership_plan_id,
                                                  )
                                                : 'all'
                                        }
                                        onValueChange={(value) =>
                                            setData(
                                                'membership_plan_id',
                                                value === 'all'
                                                    ? null
                                                    : Number.parseInt(
                                                          value,
                                                          10,
                                                      ),
                                            )
                                        }
                                    >
                                        <SelectTrigger className="border-white/10 bg-white/5 text-white">
                                            <SelectValue placeholder="All Plans" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Plans
                                            </SelectItem>
                                            {plans.map((plan) => (
                                                <SelectItem
                                                    key={plan.id}
                                                    value={String(plan.id)}
                                                >
                                                    {plan.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-white/50">
                                        Leave empty to apply to all membership
                                        plans
                                    </p>
                                    {errors.membership_plan_id && (
                                        <p className="text-sm text-red-400">
                                            {errors.membership_plan_id}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-white/10 bg-white/5">
                            <CardHeader>
                                <CardTitle className="text-white">
                                    Discount Details
                                </CardTitle>
                                <CardDescription className="text-white/60">
                                    Set the discount amount and type
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="discount_type"
                                        className="text-white"
                                    >
                                        Discount Type *
                                    </Label>
                                    <Select
                                        value={data.discount_type}
                                        onValueChange={(value) =>
                                            setData('discount_type', value)
                                        }
                                    >
                                        <SelectTrigger className="border-white/10 bg-white/5 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">
                                                Percentage
                                            </SelectItem>
                                            <SelectItem value="fixed_amount">
                                                Fixed Amount (cents)
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.discount_type && (
                                        <p className="text-sm text-red-400">
                                            {errors.discount_type}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="discount_value"
                                        className="text-white"
                                    >
                                        Discount Value *
                                    </Label>
                                    <Input
                                        id="discount_value"
                                        type="number"
                                        min="1"
                                        value={data.discount_value || ''}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setData(
                                                'discount_value',
                                                value
                                                    ? Number.parseInt(value, 10)
                                                    : 0,
                                            );
                                        }}
                                        className="border-white/10 bg-white/5 text-white"
                                        placeholder={
                                            data.discount_type === 'percentage'
                                                ? '20'
                                                : '500'
                                        }
                                    />
                                    <p className="text-xs text-white/50">
                                        {data.discount_type === 'percentage'
                                            ? 'Enter percentage (e.g., 20 for 20%)'
                                            : 'Enter amount in cents (e.g., 500 for $5.00)'}
                                    </p>
                                    {errors.discount_value && (
                                        <p className="text-sm text-red-400">
                                            {errors.discount_value}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="max_uses"
                                        className="text-white"
                                    >
                                        Max Uses
                                    </Label>
                                    <Input
                                        id="max_uses"
                                        type="number"
                                        min="1"
                                        value={data.max_uses || ''}
                                        onChange={(e) =>
                                            setData(
                                                'max_uses',
                                                e.target.value
                                                    ? Number.parseInt(
                                                          e.target.value,
                                                          10,
                                                      )
                                                    : null,
                                            )
                                        }
                                        className="border-white/10 bg-white/5 text-white"
                                        placeholder="Unlimited"
                                    />
                                    <p className="text-xs text-white/50">
                                        Leave empty for unlimited uses
                                    </p>
                                    {errors.max_uses && (
                                        <p className="text-sm text-red-400">
                                            {errors.max_uses}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-white/10 bg-white/5">
                            <CardHeader>
                                <CardTitle className="text-white">
                                    Validity Period
                                </CardTitle>
                                <CardDescription className="text-white/60">
                                    Set when the discount is active
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="starts_at"
                                        className="text-white"
                                    >
                                        Start Date *
                                    </Label>
                                    <Input
                                        id="starts_at"
                                        type="date"
                                        value={data.starts_at}
                                        onChange={(e) =>
                                            setData('starts_at', e.target.value)
                                        }
                                        className="border-white/10 bg-white/5 text-white"
                                    />
                                    {errors.starts_at && (
                                        <p className="text-sm text-red-400">
                                            {errors.starts_at}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="ends_at"
                                        className="text-white"
                                    >
                                        End Date *
                                    </Label>
                                    <Input
                                        id="ends_at"
                                        type="date"
                                        value={data.ends_at}
                                        onChange={(e) =>
                                            setData('ends_at', e.target.value)
                                        }
                                        className="border-white/10 bg-white/5 text-white"
                                    />
                                    {errors.ends_at && (
                                        <p className="text-sm text-red-400">
                                            {errors.ends_at}
                                        </p>
                                    )}
                                </div>

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
                            </CardContent>
                        </Card>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                router.visit(
                                    adminRoutes.memberships.discounts.index()
                                        .url,
                                )
                            }
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
                                    Create Discount
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
