<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;
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

        // In testing, check if roles already exist to avoid redundant seeding
        // This helps when the same seeder runs multiple times in the same test suite
        if (app()->environment('testing')) {
            $superAdminExists = Role::query()->where('name', 'Super Admin')->exists();
            if ($superAdminExists) {
                return;
            }
        }

        $permissions = collect([
            'view users' => 'View user profiles and basic user information',
            'create users' => 'Create new user accounts in the system',
            'update users' => 'Update existing user account information',
            'ban users' => 'Ban or suspend user accounts',
            'manage roles' => 'Create, edit, and delete roles in the system',
            'manage permissions' => 'Create, edit, and delete permissions in the system',
            'manage users' => 'Full administrative control over user management',
            'manage settings' => 'Modify application-wide configuration settings',
            'impersonate users' => 'Impersonate other users for support purposes',
            'view system health' => 'View system health metrics and status information',
            'view system posts' => 'View system-generated posts and announcements',
            'review reports' => 'Review content reports submitted by users',
            'resolve reports' => 'Resolve and take action on content reports',
            'flag content' => 'Flag content for review or moderation',
            'remove content' => 'Remove content from the platform',
            'restore content' => 'Restore previously removed content',
            'feature content' => 'Feature content to highlight it on the platform',
            'lock comments' => 'Lock comments on posts to prevent further discussion',
            'manage ad inventory' => 'Manage advertising inventory, campaigns, and creatives',
            'create posts' => 'Create new posts on the platform',
            'publish posts' => 'Publish posts to make them visible to the audience',
            'update posts' => 'Update existing posts',
            'delete posts' => 'Delete posts from the platform',
            'pin posts' => 'Pin posts to the top of a profile or feed',
            'manage series' => 'Create and manage post series',
            'upload media' => 'Upload images, videos, and other media files',
            'manage categories' => 'Create and manage content categories',
            'send announcements' => 'Send system-wide announcements to users',
            'manage events' => 'Create, edit, and manage events',
            'manage polls' => 'Create and manage polls on posts',
            'view analytics' => 'View general analytics and statistics',
            'view creator analytics' => 'View detailed analytics for creator content performance',
            'create subscription plans' => 'Create new subscription plans for monetization',
            'update subscription plans' => 'Update existing subscription plans',
            'refund purchases' => 'Issue refunds for purchases and subscriptions',
            'manage payouts' => 'Manage creator payouts and payment processing',
            'manage discounts' => 'Create and manage discount codes and promotions',
            'receive tips' => 'Receive tips from other users',
            'send tips' => 'Send tips to creators and other users',
            'access paywalled content' => 'Access paywalled content that the user has purchased or subscribed to',
            'hide ads' => 'Hide advertisements from the user interface',
            'boost radar' => 'Boost profile visibility in Radar for increased exposure',
            'promote to admin' => 'Assign or unassign admin roles to users (Super Admin only)',
        ]);

        $permissionModels = $permissions
            ->mapWithKeys(static function (string $description, string $permission) {
                return [
                    $permission => Permission::query()->firstOrCreate([
                        'name' => $permission,
                        'guard_name' => 'web',
                    ], [
                        'description' => $description,
                    ]),
                ];
            });

        $roles = collect([
            'Super Admin' => array_merge($permissionModels->keys()->all(), ['promote to admin']),
            'Admin' => [
                'view users',
                'create users',
                'update users',
                'ban users',
                'manage roles',
                'manage permissions',
                'manage users',
                'manage settings',
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
            'Bronze' => [
                'create posts',
                'pin posts',
                'upload media',
                'manage polls',
                'view analytics',
                'send tips',
                'access paywalled content',
                'hide ads',
                'boost radar',
            ],
            'Silver' => [
                'create posts',
                'pin posts',
                'upload media',
                'manage polls',
                'view analytics',
                'send tips',
                'access paywalled content',
                'hide ads',
                'boost radar',
            ],
            'Gold' => [
                'create posts',
                'pin posts',
                'upload media',
                'manage polls',
                'view analytics',
                'send tips',
                'access paywalled content',
                'hide ads',
                'boost radar',
            ],
            'User' => [
                'create posts',
                'upload media',
                'manage polls',
                'send tips',
                'flag content',
            ],
        ]);

        // Define boost limits for each role
        $boostLimits = [
            'Super Admin' => 3,
            'Admin' => 3,
            'Moderator' => 3,
            'Creator' => 3,
            'Bronze' => 2,
            'Silver' => 2,
            'Gold' => 2,
            'User' => 1,
        ];

        $roles->each(function (array $rolePermissions, string $roleName) use ($permissionModels, $boostLimits): void {
            /** @var \Spatie\Permission\Models\Role $role */
            $role = Role::query()->firstOrCreate([
                'name' => $roleName,
                'guard_name' => 'web',
            ], [
                'boost_radar_daily_limit' => $boostLimits[$roleName] ?? 1,
            ]);

            // Update boost limit if role already exists
            if ($role->wasRecentlyCreated === false) {
                $role->update([
                    'boost_radar_daily_limit' => $boostLimits[$roleName] ?? 1,
                ]);
            }

            if ($roleName === 'Super Admin') {
                $role->syncPermissions($permissionModels->values());

                return;
            }

            $role->syncPermissions(
                $permissionModels->only($rolePermissions)->values()
            );
        });

        // Only forget cache once at the end (removed duplicate call)
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
