<?php

namespace App\Http\Controllers\Admin\Ads;

use App\Enums\Ads\CampaignStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Ads\StoreCampaignRequest;
use App\Http\Resources\Ads\CampaignResource;
use App\Models\Ads\AdCampaign;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class CampaignAdminController extends Controller
{
    public function index(Request $request): JsonResponse|InertiaResponse
    {
        Gate::authorize('viewAny', AdCampaign::class);

        $perPage = $request->integer('per_page', 25);
        $query = AdCampaign::query()
            ->with(['advertiser', 'ads'])
            ->withCount(['ads'])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('advertiser_id')) {
            $query->where('advertiser_id', $request->integer('advertiser_id'));
        }

        if ($request->filled('search')) {
            $term = $request->string('search')->toString();
            $query->where('name', 'like', "%{$term}%");
        }

        $campaigns = $query->paginate($perPage)->withQueryString();

        if ($request->wantsJson()) {
            return CampaignResource::collection($campaigns)->toResponse($request);
        }

        return Inertia::render('Admin/Ads/Campaigns/Index', [
            'campaigns' => CampaignResource::collection($campaigns)
                ->toResponse($request)
                ->getData(true),
        ]);
    }

    public function create(Request $request): InertiaResponse
    {
        Gate::authorize('create', AdCampaign::class);

        return Inertia::render('Admin/Ads/Campaigns/Create');
    }

    public function store(StoreCampaignRequest $request): JsonResponse|Response
    {
        Gate::authorize('create', AdCampaign::class);

        $user = $request->user();
        $validated = $request->validated();

        $campaign = new AdCampaign($validated);
        $campaign->advertiser_id = $validated['advertiser_id'] ?? $user->getKey();
        $campaign->status = $validated['status'] ?? CampaignStatus::Draft;
        $campaign->save();

        $campaign->load(['advertiser', 'ads']);

        if ($request->wantsJson()) {
            return (new CampaignResource($campaign))
                ->toResponse($request)
                ->setStatusCode(Response::HTTP_CREATED);
        }

        return redirect()
            ->route('admin.campaigns.index')
            ->with('flash.banner', 'Campaign created successfully.');
    }

    public function show(Request $request, AdCampaign $campaign): JsonResponse|InertiaResponse
    {
        Gate::authorize('view', $campaign);

        $campaign->load(['advertiser', 'ads']);

        if ($request->wantsJson()) {
            return (new CampaignResource($campaign))->toResponse($request);
        }

        return Inertia::render('Admin/Ads/Campaigns/Show', [
            'campaign' => (new CampaignResource($campaign))->toArray($request),
        ]);
    }

    public function edit(Request $request, AdCampaign $campaign): InertiaResponse
    {
        Gate::authorize('update', $campaign);

        return Inertia::render('Admin/Ads/Campaigns/Edit', [
            'campaign' => (new CampaignResource($campaign))->toArray($request),
        ]);
    }

    public function update(StoreCampaignRequest $request, AdCampaign $campaign): JsonResponse|Response
    {
        Gate::authorize('update', $campaign);

        $validated = $request->validated();
        $campaign->fill($validated);
        $campaign->save();

        $campaign->load(['advertiser', 'ads']);

        if ($request->wantsJson()) {
            return (new CampaignResource($campaign))->toResponse($request);
        }

        return redirect()
            ->back()
            ->with('flash.banner', 'Campaign updated.');
    }

    public function destroy(Request $request, AdCampaign $campaign): Response
    {
        Gate::authorize('delete', $campaign);

        $campaign->delete();

        if ($request->wantsJson()) {
            return response()->noContent();
        }

        return redirect()
            ->back()
            ->with('flash.banner', 'Campaign deleted.');
    }
}
