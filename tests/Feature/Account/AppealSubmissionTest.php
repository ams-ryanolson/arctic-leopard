<?php

use App\Enums\AppealStatus;
use App\Enums\AppealType;
use App\Events\Users\AppealSubmitted;
use App\Models\User;
use App\Models\UserAppeal;
use Illuminate\Support\Facades\Event;

use function Pest\Laravel\actingAs;

it('allows suspended user to submit appeal', function (): void {
    Event::fake([AppealSubmitted::class]);

    $user = User::factory()->create();
    $user->suspend(reason: 'Test suspension');

    actingAs($user)
        ->post('/account/appeal', [
            'reason' => 'I believe this suspension was a mistake. Please review my account.',
        ])
        ->assertRedirect();

    $appeal = UserAppeal::where('user_id', $user->id)->first();

    expect($appeal)->not->toBeNull()
        ->and($appeal->appeal_type)->toBe(AppealType::Suspension)
        ->and($appeal->status)->toBe(AppealStatus::Pending)
        ->and($appeal->reason)->toContain('mistake');

    Event::assertDispatched(AppealSubmitted::class);
});

it('allows banned user to submit appeal', function (): void {
    $user = User::factory()->create();
    $user->ban(reason: 'Test ban');

    actingAs($user)
        ->post('/account/appeal', [
            'reason' => 'I would like to appeal this ban. I believe there was a misunderstanding.',
        ])
        ->assertRedirect();

    $appeal = UserAppeal::where('user_id', $user->id)->first();

    expect($appeal)->not->toBeNull()
        ->and($appeal->appeal_type)->toBe(AppealType::Ban);
});

it('prevents user from submitting multiple pending appeals', function (): void {
    $user = User::factory()->create();
    $user->suspend(reason: 'Test suspension');

    UserAppeal::factory()->create([
        'user_id' => $user->id,
        'appeal_type' => AppealType::Suspension,
        'status' => AppealStatus::Pending,
    ]);

    // User with pending appeal should be forbidden from submitting another
    actingAs($user)
        ->postJson('/account/appeal', [
            'reason' => 'Second appeal attempt',
        ])
        ->assertForbidden();
});

it('requires minimum 10 characters in appeal reason', function (): void {
    $user = User::factory()->create();
    $user->suspend(reason: 'Test suspension');

    actingAs($user)
        ->post('/account/appeal', [
            'reason' => 'Short',
        ])
        ->assertSessionHasErrors('reason');
});

it('prevents non-suspended/non-banned user from submitting appeal', function (): void {
    $user = User::factory()->create();

    actingAs($user)
        ->post('/account/appeal', [
            'reason' => 'I want to appeal something',
        ])
        ->assertForbidden();
});
