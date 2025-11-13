<?php

namespace App\Http\Controllers\Admin\Ads;

use App\Enums\Ads\AdStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Ads\ApproveAdRequest;
use App\Http\Requests\Ads\RejectAdRequest;
use App\Http\Requests\Ads\StoreAdRequest;
use App\Http\Requests\Ads\UpdateAdRequest;
use App\Http\Resources\Ads\AdResource;
use App\Models\Ads\Ad;
use App\Models\Ads\AdClick;
use App\Models\Ads\AdCreative;
use App\Models\Ads\AdImpression;
use App\Services\Ads\AdReportingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class AdAdminController extends Controller
{
    public function __construct(
        private AdReportingService $reportingService,
    ) {}

    public function index(Request $request): JsonResponse|InertiaResponse
    {
        Gate::authorize('viewAny', Ad::class);

        // Get date range for analytics (default: last 30 days)
        $endDate = Carbon::now();
        $startDate = Carbon::now()->subDays(30);

        // Overview metrics
        $totalAds = Ad::count();
        $activeAds = Ad::where('status', AdStatus::Active)->count();
        $pendingAds = Ad::where('status', AdStatus::PendingReview)->count();
        $totalImpressions = AdImpression::whereBetween('viewed_at', [$startDate, $endDate])->count();
        $totalClicks = AdClick::whereBetween('clicked_at', [$startDate, $endDate])->count();
        $totalRevenue = Ad::whereHas('impressions', function ($q) use ($startDate, $endDate): void {
            $q->whereBetween('viewed_at', [$startDate, $endDate]);
        })->sum('spent_amount');

        // Status breakdown (use raw query to get string values)
        $statusBreakdown = DB::table('ads')
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->mapWithKeys(fn ($item) => [$item->status => $item->count]);

        // Placement breakdown (raw query since we're grouping)
        $placementBreakdown = DB::table('ad_creatives')
            ->select('placement', DB::raw('count(*) as count'))
            ->groupBy('placement')
            ->get()
            ->mapWithKeys(fn ($item) => [$item->placement => $item->count]);

        // Daily timeline data for charts (last 30 days)
        $timelineData = collect();
        for ($i = 29; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $dayStart = $date->copy()->startOfDay();
            $dayEnd = $date->copy()->endOfDay();

            $impressions = AdImpression::whereBetween('viewed_at', [$dayStart, $dayEnd])->count();
            $clicks = AdClick::whereBetween('clicked_at', [$dayStart, $dayEnd])->count();
            $revenue = Ad::whereHas('impressions', function ($q) use ($dayStart, $dayEnd): void {
                $q->whereBetween('viewed_at', [$dayStart, $dayEnd]);
            })->sum('spent_amount');

            $timelineData->push([
                'date' => $date->toDateString(),
                'label' => $date->format('M d'),
                'impressions' => $impressions,
                'clicks' => $clicks,
                'revenue' => $revenue,
            ]);
        }

        // Top performing ads
        $topAds = Ad::query()
            ->with(['advertiser', 'campaign'])
            ->withCount(['impressions', 'clicks'])
            ->whereHas('impressions', function ($q) use ($startDate, $endDate): void {
                $q->whereBetween('viewed_at', [$startDate, $endDate]);
            })
            ->orderByDesc('impressions_count')
            ->limit(5)
            ->get();

        // Ad list with filters
        $perPage = $request->integer('per_page', 25);
        $query = Ad::query()
            ->with(['advertiser', 'campaign', 'creatives'])
            ->withCount(['impressions', 'clicks'])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('advertiser_id')) {
            $query->where('advertiser_id', $request->integer('advertiser_id'));
        }

        if ($request->filled('placement')) {
            $query->forPlacement(\App\Enums\Ads\AdPlacement::from($request->string('placement')->toString()));
        }

        if ($request->filled('search')) {
            $term = $request->string('search')->toString();
            $query->where(function ($builder) use ($term): void {
                $builder
                    ->where('name', 'like', "%{$term}%")
                    ->orWhereHas('advertiser', function ($q) use ($term): void {
                        $q->where('username', 'like', "%{$term}%")
                            ->orWhere('name', 'like', "%{$term}%");
                    });
            });
        }

        $ads = $query->paginate($perPage)->withQueryString();

        if ($request->wantsJson()) {
            return AdResource::collection($ads)->toResponse($request);
        }

        $filters = [
            'status' => $request->string('status')->toString() ?: null,
            'advertiser_id' => $request->integer('advertiser_id') ?: null,
            'placement' => $request->string('placement')->toString() ?: null,
            'search' => $request->string('search')->toString() ?: null,
        ];

        $payload = AdResource::collection($ads)
            ->toResponse($request)
            ->getData(true);

        return Inertia::render('Admin/Ads/Index', [
            'ads' => $payload,
            'filters' => $filters,
            'meta' => [
                'statuses' => array_map(
                    static fn (AdStatus $status) => $status->value,
                    AdStatus::cases(),
                ),
            ],
            'analytics' => [
                'overview' => [
                    'total_ads' => $totalAds,
                    'active_ads' => $activeAds,
                    'pending_ads' => $pendingAds,
                    'total_impressions' => $totalImpressions,
                    'total_clicks' => $totalClicks,
                    'total_revenue' => $totalRevenue,
                    'average_ctr' => $totalImpressions > 0 ? round(($totalClicks / $totalImpressions) * 100, 2) : 0,
                ],
                'status_breakdown' => $statusBreakdown->toArray(),
                'placement_breakdown' => $placementBreakdown->toArray(),
                'timeline' => $timelineData->toArray(),
                'top_ads' => $topAds->map(fn ($ad) => [
                    'id' => $ad->id,
                    'name' => $ad->name,
                    'advertiser' => $ad->advertiser->display_name ?? $ad->advertiser->username,
                    'impressions_count' => $ad->impressions_count,
                    'clicks_count' => $ad->clicks_count,
                    'ctr' => $ad->impressions_count > 0 ? round(($ad->clicks_count / $ad->impressions_count) * 100, 2) : 0,
                ])->toArray(),
            ],
        ]);
    }

    public function create(Request $request): InertiaResponse
    {
        Gate::authorize('create', Ad::class);

        return Inertia::render('Admin/Ads/Create');
    }

    public function store(StoreAdRequest $request): JsonResponse|Response
    {
        Gate::authorize('create', Ad::class);

        $user = $request->user();
        $validated = $request->validated();

        /** @var Ad $ad */
        $ad = DB::transaction(function () use ($validated, $user) {
            $ad = new Ad(Arr::except($validated, ['creatives']));
            $ad->advertiser_id = $validated['advertiser_id'] ?? $user->getKey();
            $ad->status = $validated['status'] ?? AdStatus::Draft;

            if ($ad->status === AdStatus::Active && $ad->approved_at === null) {
                $ad->approved_at = Carbon::now();
                $ad->approved_by = $user->getKey();
            }

            $ad->save();

            // Create creatives
            if (isset($validated['creatives']) && is_array($validated['creatives'])) {
                foreach ($validated['creatives'] as $creativeData) {
                    AdCreative::create([
                        'ad_id' => $ad->getKey(),
                        ...$creativeData,
                    ]);
                }
            }

            return $ad;
        });

        $ad->load(['advertiser', 'campaign', 'creatives']);

        if ($request->wantsJson()) {
            return (new AdResource($ad))
                ->toResponse($request)
                ->setStatusCode(Response::HTTP_CREATED);
        }

        return redirect()
            ->route('admin.ads.index')
            ->with('flash.banner', 'Ad created successfully.');
    }

    public function show(Request $request, Ad $ad): JsonResponse|InertiaResponse
    {
        Gate::authorize('view', $ad);

        $ad->load(['advertiser', 'campaign', 'creatives', 'approver']);

        // Get report data
        $startDate = $request->filled('start_date')
            ? Carbon::parse($request->string('start_date')->toString())
            : Carbon::now()->subDays(30);
        $endDate = $request->filled('end_date')
            ? Carbon::parse($request->string('end_date')->toString())
            : Carbon::now();

        $report = $this->reportingService->getAdReport($ad, $startDate, $endDate);

        if ($request->wantsJson()) {
            return (new AdResource($ad))->toResponse($request);
        }

        return Inertia::render('Admin/Ads/Show', [
            'ad' => (new AdResource($ad))->toArray($request),
            'report' => $report,
            'dateRange' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString(),
            ],
        ]);
    }

    public function edit(Request $request, Ad $ad): InertiaResponse
    {
        Gate::authorize('update', $ad);

        $ad->load(['advertiser', 'campaign', 'creatives']);

        return Inertia::render('Admin/Ads/Edit', [
            'ad' => (new AdResource($ad))->toArray($request),
        ]);
    }

    public function update(UpdateAdRequest $request, Ad $ad): JsonResponse|Response
    {
        Gate::authorize('update', $ad);

        $validated = $request->validated();
        $attributes = Arr::except($validated, ['creatives']);

        DB::transaction(function () use ($ad, $attributes, $validated): void {
            if ($attributes !== []) {
                $ad->fill($attributes);
            }

            if (array_key_exists('status', $validated)) {
                $status = AdStatus::from($validated['status']);
                $ad->status = $status;

                if ($status === AdStatus::Active && $ad->approved_at === null) {
                    $ad->approved_at = Carbon::now();
                    $ad->approved_by = request()->user()?->getKey();
                }
            }

            $ad->save();

            // Update creatives if provided
            if (array_key_exists('creatives', $validated)) {
                $ad->creatives()->delete();

                foreach ($validated['creatives'] as $creativeData) {
                    AdCreative::create([
                        'ad_id' => $ad->getKey(),
                        ...$creativeData,
                    ]);
                }
            }
        });

        $ad->refresh()->load(['advertiser', 'campaign', 'creatives']);

        if ($request->wantsJson()) {
            return (new AdResource($ad))->toResponse($request);
        }

        return redirect()
            ->back()
            ->with('flash.banner', 'Ad updated.');
    }

    public function destroy(Request $request, Ad $ad): Response
    {
        Gate::authorize('delete', $ad);

        $ad->delete();

        if ($request->wantsJson()) {
            return response()->noContent();
        }

        return redirect()
            ->back()
            ->with('flash.banner', 'Ad deleted.');
    }

    public function approve(ApproveAdRequest $request, Ad $ad): JsonResponse|Response
    {
        Gate::authorize('approve', $ad);

        $ad->status = AdStatus::Active;
        $ad->approved_at = Carbon::now();
        $ad->approved_by = $request->user()?->getKey();
        $ad->rejected_at = null;
        $ad->rejection_reason = null;
        $ad->save();

        if ($request->wantsJson()) {
            return (new AdResource($ad->fresh(['advertiser', 'campaign', 'creatives', 'approver'])))->toResponse($request);
        }

        return redirect()
            ->back()
            ->with('flash.banner', 'Ad approved.');
    }

    public function reject(RejectAdRequest $request, Ad $ad): JsonResponse|Response
    {
        Gate::authorize('reject', $ad);

        $ad->status = AdStatus::Rejected;
        $ad->rejected_at = Carbon::now();
        $ad->rejection_reason = $request->string('reason')->toString();
        $ad->save();

        if ($request->wantsJson()) {
            return (new AdResource($ad->fresh(['advertiser', 'campaign', 'creatives'])))->toResponse($request);
        }

        return redirect()
            ->back()
            ->with('flash.banner', 'Ad rejected.');
    }

    public function pause(Request $request, Ad $ad): JsonResponse|Response
    {
        Gate::authorize('pause', $ad);

        $ad->status = AdStatus::Paused;
        $ad->save();

        if ($request->wantsJson()) {
            return (new AdResource($ad->fresh(['advertiser', 'campaign', 'creatives'])))->toResponse($request);
        }

        return redirect()
            ->back()
            ->with('flash.banner', 'Ad paused.');
    }

    public function resume(Request $request, Ad $ad): JsonResponse|Response
    {
        Gate::authorize('resume', $ad);

        if ($ad->approved_at === null) {
            if ($request->wantsJson()) {
                return response()->json(['error' => 'Ad must be approved before it can be resumed'], Response::HTTP_BAD_REQUEST);
            }

            return redirect()
                ->back()
                ->with('flash.banner', 'Ad must be approved before it can be resumed.');
        }

        $ad->status = AdStatus::Active;
        $ad->save();

        if ($request->wantsJson()) {
            return (new AdResource($ad->fresh(['advertiser', 'campaign', 'creatives'])))->toResponse($request);
        }

        return redirect()
            ->back()
            ->with('flash.banner', 'Ad resumed.');
    }
}
