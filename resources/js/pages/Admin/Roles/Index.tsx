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
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import adminRoutes from '@/routes/admin';
import { Head, router } from '@inertiajs/react';
import { ChevronDown, Loader2, Plus, Save, Shield, ShieldCheck } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

type Permission = {
    id: number;
    name: string;
    description: string | null;
};

type Role = {
    id: number;
    name: string;
    boost_radar_daily_limit: number;
    permission_ids: number[];
    permissions: Permission[];
    permission_count: number;
};

type AdminRolesIndexProps = {
    roles: Role[];
    allPermissions: Permission[];
};

// Group permissions by category for better organization
const categorizePermission = (name: string): string => {
    if (
        name.includes('user') ||
        name.includes('admin') ||
        name.includes('role') ||
        name.includes('permission')
    ) {
        return 'User & Access Management';
    }
    if (
        name.includes('post') ||
        name.includes('content') ||
        name.includes('media') ||
        name.includes('series')
    ) {
        return 'Content Management';
    }
    if (
        name.includes('report') ||
        name.includes('flag') ||
        name.includes('remove') ||
        name.includes('restore') ||
        name.includes('feature') ||
        name.includes('lock')
    ) {
        return 'Moderation';
    }
    if (
        name.includes('event') ||
        name.includes('poll') ||
        name.includes('category') ||
        name.includes('announcement')
    ) {
        return 'Community Features';
    }
    if (
        name.includes('analytics') ||
        name.includes('health') ||
        name.includes('system')
    ) {
        return 'Analytics & System';
    }
    if (
        name.includes('subscription') ||
        name.includes('payout') ||
        name.includes('refund') ||
        name.includes('discount') ||
        name.includes('tip') ||
        name.includes('purchase')
    ) {
        return 'Payments & Monetization';
    }
    if (
        name.includes('ad') ||
        name.includes('inventory') ||
        name.includes('campaign')
    ) {
        return 'Advertising';
    }
    return 'Other';
};

