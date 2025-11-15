<?php

use App\Enums\EventModality;
use App\Enums\EventRsvpStatus;
use App\Enums\EventStatus;
use App\Enums\EventType;
use App\Models\Event;
use App\Models\EventRsvp;
use App\Models\EventTag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('allows members to submit an event suggestion', function (): void {
    Carbon::setTestNow('2025-11-12 10:00:00');

    $member = User::factory()->create([
        'profile_completed_at' => Carbon::now(),
    ]);

    $this->actingAs($member);

    $payload = [
        'title' => 'Consent Lab Salon',
        'subtitle' => 'Hybrid evening with translation support',
        'description' => 'Intensive format covering breath ratios, aftercare kits, and scene mapping.',
        'type' => EventType::Workshop->value,
        'modality' => EventModality::Virtual->value,
        'starts_at' => Carbon::now()->addWeek()->toDateTimeString(),
        'ends_at' => Carbon::now()->addWeek()->addHours(2)->toDateTimeString(),
        'timezone' => 'America/Los_Angeles',
        'virtual_meeting_url' => 'https://example.com/session',
        'submission_notes' => 'Will co-host with Berlin consent collective.',
    ];

    $response = $this->post(route('events.store'), $payload);

    $response->assertRedirect(route('events.index'));

    $event = Event::query()->first();

    expect($event)->not()->toBeNull()
        ->and($event->status)->toBe(EventStatus::Pending)
        ->and($event->submitted_by_id)->toBe($member->getKey())
        ->and($event->title)->toBe($payload['title'])
        ->and($event->modality->value)->toBe(EventModality::Virtual->value)
        ->and($event->viewer_rsvp)->toBeNull();
});

it('renders the events index via inertia with upcoming and past events', function (): void {
    Carbon::setTestNow('2025-11-12 10:00:00');

    $user = User::factory()->create([
        'profile_completed_at' => Carbon::now(),
    ]);

    $futureEvent = Event::factory()->create([
        'title' => 'Future Hybrid Ritual',
        'starts_at' => Carbon::now()->addDays(3),
        'ends_at' => Carbon::now()->addDays(3)->addHours(2),
        'status' => EventStatus::Published->value,
    ]);

    // Create another upcoming event so one can be featured and one in the list
    Event::factory()->create([
        'title' => 'Another Future Event',
        'starts_at' => Carbon::now()->addDays(5),
        'ends_at' => Carbon::now()->addDays(5)->addHours(2),
        'status' => EventStatus::Published->value,
    ]);

    Event::factory()->create([
        'title' => 'Past Archive Gathering',
        'starts_at' => Carbon::now()->subDays(5),
        'ends_at' => Carbon::now()->subDays(5)->addHours(2),
        'status' => EventStatus::Published->value,
    ]);

    $this->actingAs($user)
        ->get(route('events.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Events/Index')
            ->has('events.data', 1) // Should have 1 event (the other is featured)
            ->has('pastEvents', 1)
            ->has('featuredEvent') // Should have a featured event
        );
});

