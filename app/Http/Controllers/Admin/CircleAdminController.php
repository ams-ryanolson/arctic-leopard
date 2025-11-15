<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateCircleFromSuggestionRequest;
use App\Models\Circle;
use App\Models\CircleSuggestion;
use App\Models\Interest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CircleAdminController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Circle::class);

        // Get all circles with stats
        $circles = Circle::query()
            ->with(['interest:id,name,slug'])
            ->withCount(['members', 'posts'])
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        // Get pending suggestions count and list
        $pendingSuggestionsCount = CircleSuggestion::where('status', 'pending')->count();
        $pendingSuggestions = CircleSuggestion::query()
            ->with(['user:id,name,username'])
            ->where('status', 'pending')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(static function (CircleSuggestion $suggestion): array {
                return [
                    'id' => $suggestion->getKey(),
                    'name' => $suggestion->name,
                    'description' => $suggestion->description,
                    'created_at' => optional($suggestion->created_at)->toIso8601String(),
                    'user' => $suggestion->user ? [
                        'id' => $suggestion->user->getKey(),
                        'name' => $suggestion->user->name,
                        'username' => $suggestion->user->username,
                    ] : null,
                ];
            });

        // Get dashboard stats
        $stats = [
            'total_circles' => Circle::count(),
            'total_members' => DB::table('circle_members')->distinct('user_id')->count('user_id'),
            'total_posts' => DB::table('circle_post')->count(),
            'pending_suggestions' => $pendingSuggestionsCount,
        ];

        // Get most active circles (by post count)
        $mostActiveCircles = Circle::query()
            ->withCount(['members', 'posts'])
            ->orderByDesc('posts_count')
            ->limit(5)
            ->get()
            ->map(static function (Circle $circle): array {
                return [
                    'id' => $circle->getKey(),
                    'name' => $circle->name,
                    'slug' => $circle->slug,
                    'members_count' => $circle->members_count,
                    'posts_count' => $circle->posts_count,
                ];
            });

        return Inertia::render('Admin/Circles/Index', [
            'circles' => $circles->through(static function (Circle $circle): array {
                return [
                    'id' => $circle->getKey(),
                    'name' => $circle->name,
                    'slug' => $circle->slug,
                    'description' => $circle->description,
                    'visibility' => $circle->visibility,
                    'is_featured' => $circle->is_featured,
                    'members_count' => $circle->members_count,
                    'posts_count' => $circle->posts_count,
                    'created_at' => optional($circle->created_at)->toIso8601String(),
                    'interest' => $circle->interest ? [
                        'id' => $circle->interest->getKey(),
                        'name' => $circle->interest->name,
                        'slug' => $circle->interest->slug,
                    ] : null,
                ];
            }),
            'stats' => $stats,
            'most_active_circles' => $mostActiveCircles,
            'pending_suggestions_count' => $pendingSuggestionsCount,
            'pending_suggestions' => $pendingSuggestions,
        ]);
    }

    public function review(CircleSuggestion $suggestion): Response
    {
        Gate::authorize('create', Circle::class);

        if ($suggestion->status !== 'pending') {
            return redirect()
                ->route('admin.circles.index')
                ->with('status', [
                    'type' => 'error',
                    'message' => 'This suggestion has already been reviewed.',
                ]);
        }

        $suggestion->load(['user:id,name,username']);

        $interests = Interest::query()
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return Inertia::render('Admin/Circles/Review', [
            'suggestion' => [
                'id' => $suggestion->getKey(),
                'name' => $suggestion->name,
                'description' => $suggestion->description,
                'created_at' => optional($suggestion->created_at)->toIso8601String(),
                'user' => $suggestion->user ? [
                    'id' => $suggestion->user->getKey(),
                    'name' => $suggestion->user->name,
                    'username' => $suggestion->user->username,
                ] : null,
            ],
            'interests' => $interests->map(static function (Interest $interest): array {
                return [
                    'id' => $interest->getKey(),
                    'name' => $interest->name,
                    'slug' => $interest->slug,
                ];
            }),
        ]);
    }

    public function createFromSuggestion(CreateCircleFromSuggestionRequest $request, CircleSuggestion $suggestion): RedirectResponse
    {
        Gate::authorize('create', Circle::class);

        if ($suggestion->status !== 'pending') {
            return redirect()
                ->route('admin.circles.index')
                ->with('status', [
                    'type' => 'error',
                    'message' => 'This suggestion has already been reviewed.',
                ]);
        }

        $validated = $request->validated();

        $circle = Circle::create([
            'interest_id' => $validated['interest_id'],
            'name' => $validated['name'],
            'tagline' => $validated['tagline'] ?? null,
            'description' => $validated['description'] ?? $suggestion->description,
            'visibility' => $validated['visibility'],
            'is_featured' => $validated['is_featured'] ?? false,
        ]);

        $suggestion->update([
            'status' => 'approved',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return redirect()
            ->route('admin.circles.index')
            ->with('status', [
                'type' => 'success',
                'message' => "Circle '{$circle->name}' has been created successfully.",
            ]);
    }

    public function decline(Request $request, CircleSuggestion $suggestion): RedirectResponse
    {
        Gate::authorize('create', Circle::class);

        if ($suggestion->status !== 'pending') {
            return redirect()
                ->route('admin.circles.index')
                ->with('status', [
                    'type' => 'error',
                    'message' => 'This suggestion has already been reviewed.',
                ]);
        }

        $validated = $request->validate([
            'admin_notes' => ['nullable', 'string', 'max:500'],
        ]);

        $suggestion->update([
            'status' => 'rejected',
            'admin_notes' => $validated['admin_notes'] ?? null,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return redirect()
            ->route('admin.circles.index')
            ->with('status', [
                'type' => 'success',
                'message' => 'Circle suggestion declined.',
            ]);
    }
}