export default function AdminRolesIndex({
    roles,
    allPermissions,
}: AdminRolesIndexProps) {
    const [openRoles, setOpenRoles] = useState<Record<number, boolean>>({});
    const [selectedPermissions, setSelectedPermissions] = useState<
        Record<number, number[]>
    >(() => {
        const initial: Record<number, number[]> = {};
        roles.forEach((role) => {
            initial[role.id] = [...role.permission_ids];
        });
        return initial;
    });
    const [processing, setProcessing] = useState<Record<number, boolean>>({});
    const [hasChanges, setHasChanges] = useState<Record<number, boolean>>({});
    const [boostLimits, setBoostLimits] = useState<Record<number, number>>(() => {
        const initial: Record<number, number> = {};
        roles.forEach((role) => {
            initial[role.id] = role.boost_radar_daily_limit ?? 1;
        });
        return initial;
    });
    const [createRoleOpen, setCreateRoleOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [creatingRole, setCreatingRole] = useState(false);

    // Group permissions by category
    const groupedPermissions = useMemo(() => {
        const groups: Record<string, Permission[]> = {};
        allPermissions.forEach((permission) => {
            const category = categorizePermission(permission.name);
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(permission);
        });
        // Sort categories and permissions within each category
        return Object.keys(groups)
            .sort()
            .reduce(
                (acc, key) => {
                    acc[key] = groups[key].sort((a, b) =>
                        a.name.localeCompare(b.name),
                    );
                    return acc;
                },
                {} as Record<string, Permission[]>,
            );
    }, [allPermissions]);

    const toggleRole = (roleId: number) => {
        setOpenRoles((prev) => ({
            ...prev,
            [roleId]: !prev[roleId],
        }));
    };

    const togglePermission = (roleId: number, permissionId: number) => {
        setSelectedPermissions((prev) => {
            const current = prev[roleId] || [];
            const newPermissions = current.includes(permissionId)
                ? current.filter((id) => id !== permissionId)
                : [...current, permissionId];

            // Check if there are changes
            const originalPermissions =
                roles.find((r) => r.id === roleId)?.permission_ids || [];
            const hasChanged =
                newPermissions.length !== originalPermissions.length ||
                !newPermissions.every((id) =>
                    originalPermissions.includes(id),
                ) ||
                !originalPermissions.every((id) => newPermissions.includes(id));

            setHasChanges((prev) => ({
                ...prev,
                [roleId]: hasChanged,
            }));

            return {
                ...prev,
                [roleId]: newPermissions,
            };
        });
    };

    const handleSubmit = (
        e: FormEvent<HTMLFormElement>,
        roleId: number,
        roleName: string,
    ) => {
        e.preventDefault();

        if (roleName === 'Super Admin') {
            return;
        }

        if (processing[roleId]) {
            return;
        }

        setProcessing((prev) => ({ ...prev, [roleId]: true }));

        router.patch(
            adminRoutes.roles.update({ role: roleId }).url,
            {
                permissions: selectedPermissions[roleId] || [],
                boost_radar_daily_limit: boostLimits[roleId] ?? 1,
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessing((prev) => ({ ...prev, [roleId]: false }));
                    setHasChanges((prev) => ({ ...prev, [roleId]: false }));
                },
            },
        );
    };

    const handleCreateRole = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (creatingRole || !newRoleName.trim()) {
            return;
        }

        setCreatingRole(true);

        router.post(
            adminRoutes.roles.store().url,
            {
                name: newRoleName.trim(),
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setCreatingRole(false);
                    setCreateRoleOpen(false);
                    setNewRoleName('');
                },
            },
        );
    };

    return (
        <AppLayout>
            <Head title="Admin · Roles" />

            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-white">
                            Roles & Permissions
                        </h1>
                        <p className="text-sm text-white/60">
                            Manage roles and their associated permissions. Click on
                            a role to view and edit its permissions.
                        </p>
                    </div>
                    <Button
                        onClick={() => setCreateRoleOpen(true)}
                        variant="default"
                        size="default"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Role
                    </Button>
                </div>

                <div className="space-y-3">
                    {roles.map((role) => {
                        const isOpen = openRoles[role.id] || false;
                        const isSuperAdmin = role.name === 'Super Admin';
                        const isProcessing = processing[role.id] || false;
                        const hasChangesForRole = hasChanges[role.id] || false;
                        const rolePermissions =
                            selectedPermissions[role.id] || [];

                        return (
                            <Collapsible
                                key={role.id}
                                open={isOpen}
                                onOpenChange={() => toggleRole(role.id)}
                            >
                                <Card className="border-white/10 bg-gradient-to-br from-black/40 via-black/30 to-black/40 shadow-lg">
                                    <CollapsibleTrigger asChild>
                                        <CardHeader className="cursor-pointer rounded-t-lg transition-all duration-200 hover:bg-white/5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                                                            isSuperAdmin
                                                                ? 'border border-amber-400/30 bg-amber-500/20'
                                                                : role.name ===
                                                                    'Admin'
                                                                  ? 'border border-blue-400/30 bg-blue-500/20'
                                                                  : 'border border-white/10 bg-white/5'
                                                        }`}
                                                    >
                                                        {isSuperAdmin ||
                                                        role.name ===
                                                            'Admin' ? (
                                                            <ShieldCheck
                                                                className={`h-6 w-6 ${
                                                                    isSuperAdmin
                                                                        ? 'text-amber-400'
                                                                        : 'text-blue-400'
                                                                }`}
                                                            />
                                                        ) : (
                                                            <Shield className="h-6 w-6 text-white/60" />
                                                        )}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <CardTitle className="text-lg font-semibold text-white">
                                                                {role.name}
                                                            </CardTitle>
                                                            {isSuperAdmin && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-amber-400/50 bg-amber-400/10 text-xs text-amber-300"
                                                                >
                                                                    Protected
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <CardDescription className="text-sm text-white/60">
                                                            <span className="font-medium text-white/80">
                                                                {
                                                                    role.permission_count
                                                                }
                                                            </span>{' '}
                                                            permission
                                                            {role.permission_count !==
                                                            1
                                                                ? 's'
                                                                : ''}{' '}
                                                            assigned
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {hasChangesForRole &&
                                                        !isSuperAdmin && (
                                                            <Badge
                                                                variant="outline"
                                                                className="animate-pulse border-amber-400/50 bg-amber-400/10 text-amber-300"
                                                            >
                                                                Unsaved changes
                                                            </Badge>
                                                        )}
                                                    <ChevronDown
                                                        className={`h-5 w-5 text-white/40 transition-all duration-200 ${
                                                            isOpen
                                                                ? 'rotate-180 transform text-white/60'
                                                                : ''
                                                        }`}
                                                    />
                                                </div>
                                            </div>
                                        </CardHeader>
                                    </CollapsibleTrigger>

                                    <CollapsibleContent>
                                        <CardContent className="pt-6">
                                            {isSuperAdmin ? (
                                                <div className="rounded-xl border border-amber-400/20 bg-gradient-to-br from-amber-400/10 to-amber-400/5 p-6">
                                                    <div className="flex items-start gap-3">
                                                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                                                        <div className="space-y-2">
                                                            <p className="font-medium text-amber-200">
                                                                Super Admin Role
                                                                Protected
                                                            </p>
                                                            <p className="text-sm leading-relaxed text-amber-200/80">
                                                                This role cannot
                                                                be modified.
                                                                Super Admin has
                                                                all permissions
                                                                by default,
                                                                including the
                                                                exclusive
                                                                ability to
                                                                promote users to
                                                                admin roles.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <form
                                                    onSubmit={(e) =>
                                                        handleSubmit(
                                                            e,
                                                            role.id,
                                                            role.name,
                                                        )
                                                    }
                                                >
                                                    <div className="space-y-6">
                                                        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                                                            <div className="mb-6 space-y-1">
                                                                <p className="text-sm font-medium text-white">
                                                                    Select
                                                                    permissions
                                                                    for this
                                                                    role
                                                                </p>
                                                                <p className="text-xs text-white/60">
                                                                    Each
                                                                    permission
                                                                    includes a
                                                                    description
                                                                    to clarify
                                                                    its purpose
                                                                    and scope.
                                                                </p>
                                                            </div>

                                                            <div className="max-h-[700px] space-y-6 overflow-y-auto pr-2">
                                                                {Object.entries(
                                                                    groupedPermissions,
                                                                ).map(
                                                                    ([
                                                                        category,
                                                                        permissions,
                                                                    ]) => {
                                                                        const categoryPermissions =
                                                                            permissions.filter(
                                                                                (
                                                                                    p,
                                                                                ) =>
                                                                                    allPermissions.some(
                                                                                        (
                                                                                            ap,
                                                                                        ) =>
                                                                                            ap.id ===
                                                                                            p.id,
                                                                                    ),
                                                                            );
                                                                        if (
                                                                            categoryPermissions.length ===
                                                                            0
                                                                        ) {
                                                                            return null;
                                                                        }

                                                                        return (
                                                                            <div
                                                                                key={
                                                                                    category
                                                                                }
                                                                                className="space-y-3"
                                                                            >
                                                                                <div className="flex items-center gap-2">
                                                                                    <Separator className="flex-1 bg-white/10" />
                                                                                    <span className="px-2 text-xs font-semibold tracking-wider text-white/50 uppercase">
                                                                                        {
                                                                                            category
                                                                                        }
                                                                                    </span>
                                                                                    <Separator className="flex-1 bg-white/10" />
                                                                                </div>
                                                                                <div className="grid gap-2 md:grid-cols-2">
                                                                                    {categoryPermissions.map(
                                                                                        (
                                                                                            permission,
                                                                                        ) => {
                                                                                            const isChecked =
                                                                                                rolePermissions.includes(
                                                                                                    permission.id,
                                                                                                );

                                                                                            return (
                                                                                                <div
                                                                                                    key={
                                                                                                        permission.id
                                                                                                    }
                                                                                                    className={`group flex items-start gap-3 rounded-lg border p-3 transition-all ${
                                                                                                        isChecked
                                                                                                            ? 'border-blue-400/30 bg-blue-500/10'
                                                                                                            : 'border-white/10 bg-black/25 hover:border-white/20 hover:bg-white/5'
                                                                                                    }`}
                                                                                                >
                                                                                                    <Checkbox
                                                                                                        id={`role-${role.id}-permission-${permission.id}`}
                                                                                                        checked={
                                                                                                            isChecked
                                                                                                        }
                                                                                                        onCheckedChange={() =>
                                                                                                            togglePermission(
                                                                                                                role.id,
                                                                                                                permission.id,
                                                                                                            )
                                                                                                        }
                                                                                                        className="mt-0.5 shrink-0"
                                                                                                    />
                                                                                                    <div className="min-w-0 flex-1 space-y-1">
                                                                                                        <Label
                                                                                                            htmlFor={`role-${role.id}-permission-${permission.id}`}
                                                                                                            className={`cursor-pointer text-sm leading-tight font-medium ${
                                                                                                                isChecked
                                                                                                                    ? 'text-blue-200'
                                                                                                                    : 'text-white'
                                                                                                            }`}
                                                                                                        >
                                                                                                            {
                                                                                                                permission.name
                                                                                                            }
                                                                                                        </Label>
                                                                                                        {permission.description && (
                                                                                                            <p className="text-xs leading-relaxed text-white/60">
                                                                                                                {
                                                                                                                    permission.description
                                                                                                                }
                                                                                                            </p>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                            );
                                                                                        },
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    },
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                                                            <div className="mb-4 space-y-1">
                                                                <Label
                                                                    htmlFor={`boost-limit-${role.id}`}
                                                                    className="text-sm font-medium text-white"
                                                                >
                                                                    Radar Boost Daily Limit
                                                                </Label>
                                                                <p className="text-xs text-white/60">
                                                                    Maximum number of Radar boosts
                                                                    users with this role can use per
                                                                    day. Users need the "boost radar"
                                                                    permission to boost.
                                                                </p>
                                                            </div>
                                                            <Input
                                                                id={`boost-limit-${role.id}`}
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                value={boostLimits[role.id] ?? 1}
                                                                onChange={(e) => {
                                                                    const newLimit = parseInt(
                                                                        e.target.value,
                                                                        10,
                                                                    ) || 0;
                                                                    setBoostLimits((prev) => ({
                                                                        ...prev,
                                                                        [role.id]: newLimit,
                                                                    }));
                                                                    const originalLimit =
                                                                        roles.find(
                                                                            (r) =>
                                                                                r.id ===
                                                                                role.id,
                                                                        )
                                                                            ?.boost_radar_daily_limit ??
                                                                        1;
                                                                    const originalPermissions =
                                                                        roles.find(
                                                                            (r) =>
                                                                                r.id ===
                                                                                role.id,
                                                                        )
                                                                            ?.permission_ids ||
                                                                        [];
                                                                    const currentPermissions =
                                                                        selectedPermissions[
                                                                            role.id
                                                                        ] || [];
                                                                    const permissionsChanged =
                                                                        currentPermissions.length !==
                                                                            originalPermissions.length ||
                                                                        !currentPermissions.every(
                                                                            (id) =>
                                                                                originalPermissions.includes(
                                                                                    id,
                                                                                ),
                                                                        ) ||
                                                                        !originalPermissions.every(
                                                                            (id) =>
                                                                                currentPermissions.includes(
                                                                                    id,
                                                                                ),
                                                                        );
                                                                    setHasChanges((prev) => ({
                                                                        ...prev,
                                                                        [role.id]:
                                                                            newLimit !==
                                                                                originalLimit ||
                                                                            permissionsChanged,
                                                                    }));
                                                                }}
                                                                className="max-w-[200px] bg-black/25"
                                                            />
                                                        </div>

                                                        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                                                            <div className="text-sm text-white/60">
                                                                <span className="font-medium text-white/80">
                                                                    {
                                                                        rolePermissions.length
                                                                    }
                                                                </span>{' '}
                                                                of{' '}
                                                                {
                                                                    allPermissions.length
                                                                }{' '}
                                                                permissions
                                                                selected
                                                            </div>
                                                            <Button
                                                                type="submit"
                                                                disabled={
                                                                    isProcessing ||
                                                                    !hasChangesForRole
                                                                }
                                                                variant="default"
                                                                size="default"
                                                                className="min-w-[140px]"
                                                            >
                                                                {isProcessing ? (
                                                                    <>
                                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                        Saving...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Save className="mr-2 h-4 w-4" />
                                                                        Save
                                                                        Changes
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </form>
                                            )}
                                        </CardContent>
                                    </CollapsibleContent>
                                </Card>
                            </Collapsible>
                        );
                    })}
                </div>

                <Dialog open={createRoleOpen} onOpenChange={setCreateRoleOpen}>
                    <DialogContent className="bg-gradient-to-br from-black/40 via-black/30 to-black/40 border-white/10">
                        <DialogHeader>
                            <DialogTitle className="text-white">
                                Create New Role
                            </DialogTitle>
                            <DialogDescription className="text-white/60">
                                Create a new role to organize permissions. Once
                                created, you can assign permissions and configure
                                settings for this role.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateRole}>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="role-name"
                                        className="text-white"
                                    >
                                        Role Name
                                    </Label>
                                    <Input
                                        id="role-name"
                                        value={newRoleName}
                                        onChange={(e) =>
                                            setNewRoleName(e.target.value)
                                        }
                                        placeholder="e.g., Gold, Silver, Bronze"
                                        className="bg-black/25 border-white/10 text-white placeholder:text-white/40"
                                        required
                                        autoFocus
                                    />
                                    <p className="text-xs text-white/60">
                                        Choose a descriptive name for this role.
                                        This cannot be changed after creation.
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setCreateRoleOpen(false);
                                        setNewRoleName('');
                                    }}
                                    disabled={creatingRole}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={creatingRole || !newRoleName.trim()}
                                >
                                    {creatingRole ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create Role
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
