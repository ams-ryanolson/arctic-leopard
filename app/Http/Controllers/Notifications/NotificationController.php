<?php

namespace App\Http\Controllers\Notifications;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;
use Inertia\ScrollMetadata;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class NotificationController extends Controller
{
    private const PER_PAGE = 20;

    private const PAGE_NAME = 'notifications';

    public function index(Request $request): Response|JsonResponse
    {
        $user = $request->user();
        $filter = $request->string('filter', 'all')->toString();
        $page = max(1, (int) $request->input(self::PAGE_NAME, 1));

        $resolver = function () use ($request, $user, $filter, $page) {
            if ($user === null) {
                return [
                    'data' => [],
                    'links' => [],
                    'meta' => [
                        'current_page' => 1,
                        'last_page' => 1,
                        'per_page' => self::PER_PAGE,
                        'total' => 0,
                    ],
                ];
            }

            $query = $user->notifications()
                ->where('notifiable_type', $user->getMorphClass())
                ->latest('created_at');

            $blockedIds = $this->blockedParticipantIds($user);

            if ($blockedIds->isNotEmpty()) {
                $query->where(function ($builder) use ($blockedIds): void {
                    foreach ($blockedIds as $blockedId) {
                        $builder->whereJsonDoesntContain('data->actor->id', $blockedId)
                            ->whereJsonDoesntContain('data->subject->id', $blockedId);
                    }
                });
            }

            if ($filter === 'unread') {
                $query->whereNull('read_at');
            }

            $notifications = $query->paginate(
                perPage: self::PER_PAGE,
                page: $page,
                pageName: self::PAGE_NAME,
            );

            $payload = NotificationResource::collection($notifications)
                ->toResponse($request)
                ->getData(true);

            data_set($payload, 'meta.filter', $filter);

            return $payload;
        };

        $notifications = Inertia::scroll(
            $resolver,
            metadata: static function (array $payload): ScrollMetadata {
                $current = (int) data_get($payload, 'meta.current_page', 1);
                $last = (int) data_get($payload, 'meta.last_page', $current);

                return new ScrollMetadata(
                    self::PAGE_NAME,
                    $current > 1 ? $current - 1 : null,
                    $current < $last ? $current + 1 : null,
                    $current,
                );
            },
        );

        if ($request->expectsJson()) {
            return response()->json($resolver());
        }

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
            'notificationsPageName' => self::PAGE_NAME,
            'notificationsPerPage' => self::PER_PAGE,
            'activeFilter' => $filter,
            'unreadCount' => $user?->unreadNotifications()->count() ?? 0,
        ]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'count' => $user?->unreadNotifications()->count() ?? 0,
        ]);
    }

    public function markRead(Request $request, DatabaseNotification $notification): JsonResponse
    {
        $user = $request->user();

        $this->guardNotification($notification, $user);

        if ($notification->read_at === null) {
            $notification->markAsRead();
        }

        return response()->json([
            'id' => $notification->id,
            'read_at' => $notification->read_at?->toJSON(),
            'unread_count' => $user->unreadNotifications()->count(),
        ]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user !== null) {
            $user->unreadNotifications()->update(['read_at' => now()]);
        }

        return response()->json([
            'unread_count' => 0,
        ], HttpResponse::HTTP_OK);
    }

    public function destroy(Request $request, DatabaseNotification $notification): JsonResponse
    {
        $user = $request->user();

        $this->guardNotification($notification, $user);

        $notification->delete();

        return response()->json([
            'id' => $notification->id,
            'unread_count' => $user->unreadNotifications()->count(),
        ]);
    }

    public function destroyAll(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(HttpResponse::HTTP_FORBIDDEN);
        }

        $user->notifications()->delete();

        return response()->json([
            'unread_count' => 0,
        ]);
    }

    private function guardNotification(DatabaseNotification $notification, ?object $user): void
    {
        if (! $user instanceof Model) {
            abort(HttpResponse::HTTP_FORBIDDEN);
        }

        $isOwner = (string) $notification->notifiable_id === (string) $user->getKey()
            && $notification->notifiable_type === $user->getMorphClass();

        abort_unless($isOwner, HttpResponse::HTTP_FORBIDDEN);
    }

    /**
     * @return Collection<int, int>
     */
    private function blockedParticipantIds(User $user): Collection
    {
        $blocked = $user->blockedUsers()
            ->pluck('users.id');

        $blockers = $user->blockers()
            ->pluck('users.id');

        return $blocked->merge($blockers)->unique()->values();
    }
}

