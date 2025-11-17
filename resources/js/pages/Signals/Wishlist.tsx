import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import signalsWishlistRoutes from '@/routes/signals/wishlist';
import { Head, router, useForm } from '@inertiajs/react';
import {
    BarChart3,
    Edit,
    Gift,
    Plus,
    RotateCcw,
    Trash2,
    Users,
} from 'lucide-react';
import { useCallback, useState } from 'react';

type WishlistItem = {
    id: number;
    uuid: string;
    title: string;
    description: string | null;
    amount: number | null;
    currency: string | null;
    url: string | null;
    image_url: string | null;
    quantity: number | null;
    is_crowdfunded: boolean;
    goal_amount: number | null;
    current_funding: number;
    status: string;
    progress_percentage: number;
    remaining_quantity: number | null;
    expires_at: string | null;
    approved_at: string | null;
    is_active: boolean;
    can_be_purchased: boolean;
    purchase_count: number;
    created_at: string;
    updated_at: string;
    creator: {
        id: number;
        username: string;
        display_name: string;
        avatar_url: string | null;
    };
    contributors?: Array<{
        id: number;
        buyer: {
            id: number;
            username: string;
            display_name: string;
            avatar_url: string | null;
        };
        amount: number;
        currency: string;
        message: string | null;
        covers_fee: boolean;
        created_at: string;
    }>;
};

type Analytics = {
    total_items: number;
    active_items: number;
    fulfilled_items: number;
    total_contributions: number;
    total_contributors: number;
    average_contribution: number;
    items: Array<{
        item_id: number;
        title: string;
        status: string;
        total_contributions: number;
        contributor_count: number;
        purchase_count: number;
        average_contribution: number;
        largest_contribution: number;
        progress_percentage: number;
    }>;
};

interface SignalsWishlistProps {
    items: {
        data: WishlistItem[];
    };
    analytics: Analytics;
    status: string;
}

function formatCurrency(
    cents: number | null,
    currency: string | null = 'USD',
): string {
    if (cents === null) {
        return 'N/A';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency ?? 'USD',
        maximumFractionDigits: 0,
    }).format(cents / 100);
}

