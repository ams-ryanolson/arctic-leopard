<?php

use App\Models\Circle;
use App\Models\Hashtag;
use App\Models\Interest;
use App\Models\User;
use Illuminate\Support\Str;

beforeEach(function (): void {
    $this->withoutExceptionHandling();
});

test('a user can update profile basics with interests and hashtags', function (): void {
    $interests = Interest::factory()->count(3)->sequence(
        ['name' => 'Rope Artistry'],
        ['name' => 'Impact Play'],
        ['name' => 'Aftercare Rituals'],
    )->create();

    $interests->each(function (Interest $interest, int $index): void {
        Circle::factory()
            ->for($interest)
            ->create([
                'name' => $interest->name,
                'slug' => Str::slug($interest->name),
                'sort_order' => $index + 1,
            ]);
    });

    $existingHashtag = Hashtag::factory()->create([
        'name' => 'ropephoria',
        'slug' => 'ropephoria',
        'usage_count' => 0,
    ]);

    $user = User::factory()->create([
        'display_name' => null,
        'pronouns' => null,
        'bio' => null,
    ]);

    $payload = [
        'display_name' => 'Edge Guardian',
        'pronouns' => 'he/they',
        'bio' => '<strong>Ready</strong> for late-night sessions<br>Bring your best energy.',
        'interests' => [$interests[0]->id, $interests[2]->id],
        'hashtags' => ['ropephoria', 'nightflight'],
    ];

    $this->actingAs($user)
        ->from(route('onboarding.profile'))
        ->put(route('onboarding.profile.update'), $payload)
        ->assertRedirect(route('onboarding.media'));

    $user->refresh();

    expect($user->display_name)->toBe('Edge Guardian')
        ->and($user->pronouns)->toBe('he/they')
        ->and($user->bio)->toBe('<strong>Ready</strong> for late-night sessions<br>Bring your best energy.')
        ->and($user->interests()->pluck('interests.id')->sort()->values()->all())->toBe(
            collect([$interests[0]->id, $interests[2]->id])->sort()->values()->all()
        )
        ->and($user->hashtags()->pluck('name')->sort()->values()->all())->toBe(
            collect(['ropephoria', 'nightflight'])->sort()->values()->all()
        );

    expect(Hashtag::where('name', 'nightflight')->exists())->toBeTrue();

    $updatedExisting = $existingHashtag->refresh();
    $newHashtag = Hashtag::where('name', 'nightflight')->firstOrFail();

    expect($updatedExisting->usage_count)->toBe(1)
        ->and($newHashtag->usage_count)->toBe(1);

    $expectedCircleIds = Circle::query()
        ->whereIn('interest_id', $payload['interests'])
        ->pluck('id')
        ->sort()
        ->values()
        ->all();

    expect(
        $user->circles()
            ->pluck('circles.id')
            ->sort()
            ->values()
            ->all()
    )->toBe($expectedCircleIds);
});

test('bio must respect the 2500 character limit after sanitization', function (): void {
    $user = User::factory()->create();

    $oversized = str_repeat('a', 2501);

    $this->withExceptionHandling();

    $this->actingAs($user)
        ->from(route('onboarding.profile'))
        ->put(route('onboarding.profile.update'), [
            'display_name' => 'Signal Keeper',
            'pronouns' => 'they/them',
            'bio' => $oversized,
            'interests' => [],
            'hashtags' => [],
        ])
        ->assertRedirect(route('onboarding.profile'))
        ->assertSessionHasErrors('bio');
});

test('a user cannot select more than five interests', function (): void {
    $user = User::factory()->create();
    $interests = Interest::factory()->count(6)->create();

    $this->withExceptionHandling();

    $this->actingAs($user)
        ->from(route('onboarding.profile'))
        ->put(route('onboarding.profile.update'), [
            'display_name' => 'Limit Tester',
            'pronouns' => 'she/they',
            'bio' => 'Testing limits.',
            'interests' => $interests->pluck('id')->all(),
            'hashtags' => [],
        ])
        ->assertRedirect(route('onboarding.profile'))
        ->assertSessionHasErrors('interests');
});

