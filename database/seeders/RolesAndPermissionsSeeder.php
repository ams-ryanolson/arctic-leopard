<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Seed the baseline roles and permissions used across the application.
     */
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = collect([
            'view users',
            'create users',
            'update users',
            'ban users',
            'manage roles',
            'manage permissions',
            'impersonate users',
            'view system health',
            'view system posts',
            'review reports',
            'resolve reports',
            'flag content',
            'remove content',
            'restore content',
            'feature content',
            'lock comments',
            'manage ad inventory',
            'create posts',
            'publish posts',
            'update posts',
            'delete posts',
            'pin posts',
            'manage series',
            'upload media',
            'manage categories',
            'send announcements',
            'manage events',
            'manage polls',
            'view analytics',
            'view creator analytics',
            'create subscription plans',
            'update subscription plans',
            'refund purchases',
            'manage payouts',
            'manage discounts',
            'receive tips',
            'send tips',
            'access paywalled content',
            'hide ads',
        ]);

        $permissionModels = $permissions
            ->mapWithKeys(static fn (string $permission): array => [
                $permission => Permission::query()->firstOrCreate([
                    'name' => $permission,
                    'guard_name' => 'web',
                ]),
            ]);

        $roles = collect([
            'Super Admin' => $permissionModels->keys()->all(),
            'Admin' => [
                'view users',
                'create users',
                'update users',
                'ban users',
                'manage roles',
                'manage permissions',
                'impersonate users',
                'view system health',
                'view system posts',
                'review reports',
                'resolve reports',
                'flag content',
                'remove content',
                'restore content',
                'feature content',
                'lock comments',
                'manage ad inventory',
                'create posts',
                'publish posts',
                'update posts',
                'delete posts',
                'pin posts',
                'manage series',
                'upload media',
                'manage categories',
                'send announcements',
                'manage events',
                'manage polls',
                'view analytics',
                'view creator analytics',
                'create subscription plans',
                'update subscription plans',
                'refund purchases',
                'manage payouts',
                'manage discounts',
                'receive tips',
                'send tips',
                'access paywalled content',
                'hide ads',
            ],
            'Moderator' => [
                'view users',
                'update users',
                'ban users',
                'review reports',
                'resolve reports',
                'flag content',
                'remove content',
                'restore content',
                'feature content',
                'lock comments',
                'manage polls',
            ],
            'Creator' => [
                'create posts',
                'publish posts',
                'update posts',
                'delete posts',
                'pin posts',
                'manage series',
                'upload media',
                'manage categories',
                'manage events',
                'manage polls',
                'view analytics',
                'view creator analytics',
                'create subscription plans',
                'update subscription plans',
                'manage discounts',
                'receive tips',
                'send tips',
                'access paywalled content',
            ],
            'Premium' => [
                'create posts',
                'pin posts',
                'upload media',
                'manage polls',
                'view analytics',
                'send tips',
                'access paywalled content',
                'hide ads',
            ],
            'User' => [
                'create posts',
                'upload media',
                'manage polls',
                'send tips',
                'flag content',
            ],
        ]);

        $roles->each(function (array $rolePermissions, string $roleName) use ($permissionModels): void {
            /** @var \Spatie\Permission\Models\Role $role */
            $role = Role::query()->firstOrCreate([
                'name' => $roleName,
                'guard_name' => 'web',
            ]);

            if ($roleName === 'Super Admin') {
                $role->syncPermissions($permissionModels->values());

                return;
            }

            $role->syncPermissions(
                $permissionModels->only($rolePermissions)->values()
            );
        });

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
