<?php

use App\Http\Controllers\Comments\CommentController;
use App\Http\Controllers\Comments\CommentLikeController;
use App\Http\Controllers\Feed\CircleFeedController;
use App\Http\Controllers\Feed\FollowingFeedController;
use App\Http\Controllers\Feed\UserFeedController;
use App\Http\Controllers\Hashtags\HashtagController;
use App\Http\Controllers\Messaging\ConversationController;
use App\Http\Controllers\Messaging\ConversationMessageController;
use App\Http\Controllers\Messaging\ConversationParticipantController;
use App\Http\Controllers\Messaging\ConversationPresenceController;
use App\Http\Controllers\Messaging\ConversationReadController;
use App\Http\Controllers\Messaging\MessageController as MessagingMessageController;
use App\Http\Controllers\Messaging\MessageReactionController;
use App\Http\Controllers\Messaging\TipRequestController;
use App\Http\Controllers\Payments\PaymentMethodController;
use App\Http\Controllers\Posts\MediaController;
use App\Http\Controllers\Posts\PollVoteController;
use App\Http\Controllers\Posts\PostController;
use App\Http\Controllers\Posts\PostLikeController;
use App\Http\Controllers\Posts\PostRepostController;
use App\Http\Controllers\Posts\PostViewController;
use App\Http\Controllers\Posts\PurchaseController;
use App\Http\Controllers\Search\SearchController;
use App\Http\Controllers\Settings\VerificationController;
use App\Http\Controllers\Signals\PlaybookArticleLikeController;
use App\Http\Controllers\Subscriptions\SubscriptionController;
use App\Http\Controllers\Subscriptions\SubscriptionPlanController;
use App\Http\Controllers\Webhooks\PaymentWebhookController;
use App\Http\Controllers\Webhooks\SumsubWebhookController;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Payments\PaymentSubscription;
use App\Models\Payments\SubscriptionPlan;
use App\Models\PlaybookArticle;
use Illuminate\Http\Middleware\VerifyCsrfToken;
use Illuminate\Support\Facades\Route;

Route::model('subscription', PaymentSubscription::class);
Route::model('subscriptionPlan', SubscriptionPlan::class);
Route::model('conversation', Conversation::class);
Route::model('article', PlaybookArticle::class);
Route::bind('message', static fn ($value) => Message::withTrashed()->findOrFail($value));

Route::post('webhooks/payments/{provider}', [PaymentWebhookController::class, 'store'])->name('webhooks.payments.store');

Route::post('webhooks/sumsub', [SumsubWebhookController::class, 'handle'])
    ->withoutMiddleware([VerifyCsrfToken::class])
    ->name('webhooks.sumsub');

Route::apiResource('posts', PostController::class)->only(['index', 'show']);
Route::apiResource('posts.comments', CommentController::class)->only(['index']);
Route::post('posts/{post}/views', [PostViewController::class, 'store'])->name('posts.views.store');

Route::get('feed/users/{user}', [UserFeedController::class, 'index'])->name('feed.user');

// Search endpoints
Route::get('search/autocomplete', [SearchController::class, 'autocomplete'])->name('search.autocomplete');
Route::get('search', [SearchController::class, 'index'])->name('search.index');

// Hashtag endpoints
Route::get('hashtags/{hashtag:slug}/posts', [HashtagController::class, 'posts'])->name('hashtags.posts');

// Public endpoint to get client IP (for fraud detection)
Route::get('client-ip', function () {
    return response()->json([
        'ip' => request()->ip(),
    ]);
})->name('api.client-ip');

