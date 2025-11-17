<?php

use App\Enums\PostAudience;
use App\Enums\TimelineVisibilitySource;
use App\Models\Payments\PaymentIntent;
use App\Models\Post;
use App\Models\Timeline;
use App\Models\User;
use App\Payments\Data\PaymentCaptureData;
use App\Services\Payments\PaymentService;
use App\ValueObjects\Money;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

it('allows a user to purchase a paywalled post', function (): void {
    $author = User::factory()->create();
    $buyer = User::factory()->create();

    $post = Post::factory()
        ->for($author, 'author')
        ->create([
            'audience' => PostAudience::PayToView->value,
            'paywall_price' => 1500,
            'paywall_currency' => 'USD',
        ]);

    Sanctum::actingAs($buyer);

    $response = $this->postJson("/api/posts/{$post->getKey()}/purchase", [
        'amount' => 1500,
        'currency' => 'USD',
        'provider' => 'stripe',
        'provider_reference' => 'txn_123',
    ]);

    $response->assertCreated()
        ->assertJson(fn ($json) => $json
            ->has('purchase', fn ($data) => $data
                ->where('post_id', $post->getKey())
                ->where('amount', 1500)
                ->where('currency', 'USD')
                ->etc()
            )
            ->has('payment_intent')
        );

    $intentData = $response->json('payment_intent');
    $intent = PaymentIntent::query()->findOrFail($intentData['id']);

    app(PaymentService::class)->capture(
        $intent,
        new PaymentCaptureData(
            providerIntentId: $intent->provider_intent_id,
            amount: Money::from(1500, 'USD')
        )
    );

    $purchase = $post->purchases()->first();

    expect($purchase)->not->toBeNull()
        ->and($purchase->user_id)->toBe($buyer->getKey());

    expect(
        Timeline::query()
            ->where('user_id', $buyer->getKey())
            ->where('post_id', $post->getKey())
            ->where('visibility_source', TimelineVisibilitySource::PaywallPurchase->value)
            ->exists()
    )->toBeTrue();
});
