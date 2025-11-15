<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreMembershipPlanRequest;
use App\Http\Requests\Admin\UpdateMembershipPlanRequest;
use App\Models\Memberships\MembershipPlan;
use App\Models\Memberships\UserMembership;
use App\Models\Payments\Payment;
use App\Models\User;
use App\Services\Memberships\MembershipService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class AdminMembershipController extends Controller
{
    public function __construct(
        private readonly MembershipService $membershipService
    ) {}

    public function index(Request $request): Response
    {
        Gate::authorize('manage settings');

        $plans = MembershipPlan::query()
            ->orderBy('display_order')
            ->orderBy('name')
            ->get()
            ->map(static fn (MembershipPlan $plan) => [
                'id' => $plan->id,
                'uuid' => $plan->uuid,
                'name' => $plan->name,
                'slug' => $plan->slug,
                'description' => $plan->description,
                'monthly_price' => $plan->monthly_price,
                'yearly_price' => $plan->yearly_price,
                'currency' => $plan->currency,
                'role_to_assign' => $plan->role_to_assign,
                'permissions_to_grant' => $plan->permissions_to_grant,
                'features' => $plan->features,
                'is_active' => $plan->is_active,
                'is_public' => $plan->is_public,
                'display_order' => $plan->display_order,
                'allows_recurring' => $plan->allows_recurring,
                'allows_one_time' => $plan->allows_one_time,
                'one_time_duration_days' => $plan->one_time_duration_days,
            ]);

        return Inertia::render('Admin/Memberships/Plans/Index', [
            'plans' => $plans,
        ]);
    }

    public function create(Request $request): Response
    {
        Gate::authorize('manage settings');

        $roles = Role::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(static fn (Role $role) => [
                'id' => $role->id,
                'name' => $role->name,
            ]);

        return Inertia::render('Admin/Memberships/Plans/Create', [
            'roles' => $roles,
        ]);
    }

    public function store(StoreMembershipPlanRequest $request): RedirectResponse
    {
        $plan = MembershipPlan::create($request->validated());

        return redirect()
            ->route('admin.memberships.index')
            ->with('success', 'Membership plan created successfully.');
    }

    public function edit(MembershipPlan $plan): Response
    {
        Gate::authorize('manage settings');

        $roles = Role::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(static fn (Role $role) => [
                'id' => $role->id,
                'name' => $role->name,
            ]);

        return Inertia::render('Admin/Memberships/Plans/Edit', [
            'plan' => [
                'id' => $plan->id,
                'uuid' => $plan->uuid,
                'name' => $plan->name,
                'slug' => $plan->slug,
                'description' => $plan->description,
                'monthly_price' => $plan->monthly_price,
                'yearly_price' => $plan->yearly_price,
                'currency' => $plan->currency,
                'role_to_assign' => $plan->role_to_assign,
                'permissions_to_grant' => $plan->permissions_to_grant ?? [],
                'features' => $plan->features ?? [],
                'is_active' => $plan->is_active,
                'is_public' => $plan->is_public,
                'display_order' => $plan->display_order,
                'allows_recurring' => $plan->allows_recurring,
                'allows_one_time' => $plan->allows_one_time,
                'one_time_duration_days' => $plan->one_time_duration_days,
            ],
            'roles' => $roles,
        ]);
    }

    public function update(UpdateMembershipPlanRequest $request, MembershipPlan $plan): RedirectResponse
    {
        $plan->update($request->validated());

        return redirect()
            ->route('admin.memberships.index')
            ->with('success', 'Membership plan updated successfully.');
    }

    public function destroy(MembershipPlan $plan): RedirectResponse
    {
        Gate::authorize('manage settings');

        $plan->delete();

        return redirect()
            ->route('admin.memberships.index')
            ->with('success', 'Membership plan deleted successfully.');
    }

    public function userMemberships(Request $request): Response
    {
        Gate::authorize('manage settings');

        $search = trim((string) $request->string('search'));
        $statusFilter = trim((string) $request->string('status'));
        $planFilter = trim((string) $request->string('plan'));

        $memberships = UserMembership::query()
            ->with(['user:id,name,username,email', 'plan:id,name,slug'])
            ->when($search !== '', static function ($query) use ($search): void {
                $query->whereHas('user', static function ($userQuery) use ($search): void {
                    $userQuery->where('name', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($statusFilter !== '', static fn ($query) => $query->where('status', $statusFilter))
            ->when($planFilter !== '', static function ($query) use ($planFilter): void {
                $query->whereHas('plan', static fn ($planQuery) => $planQuery->where('slug', $planFilter));
            })
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        $plans = MembershipPlan::query()
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->map(static fn (MembershipPlan $plan) => [
                'id' => $plan->id,
                'name' => $plan->name,
                'slug' => $plan->slug,
            ]);

        return Inertia::render('Admin/Memberships/Users/Index', [
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
                'plan' => $planFilter,
            ],
            'memberships' => $memberships->through(static function (UserMembership $membership): array {
                return [
                    'id' => $membership->id,
                    'uuid' => $membership->uuid,
                    'user' => [
                        'id' => $membership->user->id,
                        'name' => $membership->user->name,
                        'username' => $membership->user->username,
                        'email' => $membership->user->email,
                    ],
                    'plan' => [
                        'id' => $membership->plan->id,
                        'name' => $membership->plan->name,
                        'slug' => $membership->plan->slug,
                    ],
                    'status' => $membership->status,
                    'billing_type' => $membership->billing_type,
                    'starts_at' => $membership->starts_at->toIso8601String(),
                    'ends_at' => $membership->ends_at?->toIso8601String(),
                    'next_billing_at' => $membership->next_billing_at?->toIso8601String(),
                    'original_price' => $membership->original_price,
                    'discount_amount' => $membership->discount_amount,
                ];
            }),
            'plans' => $plans,
        ]);
    }

    public function showUserMembership(User $user): Response
    {
        Gate::authorize('manage settings');

        $memberships = $user->memberships()
            ->with('plan')
            ->orderByDesc('created_at')
            ->get()
            ->map(static function (UserMembership $membership): array {
                return [
                    'id' => $membership->id,
                    'uuid' => $membership->uuid,
                    'plan' => [
                        'id' => $membership->plan->id,
                        'name' => $membership->plan->name,
                        'slug' => $membership->plan->slug,
                    ],
                    'status' => $membership->status,
                    'billing_type' => $membership->billing_type,
                    'starts_at' => $membership->starts_at->toIso8601String(),
                    'ends_at' => $membership->ends_at?->toIso8601String(),
                    'next_billing_at' => $membership->next_billing_at?->toIso8601String(),
                    'cancelled_at' => $membership->cancelled_at?->toIso8601String(),
                    'cancellation_reason' => $membership->cancellation_reason,
                    'original_price' => $membership->original_price,
                    'discount_amount' => $membership->discount_amount,
                ];
            });

        return Inertia::render('Admin/Memberships/Users/Show', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
            ],
            'memberships' => $memberships,
            'plans' => MembershipPlan::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'slug', 'role_to_assign'])
                ->map(static fn (MembershipPlan $plan) => [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'slug' => $plan->slug,
                    'role_to_assign' => $plan->role_to_assign,
                ]),
        ]);
    }

    public function assignMembership(Request $request, User $user): RedirectResponse
    {
        Gate::authorize('manage settings');

        $request->validate([
            'plan_id' => ['required', 'integer', 'exists:membership_plans,id'],
            'billing_type' => ['required', 'string', 'in:recurring,one_time'],
            'duration_days' => ['nullable', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $plan = MembershipPlan::findOrFail($request->integer('plan_id'));
        $billingType = $request->string('billing_type')->toString();

        // Create a dummy payment record for manual assignments
        $payment = Payment::create([
            'payer_id' => $user->id,
            'payee_id' => null,
            'payable_type' => MembershipPlan::class,
            'payable_id' => $plan->id,
            'type' => $billingType === 'recurring' ? \App\Enums\Payments\PaymentType::Recurring : \App\Enums\Payments\PaymentType::OneTime,
            'status' => \App\Enums\Payments\PaymentStatus::Captured,
            'amount' => 0, // Free manual assignment
            'fee_amount' => 0,
            'net_amount' => 0,
            'currency' => $plan->currency,
            'method' => 'manual',
            'provider' => 'manual',
            'metadata' => [
                'billing_type' => $billingType,
                'billing_interval' => 'monthly',
                'assigned_by' => $request->user()->id,
                'notes' => $request->string('notes')->value(),
                'manual_assignment' => true,
            ],
            'authorized_at' => now(),
            'captured_at' => now(),
        ]);

        // Manually create membership
        $membership = $this->membershipService->purchase(
            $user,
            $plan,
            $payment,
            $billingType,
            0 // No discount for manual assignments
        );

        // Update the membership with custom duration if provided
        if ($request->filled('duration_days')) {
            $durationDays = $request->integer('duration_days');
            $membership->update([
                'ends_at' => now()->addDays($durationDays),
            ]);
        }

        return redirect()
            ->back()
            ->with('success', "Membership '{$plan->name}' assigned successfully to {$user->name}.");
    }
}