it('allows admins to create, update, and transition events', function (): void {
    Carbon::setTestNow('2025-11-12 10:00:00');

    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $tags = EventTag::factory()->count(2)->create();

    $this->actingAs($admin);

    $storePayload = [
        'title' => 'Leather Atlas Field Trip',
        'subtitle' => 'Warehouse residency',
        'description' => 'Pop-up with bilingual scouts and circle-only aftercare.',
        'status' => EventStatus::Draft->value,
        'type' => EventType::Meetup->value,
        'modality' => EventModality::InPerson->value,
        'starts_at' => Carbon::now()->addDays(10)->toDateTimeString(),
        'ends_at' => Carbon::now()->addDays(10)->addHours(4)->toDateTimeString(),
        'timezone' => 'Europe/Berlin',
        'avatar_path' => 'events/avatars/field-trip.jpg',
        'cover_path' => 'events/covers/field-trip.jpg',
        'location_name' => 'Warehouse District Pop-up',
        'location_city' => 'Berlin',
        'location_region' => 'Berlin',
        'location_country' => 'DE',
        'virtual_meeting_url' => null,
        'tags' => $tags->pluck('id')->all(),
        'is_recurring' => true,
        'recurrence_rule' => 'RRULE:FREQ=WEEKLY;COUNT=2',
        'occurrences' => [
            [
                'title' => 'Leather Atlas Field Trip · Week 2',
                'starts_at' => Carbon::now()->addDays(17)->toDateTimeString(),
                'ends_at' => Carbon::now()->addDays(17)->addHours(4)->toDateTimeString(),
            ],
        ],
    ];

    $storeResponse = $this->postJson(route('admin.events.store'), $storePayload);

    $storeResponse->assertCreated()
        ->assertJsonPath('data.title', 'Leather Atlas Field Trip')
        ->assertJsonPath('data.status', EventStatus::Draft->value);

    $event = Event::query()->latest()->first();

    expect($event)->not()->toBeNull()
        ->and($event->tags()->pluck('event_tags.id')->sort()->values()->all())
        ->toEqualCanonicalizing($tags->pluck('id')->all())
        ->and($event->occurrences()->count())->toBe(1);

    $updateResponse = $this->putJson(route('admin.events.update', $event), [
        'manager_id' => $admin->getKey(),
        'status' => EventStatus::Published->value,
    ]);

    $updateResponse->assertOk()
        ->assertJsonPath('data.status', EventStatus::Published->value)
        ->assertJsonPath('data.manager.id', $admin->getKey());

    $event->refresh();

    expect($event->status->value)->toBe(EventStatus::Published->value)
        ->and($event->manager_id)->toBe($admin->getKey());

    $pendingEvent = Event::factory()->create([
        'status' => EventStatus::Pending->value,
        'starts_at' => Carbon::now()->addDay(),
        'submitted_by_id' => User::factory()->create()->getKey(),
    ]);

    $this->postJson(route('admin.events.approve', $pendingEvent))
        ->assertOk()
        ->assertJsonPath('data.status', EventStatus::Draft->value);

    $pendingEvent->refresh();

    expect($pendingEvent->status->value)->toBe(EventStatus::Draft->value)
        ->and($pendingEvent->approved_by_id)->toBe($admin->getKey())
        ->and($pendingEvent->approved_at)->not()->toBeNull();

    $this->postJson(route('admin.events.publish', $pendingEvent))
        ->assertOk()
        ->assertJsonPath('data.status', EventStatus::Published->value);

    $pendingEvent->refresh();

    expect($pendingEvent->status->value)->toBe(EventStatus::Published->value)
        ->and($pendingEvent->published_at)->not()->toBeNull();

    $this->postJson(route('admin.events.cancel', $pendingEvent))
        ->assertOk()
        ->assertJsonPath('data.status', EventStatus::Cancelled->value);

    $pendingEvent->refresh();

    expect($pendingEvent->status->value)->toBe(EventStatus::Cancelled->value)
        ->and($pendingEvent->cancelled_at)->not()->toBeNull();
});

it('allows members to RSVP going or tentative and remove their RSVP', function (): void {
    Carbon::setTestNow('2025-11-12 10:00:00');

    $user = User::factory()->create([
        'profile_completed_at' => Carbon::now(),
    ]);

    $event = Event::factory()->create([
        'status' => EventStatus::Published->value,
        'starts_at' => Carbon::now()->addDay(),
        'allow_guests' => true,
    ]);

    $this->actingAs($user);

    $response = $this->post(route('events.rsvps.store', $event), [
        'status' => EventRsvpStatus::Going->value,
        'guest_count' => 2,
    ]);

    $response->assertRedirect();

    $rsvp = EventRsvp::query()->first();

    expect($rsvp)->not()->toBeNull()
        ->and($rsvp->status->value)->toBe(EventRsvpStatus::Going->value)
        ->and($rsvp->guest_count)->toBe(2);

    $this->delete(route('events.rsvps.destroy', $event))
        ->assertRedirect();

    expect(EventRsvp::query()->count())->toBe(0);
});
