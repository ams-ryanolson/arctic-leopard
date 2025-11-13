<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateUserRolesRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class AdminUserController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', User::class);

        $search = trim((string) $request->string('search'));
        $roleFilter = trim((string) $request->string('role'));

        $users = User::query()
            ->with(['roles:id,name'])
            ->select(['id', 'name', 'display_name', 'username', 'email', 'created_at', 'avatar_path'])
            ->when($search !== '', static function ($query) use ($search): void {
                $query->where(static function ($builder) use ($search): void {
                    $builder->where('name', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($roleFilter !== '', static function ($query) use ($roleFilter): void {
                $query->whereHas('roles', static fn ($roleQuery) => $roleQuery->where('name', $roleFilter));
            })
            ->orderByDesc('created_at')
            ->paginate(12)
            ->withQueryString();

        $availableRoles = Role::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(static fn (Role $role) => [
                'id' => $role->getKey(),
                'name' => $role->name,
            ]);

        return Inertia::render('Admin/Users/Index', [
            'filters' => [
                'search' => $search,
                'role' => $roleFilter,
            ],
            'users' => $users->through(static function (User $user): array {
                return [
                    'id' => $user->getKey(),
                    'name' => $user->name,
                    'display_name' => $user->display_name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'avatar_url' => $user->avatar_url,
                    'created_at' => optional($user->created_at)->toIso8601String(),
                    'roles' => $user->roles->pluck('name')->all(),
                ];
            }),
            'availableRoles' => $availableRoles,
        ]);
    }

    public function update(UpdateUserRolesRequest $request, User $user): RedirectResponse
    {
        Gate::authorize('updateRoles', $user);

        $validated = $request->validated();

        $roles = collect($validated['roles'])
            ->map(static fn (string $role) => trim($role))
            ->filter()
            ->unique()
            ->values();

        if ($roles->isEmpty()) {
            $roles->push('User');
        }

        if (! $roles->contains('User') && Role::query()->where('name', 'User')->exists()) {
            $roles->push('User');
        }

        $user->syncRoles($roles->all());

        return redirect()
            ->back()
            ->with('status', [
                'type' => 'success',
                'message' => 'Roles updated successfully.',
            ]);
    }
}
