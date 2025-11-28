<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Admin\DashboardDataService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function __construct(
        private readonly DashboardDataService $dashboardService
    ) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        Gate::authorize('accessAdmin', User::class);

        $user = $request->user();

        return Inertia::render('Admin/Dashboard', [
            'welcome' => [
                'name' => $user?->display_name ?? $user?->name ?? $user?->username,
                'message' => 'Monitor platform health, review creator submissions, and keep the scene thriving.',
            ],
            'globalStats' => $this->dashboardService->getGlobalStats(),
            'overview' => $this->dashboardService->getOverviewStats(),
            'financial' => $this->dashboardService->getFinancialMetrics(),
            'recentActivity' => $this->dashboardService->getRecentActivity(5)->values()->all(),
            'quickLinks' => $this->dashboardService->getQuickLinks(),
        ]);
    }
}
