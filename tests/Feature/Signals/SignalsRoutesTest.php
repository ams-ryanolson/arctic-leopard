<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

uses()
    ->group('signals')
    ->beforeEach(function () {
        $this->actingAs(User::factory()->create());
    });

it('renders signals inertia pages', function (string $uri, string $component) {
    $this
        ->get($uri)
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component($component));
})->with([
    ['/signals', 'Signals/Overview'],
    ['/signals/stats', 'Signals/Stats'],
    ['/signals/subscriptions', 'Signals/Subscriptions'],
    ['/signals/monetization', 'Signals/Monetization'],
    ['/signals/payouts', 'Signals/Payouts'],
    ['/signals/audience', 'Signals/Audience'],
    ['/signals/compliance', 'Signals/Compliance'],
    ['/signals/settings', 'Signals/Settings'],
]);

it('provides stats payload structure', function () {
    $this
        ->get('/signals/stats')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Signals/Stats')
            ->has('alerts', 4)
            ->has('metrics')
            ->has('payoutSummary.pendingTransfers', 3));
});

it('provides compliance payload structure', function () {
    $this
        ->get('/signals/compliance')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Signals/Compliance')
            ->has('disputes', 3)
            ->has('kycTasks', 3)
            ->has('documents', 3));
});

it('provides settings payload structure', function () {
    $this
        ->get('/signals/settings')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Signals/Settings')
            ->has('welcome.steps', 3)
            ->has('notifications', 3)
            ->has('automations', 3));
});


