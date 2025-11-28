<?php

namespace App\Http\Controllers\Advertiser;

use App\Enums\Ads\AdStatus;
use App\Enums\Payments\PaymentType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Ads\StoreAdRequest;
use App\Http\Requests\Ads\UpdateAdRequest;
use App\Http\Resources\Ads\AdResource;
use App\Http\Resources\Ads\CampaignResource;
use App\Models\Ads\Ad;
use App\Models\Ads\AdCampaign;
use App\Models\Ads\AdCreative;
use App\Payments\Data\PaymentIntentData;
use App\Services\Ads\AdReportingService;
use App\Services\Payments\PaymentService;
use App\ValueObjects\Money;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class AdvertiserController extends Controller
{
    public function __construct(
        private AdReportingService $reportingService,
        private PaymentService $paymentService,
    ) {}

    public function index(Request $request): JsonResponse|InertiaResponse
    {
        $user = $request->user();
        $perPage = $request->integer('per_page', 25);

        $ads = Ad::query()
            ->where('advertiser_id', $user->getKey())
            ->with(['campaign', 'creatives'])
            ->withCount(['impressions', 'clicks'])
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        if ($request->wantsJson()) {
            return AdResource::collection($ads)->toResponse($request);
        }

        return Inertia::render('Signals/Ads/Index', [
            'ads' => AdResource::collection($ads)
                ->toResponse($request)
                ->getData(true),
        ]);
    }

    public function create(Request $request): InertiaResponse
    {
        return Inertia::render('Signals/Ads/Create');
    }

    public function store(StoreAdRequest $request): JsonResponse|Response
    {
        $user = $request->user();
        $validated = $request->validated();

        /** @var Ad $ad */
        $ad = DB::transaction(function () use ($validated, $user) {
            $ad = new Ad(Arr::except($validated, ['creatives']));
            $ad->advertiser_id = $user->getKey();
            $ad->status = AdStatus::PendingReview; // Self-serve ads need approval

            $ad->save();

            // Create creatives
            if (isset($validated['creatives']) && is_array($validated['creatives'])) {
                foreach ($validated['creatives'] as $creativeData) {
                    AdCreative::create([
                        'ad_id' => $ad->getKey(),
                        ...$creativeData,
                        'review_status' => 'pending', // Creatives need review
                    ]);
                }
            }

            return $ad;
        });

        $ad->load(['campaign', 'creatives']);

        if ($request->wantsJson()) {
            return (new AdResource($ad))
                ->toResponse($request)
                ->setStatusCode(Response::HTTP_CREATED);
        }

        return redirect()
            ->route('signals.ads.index')
            ->with('flash.banner', 'Ad submitted for review.');
    }

    public function show(Request $request, Ad $ad): JsonResponse|InertiaResponse
    {
        $this->authorize('view', $ad);

        $ad->load(['campaign', 'creatives']);

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

        return Inertia::render('Signals/Ads/Show', [
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
        $this->authorize('update', $ad);

        $ad->load(['campaign', 'creatives']);

        return Inertia::render('Signals/Ads/Edit', [
            'ad' => (new AdResource($ad))->toArray($request),
        ]);
    }

    public function update(UpdateAdRequest $request, Ad $ad): JsonResponse|Response
    {
        $this->authorize('update', $ad);

        $validated = $request->validated();
        $attributes = Arr::except($validated, ['creatives']);

        DB::transaction(function () use ($ad, $attributes, $validated): void {
            if ($attributes !== []) {
                $ad->fill($attributes);
            }

            // If ad was rejected and being updated, reset to pending review
            if ($ad->status === AdStatus::Rejected) {
                $ad->status = AdStatus::PendingReview;
                $ad->rejected_at = null;
                $ad->rejection_reason = null;
            }

            $ad->save();

            // Update creatives if provided
            if (array_key_exists('creatives', $validated)) {
                $ad->creatives()->delete();

                foreach ($validated['creatives'] as $creativeData) {
                    AdCreative::create([
                        'ad_id' => $ad->getKey(),
                        ...$creativeData,
                        'review_status' => 'pending', // New creatives need review
                    ]);
                }
            }
        });

        $ad->refresh()->load(['campaign', 'creatives']);

        if ($request->wantsJson()) {
            return (new AdResource($ad))->toResponse($request);
        }

        return redirect()
            ->back()
            ->with('flash.banner', 'Ad updated.');
    }

    public function report(Request $request, Ad $ad): JsonResponse|InertiaResponse
    {
        $this->authorize('view', $ad);

        $startDate = $request->filled('start_date')
            ? Carbon::parse($request->string('start_date')->toString())
            : Carbon::now()->subDays(30);
        $endDate = $request->filled('end_date')
            ? Carbon::parse($request->string('end_date')->toString())
            : Carbon::now();

        $report = $this->reportingService->getAdReport($ad, $startDate, $endDate);

        if ($request->wantsJson()) {
            return response()->json($report);
        }

        return Inertia::render('Signals/Ads/Reports/Show', [
            'ad' => (new AdResource($ad))->toArray($request),
            'report' => $report,
            'dateRange' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString(),
            ],
        ]);
    }

    public function campaigns(Request $request): JsonResponse|InertiaResponse
    {
        $user = $request->user();

        $campaigns = AdCampaign::query()
            ->where('advertiser_id', $user->getKey())
            ->with(['ads'])
            ->withCount(['ads'])
            ->orderByDesc('created_at')
            ->paginate(25)
            ->withQueryString();

        if ($request->wantsJson()) {
            return CampaignResource::collection($campaigns)->toResponse($request);
        }

        return Inertia::render('Signals/Ads/Campaigns/Index', [
            'campaigns' => CampaignResource::collection($campaigns)
                ->toResponse($request)
                ->getData(true),
        ]);
    }

    public function checkout(Request $request): JsonResponse|Response
    {
        $request->validate([
            'ad_id' => ['required', 'integer', 'exists:ads,id'],
            'amount' => ['required', 'integer', 'min:1'],
            'currency' => ['required', 'string', 'size:3'],
            'gateway' => ['nullable', 'string'],
            'method' => ['nullable', 'string'],
            'payment_method_id' => ['nullable', 'integer', 'exists:payment_methods,id'],
        ]);

        $user = $request->user();
        $ad = Ad::findOrFail($request->integer('ad_id'));

        // Verify ad belongs to user or is available for purchase
        if ($ad->advertiser_id !== $user->getKey() && $ad->status !== AdStatus::Active) {
            return response()->json(['error' => 'Ad not available for purchase'], Response::HTTP_BAD_REQUEST);
        }

        $amount = Money::from($request->integer('amount'), strtoupper($request->string('currency')->toString()));

        $metadata = [
            'ad_name' => $ad->name,
            'ad_uuid' => $ad->uuid,
            'payment_type' => 'one_time',
        ];

        if ($request->filled('payment_method_id')) {
            $metadata['payment_method_id'] = $request->input('payment_method_id');
        }

        // Create payment intent
        $intent = $this->paymentService->createIntent(
            new PaymentIntentData(
                payableType: Ad::class,
                payableId: $ad->getKey(),
                amount: $amount,
                payerId: $user->getKey(),
                payeeId: null, // Platform receives payment
                type: PaymentType::OneTime,
                method: $request->input('method'),
                metadata: $metadata,
                description: "Purchase ad: {$ad->name}"
            ),
            $request->input('gateway')
        );

        if ($request->wantsJson()) {
            return response()->json([
                'intent' => $intent,
                'ad' => (new AdResource($ad))->toArray($request),
            ], Response::HTTP_CREATED);
        }

        $ccbillOptions = config('payments.gateways.ccbill.options', []);

        return Inertia::render('Signals/Ads/Checkout', [
            'ad' => (new AdResource($ad))->toArray($request),
            'intent' => [
                'id' => $intent->id,
                'client_secret' => $intent->client_secret,
                'amount' => $intent->amount,
                'currency' => $intent->currency,
            ],
            'ccbill_client_accnum' => $ccbillOptions['low_risk_non_recurring']['client_accnum'] ?? null,
            'ccbill_client_subacc' => $ccbillOptions['low_risk_non_recurring']['client_subacc'] ?? null,
        ]);
    }
}
