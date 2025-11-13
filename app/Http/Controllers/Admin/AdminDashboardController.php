<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
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
            'overview' => [
                [
                    'label' => 'Creators pending review',
                    'value' => 12,
                    'trend' => '+3 this week',
                ],
                [
                    'label' => 'Escalated reports',
                    'value' => 4,
                    'trend' => '2 require follow-up',
                ],
                [
                    'label' => 'Scheduled events',
                    'value' => 9,
                    'trend' => '5 awaiting approval',
                ],
            ],
            'recentActivity' => [
                [
                    'id' => 1,
                    'title' => 'Edge Guardians summit request',
                    'timestamp' => '28 minutes ago',
                    'summary' => 'Creator submitted sponsorship details for moderator review.',
                ],
                [
                    'id' => 2,
                    'title' => 'Circle spotlight escalation',
                    'timestamp' => '2 hours ago',
                    'summary' => 'New compliance flag raised for Midnight Pups Collective.',
                ],
                [
                    'id' => 3,
                    'title' => 'Scene archive audit',
                    'timestamp' => 'Yesterday',
                    'summary' => 'Automated review completed 184 scene uploads with no issues.',
                ],
            ],
            'quickLinks' => [
                [
                    'label' => 'Review events queue',
                    'description' => 'Approve, publish, or cancel upcoming scenes.',
                    'url' => route('admin.events.index'),
                ],
                [
                    'label' => 'Check safety escalations',
                    'description' => 'Prioritise flagged reports that need moderator decisions.',
                    'url' => '#',
                    'disabled' => true,
                ],
                [
                    'label' => 'Plan creator outreach',
                    'description' => 'Coordinate spotlights and consent training refreshers.',
                    'url' => '#',
                    'disabled' => true,
                ],
            ],
        ]);
    }
}