Route::get('users/{user}/profile', [\App\Http\Controllers\UserProfileController::class, 'show'])->name('users.profile.show');

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('search/mentions', [SearchController::class, 'mentions'])->name('search.mentions');
    Route::get('search/hashtags', [SearchController::class, 'hashtags'])->name('search.hashtags');
    Route::get('payment-methods/frontend-token', [PaymentMethodController::class, 'getFrontendToken'])->name('payment-methods.frontend-token');
    Route::apiResource('payment-methods', PaymentMethodController::class);
    Route::post('payment-methods/{paymentMethod}/set-default', [PaymentMethodController::class, 'setDefault'])->name('payment-methods.set-default');

    Route::post('payments/capture', [\App\Http\Controllers\Payments\PaymentController::class, 'capture'])->name('payments.capture');

    Route::apiResource('posts', PostController::class)->only(['store', 'update', 'destroy']);

    Route::get('feed/following', [FollowingFeedController::class, 'index'])->name('feed.following');
    Route::get('feed/circles/{circle:slug}', [CircleFeedController::class, 'show'])->name('feed.circle');

    Route::apiResource('posts.comments', CommentController::class)->only(['store', 'destroy']);
    Route::post('posts/{post}/comments/{comment}/like', [CommentLikeController::class, 'store'])->name('posts.comments.like.store');
    Route::delete('posts/{post}/comments/{comment}/like', [CommentLikeController::class, 'destroy'])->name('posts.comments.like.destroy');

    Route::post('posts/{post}/purchase', [PurchaseController::class, 'store'])->name('posts.purchase.store');
    Route::post('posts/{post}/like', [PostLikeController::class, 'store'])->name('posts.like.store');
    Route::delete('posts/{post}/like', [PostLikeController::class, 'destroy'])->name('posts.like.destroy');
    Route::post('posts/{post}/amplify', [PostRepostController::class, 'store'])->name('posts.amplify.store');
    Route::delete('posts/{post}/amplify', [PostRepostController::class, 'destroy'])->name('posts.amplify.destroy');

    Route::post('playbook-articles/{article}/like', [PlaybookArticleLikeController::class, 'store'])->name('playbook-articles.like.store');
    Route::delete('playbook-articles/{article}/like', [PlaybookArticleLikeController::class, 'destroy'])->name('playbook-articles.like.destroy');

    Route::post('polls/{poll}/vote', [PollVoteController::class, 'store'])->name('polls.vote.store');
    Route::delete('polls/{poll}/vote/{vote}', [PollVoteController::class, 'destroy'])->name('polls.vote.destroy');

    Route::delete('posts/{post}/media/{media}', [MediaController::class, 'destroy'])->name('posts.media.destroy');

    Route::apiResource('subscription-plans', SubscriptionPlanController::class)->except(['show'])->parameters([
        'subscription-plans' => 'subscriptionPlan',
    ]);

    Route::post('subscriptions', [SubscriptionController::class, 'store'])->name('subscriptions.store');
    Route::delete('subscriptions/{subscription}', [SubscriptionController::class, 'destroy'])->name('subscriptions.destroy');
    Route::post('subscriptions/{subscription}/resume', [SubscriptionController::class, 'resume'])->name('subscriptions.resume');

    Route::get('conversations', [ConversationController::class, 'index'])->name('conversations.index');
    Route::post('conversations', [ConversationController::class, 'store'])->name('conversations.store');
    Route::get('conversations/{conversation}', [ConversationController::class, 'show'])->name('conversations.show');

    Route::post('conversations/{conversation}/participants', [ConversationParticipantController::class, 'store'])->name('conversations.participants.store');
    Route::delete('conversations/{conversation}/participants/{user}', [ConversationParticipantController::class, 'destroy'])->name('conversations.participants.destroy');

    Route::get('conversations/{conversation}/messages', [ConversationMessageController::class, 'index'])->name('conversations.messages.index');
    Route::post('conversations/{conversation}/messages', [ConversationMessageController::class, 'store'])->name('conversations.messages.store');

    Route::post('conversations/{conversation}/presence/heartbeat', [ConversationPresenceController::class, 'heartbeat'])->name('conversations.presence.heartbeat');
    Route::post('conversations/{conversation}/presence/typing', [ConversationPresenceController::class, 'typing'])->name('conversations.presence.typing');
    Route::post('conversations/{conversation}/read', ConversationReadController::class)->name('conversations.read');

    Route::delete('messages/{message}', [MessagingMessageController::class, 'destroy'])->name('messages.destroy');
    Route::post('messages/{message}/undo', [MessagingMessageController::class, 'undo'])->name('messages.undo');
    Route::get('messages/{message}/thread', [MessagingMessageController::class, 'thread'])->name('messages.thread');
    Route::post('messages/{message}/reactions', [MessageReactionController::class, 'store'])->name('messages.reactions.store');
    Route::post('messages/{message}/tip-request/accept', [TipRequestController::class, 'accept'])->name('messages.tip-request.accept');
    Route::post('messages/{message}/tip-request/decline', [TipRequestController::class, 'decline'])->name('messages.tip-request.decline');

    Route::prefix('ads')->as('ads.')->group(function () {
        Route::get('{placement}', [\App\Http\Controllers\Ads\AdController::class, 'serve'])->name('serve');
        Route::post('{ad}/impressions', [\App\Http\Controllers\Ads\AdController::class, 'recordImpression'])->name('impressions.store');
        Route::post('{ad}/clicks', [\App\Http\Controllers\Ads\AdController::class, 'recordClick'])->name('clicks.store');
        Route::get('{ad}/track', [\App\Http\Controllers\Ads\AdController::class, 'trackClick'])->name('track');
    });

    Route::prefix('settings/verification')->as('settings.verification.')->group(function () {
        Route::post('session', [VerificationController::class, 'createSession'])->name('session.store');
        Route::post('token', [VerificationController::class, 'refreshToken'])->name('token.refresh');
        Route::get('status', [VerificationController::class, 'status'])->name('status');
    });
});