function getStatusBadgeClass(status: string): string {
    switch (status) {
        case 'active':
            return 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30';
        case 'funded':
            return 'bg-amber-500/20 text-amber-200 border-amber-500/30';
        case 'fulfilled':
            return 'bg-violet-500/20 text-violet-200 border-violet-500/30';
        case 'cancelled':
            return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
        default:
            return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
}

export default function SignalsWishlist({
    items: itemsData,
    analytics,
    status: initialStatus,
}: SignalsWishlistProps) {
    const [selectedStatus, setSelectedStatus] = useState(initialStatus);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<WishlistItem | null>(null);
    const [contributorsItem, setContributorsItem] =
        useState<WishlistItem | null>(null);
    const [contributorsData, setContributorsData] = useState<
        Array<{
            buyer_id: number;
            buyer_name: string;
            buyer_avatar: string | null;
            total_contributed: number;
            contribution_count: number;
        }>
    >([]);
    const [loadingContributors, setLoadingContributors] = useState(false);

    const items = itemsData.data;

    const createForm = useForm({
        title: '',
        description: '',
        amount: '',
        currency: 'USD',
        url: '',
        image_url: '',
        is_crowdfunded: false,
        quantity: '',
        goal_amount: '',
        expires_at: '',
    });

    const editForm = useForm({
        title: '',
        description: '',
        amount: '',
        currency: 'USD',
        url: '',
        image_url: '',
        quantity: '',
        goal_amount: '',
        expires_at: '',
    });

    const handleCreate = useCallback(() => {
        const data: Record<string, any> = {
            title: createForm.data.title,
            description: createForm.data.description || null,
            currency: createForm.data.currency,
            url: createForm.data.url || null,
            image_url: createForm.data.image_url || null,
            is_crowdfunded: createForm.data.is_crowdfunded,
            expires_at: createForm.data.expires_at || null,
        };

        if (createForm.data.is_crowdfunded) {
            data.goal_amount = createForm.data.goal_amount
                ? parseInt(createForm.data.goal_amount) * 100
                : null;
            data.amount = null;
            data.quantity = null;
        } else {
            data.amount = createForm.data.amount
                ? parseInt(createForm.data.amount) * 100
                : null;
            data.quantity = createForm.data.quantity
                ? parseInt(createForm.data.quantity)
                : null;
            data.goal_amount = null;
        }

        createForm.post(signalsWishlistRoutes.store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                setCreateDialogOpen(false);
                createForm.reset();
            },
        });
    }, [createForm]);

    const handleEdit = useCallback(() => {
        if (!editItem) {
            return;
        }

        const data: Record<string, any> = {
            title: editForm.data.title,
            description: editForm.data.description || null,
            currency: editForm.data.currency,
            url: editForm.data.url || null,
            image_url: editForm.data.image_url || null,
            expires_at: editForm.data.expires_at || null,
        };

        if (editItem.is_crowdfunded) {
            data.goal_amount = editForm.data.goal_amount
                ? parseInt(editForm.data.goal_amount) * 100
                : null;
        } else {
            data.amount = editForm.data.amount
                ? parseInt(editForm.data.amount) * 100
                : null;
            data.quantity = editForm.data.quantity
                ? parseInt(editForm.data.quantity)
                : null;
        }

        editForm.put(signalsWishlistRoutes.update.url(editItem.id), {
            preserveScroll: true,
            onSuccess: () => {
                setEditItem(null);
                editForm.reset();
            },
        });
    }, [editForm, editItem]);

    const handleDelete = useCallback(
        (item: WishlistItem) => {
            if (
                confirm('Are you sure you want to delete this wishlist item?')
            ) {
                router.delete(signalsWishlistRoutes.destroy.url(item.id), {
                    preserveScroll: true,
                });
            }
        },
        [router],
    );

    const handleRenew = useCallback(
        (item: WishlistItem) => {
            router.post(signalsWishlistRoutes.renew.url(item.id), {
                preserveScroll: true,
            });
        },
        [router],
    );

    const openEditDialog = useCallback(
        (item: WishlistItem) => {
            setEditItem(item);
            editForm.setData({
                title: item.title,
                description: item.description || '',
                amount: item.amount ? String(item.amount / 100) : '',
                currency: item.currency || 'USD',
                url: item.url || '',
                image_url: item.image_url || '',
                quantity: item.quantity ? String(item.quantity) : '',
                goal_amount: item.goal_amount
                    ? String(item.goal_amount / 100)
                    : '',
                expires_at: item.expires_at ? item.expires_at.slice(0, 16) : '',
            });
        },
        [editForm],
    );

    const openContributorsDialog = useCallback(async (item: WishlistItem) => {
        setContributorsItem(item);
        setLoadingContributors(true);
        try {
            const response = await fetch(
                signalsWishlistRoutes.contributors.url(item.id),
            );
            const result = await response.json();
            setContributorsData(result.data || []);
        } catch (error) {
            console.error('Failed to load contributors:', error);
            setContributorsData([]);
        } finally {
            setLoadingContributors(false);
        }
    }, []);

    const activeItems = items.filter((item) => item.status === 'active');
    const fulfilledItems = items.filter((item) => item.status === 'fulfilled');
    const pendingItems = items.filter(
        (item) => !item.approved_at && item.status === 'active',
    );

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Signals', href: '/signals' },
                { title: 'Wishlist', href: '/signals/wishlist' },
            ]}
        >
            <Head title="Signals · Wishlist" />

            <div className="space-y-8 text-white">
                <header className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Wishlist Manager
                        </h1>
                        <p className="text-sm text-white/65">
                            Manage your wishlist items and track contributions.
                        </p>
                    </div>
                    <Dialog
                        open={createDialogOpen}
                        onOpenChange={setCreateDialogOpen}
                    >
                        <DialogTrigger asChild>
                            <Button className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 text-white">
                                <Plus className="mr-2 size-4" />
                                Add Item
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-black/90 text-white shadow-[0_60px_120px_-70px_rgba(249,115,22,0.75)] backdrop-blur-xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-semibold">
                                    Create Wishlist Item
                                </DialogTitle>
                                <DialogDescription className="text-sm text-white/60">
                                    Add a new item to your wishlist for
                                    supporters to contribute to.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="create-title">
                                        Title *
                                    </Label>
                                    <Input
                                        id="create-title"
                                        value={createForm.data.title}
                                        onChange={(e) =>
                                            createForm.setData(
                                                'title',
                                                e.target.value,
                                            )
                                        }
                                        className="border-white/20 bg-black/40 text-white placeholder:text-white/40"
                                        placeholder="Custom dyed jute rope set"
                                    />
                                    <InputError
                                        message={createForm.errors.title}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="create-description">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="create-description"
                                        value={createForm.data.description}
                                        onChange={(e) =>
                                            createForm.setData(
                                                'description',
                                                e.target.value,
                                            )
                                        }
                                        className="border-white/20 bg-black/40 text-white placeholder:text-white/40"
                                        placeholder="Describe what this item is for..."
                                        rows={3}
                                    />
                                    <InputError
                                        message={createForm.errors.description}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="create-crowdfunded"
                                            checked={
                                                createForm.data.is_crowdfunded
                                            }
                                            onCheckedChange={(checked) =>
                                                createForm.setData(
                                                    'is_crowdfunded',
                                                    checked === true,
                                                )
                                            }
                                        />
                                        <Label
                                            htmlFor="create-crowdfunded"
                                            className="cursor-pointer"
                                        >
                                            This is a crowdfunded item
                                        </Label>
                                    </div>
                                </div>
                                {createForm.data.is_crowdfunded ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="create-goal">
                                            Goal Amount (USD) *
                                        </Label>
                                        <Input
                                            id="create-goal"
                                            type="number"
                                            min="1"
                                            step="0.01"
                                            value={createForm.data.goal_amount}
                                            onChange={(e) =>
                                                createForm.setData(
                                                    'goal_amount',
                                                    e.target.value,
                                                )
                                            }
                                            className="border-white/20 bg-black/40 text-white placeholder:text-white/40"
                                            placeholder="100.00"
                                        />
                                        <InputError
                                            message={
                                                createForm.errors.goal_amount
                                            }
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="create-amount">
                                                    Price (USD)
                                                </Label>
                                                <Input
                                                    id="create-amount"
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    value={
                                                        createForm.data.amount
                                                    }
                                                    onChange={(e) =>
                                                        createForm.setData(
                                                            'amount',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="border-white/20 bg-black/40 text-white placeholder:text-white/40"
                                                    placeholder="95.00"
                                                />
                                                <InputError
                                                    message={
                                                        createForm.errors.amount
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="create-quantity">
                                                    Quantity *
                                                </Label>
                                                <Input
                                                    id="create-quantity"
                                                    type="number"
                                                    min="1"
                                                    value={
                                                        createForm.data.quantity
                                                    }
                                                    onChange={(e) =>
                                                        createForm.setData(
                                                            'quantity',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="border-white/20 bg-black/40 text-white placeholder:text-white/40"
                                                    placeholder="5"
                                                />
                                                <InputError
                                                    message={
                                                        createForm.errors
                                                            .quantity
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="create-image">
                                            Image URL
                                        </Label>
                                        <Input
                                            id="create-image"
                                            type="url"
                                            value={createForm.data.image_url}
                                            onChange={(e) =>
                                                createForm.setData(
                                                    'image_url',
                                                    e.target.value,
                                                )
                                            }
                                            className="border-white/20 bg-black/40 text-white placeholder:text-white/40"
                                            placeholder="https://example.com/image.jpg"
                                        />
                                        <InputError
                                            message={
                                                createForm.errors.image_url
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="create-url">
                                            Item URL
                                        </Label>
                                        <Input
                                            id="create-url"
                                            type="url"
                                            value={createForm.data.url}
                                            onChange={(e) =>
                                                createForm.setData(
                                                    'url',
                                                    e.target.value,
                                                )
                                            }
                                            className="border-white/20 bg-black/40 text-white placeholder:text-white/40"
                                            placeholder="https://example.com/item"
                                        />
                                        <InputError
                                            message={createForm.errors.url}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="create-expires">
                                        Expires At (Optional)
                                    </Label>
                                    <Input
                                        id="create-expires"
                                        type="datetime-local"
                                        value={createForm.data.expires_at}
                                        onChange={(e) =>
                                            createForm.setData(
                                                'expires_at',
                                                e.target.value,
                                            )
                                        }
                                        className="border-white/20 bg-black/40 text-white placeholder:text-white/40"
                                    />
                                    <InputError
                                        message={createForm.errors.expires_at}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setCreateDialogOpen(false)}
                                    className="border-white/20 text-white/80"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreate}
                                    disabled={createForm.processing}
                                    className="bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 text-white"
                                >
                                    {createForm.processing
                                        ? 'Creating...'
                                        : 'Create Item'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </header>

                <Tabs
                    value={selectedStatus}
                    onValueChange={setSelectedStatus}
                    className="space-y-6"
                >
                    <TabsList className="grid w-full grid-cols-3 rounded-2xl border border-white/10 bg-black/30 p-1">
                        <TabsTrigger
                            value="active"
                            className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white"
                        >
                            Active ({activeItems.length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="fulfilled"
                            className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white"
                        >
                            Fulfilled ({fulfilledItems.length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="pending"
                            className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white"
                        >
                            Pending ({pendingItems.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="active" className="space-y-4">
                        {activeItems.length === 0 ? (
                            <Card className="border-white/10 bg-white/5">
                                <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-white/70">
                                    <Gift className="size-12 text-white/30" />
                                    <p>No active wishlist items.</p>
                                    <Button
                                        onClick={() =>
                                            setCreateDialogOpen(true)
                                        }
                                        className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 text-white"
                                    >
                                        <Plus className="mr-2 size-4" />
                                        Add Your First Item
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {activeItems.map((item) => (
                                    <Card
                                        key={item.id}
                                        className="border-white/10 bg-white/5 text-white"
                                    >
                                        <CardHeader>
                                            <div className="flex items-start justify-between gap-2">
                                                <CardTitle className="text-lg font-semibold">
                                                    {item.title}
                                                </CardTitle>
                                                <Badge
                                                    className={cn(
                                                        'rounded-full border text-xs',
                                                        getStatusBadgeClass(
                                                            item.status,
                                                        ),
                                                    )}
                                                >
                                                    {item.status}
                                                </Badge>
                                            </div>
                                            {item.description && (
                                                <CardDescription className="text-white/60">
                                                    {item.description}
                                                </CardDescription>
                                            )}
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {item.image_url && (
                                                <img
                                                    src={item.image_url}
                                                    alt={item.title}
                                                    className="h-32 w-full rounded-xl border border-white/10 object-cover"
                                                />
                                            )}
                                            {item.is_crowdfunded ? (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-xs text-white/70">
                                                        <span>Progress</span>
                                                        <span>
                                                            {Math.round(
                                                                item.progress_percentage,
                                                            )}
                                                            %
                                                        </span>
                                                    </div>
                                                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-500"
                                                            style={{
                                                                width: `${Math.min(item.progress_percentage, 100)}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <p className="text-xs text-white/60">
                                                        {formatCurrency(
                                                            item.current_funding,
                                                            item.currency,
                                                        )}{' '}
                                                        of{' '}
                                                        {formatCurrency(
                                                            item.goal_amount,
                                                            item.currency,
                                                        )}{' '}
                                                        raised
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-white/70">
                                                    {item.remaining_quantity !==
                                                    null
                                                        ? `${item.remaining_quantity} ${item.remaining_quantity === 1 ? 'item' : 'items'} remaining`
                                                        : formatCurrency(
                                                              item.amount,
                                                              item.currency,
                                                          )}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap gap-2 text-xs text-white/60">
                                                <Badge className="rounded-full border-white/20 bg-white/10">
                                                    {item.purchase_count}{' '}
                                                    {item.purchase_count === 1
                                                        ? 'purchase'
                                                        : 'purchases'}
                                                </Badge>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="flex flex-wrap gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    openEditDialog(item)
                                                }
                                                className="border-white/20 text-white/80"
                                            >
                                                <Edit className="mr-1 size-3" />
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    openContributorsDialog(item)
                                                }
                                                className="border-white/20 text-white/80"
                                            >
                                                <Users className="mr-1 size-3" />
                                                Contributors
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    router.visit(
                                                        signalsWishlistRoutes.analytics.url(
                                                            item.id,
                                                        ),
                                                    )
                                                }
                                                className="border-white/20 text-white/80"
                                            >
                                                <BarChart3 className="mr-1 size-3" />
                                                Analytics
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    handleDelete(item)
                                                }
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                <Trash2 className="mr-1 size-3" />
                                                Delete
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="fulfilled" className="space-y-4">
                        {fulfilledItems.length === 0 ? (
                            <Card className="border-white/10 bg-white/5">
                                <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-white/70">
                                    <p>
                                        No fulfilled items. Renew items to make
                                        them active again.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {fulfilledItems.map((item) => (
                                    <Card
                                        key={item.id}
                                        className="border-white/10 bg-white/5 text-white"
                                    >
                                        <CardHeader>
                                            <div className="flex items-start justify-between gap-2">
                                                <CardTitle className="text-lg font-semibold">
                                                    {item.title}
                                                </CardTitle>
                                                <Badge
                                                    className={cn(
                                                        'rounded-full border text-xs',
                                                        getStatusBadgeClass(
                                                            item.status,
                                                        ),
                                                    )}
                                                >
                                                    Fulfilled
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-white/70">
                                                {item.purchase_count}{' '}
                                                {item.purchase_count === 1
                                                    ? 'purchase'
                                                    : 'purchases'}{' '}
                                                made
                                            </p>
                                        </CardContent>
                                        <CardFooter>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    handleRenew(item)
                                                }
                                                className="border-white/20 text-white/80"
                                            >
                                                <RotateCcw className="mr-1 size-3" />
                                                Renew
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="pending" className="space-y-4">
                        {pendingItems.length === 0 ? (
                            <Card className="border-white/10 bg-white/5">
                                <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-white/70">
                                    <p>No items pending approval.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {pendingItems.map((item) => (
                                    <Card
                                        key={item.id}
                                        className="border-white/10 bg-white/5 text-white"
                                    >
                                        <CardHeader>
                                            <CardTitle className="text-lg font-semibold">
                                                {item.title}
                                            </CardTitle>
                                            <CardDescription className="text-white/60">
                                                Waiting for admin approval
                                            </CardDescription>
                                        </CardHeader>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                <Card className="border-white/10 bg-white/5 text-white">
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold">
                            Analytics Overview
                        </CardTitle>
                        <CardDescription className="text-white/60">
                            Summary of your wishlist performance
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <p className="text-xs tracking-[0.3em] text-white/50 uppercase">
                                    Total Items
                                </p>
                                <p className="mt-2 text-2xl font-semibold">
                                    {analytics.total_items}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs tracking-[0.3em] text-white/50 uppercase">
                                    Total Contributions
                                </p>
                                <p className="mt-2 text-2xl font-semibold">
                                    {formatCurrency(
                                        analytics.total_contributions,
                                        'USD',
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs tracking-[0.3em] text-white/50 uppercase">
                                    Total Contributors
                                </p>
                                <p className="mt-2 text-2xl font-semibold">
                                    {analytics.total_contributors}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs tracking-[0.3em] text-white/50 uppercase">
                                    Avg Contribution
                                </p>
                                <p className="mt-2 text-2xl font-semibold">
                                    {formatCurrency(
                                        analytics.average_contribution,
                                        'USD',
                                    )}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {editItem && (
                    <Dialog
                        open={!!editItem}
                        onOpenChange={(open) => !open && setEditItem(null)}
                    >
                        <DialogContent className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-black/90 text-white shadow-[0_60px_120px_-70px_rgba(249,115,22,0.75)] backdrop-blur-xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-semibold">
                                    Edit Wishlist Item
                                </DialogTitle>
                                <DialogDescription className="text-sm text-white/60">
                                    Update your wishlist item details.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-title">Title *</Label>
                                    <Input
                                        id="edit-title"
                                        value={editForm.data.title}
                                        onChange={(e) =>
                                            editForm.setData(
                                                'title',
                                                e.target.value,
                                            )
                                        }
                                        className="border-white/20 bg-black/40 text-white placeholder:text-white/40"
                                    />
                                    <InputError
                                        message={editForm.errors.title}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-description">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="edit-description"
                                        value={editForm.data.description}
                                        onChange={(e) =>
                                            editForm.setData(
                                                'description',
                                                e.target.value,
                                            )
                                        }
                                        className="border-white/20 bg-black/40 text-white placeholder:text-white/40"
                                        rows={3}
                                    />
                                    <InputError
                                        message={editForm.errors.description}
                                    />
                                </div>
                                {editItem.is_crowdfunded ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-goal">
                                            Goal Amount (USD)
                                        </Label>
                                        <Input
                                            id="edit-goal"
                                            type="number"
                                            min="1"
                                            step="0.01"
                                            value={editForm.data.goal_amount}
                                            onChange={(e) =>
                                                editForm.setData(
                                                    'goal_amount',
                                                    e.target.value,
                                                )
                                            }
                                            className="border-white/20 bg-black/40 text-white placeholder:text-white/40"
                                        />
                                        <InputError
                                            message={
                                                editForm.errors.goal_amount
                                            }
                                        />
                                    </div>
                                ) : (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-amount">
                                                Price (USD)
                                            </Label>
                                            <Input
                                                id="edit-amount"
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                value={editForm.data.amount}
                                                onChange={(e) =>
                                                    editForm.setData(
                                                        'amount',
                                                        e.target.value,
                                                    )
                                                }
                                                className="border-white/20 bg-black/40 text-white placeholder:text-white/40"
                                            />
                                            <InputError
                                                message={editForm.errors.amount}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-quantity">
                                                Quantity
                                            </Label>
                                            <Input
                                                id="edit-quantity"
                                                type="number"
                                                min="1"
                                                value={editForm.data.quantity}
                                                onChange={(e) =>
                                                    editForm.setData(
                                                        'quantity',
                                                        e.target.value,
                                                    )
                                                }
                                                className="border-white/20 bg-black/40 text-white placeholder:text-white/40"
                                            />
                                            <InputError
                                                message={
                                                    editForm.errors.quantity
                                                }
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-image">
                                            Image URL
                                        </Label>
                                        <Input
                                            id="edit-image"
                                            type="url"
                                            value={editForm.data.image_url}
                                            onChange={(e) =>
                                                editForm.setData(
                                                    'image_url',
                                                    e.target.value,
                                                )
                                            }
                                            className="border-white/20 bg-black/40 text-white placeholder:text-white/40"
                                        />
                                        <InputError
                                            message={editForm.errors.image_url}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-url">
                                            Item URL
                                        </Label>
                                        <Input
                                            id="edit-url"
                                            type="url"
                                            value={editForm.data.url}
                                            onChange={(e) =>
                                                editForm.setData(
                                                    'url',
                                                    e.target.value,
                                                )
                                            }
                                            className="border-white/20 bg-black/40 text-white placeholder:text-white/40"
                                        />
                                        <InputError
                                            message={editForm.errors.url}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-expires">
                                        Expires At (Optional)
                                    </Label>
                                    <Input
                                        id="edit-expires"
                                        type="datetime-local"
                                        value={editForm.data.expires_at}
                                        onChange={(e) =>
                                            editForm.setData(
                                                'expires_at',
                                                e.target.value,
                                            )
                                        }
                                        className="border-white/20 bg-black/40 text-white placeholder:text-white/40"
                                    />
                                    <InputError
                                        message={editForm.errors.expires_at}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setEditItem(null)}
                                    className="border-white/20 text-white/80"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleEdit}
                                    disabled={editForm.processing}
                                    className="bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 text-white"
                                >
                                    {editForm.processing
                                        ? 'Updating...'
                                        : 'Update Item'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}

                {contributorsItem && (
                    <Dialog
                        open={!!contributorsItem}
                        onOpenChange={(open) =>
                            !open && setContributorsItem(null)
                        }
                    >
                        <DialogContent className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-black/90 text-white shadow-[0_60px_120px_-70px_rgba(249,115,22,0.75)] backdrop-blur-xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-semibold">
                                    Contributors
                                </DialogTitle>
                                <DialogDescription className="text-sm text-white/60">
                                    View all contributors for{' '}
                                    {contributorsItem.title}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3 py-4">
                                {loadingContributors ? (
                                    <p className="text-center text-white/60">
                                        Loading contributors...
                                    </p>
                                ) : contributorsData.length > 0 ? (
                                    contributorsData.map((contributor) => (
                                        <div
                                            key={contributor.buyer_id}
                                            className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-4"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 overflow-hidden rounded-full border border-white/10 bg-white/10">
                                                    {contributor.buyer_avatar ? (
                                                        <img
                                                            src={
                                                                contributor.buyer_avatar
                                                            }
                                                            alt={
                                                                contributor.buyer_name
                                                            }
                                                            className="size-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex size-full items-center justify-center text-xs text-white/60">
                                                            {contributor.buyer_name
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-white">
                                                        {contributor.buyer_name}
                                                    </p>
                                                    <p className="text-xs text-white/60">
                                                        {
                                                            contributor.contribution_count
                                                        }{' '}
                                                        {contributor.contribution_count ===
                                                        1
                                                            ? 'contribution'
                                                            : 'contributions'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-emerald-200">
                                                    {formatCurrency(
                                                        contributor.total_contributed,
                                                        'USD',
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-white/60">
                                        No contributors yet.
                                    </p>
                                )}
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setContributorsItem(null)}
                                    className="border-white/20 text-white/80"
                                >
                                    Close
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </AppLayout>
    );
}
