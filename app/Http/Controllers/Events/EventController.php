<?php

namespace App\Http\Controllers\Events;

use App\Enums\EventModality;
use App\Enums\EventRsvpStatus;
use App\Enums\EventStatus;
use App\Enums\EventType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Events\SubmitEventRequest;
use App\Http\Resources\EventResource;
use App\Http\Resources\EventTagResource;
use App\Models\Event;
use App\Models\EventTag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function index(Request $request): JsonResponse|Response
    {
        $viewer = $request->user();
        $perPage = $request->integer('per_page', 12);

        $filters = [
            'search' => $request->string('search')->toString(),
            'type' => $request->string('type')->toString(),
            'modality' => $request->string('modality')->toString(),
            'tags' => $request->input('tags', []),
            'location_city' => $request->string('location_city')->toString(),
            'location_region' => $request->string('location_region')->toString(),
            'location_country' => $request->string('location_country')->toString(),
            'location_latitude' => $request->has('location_latitude') ? $request->float('location_latitude') : null,
            'location_longitude' => $request->has('location_longitude') ? $request->float('location_longitude') : null,
            'status' => $request->string('status')->toString() ?: EventStatus::Published->value,
        ];

        $baseQuery = Event::query()
            ->with(['tags', 'manager'])
            ->withCount([
                'rsvps as going_count' => fn ($query) => $query->where('status', EventRsvpStatus::Going->value),
                'rsvps as tentative_count' => fn ($query) => $query->where('status', EventRsvpStatus::Tentative->value),
                'rsvps as cancelled_count' => fn ($query) => $query->where('status', EventRsvpStatus::Cancelled->value),
            ])
            ->where('status', EventStatus::Published->value);

        if ($filters['search']) {
            $baseQuery->where('title', 'like', "%{$filters['search']}%");
        }

        if ($filters['type']) {
            $baseQuery->where('type', $filters['type']);
        }

        if ($filters['modality']) {
            $baseQuery->where('modality', $filters['modality']);
        }

        if ($filters['location_city']) {
            $baseQuery->where('location_city', 'like', "%{$filters['location_city']}%");
        }

        if ($filters['location_region']) {
            $baseQuery->where('location_region', 'like', "%{$filters['location_region']}%");
        }

        if ($filters['location_country']) {
            $baseQuery->where('location_country', 'like', "%{$filters['location_country']}%");
        }

        if (! empty($filters['tags']) && is_array($filters['tags'])) {
            $tagIds = array_filter(array_map('intval', $filters['tags']));
            if (! empty($tagIds)) {
                $baseQuery->whereHas('tags', fn ($query) => $query->whereIn('event_tags.id', $tagIds));
            }
        }

        $now = Carbon::now();

        $upcomingQuery = (clone $baseQuery)
            ->where('starts_at', '>=', $now)
            ->orderBy('starts_at');

        $upcoming = $upcomingQuery->paginate($perPage)->withQueryString();

        $past = (clone $baseQuery)
            ->where('starts_at', '<', $now)
            ->orderByDesc('starts_at')
            ->limit(6)
            ->get();

        // Get all upcoming events for featured selection (before pagination)
        $allUpcomingForFeatured = (clone $upcomingQuery)->get();

        // Get a random featured event from upcoming events (for header display)
        $featuredEvent = null;
        $featuredEventId = null;
        if ($allUpcomingForFeatured->isNotEmpty()) {
            $featuredEvent = $allUpcomingForFeatured->random();
            $featuredEventId = $featuredEvent->getKey();

            // Exclude featured event from paginated results
            $upcoming = $upcomingQuery
                ->where('id', '!=', $featuredEventId)
                ->paginate($perPage)
                ->withQueryString();
        }

        if ($viewer) {
            $viewerId = $viewer->getKey();

            $this->attachViewerRsvp($upcoming->getCollection(), $viewerId);
            $this->attachViewerRsvp($past, $viewerId);

            // Attach viewer RSVP to featured event separately
            if ($featuredEvent) {
                $viewerRsvp = $featuredEvent->rsvps()
                    ->where('user_id', $viewerId)
                    ->first();

                if ($viewerRsvp) {
                    $featuredEvent->setRelation('viewer_rsvp', $viewerRsvp);
                }
            }
        }

        $upcomingPayload = EventResource::collection($upcoming)->toResponse($request)->getData(true);
        $pastPayload = EventResource::collection($past)->resolve();
        $featuredEventPayload = $featuredEvent ? (new EventResource($featuredEvent))->resolve($request) : null;

        // Get tags only from published events
        $eventTagIds = Event::query()
            ->where('status', EventStatus::Published->value)
            ->whereHas('tags')
            ->with('tags:id')
            ->get()
            ->pluck('tags')
            ->flatten()
            ->pluck('id')
            ->unique()
            ->values();

        $eventTags = EventTag::query()
            ->whereIn('id', $eventTagIds)
            ->active()
            ->orderBy('display_order')
            ->get();

        $filtersMeta = [
            'statuses' => array_map(
                static fn (EventStatus $status) => $status->value,
                EventStatus::cases(),
            ),
            'types' => EventType::values(),
            'modalities' => EventModality::values(),
            'tags' => EventTagResource::collection($eventTags)->resolve(),
        ];

        if ($request->wantsJson()) {
            return response()->json([
                'events' => $upcomingPayload,
                'past' => $pastPayload,
                'featuredEvent' => $featuredEventPayload,
                'filters' => $filters,
                'meta' => $filtersMeta,
            ]);
        }

        $filtersForFrontend = [
            'search' => $filters['search'] ?: null,
            'type' => $filters['type'] ?: null,
            'modality' => $filters['modality'] ?: null,
            'tags' => ! empty($filters['tags']) && is_array($filters['tags'])
                ? array_map('intval', $filters['tags'])
                : null,
            'location_city' => $filters['location_city'] ?: null,
            'location_region' => $filters['location_region'] ?: null,
            'location_country' => $filters['location_country'] ?: null,
            'location_latitude' => $filters['location_latitude'] ?: null,
            'location_longitude' => $filters['location_longitude'] ?: null,
        ];

        return Inertia::render('Events/Index', [
            'events' => $upcomingPayload,
            'pastEvents' => $pastPayload,
            'featuredEvent' => $featuredEventPayload,
            'filters' => $filtersForFrontend,
            'meta' => $filtersMeta,
        ]);
    }

    public function submit(Request $request): Response
    {
        // Get tags only from published events
        $eventTagIds = Event::query()
            ->where('status', EventStatus::Published->value)
            ->whereHas('tags')
            ->with('tags:id')
            ->get()
            ->pluck('tags')
            ->flatten()
            ->pluck('id')
            ->unique()
            ->values();

        $eventTags = EventTag::query()
            ->whereIn('id', $eventTagIds)
            ->active()
            ->orderBy('display_order')
            ->get();

        $filtersMeta = [
            'types' => EventType::values(),
            'modalities' => EventModality::values(),
            'tags' => EventTagResource::collection($eventTags)->resolve(),
        ];

        return Inertia::render('Events/Submit', [
            'tags' => $filtersMeta['tags'],
            'modalities' => $filtersMeta['modalities'],
            'types' => $filtersMeta['types'],
        ]);
    }

    public function store(SubmitEventRequest $request): JsonResponse|RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $event = new Event(Arr::except($validated, ['tags']));
        $event->status = EventStatus::Pending;
        $event->submitted_by_id = $user?->getKey();
        $event->created_by_id = $user?->getKey();
        $event->submitted_at = Carbon::now();
        $event->save();

        $this->syncTags($event, $validated['tags'] ?? []);

        $event->load(['tags', 'manager'])
            ->setRelation('viewer_rsvp', null);

        $resource = new EventResource($event);

        if ($request->wantsJson()) {
            return $resource
                ->toResponse($request)
                ->setStatusCode(201);
        }

        return redirect()
            ->route('events.index')
            ->with('flash.banner', 'Your event submission has been received. We will review it shortly.');
    }

    public function show(Request $request, Event $event): JsonResponse|Response
    {
        $this->authorize('view', $event);

        $event->load([
            'tags',
            'manager',
            'creator',
            'submitter',
            'approver',
            'media',
            'occurrences' => fn ($query) => $query->orderBy('starts_at'),
        ])->loadCount([
            'rsvps as going_count' => fn ($query) => $query->where('status', EventRsvpStatus::Going->value),
            'rsvps as tentative_count' => fn ($query) => $query->where('status', EventRsvpStatus::Tentative->value),
            'rsvps as cancelled_count' => fn ($query) => $query->where('status', EventRsvpStatus::Cancelled->value),
        ]);

        $viewer = $request->user();

        if ($viewer) {
            $viewerRsvp = $event->rsvps()
                ->where('user_id', $viewer->getKey())
                ->first();

            if ($viewerRsvp) {
                $event->setRelation('viewer_rsvp', $viewerRsvp);
            }
        }

        $resource = new EventResource($event);

        if ($request->wantsJson()) {
            return $resource->toResponse($request);
        }

        return Inertia::render('Events/Show', [
            'event' => $resource->resolve(),
        ]);
    }

    /**
     * @param  Collection<int, Event>  $events
     */
    protected function attachViewerRsvp(Collection $events, int $viewerId): void
    {
        if ($events->isEmpty()) {
            return;
        }

        $events->load(['rsvps' => fn ($query) => $query->where('user_id', $viewerId)]);

        $events->each(function (Event $event) {
            $viewerRsvp = $event->rsvps->first();
            $event->setRelation('viewer_rsvp', $viewerRsvp ?: null);
            $event->unsetRelation('rsvps');
        });
    }

    /**
     * @param  array<int, int>  $tagIds
     */
    protected function syncTags(Event $event, array $tagIds): void
    {
        if ($tagIds === []) {
            $event->tags()->sync([]);

            return;
        }

        $pivot = collect($tagIds)
            ->filter()
            ->unique()
            ->values()
            ->mapWithKeys(static fn (int $tagId, int $index) => [
                $tagId => [
                    'position' => $index,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ])
            ->all();

        $event->tags()->sync($pivot);
    }
}
