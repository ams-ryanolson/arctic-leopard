<?php

use App\Enums\AppealStatus;
use App\Enums\AppealType;
use App\Events\Users\AppealReviewed;
use App\Models\User;
use App\Models\UserAppeal;
use Illuminate\Support\Facades\Event;

use function Pest\Laravel\actingAs;

it('allows admin to view appeals index', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $suspendedUser = User::factory()->create();
    $suspendedUser->suspend(reason: 'Test suspension');

    UserAppeal::factory()->create([
        'user_id' => $suspendedUser->id,
        'appeal_type' => AppealType::Suspension,
        'status' => AppealStatus::Pending,
    ]);

    actingAs($admin)
        ->get('/admin/appeals')
        ->assertSuccessful();
});

it('allows admin to review and approve appeal', function (): void {
    Event::fake([AppealReviewed::class]);

    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $suspendedUser = User::factory()->create();
    $suspendedUser->suspend(reason: 'Test suspension');

    $appeal = UserAppeal::factory()->create([
        'user_id' => $suspendedUser->id,
        'appeal_type' => AppealType::Suspension,
        'status' => AppealStatus::Pending,
        'reason' => 'I believe this was a mistake',
    ]);

    actingAs($admin)
        ->post("/admin/appeals/{$appeal->id}/review", [
            'status' => 'approved',
            'review_notes' => 'Appeal approved, user was suspended in error',
        ])
        ->assertRedirect();

    $appeal->refresh();

    expect($appeal->status)->toBe(AppealStatus::Approved)
        ->and($appeal->reviewed_by_id)->toBe($admin->id)
        ->and($appeal->review_notes)->toBe('Appeal approved, user was suspended in error')
        ->and($appeal->reviewed_at)->not->toBeNull();

    Event::assertDispatched(AppealReviewed::class);
});

it('allows admin to review and reject appeal', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $bannedUser = User::factory()->create();
    $bannedUser->ban(reason: 'Test ban');

    $appeal = UserAppeal::factory()->create([
        'user_id' => $bannedUser->id,
        'appeal_type' => AppealType::Ban,
        'status' => AppealStatus::Pending,
    ]);

    actingAs($admin)
        ->post("/admin/appeals/{$appeal->id}/review", [
            'status' => 'rejected',
            'review_notes' => 'Ban was justified',
        ])
        ->assertRedirect();

    $appeal->refresh();

    expect($appeal->status)->toBe(AppealStatus::Rejected)
        ->and($appeal->reviewed_by_id)->toBe($admin->id);
});

it('denies moderator access to appeals (admin only)', function (): void {
    $moderator = User::factory()->create([
        'email_verified_at' => now(),
        'profile_completed_at' => now(),
    ]);
    $moderator->assignRole('Moderator');

    $suspendedUser = User::factory()->create();
    $suspendedUser->suspend(reason: 'Test');

    $appeal = UserAppeal::factory()->create([
        'user_id' => $suspendedUser->id,
        'appeal_type' => AppealType::Suspension,
        'status' => AppealStatus::Pending,
    ]);

    // Appeals are admin-only, moderators get redirected (302 redirect means access denied)
    actingAs($moderator)
        ->get("/admin/appeals/{$appeal->id}")
        ->assertRedirect();
});
