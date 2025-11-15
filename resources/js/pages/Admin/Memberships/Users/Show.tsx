import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import adminRoutes from '@/routes/admin';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Crown, Loader2, Plus, Save } from 'lucide-react';
import { useState } from 'react';

type UserMembership = {
    id: number;
    uuid: string;
    plan: {
        id: number;
        name: string;
        slug: string;
    };
    status: string;
    billing_type: string;
    starts_at: string;
    ends_at: string | null;
    next_billing_at: string | null;
    cancelled_at: string | null;
    cancellation_reason: string | null;
    original_price: number;
    discount_amount: number;
};

type MembershipPlan = {
    id: number;
    name: string;
    slug: string;
    role_to_assign: string;
};

type AdminUserMembershipShowProps = {
    user: {
        id: number;
        name: string;
        username: string;
        email: string;
    };
    memberships: UserMembership[];
    plans: MembershipPlan[];
};

export default function AdminUserMembershipShow({ user, memberships, plans }: AdminUserMembershipShowProps) {
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        plan_id: '',
        billing_type: 'one_time',
        duration_days: '',
        notes: '',
    });

    const formatPrice = (cents: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(cents / 100);
    };

    const handleAssign = (e: React.FormEvent) => {
        e.preventDefault();
        post(adminRoutes.memberships.users.assign(user.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                setAssignDialogOpen(false);
                router.reload();
            },
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Admin', href: adminRoutes.dashboard().url },
                { title: 'Memberships', href: adminRoutes.memberships.index().url },
                { title: 'User Memberships', href: adminRoutes.memberships.users.index().url },
                { title: user.name, href: adminRoutes.memberships.users.show(user.id).url },
            ]}
        >
            <Head title={`Memberships - ${user.name}`} />

            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={adminRoutes.memberships.users.index().url}>
                                <ArrowLeft className="mr-2 size-4" />
                                Back
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white">{user.name}</h1>
                            <p className="mt-2 text-sm text-white/70">
                                @{user.username} • {user.email}
                            </p>
                        </div>
                    </div>
                    <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 size-4" />
                                Assign Membership
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="border-white/10 bg-neutral-950 text-white">
                            <DialogHeader>
                                <DialogTitle>Assign Membership to {user.name}</DialogTitle>
                                <DialogDescription className="text-white/60">
                                    Manually assign a membership plan to this user. This will cancel any existing active
                                    membership.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAssign}>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="plan_id" className="text-white">
                                            Membership Plan *
                                        </Label>
                                        <Select
                                            value={data.plan_id}
                                            onValueChange={(value) => setData('plan_id', value)}
                                        >
                                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                                <SelectValue placeholder="Select a plan" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {plans.map((plan) => (
                                                    <SelectItem key={plan.id} value={String(plan.id)}>
                                                        {plan.name} ({plan.role_to_assign})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.plan_id && (
                                            <p className="text-sm text-red-400">{errors.plan_id}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-white">Billing Type *</Label>
                                        <RadioGroup
                                            value={data.billing_type}
                                            onValueChange={(value) => setData('billing_type', value)}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="one_time" id="one_time" />
                                                <Label htmlFor="one_time" className="text-white">
                                                    One-Time
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="recurring" id="recurring" />
                                                <Label htmlFor="recurring" className="text-white">
                                                    Recurring
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                        {errors.billing_type && (
                                            <p className="text-sm text-red-400">{errors.billing_type}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="duration_days" className="text-white">
                                            Duration (days)
                                        </Label>
                                        <Input
                                            id="duration_days"
                                            type="number"
                                            min="1"
                                            value={data.duration_days}
                                            onChange={(e) => setData('duration_days', e.target.value)}
                                            className="bg-white/5 border-white/10 text-white"
                                            placeholder="Leave empty for default"
                                        />
                                        <p className="text-xs text-white/50">
                                            Leave empty to use plan default (30 days for one-time, 30 days for recurring)
                                        </p>
                                        {errors.duration_days && (
                                            <p className="text-sm text-red-400">{errors.duration_days}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="notes" className="text-white">
                                            Notes (optional)
                                        </Label>
                                        <Textarea
                                            id="notes"
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            className="bg-white/5 border-white/10 text-white"
                                            placeholder="Reason for manual assignment..."
                                            rows={3}
                                        />
                                        {errors.notes && (
                                            <p className="text-sm text-red-400">{errors.notes}</p>
                                        )}
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setAssignDialogOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? (
                                            <>
                                                <Loader2 className="mr-2 size-4 animate-spin" />
                                                Assigning...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 size-4" />
                                                Assign Membership
                                            </>
                                        )}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card className="border-white/10 bg-white/5">
                    <CardHeader>
                        <CardTitle className="text-white">Membership History</CardTitle>
                        <CardDescription className="text-white/60">
                            All membership subscriptions for this user
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {memberships.length === 0 ? (
                            <div className="py-12 text-center">
                                <Crown className="mx-auto size-12 text-white/20" />
                                <h3 className="mt-4 text-lg font-semibold text-white">No memberships</h3>
                                <p className="mt-2 text-sm text-white/60">
                                    This user has no membership history
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/10">
                                {memberships.map((membership) => (
                                    <div key={membership.id} className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <Crown className="size-5 text-amber-400" />
                                                    <div>
                                                        <p className="font-semibold text-white">
                                                            {membership.plan.name}
                                                        </p>
                                                        <Badge
                                                            variant={
                                                                membership.status === 'active'
                                                                    ? 'default'
                                                                    : membership.status === 'expired'
                                                                    ? 'secondary'
                                                                    : 'outline'
                                                            }
                                                            className={
                                                                membership.status === 'active'
                                                                    ? 'bg-green-500/20 text-green-400'
                                                                    : ''
                                                            }
                                                        >
                                                            {membership.status}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div className="ml-8 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                                                    <div>
                                                        <p className="text-xs text-white/50">Billing Type</p>
                                                        <p className="text-sm font-medium text-white">
                                                            {membership.billing_type === 'recurring'
                                                                ? 'Recurring'
                                                                : 'One-Time'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-white/50">Price</p>
                                                        <p className="text-sm font-medium text-white">
                                                            {formatPrice(membership.original_price)}
                                                            {membership.discount_amount > 0 && (
                                                                <span className="ml-1 text-xs text-white/50">
                                                                    (-{formatPrice(membership.discount_amount)})
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-white/50">Started</p>
                                                        <p className="text-sm text-white/70">
                                                            {formatDistanceToNow(new Date(membership.starts_at), {
                                                                addSuffix: true,
                                                            })}
                                                        </p>
                                                    </div>
                                                    {membership.ends_at && (
                                                        <div>
                                                            <p className="text-xs text-white/50">Ends</p>
                                                            <p className="text-sm text-white/70">
                                                                {formatDistanceToNow(new Date(membership.ends_at), {
                                                                    addSuffix: true,
                                                                })}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                {membership.cancellation_reason && (
                                                    <div className="ml-8">
                                                        <p className="text-xs text-white/50">Cancellation Reason</p>
                                                        <p className="text-sm text-white/70">
                                                            {membership.cancellation_reason}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

