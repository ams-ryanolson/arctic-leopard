<?php

namespace App\Http\Controllers\Events;

use App\Enums\EventModality;
use App\Enums\EventRsvpStatus;
use App\Enums\EventStatus;
use App\Enums\EventType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Events\StoreEventRequest;
use App\Http\Requests\Events\UpdateEventRequest;
use App\Http\Resources\EventResource;
use App\Models\Event;
use App\Models\User;
use App\Services\Events\EventRecurrenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class EventAdminController extends Controller
{
    public function __construct(
        protected EventRecurrenceService $recurrenceService,
    ) {}

    public function index(Request $request): JsonResponse|InertiaResponse
    {
        Gate::authorize('viewAny', Event::class);

        $perPage = $request->integer('per_page', 25);
        $query = Event::query()
            ->with(['manager', 'creator', 'submitter', 'approver', 'tags'])
            ->withCount([
                'rsvps as going_count' => fn ($query) => $query->where('status', EventRsvpStatus::Going->value),
                'rsvps as tentative_count' => fn ($query) => $query->where('status', EventRsvpStatus::Tentative->value),
                'rsvps as cancelled_count' => fn ($query) => $query->where('status', EventRsvpStatus::Cancelled->value),
                'occurrences',
            ])
            ->orderByDesc('starts_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('manager_id')) {
            $query->where('manager_id', $request->integer('manager_id'));
        }

        if ($request->filled('search')) {
            $term = $request->string('search')->toString();

            $query->where(function ($builder) use ($term) {
                $builder
                    ->where('title', 'like', "%{$term}%")
                    ->orWhere('description', 'like', "%{$term}%")
                    ->orWhere('location_city', 'like', "%{$term}%");
            });
        }

        $events = $query->paginate($perPage)->withQueryString();

        if ($request->wantsJson()) {
            return EventResource::collection($events)->toResponse($request);
        }

        $filters = [
            'status' => $request->string('status')->toString() ?: null,
            'type' => $request->string('type')->toString() ?: null,
            'modality' => $request->string('modality')->toString() ?: null,
            'search' => $request->string('search')->toString() ?: null,
        ];

        $payload = EventResource::collection($events)
            ->toResponse($request)
            ->getData(true);

        return Inertia::render('Admin/Events/Index', [
            'events' => $payload,
            'filters' => $filters,
            'meta' => [
                'statuses' => array_map(
                    static fn (EventStatus $status) => $status->value,
                    EventStatus::cases(),
                ),
                'types' => EventType::values(),
                'modalities' => EventModality::values(),
            ],
        ]);
    }

    public function store(StoreEventRequest $request): JsonResponse|Response
    {
        Gate::authorize('create', Event::class);

        $admin = $request->user();
        $validated = $request->validated();

        /** @var Event $event */
        $event = DB::transaction(function () use ($validated, $admin) {
            $event = new Event(Arr::except($validated, ['tags', 'occurrences']));
            $event->created_by_id = $admin?->getKey();

            if (! $event->submitted_by_id && $admin) {
                $event->submitted_by_id = $admin->getKey();
            }

            if ($event->status === null) {
                $event->status = EventStatus::Draft;
            }

            if ($event->status === EventStatus::Published && $event->published_at === null) {
                $event->published_at = Carbon::now();
            }

            if ($event->status === EventStatus::Cancelled && $event->cancelled_at === null) {
                $event->cancelled_at = Carbon::now();
            }

            $event->save();

            $this->syncTags($event, $validated['tags'] ?? []);

            if (! empty($validated['occurrences'])) {
                $this->recurrenceService->syncOccurrences($event, $validated['occurrences']);
            }

            return $event;
        });

        $event->load(['tags', 'manager', 'creator', 'submitter', 'approver'])
            ->loadCount([
                'rsvps as going_count' => fn ($query) => $query->where('status', EventRsvpStatus::Going->value),
                'rsvps as tentative_count' => fn ($query) => $query->where('status', EventRsvpStatus::Tentative->value),
                'rsvps as cancelled_count' => fn ($query) => $query->where('status', EventRsvpStatus::Cancelled->value),
            ]);

        if ($request->wantsJson()) {
            return (new EventResource($event))
                ->toResponse($request)
                ->setStatusCode(Response::HTTP_CREATED);
        }

        return redirect()
            ->route('admin.events.index')
            ->with('flash.banner', 'Event created successfully.');
    }

    public function show(Request $request, Event $event): JsonResponse|Response
    {
        Gate::authorize('view', $event);

        $event->load([
            'tags',
            'manager',
            'creator',
            'submitter',
            'approver',
            'occurrences',
        ])->loadCount([
            'rsvps as going_count' => fn ($query) => $query->where('status', EventRsvpStatus::Going->value),
            'rsvps as tentative_count' => fn ($query) => $query->where('status', EventRsvpStatus::Tentative->value),
            'rsvps as cancelled_count' => fn ($query) => $query->where('status', EventRsvpStatus::Cancelled->value),
        ]);

        return $request->wantsJson()
            ? (new EventResource($event))->toResponse($request)
            : redirect()->route('events.show', $event);
    }

    public function update(UpdateEventRequest $request, Event $event): JsonResponse|Response
    {
        Gate::authorize('update', $event);

        $validated = $request->validated();
        $attributes = Arr::except($validated, ['tags', 'occurrences', 'manager_id']);

        DB::transaction(function () use ($event, $attributes, $validated, $request) {
            if ($attributes !== []) {
                $event->fill($attributes);
            }

            if (array_key_exists('status', $validated)) {
                $status = EventStatus::from($validated['status']);
                $event->status = $status;

                if ($status === EventStatus::Published && $event->published_at === null) {
                    $event->published_at = Carbon::now();
                }

                if ($status === EventStatus::Cancelled && $event->cancelled_at === null) {
                    $event->cancelled_at = Carbon::now();
                }

                if ($status === EventStatus::Pending) {
                    $event->approved_at = null;
                    $event->approved_by_id = null;
                }
            }

            if ($request->filled('manager_id')) {
                $manager = User::query()->find($request->integer('manager_id'));
                $event->manager()->associate($manager);
            } elseif (array_key_exists('manager_id', $validated)) {
                $event->manager()->dissociate();
            }

            $event->save();

            if (array_key_exists('tags', $validated)) {
                $this->syncTags($event, $validated['tags'] ?? []);
            }

            if (array_key_exists('occurrences', $validated)) {
                $this->recurrenceService->syncOccurrences($event, $validated['occurrences'] ?? []);
            }
        });

        $event->refresh()
            ->load(['tags', 'manager', 'creator', 'submitter', 'approver'])
            ->loadCount([
                'rsvps as going_count' => fn ($query) => $query->where('status', EventRsvpStatus::Going->value),
                'rsvps as tentative_count' => fn ($query) => $query->where('status', EventRsvpStatus::Tentative->value),
                'rsvps as cancelled_count' => fn ($query) => $query->where('status', EventRsvpStatus::Cancelled->value),
            ]);

        if ($request->wantsJson()) {
            return (new EventResource($event))->toResponse($request);
        }

        return redirect()
            ->back()
            ->with('flash.banner', 'Event updated.');
    }

    public function destroy(Request $request, Event $event): Response
    {
        Gate::authorize('delete', $event);

        $event->delete();

        if ($request->wantsJson()) {
            return response()->noContent();
        }

        return redirect()
            ->back()
            ->with('flash.banner', 'Event archived.');
    }

    public function approve(Request $request, Event $event): JsonResponse|Response
    {
        Gate::authorize('approve', $event);

        $event->status = EventStatus::Draft;
        $event->approved_at = Carbon::now();
        $event->approved_by_id = $request->user()?->getKey();
        $event->save();

        if ($request->wantsJson()) {
            return (new EventResource($event->fresh(['tags', 'manager', 'creator', 'submitter', 'approver'])))->toResponse($request);
        }

        return redirect()
            ->back()
            ->with('flash.banner', 'Event approved.');
    }

    public function publish(Request $request, Event $event): JsonResponse|Response
    {
        Gate::authorize('publish', $event);

        $event->status = EventStatus::Published;
        $event->published_at ??= Carbon::now();
        $event->save();

        if ($request->wantsJson()) {
            return (new EventResource($event->fresh(['tags', 'manager', 'creator', 'submitter', 'approver'])))->toResponse($request);
        }

        return redirect()
            ->back()
            ->with('flash.banner', 'Event published.');
    }

    public function cancel(Request $request, Event $event): JsonResponse|Response
    {
        Gate::authorize('cancel', $event);

        $event->status = EventStatus::Cancelled;
        $event->cancelled_at = Carbon::now();

        if ($request->filled('admin_notes')) {
            $event->admin_notes = trim($request->string('admin_notes')->toString());
        }

        $event->save();

        if ($request->wantsJson()) {
            return (new EventResource($event->fresh(['tags', 'manager', 'creator', 'submitter', 'approver'])))->toResponse($request);
        }

        return redirect()
            ->back()
            ->with('flash.banner', 'Event cancelled.');
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
