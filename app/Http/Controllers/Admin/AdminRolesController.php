<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ActivityType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateRolePermissionsRequest;
use App\Models\Permission;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class AdminRolesController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('manage roles');

        // Get all permissions with descriptions for the frontend
        $allPermissions = Permission::query()
            ->orderBy('name')
            ->get()
            ->map(static fn (Permission $permission) => [
                'id' => $permission->getKey(),
                'name' => $permission->name,
                'description' => $permission->description,
            ]);

        // Get all roles with their assigned permissions
        $roles = Role::query()
            ->with('permissions:id,name,description')
            ->get()
            ->map(static function (Role $role) {
                return [
                    'id' => $role->getKey(),
                    'name' => $role->name,
                    'permission_ids' => $role->permissions->pluck('id')->toArray(),
                    'permissions' => $role->permissions->map(static fn ($permission) => [
                        'id' => $permission->getKey(),
                        'name' => $permission->name,
                        'description' => $permission->description,
                    ])->sortBy('name')->values(),
                    'permission_count' => $role->permissions->count(),
                ];
            })
            ->sortByDesc(function ($role) {
                // Sort by permission count, but Super Admin always first
                if ($role['name'] === 'Super Admin') {
                    return PHP_INT_MAX;
                }

                return $role['permission_count'];
            })
            ->values();

        return Inertia::render('Admin/Roles/Index', [
            'roles' => $roles,
            'allPermissions' => $allPermissions,
        ]);
    }

    public function update(UpdateRolePermissionsRequest $request, Role $role): RedirectResponse
    {
        Gate::authorize('manage roles');

        // Prevent modifying Super Admin role
        if ($role->name === 'Super Admin') {
            return redirect()->back()->withErrors(['role' => 'Cannot modify Super Admin role permissions']);
        }

        $permissionIds = $request->validated()['permissions'];
        $permissions = Permission::query()->whereIn('id', $permissionIds)->get();

        // Capture old permissions before sync
        $oldPermissionIds = $role->permissions->pluck('id')->toArray();
        $added = array_diff($permissionIds, $oldPermissionIds);
        $removed = array_diff($oldPermissionIds, $permissionIds);

        $role->syncPermissions($permissions);

        // Clear permission cache
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        // Log the activity
        app(ActivityLogService::class)->log(
            ActivityType::RolePermissionsChanged,
            "Permissions changed for role: {$role->name}",
            $role,
            $request->user(),
            [
                'role_id' => $role->id,
                'role_name' => $role->name,
                'added_permissions' => Permission::whereIn('id', $added)->pluck('name')->toArray(),
                'removed_permissions' => Permission::whereIn('id', $removed)->pluck('name')->toArray(),
            ],
            $request
        );

        return redirect()->back()->with('success', 'Role permissions updated successfully');
    }
}
