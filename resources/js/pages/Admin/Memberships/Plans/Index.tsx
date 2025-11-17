import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import adminRoutes from '@/routes/admin';
import { Head, Link, router } from '@inertiajs/react';
import { Crown, Edit, Loader2, Plus, Tag, Trash2 } from 'lucide-react';
import { useState } from 'react';

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
    permissions_to_grant: string[] | null;
    features: Record<string, string> | null;
    is_active: boolean;
    is_public: boolean;
    display_order: number;
    allows_recurring: boolean;
    allows_one_time: boolean;
    one_time_duration_days: number | null;
};

type AdminMembershipsIndexProps = {
    plans: MembershipPlan[];
};

export default function AdminMembershipsPlansIndex({
    plans,
}: AdminMembershipsIndexProps) {
    const [deleting, setDeleting] = useState<number | null>(null);

    const formatPrice = (cents: number, currency: string = 'USD'): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(cents / 100);
    };

    const handleDelete = (plan: MembershipPlan) => {
        if (
            !confirm(
                `Are you sure you want to delete "${plan.name}"? This action cannot be undone.`,
            )
        ) {
            return;
        }

        setDeleting(plan.id);
        router.delete(adminRoutes.memberships.destroy(plan.id).url, {
            preserveScroll: true,
            onFinish: () => setDeleting(null),
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
            ]}
        >
            <Head title="Membership Plans" />

            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">
                            Membership Plans
                        </h1>
                        <p className="mt-2 text-sm text-white/70">
                            Manage membership plans that users can purchase to
                            upgrade their accounts
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" asChild>
                            <Link
                                href={
                                    adminRoutes.memberships.discounts.index()
                                        .url
                                }
                            >
                                <Tag className="mr-2 size-4" />
                                Discounts
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href={adminRoutes.memberships.create().url}>
                                <Plus className="mr-2 size-4" />
                                Create Plan
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {plans.map((plan) => (
                        <Card
                            key={plan.id}
                            className="border-white/10 bg-white/5"
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <Crown className="size-5 text-amber-400" />
                                        <CardTitle className="text-white">
                                            {plan.name}
                                        </CardTitle>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {plan.is_active ? (
                                            <Badge
                                                variant="default"
                                                className="bg-green-500/20 text-green-400"
                                            >
                                                Active
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                Inactive
                                            </Badge>
                                        )}
                                        {!plan.is_public && (
                                            <Badge variant="secondary">
                                                Hidden
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <CardDescription className="text-white/60">
                                    {plan.description || 'No description'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-white/70">
                                            Monthly Price:
                                        </span>
                                        <span className="font-semibold text-white">
                                            {formatPrice(
                                                plan.monthly_price,
                                                plan.currency,
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-white/70">
                                            Yearly Price:
                                        </span>
                                        <span className="font-semibold text-white">
                                            {formatPrice(
                                                plan.yearly_price,
                                                plan.currency,
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-white/70">
                                            Role:
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className="text-white/80"
                                        >
                                            {plan.role_to_assign}
                                        </Badge>
                                    </div>
                                </div>

                                {plan.features &&
                                    Object.keys(plan.features).length > 0 && (
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-white/70">
                                                Features:
                                            </p>
                                            <ul className="space-y-1 text-xs text-white/60">
                                                {Object.entries(plan.features)
                                                    .slice(0, 3)
                                                    .map(([key, value]) => (
                                                        <li key={key}>
                                                            • {value}
                                                        </li>
                                                    ))}
                                                {Object.keys(plan.features)
                                                    .length > 3 && (
                                                    <li className="text-white/40">
                                                        +
                                                        {Object.keys(
                                                            plan.features,
                                                        ).length - 3}{' '}
                                                        more
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    )}

                                <div className="flex items-center gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        asChild
                                        className="flex-1"
                                    >
                                        <Link
                                            href={
                                                adminRoutes.memberships.edit(
                                                    plan.id,
                                                ).url
                                            }
                                        >
                                            <Edit className="mr-2 size-4" />
                                            Edit
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(plan)}
                                        disabled={deleting === plan.id}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        {deleting === plan.id ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="size-4" />
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {plans.length === 0 && (
                    <Card className="border-white/10 bg-white/5">
                        <CardContent className="py-12 text-center">
                            <Crown className="mx-auto size-12 text-white/20" />
                            <h3 className="mt-4 text-lg font-semibold text-white">
                                No membership plans
                            </h3>
                            <p className="mt-2 text-sm text-white/60">
                                Get started by creating your first membership
                                plan
                            </p>
                            <Button asChild className="mt-6">
                                <Link
                                    href={adminRoutes.memberships.create().url}
                                >
                                    <Plus className="mr-2 size-4" />
                                    Create Plan
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
