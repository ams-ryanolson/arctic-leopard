<?php

use App\Models\Hashtag;
use App\Models\Interest;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

it('displays a public profile preview for guests', function (): void {
    $user = User::factory()->create([
        'username' => 'testuser',
        'display_name' => 'Test User',
        'bio' => '<p>This is my bio</p>',
        'pronouns' => 'They/Them',
        'location_region' => 'NY',
        'location_country' => 'USA',
    ]);

    $this->get(route('profile.show', ['username' => 'testuser']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Profile/Preview')
            ->has('user', fn (Assert $userPage) => $userPage
                ->where('username', 'testuser')
                ->where('display_name', 'Test User')
                ->where('bio', '<p>This is my bio</p>')
                ->where('pronouns', 'They/Them')
                ->where('location', 'NY, USA')
                ->etc()
            )
            ->has('stats', fn (Assert $stats) => $stats
                ->has('followers')
                ->has('following')
                ->has('posts')
            )
            ->has('profileUrl')
        );
});

it('displays a user profile by username for authenticated users', function (): void {
    Carbon::setTestNow('2025-01-01 00:00:00');

    $viewer = User::factory()->create();

    $user = User::factory()->create([
        'username' => 'testuser',
        'display_name' => 'Test User',
        'bio' => '<p>This is my bio</p>',
        'pronouns' => 'They/Them',
        'location_city' => 'New York',
        'location_region' => 'NY',
        'location_country' => 'USA',
        'birthdate' => '1990-01-01',
    ]);

    $interest = Interest::factory()->create(['name' => 'Rope']);
    $user->interests()->attach($interest);

    $hashtag = Hashtag::factory()->create(['name' => 'kink']);
    $user->hashtags()->attach($hashtag);

    $this->actingAs($viewer)
        ->get(route('profile.show', ['username' => 'testuser']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Profile/Show')
            ->has('user', fn (Assert $userPage) => $userPage
                ->where('username', 'testuser')
                ->where('display_name', 'Test User')
                ->where('bio', '<p>This is my bio</p>')
                ->where('pronouns', 'They/Them')
                ->where('location', 'NY, USA')
                ->where('age', 35)
                ->where('is_following', false)
                ->where('can_follow', true)
                ->has('interests', 1)
                ->has('hashtags', 1)
                ->etc()
            )
            ->where('isOwnProfile', false)
        );

    Carbon::setTestNow();
});

it('returns 404 for non-existent username', function (): void {
    $this->get('/p/nonexistent')->assertNotFound();
});

it('shows own profile with edit indicator', function (): void {
    $user = User::factory()->create([
        'username' => 'myuser',
    ]);

    $this->actingAs($user)
        ->get('/p/myuser')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('isOwnProfile', true)
        );
});

it('handles username case-insensitively for guests', function (): void {
    User::factory()->create([
        'username' => 'TestUser',
    ]);

    // Guests should see the Preview page regardless of case
    $this->get('/p/testuser')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('Profile/Preview'));
    $this->get('/p/TESTUSER')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('Profile/Preview'));
    $this->get('/p/TestUser')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('Profile/Preview'));
});

it('handles username case-insensitively for authenticated users', function (): void {
    $viewer = User::factory()->create();

    User::factory()->create([
        'username' => 'TestUser',
    ]);

    // Authenticated users should see the full Show page regardless of case
    $this->actingAs($viewer)->get('/p/testuser')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('Profile/Show'));
    $this->actingAs($viewer)->get('/p/TESTUSER')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('Profile/Show'));
    $this->actingAs($viewer)->get('/p/TestUser')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('Profile/Show'));
});

// TODO: Privacy tests
// it('blocks viewing profile when user is blocked by owner')
// it('blocks viewing private profile without permission')
// it('blocks viewing profile from restricted regions')
