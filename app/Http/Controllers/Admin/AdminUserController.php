<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BanUserRequest;
use App\Http\Requests\Admin\GrantFreeMembershipRequest;
use App\Http\Requests\Admin\SuspendUserRequest;
use App\Http\Requests\Admin\UpdateUserRolesRequest;
use App\Http\Requests\Admin\WarnUserRequest;
use App\Models\Memberships\MembershipPlan;
use App\Models\User;
use App\Services\Memberships\MembershipService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class AdminUserController extends Controller
{
    public function __construct(
        private readonly MembershipService $membershipService
    ) {}

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', User::class);

        $search = trim((string) $request->string('search'));
        $roleFilter = trim((string) $request->string('role'));

        $users = User::query()
            ->with(['roles:id,name', 'latestVerification'])
            ->select(['id', 'name', 'display_name', 'username', 'email', 'created_at', 'avatar_path', 'suspended_at', 'suspended_until', 'banned_at'])
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

        $membershipPlans = MembershipPlan::query()
            ->active()
            ->orderBy('display_order')
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->map(static fn (MembershipPlan $plan) => [
                'id' => $plan->id,
                'name' => $plan->name,
                'slug' => $plan->slug,
            ]);

        return Inertia::render('Admin/Users/Index', [
            'filters' => [
                'search' => $search,
                'role' => $roleFilter,
            ],
            'users' => $users->through(static function (User $user): array {
                $latest = $user->latestVerification;

                return [
                    'id' => $user->getKey(),
                    'name' => $user->name,
                    'display_name' => $user->display_name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'avatar_url' => $user->avatar_url,
                    'created_at' => optional($user->created_at)->toIso8601String(),
                    'roles' => $user->roles->pluck('name')->all(),
                    'is_suspended' => $user->isSuspended(),
                    'is_banned' => $user->isBanned(),
                    'suspended_until' => optional($user->suspended_until)?->toIso8601String(),
                    'verification' => $latest ? [
                        'status' => $latest->status->value,
                        'verified_at' => $latest->verified_at?->toIso8601String(),
                        'expires_at' => $latest->expires_at?->toIso8601String(),
                        'renewal_required_at' => $latest->renewal_required_at?->toIso8601String(),
                        'is_expired' => $latest->isExpired(),
                        'is_in_grace_period' => $latest->isInGracePeriod(),
                        'needs_renewal' => $latest->needsRenewal(),
                    ] : null,
                ];
            }),
            'availableRoles' => $availableRoles,
            'membershipPlans' => $membershipPlans,
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

    public function suspend(SuspendUserRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();
        $admin = $request->user();

        $user->suspend(
            until: isset($validated['suspended_until']) ? Carbon::parse($validated['suspended_until']) : null,
            reason: $validated['reason'] ?? null,
            admin: $admin
        );

        return redirect()
            ->back()
            ->with('status', [
                'type' => 'success',
                'message' => 'User suspended successfully.',
            ]);
    }

    public function unsuspend(Request $request, User $user): RedirectResponse
    {
        Gate::authorize('unsuspend', $user);

        $user->unsuspend();

        return redirect()
            ->back()
            ->with('status', [
                'type' => 'success',
                'message' => 'User unsuspended successfully.',
            ]);
    }

    public function ban(BanUserRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();
        $admin = $request->user();

        $user->ban(
            reason: $validated['reason'],
            admin: $admin
        );

        return redirect()
            ->back()
            ->with('status', [
                'type' => 'success',
                'message' => 'User banned successfully.',
            ]);
    }

    public function unban(Request $request, User $user): RedirectResponse
    {
        Gate::authorize('unban', $user);

        $user->unban();

        return redirect()
            ->back()
            ->with('status', [
                'type' => 'success',
                'message' => 'User unbanned successfully.',
            ]);
    }

    public function warn(WarnUserRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();
        $admin = $request->user();

        $user->warn(
            reason: $validated['reason'],
            notes: $validated['notes'] ?? null,
            admin: $admin
        );

        return redirect()
            ->back()
            ->with('status', [
                'type' => 'success',
                'message' => 'User warned successfully.',
            ]);
    }

    public function grantFreeMembership(GrantFreeMembershipRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();
        $admin = $request->user();

        $plan = MembershipPlan::findOrFail($validated['membership_plan_id']);

        $this->membershipService->grantFreeMembership(
            user: $user,
            plan: $plan,
            expiresAt: Carbon::parse($validated['expires_at']),
            reason: $validated['reason'] ?? null,
            admin: $admin
        );

        return redirect()
            ->back()
            ->with('status', [
                'type' => 'success',
                'message' => 'Free membership granted successfully.',
            ]);
    }

    /**
     * Show suspended and banned users.
     */
    public function suspensions(Request $request): Response
    {
        Gate::authorize('viewAny', User::class);

        $search = trim((string) $request->string('search'));
        $statusFilter = trim((string) $request->string('status')); // 'suspended', 'banned', or 'all'

        $users = User::query()
            ->with([
                'roles:id,name',
                'suspendedBy:id,name,username',
                'bannedBy:id,name,username',
            ])
            ->where(function ($query): void {
                $query->whereNotNull('suspended_at')
                    ->orWhereNotNull('banned_at');
            })
            ->when($search !== '', static function ($query) use ($search): void {
                $query->where(static function ($builder) use ($search): void {
                    $builder->where('name', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($statusFilter === 'suspended', static fn ($query) => $query->suspended())
            ->when($statusFilter === 'banned', static fn ($query) => $query->banned())
            ->orderByDesc('banned_at')
            ->orderByDesc('suspended_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Users/Suspensions', [
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
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
                    'is_suspended' => $user->isSuspended(),
                    'is_banned' => $user->isBanned(),
                    'suspended_at' => optional($user->suspended_at)?->toIso8601String(),
                    'suspended_until' => optional($user->suspended_until)?->toIso8601String(),
                    'suspended_reason' => $user->suspended_reason,
                    'suspended_by' => $user->suspendedBy ? [
                        'id' => $user->suspendedBy->getKey(),
                        'name' => $user->suspendedBy->name,
                        'username' => $user->suspendedBy->username,
                    ] : null,
                    'banned_at' => optional($user->banned_at)?->toIso8601String(),
                    'banned_reason' => $user->banned_reason,
                    'banned_by' => $user->bannedBy ? [
                        'id' => $user->bannedBy->getKey(),
                        'name' => $user->bannedBy->name,
                        'username' => $user->bannedBy->username,
                    ] : null,
                    'warning_count' => $user->warning_count,
                    'last_warned_at' => optional($user->last_warned_at)?->toIso8601String(),
                ];
            }),
        ]);
    }
}
