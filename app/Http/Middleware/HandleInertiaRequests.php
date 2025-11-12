<?php

namespace App\Http\Middleware;

use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Services\Toasts\ToastBus;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'toasts' => $request->user()
                ? fn (): array => app(ToastBus::class)->peek($request->user())
                : [],
            'notifications' => fn (): array => [
                'unread_count' => $request->user()
                    ? $request->user()->unreadNotifications()->count()
                    : 0,
            ],
            'messaging' => fn (): array => [
                'unread_count' => $request->user()
                    ? ConversationParticipant::query()
                        ->where('user_id', $request->user()->getKey())
                        ->whereNull('left_at')
                        ->get()
                        ->sum(function (ConversationParticipant $participant): int {
                            return Message::query()
                                ->where('conversation_id', $participant->conversation_id)
                                ->when(
                                    $participant->last_read_message_id,
                                    fn ($query) => $query->where('id', '>', $participant->last_read_message_id),
                                )
                                ->count();
                        })
                    : 0,
            ],
            'features' => [
                'blocking' => config('block.enabled'),
            ],
        ];
    }
}
