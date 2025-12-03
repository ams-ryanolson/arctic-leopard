import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import adminRoutes from '@/routes/admin';
import { Head, router } from '@inertiajs/react';
import {
    Bookmark,
    CalendarRange,
    Gift,
    ImageIcon,
    Loader2,
    Megaphone,
    MessageCircle,
    Plus,
    Radar,
    Search,
    Sparkles,
    ToggleLeft,
    Trash2,
    Users,
    Video,
} from 'lucide-react';
import { useState } from 'react';

type Feature = {
    key: string;
    name: string;
    description: string;
    icon: string;
    enabled: boolean;
    hasGlobalOverride: boolean;
};

type UserOverride = {
    id: number;
    email: string;
    name: string;
    enabled: boolean;
};

type AdminFeatureFlagsIndexProps = {
    featureFlags: Feature[];
};

const iconMap: Record<string, any> = {
    Megaphone,
    Radar,
    Sparkles,
    Gift,
    Video,
    MessageCircle,
    CalendarRange,
    Bookmark,
    Users,
    ImageIcon,
    ToggleLeft,
};

export default function AdminFeatureFlagsIndex({
    featureFlags: initialFeatures,
}: AdminFeatureFlagsIndexProps) {
    const [features, setFeatures] = useState(initialFeatures);
    const [selectedFeature, setSelectedFeature] = useState<Feature | null>(
        null,
    );
    const [userOverrides, setUserOverrides] = useState<UserOverride[]>([]);
    const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
    const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserOverride[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isToggling, setIsToggling] = useState<string | null>(null);
    const [isTogglingUser, setIsTogglingUser] = useState<string | null>(null);

    const loadUserOverrides = async (featureKey: string) => {
        try {
            const response = await fetch(`/admin/features/${featureKey}/users`);
            const data = await response.json();
            setUserOverrides(data.overrides || []);
        } catch (error) {
            console.error('Failed to load user overrides:', error);
        }
    };

    const handleFeatureToggle = async (feature: Feature, enabled: boolean) => {
        setIsToggling(feature.key);
        try {
            await router.post(
                `/admin/features/${feature.key}/toggle`,
                { enabled },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setFeatures((prev) =>
                            prev.map((f) =>
                                f.key === feature.key
                                    ? { ...f, enabled, hasGlobalOverride: true }
                                    : f,
                            ),
                        );
                    },
                },
            );
        } catch (error) {
            console.error('Failed to toggle feature:', error);
        } finally {
            setIsToggling(null);
        }
    };

    const handleUserSearch = async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(
                `/admin/features/users/search?query=${encodeURIComponent(query)}`,
            );
            const data = await response.json();
            setSearchResults(data.users || []);
        } catch (error) {
            console.error('Failed to search users:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleToggleUserFeature = async (
        userId: number,
        enabled: boolean,
    ) => {
        if (!selectedFeature) {
            return;
        }

        setIsTogglingUser(`${selectedFeature.key}-${userId}`);
        try {
            const response = await fetch(
                `/admin/features/${selectedFeature.key}/users/toggle`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') || '',
                        'X-Requested-With': 'XMLHttpRequest',
                        Accept: 'application/json',
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({ user_id: userId, enabled }),
                },
            );

            if (response.ok) {
                const _data = await response.json();
                // Refresh the user overrides list
                await loadUserOverrides(selectedFeature.key);
                setIsSearchDialogOpen(false);
                setSearchQuery('');
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Failed to toggle user feature:', error);
        } finally {
            setIsTogglingUser(null);
        }
    };

    const handleRemoveUserOverride = async (userId: number) => {
        if (!selectedFeature) {
            return;
        }

        try {
            const response = await fetch(
                `/admin/features/${selectedFeature.key}/users`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') || '',
                        'X-Requested-With': 'XMLHttpRequest',
                        Accept: 'application/json',
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({ user_id: userId }),
                },
            );

            if (response.ok) {
                await loadUserOverrides(selectedFeature.key);
            }
        } catch (error) {
            console.error('Failed to remove user override:', error);
        }
    };

    const openUserDialog = (feature: Feature) => {
        setSelectedFeature(feature);
        setIsUserDialogOpen(true);
        loadUserOverrides(feature.key);
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Admin', href: adminRoutes.dashboard().url },
                { title: 'Feature Flags', href: '/admin/features' },
            ]}
        >
            <Head title="Feature Flags · Admin" />

            <div className="space-y-8 text-white">
                <header>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Feature Flags
                    </h1>
                    <p className="text-sm text-white/70">
                        Manage global feature flags and assign features to
                        specific users for testing.
                    </p>
                </header>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature) => {
                        const Icon = iconMap[feature.icon] || ToggleLeft;

                        return (
                            <Card
                                key={feature.key}
                                className="border-white/10 bg-white/5"
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                                                <Icon className="h-5 w-5 text-white/70" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">
                                                    {feature.name}
                                                </CardTitle>
                                                <CardDescription className="text-xs text-white/50">
                                                    {feature.key}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isToggling === feature.key ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-white/50" />
                                            ) : (
                                                <Checkbox
                                                    checked={feature.enabled}
                                                    onCheckedChange={(
                                                        checked,
                                                    ) =>
                                                        handleFeatureToggle(
                                                            feature,
                                                            checked === true,
                                                        )
                                                    }
                                                    className="border-white/20 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="mb-4 text-sm text-white/60">
                                        {feature.description}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                openUserDialog(feature)
                                            }
                                            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                                        >
                                            <Users className="mr-2 h-4 w-4" />
                                            Manage Users
                                        </Button>
                                        {feature.enabled && (
                                            <Badge
                                                variant="outline"
                                                className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                                            >
                                                Enabled
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* User Overrides Dialog */}
                <Dialog
                    open={isUserDialogOpen}
                    onOpenChange={setIsUserDialogOpen}
                >
                    <DialogContent className="max-w-2xl border-white/10 bg-[#0a0a0a] text-white">
                        <DialogHeader>
                            <DialogTitle>
                                {selectedFeature?.name} - User Overrides
                            </DialogTitle>
                            <DialogDescription className="text-white/60">
                                Assign this feature to specific users for
                                testing. User-specific settings override the
                                global setting.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-white/90">
                                        Global Setting
                                    </Label>
                                    <p className="text-xs text-white/50">
                                        {selectedFeature?.enabled
                                            ? 'Enabled globally'
                                            : 'Disabled globally'}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsSearchDialogOpen(true)}
                                    className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add User
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-white/90">
                                    User-Specific Overrides (
                                    {userOverrides.length})
                                </Label>
                                {userOverrides.length === 0 ? (
                                    <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center text-sm text-white/50">
                                        No user-specific overrides. Users will
                                        use the global setting.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {userOverrides.map((override) => (
                                            <div
                                                key={override.id}
                                                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage
                                                            src={undefined}
                                                        />
                                                        <AvatarFallback className="bg-white/10 text-xs">
                                                            {(
                                                                override.name ||
                                                                override.email
                                                            )
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">
                                                            {override.name ||
                                                                override.email}
                                                        </p>
                                                        <p className="text-xs text-white/50">
                                                            {override.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant={
                                                            override.enabled
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                        className={
                                                            override.enabled
                                                                ? 'bg-emerald-400/20 text-emerald-200'
                                                                : 'bg-red-400/20 text-red-200'
                                                        }
                                                    >
                                                        {override.enabled
                                                            ? 'Enabled'
                                                            : 'Disabled'}
                                                    </Badge>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleRemoveUserOverride(
                                                                override.id,
                                                            )
                                                        }
                                                        className="text-white/50 hover:bg-white/10 hover:text-white"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setIsUserDialogOpen(false)}
                                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                            >
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* User Search Dialog */}
                <Dialog
                    open={isSearchDialogOpen}
                    onOpenChange={setIsSearchDialogOpen}
                >
                    <DialogContent className="border-white/10 bg-[#0a0a0a] text-white">
                        <DialogHeader>
                            <DialogTitle>Add User Override</DialogTitle>
                            <DialogDescription className="text-white/60">
                                Search for a user to assign this feature to.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/50" />
                                <Input
                                    placeholder="Search by email or name..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        handleUserSearch(e.target.value);
                                    }}
                                    className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/50"
                                />
                            </div>

                            {isSearching && (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="h-5 w-5 animate-spin text-white/50" />
                                </div>
                            )}

                            {!isSearching && searchResults.length > 0 && (
                                <div className="max-h-60 space-y-2 overflow-y-auto">
                                    {searchResults.map((user) => (
                                        <div
                                            key={user.id}
                                            className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage
                                                        src={undefined}
                                                    />
                                                    <AvatarFallback className="bg-white/10 text-xs">
                                                        {user.name
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium text-white">
                                                        {user.name}
                                                    </p>
                                                    <p className="text-xs text-white/50">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleToggleUserFeature(
                                                            user.id,
                                                            true,
                                                        )
                                                    }
                                                    disabled={
                                                        isTogglingUser ===
                                                        `${selectedFeature?.key}-${user.id}`
                                                    }
                                                    className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20"
                                                >
                                                    {isTogglingUser ===
                                                    `${selectedFeature?.key}-${user.id}` ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        'Enable'
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleToggleUserFeature(
                                                            user.id,
                                                            false,
                                                        )
                                                    }
                                                    disabled={
                                                        isTogglingUser ===
                                                        `${selectedFeature?.key}-${user.id}`
                                                    }
                                                    className="border-red-400/30 bg-red-400/10 text-red-200 hover:bg-red-400/20"
                                                >
                                                    {isTogglingUser ===
                                                    `${selectedFeature?.key}-${user.id}` ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        'Disable'
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!isSearching &&
                                searchQuery.length >= 2 &&
                                searchResults.length === 0 && (
                                    <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center text-sm text-white/50">
                                        No users found
                                    </div>
                                )}
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsSearchDialogOpen(false);
                                    setSearchQuery('');
                                    setSearchResults([]);
                                }}
                                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                            >
                                Cancel
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
