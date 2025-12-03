import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import adminRoutes from '@/routes/admin';
import { Head, Link, router } from '@inertiajs/react';
import { Loader2, Plus, Tag, Trash2 } from 'lucide-react';
import { useState } from 'react';

type Discount = {
    id: number;
    code: string;
    description: string | null;
    discount_type: string;
    discount_value: number;
    membership_plan_id: number | null;
    plan: {
        id: number;
        name: string;
        slug: string;
    } | null;
    starts_at: string;
    ends_at: string;
    max_uses: number | null;
    used_count: number;
    is_active: boolean;
};

type AdminDiscountsIndexProps = {
    discounts: Discount[];
    plans: Array<{
        id: number;
        name: string;
        slug: string;
    }>;
};

export default function AdminDiscountsIndex({
    discounts,
    plans: _plans,
}: AdminDiscountsIndexProps) {
    const [deleting, setDeleting] = useState<number | null>(null);

    const handleDelete = (discount: Discount) => {
        if (
            !confirm(
                `Are you sure you want to delete discount code "${discount.code}"? This action cannot be undone.`,
            )
        ) {
            return;
        }

        setDeleting(discount.id);
        router.delete(
            adminRoutes.memberships.discounts.destroy(discount.id).url,
            {
                preserveScroll: true,
                onFinish: () => setDeleting(null),
            },
        );
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
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
            ]}
        >
            <Head title="Discount Codes" />

            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">
                            Discount Codes
                        </h1>
                        <p className="mt-2 text-sm text-white/70">
                            Manage discount codes for membership plans
                        </p>
                    </div>
                    <Button asChild>
                        <Link
                            href={
                                adminRoutes.memberships.discounts.create().url
                            }
                        >
                            <Plus className="mr-2 size-4" />
                            Create Discount
                        </Link>
                    </Button>
                </div>

                <Card className="border-white/10 bg-white/5">
                    <CardContent className="p-0">
                        {discounts.length === 0 ? (
                            <div className="py-12 text-center">
                                <Tag className="mx-auto size-12 text-white/20" />
                                <h3 className="mt-4 text-lg font-semibold text-white">
                                    No discount codes
                                </h3>
                                <p className="mt-2 text-sm text-white/60">
                                    Get started by creating your first discount
                                    code
                                </p>
                                <Button asChild className="mt-6">
                                    <Link
                                        href={
                                            adminRoutes.memberships.discounts.create()
                                                .url
                                        }
                                    >
                                        <Plus className="mr-2 size-4" />
                                        Create Discount
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/10">
                                {discounts.map((discount) => (
                                    <div
                                        key={discount.id}
                                        className="p-6 transition-colors hover:bg-white/5"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <Tag className="size-5 text-amber-400" />
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-white">
                                                                {discount.code}
                                                            </span>
                                                            {discount.is_active ? (
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
                                                        </div>
                                                        {discount.description && (
                                                            <p className="text-sm text-white/60">
                                                                {
                                                                    discount.description
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="ml-8 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                                                    <div>
                                                        <p className="text-xs text-white/50">
                                                            Discount Type
                                                        </p>
                                                        <p className="text-sm font-medium text-white">
                                                            {discount.discount_type ===
                                                            'percentage'
                                                                ? `${discount.discount_value}%`
                                                                : `$${(discount.discount_value / 100).toFixed(2)}`}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-white/50">
                                                            Applies To
                                                        </p>
                                                        <p className="text-sm font-medium text-white">
                                                            {discount.plan
                                                                ? discount.plan
                                                                      .name
                                                                : 'All Plans'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-white/50">
                                                            Valid Period
                                                        </p>
                                                        <p className="text-sm text-white/70">
                                                            {formatDate(
                                                                discount.starts_at,
                                                            )}{' '}
                                                            -{' '}
                                                            {formatDate(
                                                                discount.ends_at,
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-white/50">
                                                            Usage
                                                        </p>
                                                        <p className="text-sm text-white/70">
                                                            {
                                                                discount.used_count
                                                            }
                                                            {discount.max_uses
                                                                ? ` / ${discount.max_uses}`
                                                                : ' / ∞'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <Link
                                                        href={
                                                            adminRoutes.memberships.discounts.edit(
                                                                discount.id,
                                                            ).url
                                                        }
                                                    >
                                                        Edit
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleDelete(discount)
                                                    }
                                                    disabled={
                                                        deleting === discount.id
                                                    }
                                                    className="text-red-400 hover:text-red-300"
                                                >
                                                    {deleting ===
                                                    discount.id ? (
                                                        <Loader2 className="size-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="size-4" />
                                                    )}
                                                </Button>
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
