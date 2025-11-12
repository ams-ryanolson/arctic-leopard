<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

uses()
    ->group('radar')
    ->beforeEach(function (): void {
        $this->user = User::factory()->create([
            'profile_completed_at' => now(),
            'location_city' => 'Los Angeles',
            'location_region' => 'CA',
            'location_country' => 'US',
            'location_latitude' => 34.052235,
            'location_longitude' => -118.243683,
        ]);

        $this->actingAs($this->user);
    });

it('renders the radar experience', function (): void {
    $coordinates = collect([
        ['lat' => 34.0511, 'lng' => -118.2445],
        ['lat' => 34.0532, 'lng' => -118.2411],
        ['lat' => 34.0565, 'lng' => -118.2402],
        ['lat' => 34.0578, 'lng' => -118.2457],
        ['lat' => 34.0481, 'lng' => -118.2503],
        ['lat' => 34.0622, 'lng' => -118.2538],
        ['lat' => 34.0449, 'lng' => -118.2551],
        ['lat' => 34.0664, 'lng' => -118.2386],
        ['lat' => 34.0712, 'lng' => -118.2315],
        ['lat' => 34.0403, 'lng' => -118.2695],
        ['lat' => 34.0592, 'lng' => -118.2654],
        ['lat' => 34.0468, 'lng' => -118.2612],
        ['lat' => 34.0505, 'lng' => -118.2305],
        ['lat' => 34.0421, 'lng' => -118.2229],
        ['lat' => 34.0744, 'lng' => -118.2488],
    ]);

    $coordinates->each(function (array $point): void {
        User::factory()->create([
            'profile_completed_at' => now(),
            'location_city' => 'Los Angeles',
            'location_region' => 'CA',
            'location_country' => 'US',
            'location_latitude' => $point['lat'],
            'location_longitude' => $point['lng'],
        ]);
    });

    $this
        ->get('/radar')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Radar/Index')
            ->where('viewer.name', $this->user->display_name ?? $this->user->username ?? $this->user->name)
            ->where('viewer.location.city', 'Los Angeles')
            ->where('perPage', 12)
            ->where('radar.meta.current_page', 1)
            ->where('radar.meta.last_page', fn (int $lastPage) => $lastPage >= 2)
            ->has('radar.data', 12)
            ->has('filters.positions', 3)
            ->has('spotlights', 3)
            ->etc());
});

it('redirects guests to the login flow', function (): void {
    auth()->logout();

    $this
        ->get('/radar')
        ->assertRedirect(route('login'));
});

it('orders radar results by proximity', function (): void {
    $viewerLat = 34.052235;
    $viewerLng = -118.243683;

    $closest = User::factory()->create([
        'profile_completed_at' => now(),
        'location_city' => 'Los Angeles',
        'location_region' => 'CA',
        'location_country' => 'US',
        'location_latitude' => 34.053235,
        'location_longitude' => -118.243683,
    ]);

    $middle = User::factory()->create([
        'profile_completed_at' => now(),
        'location_city' => 'Los Angeles',
        'location_region' => 'CA',
        'location_country' => 'US',
        'location_latitude' => 34.062235,
        'location_longitude' => -118.253683,
    ]);

    $furthest = User::factory()->create([
        'profile_completed_at' => now(),
        'location_city' => 'Los Angeles',
        'location_region' => 'CA',
        'location_country' => 'US',
        'location_latitude' => 34.092235,
        'location_longitude' => -118.293683,
    ]);

    User::factory()->count(3)->create([
        'profile_completed_at' => now(),
        'location_city' => 'Los Angeles',
        'location_region' => 'CA',
        'location_country' => 'US',
        'location_latitude' => fake()->latitude($viewerLat - 0.3, $viewerLat + 0.3),
        'location_longitude' => fake()->longitude($viewerLng - 0.3, $viewerLng + 0.3),
    ]);

    $this
        ->get('/radar')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('radar.data.0.id', $closest->id)
            ->where('radar.data.1.id', $middle->id)
            ->where('radar.data.2.id', $furthest->id)
            ->where('radar.data.0.distance_km', fn ($distance) => (float) $distance >= 0 && (float) $distance < 1)
            ->where('radar.data.1.distance_km', fn ($distance) => (float) $distance > 1 && (float) $distance < 2)
            ->where('radar.data.2.distance_km', fn ($distance) => (float) $distance > 5)
            ->etc());
});

it('limits radar results to players within fifty kilometers when available', function (): void {
    $nearby = User::factory()->create([
        'profile_completed_at' => now(),
        'location_city' => 'Los Angeles',
        'location_region' => 'CA',
        'location_country' => 'US',
        'location_latitude' => 34.082235,
        'location_longitude' => -118.253683,
    ]);

    $farAway = User::factory()->create([
        'profile_completed_at' => now(),
        'location_city' => 'New York',
        'location_region' => 'NY',
        'location_country' => 'US',
        'location_latitude' => 40.7128,
        'location_longitude' => -74.006,
    ]);

    $this
        ->get('/radar')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('radar.data', function ($profiles) use ($nearby, $farAway): bool {
                $ids = collect($profiles)->pluck('id');

                return $ids->contains($nearby->id) && ! $ids->contains($farAway->id);
            })
            ->where('radar.meta.total', fn (int $total) => $total >= 1)
            ->etc());
});
