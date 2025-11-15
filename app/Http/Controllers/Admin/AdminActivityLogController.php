<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ActivityType;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class AdminActivityLogController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('accessAdmin', User::class);

        $search = trim((string) $request->string('search'));
        $typeFilter = trim((string) $request->string('type'));
        $userIdFilter = $request->integer('user_id', 0);
        $dateFrom = trim((string) $request->string('date_from'));
        $dateTo = trim((string) $request->string('date_to'));

        $activities = Activity::query()
            ->with([
                'causer' => static function ($query): void {
                    $query->select(['id', 'name', 'username', 'email', 'avatar_path']);
                },
                'subject',
            ])
            ->when($search !== '', static function ($query) use ($search): void {
                $query->where('description', 'like', "%{$search}%");
            })
            ->when($typeFilter !== '', static function ($query) use ($typeFilter): void {
                $query->where('log_name', $typeFilter);
            })
            ->when($userIdFilter > 0, static function ($query) use ($userIdFilter): void {
                $query->where('causer_id', $userIdFilter)
                    ->where('causer_type', User::class);
            })
            ->when($dateFrom !== '', static function ($query) use ($dateFrom): void {
                $query->whereDate('created_at', '>=', $dateFrom);
            })
            ->when($dateTo !== '', static function ($query) use ($dateTo): void {
                $query->whereDate('created_at', '<=', $dateTo);
            })
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        $users = User::query()
            ->select(['id', 'name', 'username', 'email'])
            ->orderBy('name')
            ->get()
            ->map(static fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
            ]);

        // Transform activities manually to ensure proper serialization
        $transformedActivities = $activities->getCollection()->map(static function (Activity $activity): array {
            $properties = $activity->properties ?? [];
            $causer = $activity->causer;

            return [
                'id' => $activity->id,
                'log_name' => $activity->log_name,
                'description' => $activity->description,
                'causer' => $causer ? [
                    'id' => $causer->id,
                    'name' => $causer->name,
                    'username' => $causer->username,
                    'email' => $causer->email,
                    'avatar_url' => $causer->avatar_url ?? null,
                ] : null,
                'subject_type' => $activity->subject_type,
                'subject_id' => $activity->subject_id,
                'properties' => $properties,
                'ip_address' => $properties['ip_address'] ?? null,
                'user_agent' => $properties['user_agent'] ?? null,
                'created_at' => $activity->created_at->toIso8601String(),
            ];
        });

        // Create paginated response structure
        $paginatedActivities = [
            'data' => $transformedActivities->values()->all(),
            'links' => $activities->linkCollection()->toArray(),
            'meta' => [
                'current_page' => $activities->currentPage(),
                'last_page' => $activities->lastPage(),
                'per_page' => $activities->perPage(),
                'total' => $activities->total(),
                'from' => $activities->firstItem(),
                'to' => $activities->lastItem(),
                'path' => $activities->path(),
            ],
        ];

        return Inertia::render('Admin/ActivityLog/Index', [
            'filters' => [
                'search' => $search,
                'type' => $typeFilter,
                'user_id' => $userIdFilter,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'activities' => $paginatedActivities,
            'users' => $users,
            'activityTypes' => array_map(
                static fn (ActivityType $type) => [
                    'value' => $type->value,
                    'label' => str_replace(['.', '_'], [' ', ' '], ucwords($type->value, '.')),
                ],
                ActivityType::cases()
            ),
        ]);
    }
}
