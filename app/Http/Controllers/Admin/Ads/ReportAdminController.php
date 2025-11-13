<?php

namespace App\Http\Controllers\Admin\Ads;

use App\Http\Controllers\Controller;
use App\Models\Ads\Ad;
use App\Models\Ads\AdCampaign;
use App\Services\Ads\AdReportingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ReportAdminController extends Controller
{
    public function __construct(
        private AdReportingService $reportingService,
    ) {}

    public function index(Request $request): JsonResponse|InertiaResponse
    {
        Gate::authorize('viewAny', Ad::class);

        $startDate = $request->filled('start_date')
            ? Carbon::parse($request->string('start_date')->toString())
            : Carbon::now()->subDays(30);
        $endDate = $request->filled('end_date')
            ? Carbon::parse($request->string('end_date')->toString())
            : Carbon::now();

        // This would typically show a list of reports or a dashboard
        // For now, redirect to a specific report view
        return Inertia::render('Admin/Ads/Reports/Show', [
            'dateRange' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString(),
            ],
        ]);
    }

    public function show(Request $request, Ad $ad): JsonResponse|InertiaResponse
    {
        Gate::authorize('view', $ad);

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

        return Inertia::render('Admin/Ads/Reports/Show', [
            'ad' => (new \App\Http\Resources\Ads\AdResource($ad))->toArray($request),
            'report' => $report,
            'dateRange' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString(),
            ],
        ]);
    }

    public function campaignReport(Request $request, AdCampaign $campaign): JsonResponse|InertiaResponse
    {
        Gate::authorize('view', $campaign);

        $startDate = $request->filled('start_date')
            ? Carbon::parse($request->string('start_date')->toString())
            : Carbon::now()->subDays(30);
        $endDate = $request->filled('end_date')
            ? Carbon::parse($request->string('end_date')->toString())
            : Carbon::now();

        $report = $this->reportingService->getCampaignReport($campaign, $startDate, $endDate);

        if ($request->wantsJson()) {
            return response()->json($report);
        }

        return Inertia::render('Admin/Ads/Reports/Campaign', [
            'campaign' => (new \App\Http\Resources\Ads\CampaignResource($campaign))->toArray($request),
            'report' => $report,
            'dateRange' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString(),
            ],
        ]);
    }

    public function export(Request $request): Response
    {
        Gate::authorize('viewAny', Ad::class);

        // CSV export implementation would go here
        // For now, return a placeholder response
        return response()->noContent();
    }
}
