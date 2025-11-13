<?php

namespace App\Http\Controllers\Events;

use App\Enums\EventRsvpStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Events\UpdateEventRsvpRequest;
use App\Http\Resources\EventResource;
use App\Http\Resources\EventRsvpResource;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;

class EventRsvpController extends Controller
{
    public function store(UpdateEventRsvpRequest $request, Event $event): JsonResponse|Response|RedirectResponse
    {
        $this->authorize('view', $event);

        $user = $request->user();

        $payload = $request->validated();

        $rsvp = $event->rsvps()->updateOrCreate(
            [
                'user_id' => $user->getKey(),
            ],
            [
                'status' => $payload['status'],
                'guest_count' => $payload['guest_count'] ?? 0,
                'note' => $payload['note'] ?? null,
                'responded_at' => Carbon::now(),
            ],
        );

        $rsvp->load('user');

        $event->loadCount([
            'rsvps as going_count' => fn ($query) => $query->where('status', EventRsvpStatus::Going->value),
            'rsvps as tentative_count' => fn ($query) => $query->where('status', EventRsvpStatus::Tentative->value),
            'rsvps as cancelled_count' => fn ($query) => $query->where('status', EventRsvpStatus::Cancelled->value),
        ]);

        $event->setRelation('viewer_rsvp', $rsvp);

        if ($request->wantsJson()) {
            return response()->json([
                'rsvp' => (new EventRsvpResource($rsvp))->toArray($request),
                'event' => (new EventResource($event))->resolve(),
            ]);
        }

        return redirect()->back();
    }

    public function destroy(Request $request, Event $event): Response|RedirectResponse
    {
        $this->authorize('view', $event);

        $user = $request->user();

        $event->rsvps()
            ->where('user_id', $user->getKey())
            ->delete();

        if ($request->wantsJson()) {
            return response()->noContent();
        }

        return redirect()->back();
    }
}
