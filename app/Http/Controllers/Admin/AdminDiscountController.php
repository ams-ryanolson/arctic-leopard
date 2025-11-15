<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDiscountRequest;
use App\Http\Requests\Admin\UpdateDiscountRequest;
use App\Models\Memberships\MembershipDiscount;
use App\Models\Memberships\MembershipPlan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AdminDiscountController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('manage settings');

        $discounts = MembershipDiscount::query()
            ->with('plan:id,name,slug')
            ->orderByDesc('created_at')
            ->get()
            ->map(static fn (MembershipDiscount $discount) => [
                'id' => $discount->id,
                'code' => $discount->code,
                'description' => $discount->description,
                'discount_type' => $discount->discount_type,
                'discount_value' => $discount->discount_value,
                'membership_plan_id' => $discount->membership_plan_id,
                'plan' => $discount->plan ? [
                    'id' => $discount->plan->id,
                    'name' => $discount->plan->name,
                    'slug' => $discount->plan->slug,
                ] : null,
                'starts_at' => $discount->starts_at->toIso8601String(),
                'ends_at' => $discount->ends_at->toIso8601String(),
                'max_uses' => $discount->max_uses,
                'used_count' => $discount->used_count,
                'is_active' => $discount->is_active,
            ]);

        $plans = MembershipPlan::query()
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return Inertia::render('Admin/Memberships/Discounts/Index', [
            'discounts' => $discounts,
            'plans' => $plans->map(static fn (MembershipPlan $plan) => [
                'id' => $plan->id,
                'name' => $plan->name,
                'slug' => $plan->slug,
            ]),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('manage settings');

        $plans = MembershipPlan::query()
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return Inertia::render('Admin/Memberships/Discounts/Create', [
            'plans' => $plans->map(static fn (MembershipPlan $plan) => [
                'id' => $plan->id,
                'name' => $plan->name,
                'slug' => $plan->slug,
            ]),
        ]);
    }

    public function store(StoreDiscountRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        // Ensure membership_plan_id is null if empty or "all"
        if (empty($validated['membership_plan_id']) || $validated['membership_plan_id'] === 'all') {
            $validated['membership_plan_id'] = null;
        }

        MembershipDiscount::create($validated);

        return redirect()->route('admin.memberships.discounts.index')
            ->with('success', 'Discount code created successfully.');
    }

    public function edit(MembershipDiscount $discount): Response
    {
        Gate::authorize('manage settings');

        $plans = MembershipPlan::query()
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return Inertia::render('Admin/Memberships/Discounts/Edit', [
            'discount' => [
                'id' => $discount->id,
                'code' => $discount->code,
                'description' => $discount->description,
                'discount_type' => $discount->discount_type,
                'discount_value' => $discount->discount_value,
                'membership_plan_id' => $discount->membership_plan_id,
                'starts_at' => $discount->starts_at->toIso8601String(),
                'ends_at' => $discount->ends_at->toIso8601String(),
                'max_uses' => $discount->max_uses,
                'used_count' => $discount->used_count,
                'is_active' => $discount->is_active,
            ],
            'plans' => $plans->map(static fn (MembershipPlan $plan) => [
                'id' => $plan->id,
                'name' => $plan->name,
                'slug' => $plan->slug,
            ]),
        ]);
    }

    public function update(UpdateDiscountRequest $request, MembershipDiscount $discount): RedirectResponse
    {
        $discount->update($request->validated());

        return redirect()->route('admin.memberships.discounts.index')
            ->with('success', 'Discount code updated successfully.');
    }

    public function destroy(MembershipDiscount $discount): RedirectResponse
    {
        Gate::authorize('manage settings');

        $discount->delete();

        return redirect()->route('admin.memberships.discounts.index')
            ->with('success', 'Discount code deleted successfully.');
    }
}
