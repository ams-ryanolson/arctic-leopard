<?php

namespace App\Http\Controllers\Subscriptions;

use App\Http\Controllers\Controller;
use App\Http\Requests\Subscriptions\StoreSubscriptionPlanRequest;
use App\Http\Requests\Subscriptions\UpdateSubscriptionPlanRequest;
use App\Models\Payments\SubscriptionPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SubscriptionPlanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $plans = SubscriptionPlan::query()
            ->where('creator_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($plans);
    }

    public function store(StoreSubscriptionPlanRequest $request): JsonResponse
    {
        $plan = SubscriptionPlan::query()->create([
            'creator_id' => $request->user()->id,
            'name' => $request->string('name'),
            'slug' => $this->uniqueSlug($request->user()->id, $request->string('name')),
            'description' => $request->input('description'),
            'amount' => $request->integer('amount'),
            'currency' => $request->string('currency'),
            'interval' => $request->string('interval'),
            'interval_count' => $request->integer('interval_count'),
            'trial_days' => $request->integer('trial_days'),
            'is_active' => $request->boolean('is_active'),
            'is_public' => $request->boolean('is_public'),
            'metadata' => [],
        ]);

        return response()->json($plan, JsonResponse::HTTP_CREATED);
    }

    public function update(UpdateSubscriptionPlanRequest $request, SubscriptionPlan $subscriptionPlan): JsonResponse
    {
        $this->authorizePlan($request, $subscriptionPlan);

        $payload = $request->validated();

        if (isset($payload['name'])) {
            $subscriptionPlan->name = $payload['name'];
        }

        if (isset($payload['description'])) {
            $subscriptionPlan->description = $payload['description'];
        }

        if (isset($payload['amount'])) {
            $subscriptionPlan->amount = $payload['amount'];
        }

        if (isset($payload['currency'])) {
            $subscriptionPlan->currency = $payload['currency'];
        }

        if (isset($payload['interval'])) {
            $subscriptionPlan->interval = $payload['interval'];
        }

        if (isset($payload['interval_count'])) {
            $subscriptionPlan->interval_count = (int) $payload['interval_count'];
        }

        if (array_key_exists('trial_days', $payload)) {
            $subscriptionPlan->trial_days = (int) $payload['trial_days'];
        }

        if (array_key_exists('is_active', $payload)) {
            $subscriptionPlan->is_active = (bool) $payload['is_active'];
        }

        if (array_key_exists('is_public', $payload)) {
            $subscriptionPlan->is_public = (bool) $payload['is_public'];
        }

        $subscriptionPlan->save();

        return response()->json($subscriptionPlan);
    }

    public function destroy(Request $request, SubscriptionPlan $subscriptionPlan): JsonResponse
    {
        $this->authorizePlan($request, $subscriptionPlan);

        $subscriptionPlan->delete();

        return response()->json(status: JsonResponse::HTTP_NO_CONTENT);
    }

    protected function authorizePlan(Request $request, SubscriptionPlan $plan): void
    {
        abort_unless($plan->creator_id === $request->user()->id, JsonResponse::HTTP_FORBIDDEN);
    }

    protected function uniqueSlug(int $creatorId, string $name): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $suffix = 1;

        while (SubscriptionPlan::query()
            ->where('creator_id', $creatorId)
            ->where('slug', $slug)
            ->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
