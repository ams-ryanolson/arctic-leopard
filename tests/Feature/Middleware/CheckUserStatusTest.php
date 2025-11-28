<?php

use App\Models\User;
use Illuminate\Support\Carbon;

use function Pest\Laravel\actingAs;

it('redirects banned user to banned page', function (): void {
    $user = User::factory()->create();
    $user->ban(reason: 'Test ban');

    actingAs($user)
        ->get('/')
        ->assertRedirect('/account/banned');
});

it('redirects suspended user to suspended page', function (): void {
    $user = User::factory()->create();
    $user->suspend(until: Carbon::now()->addDays(7), reason: 'Test suspension');

    actingAs($user)
        ->get('/')
        ->assertRedirect('/account/suspended');
});

it('allows banned user to access account status page', function (): void {
    $user = User::factory()->create();
    $user->ban(reason: 'Test ban');

    actingAs($user)
        ->get('/account/banned')
        ->assertSuccessful();
});

it('allows suspended user to access account status page', function (): void {
    $user = User::factory()->create();
    $user->suspend(until: Carbon::now()->addDays(7), reason: 'Test suspension');

    actingAs($user)
        ->get('/account/suspended')
        ->assertSuccessful();
});

it('allows banned user to access appeal routes', function (): void {
    $user = User::factory()->create();
    $user->ban(reason: 'Test ban');

    actingAs($user)
        ->get('/account/appeal/create')
        ->assertSuccessful();
});

it('allows suspended user to logout', function (): void {
    $user = User::factory()->create();
    $user->suspend(reason: 'Test suspension');

    actingAs($user)
        ->post('/logout')
        ->assertRedirect('/');
});
