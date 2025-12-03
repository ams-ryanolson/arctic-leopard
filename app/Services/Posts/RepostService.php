<?php

namespace App\Services\Posts;

use App\Enums\PostAudience;
use App\Enums\PostType;
use App\Enums\TimelineVisibilitySource;
use App\Events\PostAmplified;
use App\Events\PostUnamplified;
use App\Events\TimelineEntryBroadcast;
use App\Models\Post;
use App\Models\Repost;
use App\Models\Timeline;
use App\Models\User;
use App\Services\Cache\PostCacheService;
use App\Services\Cache\TimelineCacheService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class RepostService
{
    public function __construct(
        private readonly PostCacheService $postCache,
        private readonly TimelineCacheService $timelineCache,
    ) {}

    /**
     * Amplify a post with an optional comment.
     */
    public function amplify(User $user, Post $originalPost, ?string $comment = null): Post
    {
        return DB::transaction(function () use ($user, $originalPost, $comment): Post {
            // Check if user already amplified this post
            $existingRepost = Repost::query()
                ->where('user_id', $user->getKey())
                ->where('post_id', $originalPost->getKey())
                ->first();

            if ($existingRepost !== null) {
                return $existingRepost->repostPost;
            }

            // Prevent amplifying an amplify post
            if ($originalPost->isAmplify()) {
                throw new \InvalidArgumentException('Cannot amplify an amplify post.');
            }

            // Create the amplify post
            $amplifyPost = new Post([
                'type' => PostType::Amplify,
                'audience' => PostAudience::Public,
                'body' => $comment,
                'published_at' => Carbon::now(),
                'reposted_post_id' => $originalPost->getKey(),
            ]);

            $amplifyPost->author()->associate($user);
            $amplifyPost->save();

            // Create repost record
            $repost = Repost::create([
                'user_id' => $user->getKey(),
                'post_id' => $originalPost->getKey(),
                'repost_post_id' => $amplifyPost->getKey(),
            ]);

            // Increment reposts_count on original post
            $originalPost->increment('reposts_count');

            // Create timeline entry for amplifier (not for circles)
            Timeline::query()->upsert([
                [
                    'user_id' => $user->getKey(),
                    'post_id' => $amplifyPost->getKey(),
                    'visibility_source' => TimelineVisibilitySource::SelfAuthored->value,
                    'context' => json_encode([]),
                    'visible_at' => $amplifyPost->published_at ?? now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ], ['user_id', 'post_id'], ['visibility_source', 'context', 'visible_at', 'updated_at']);

            // Broadcast timeline entry to refresh feed
            $timelineEntry = Timeline::query()
                ->where('user_id', $user->getKey())
                ->where('post_id', $amplifyPost->getKey())
                ->first();

            if ($timelineEntry) {
                $amplifyPost->loadMissing('author');
                event(new TimelineEntryBroadcast(
                    $timelineEntry->id,
                    $timelineEntry->user_id,
                    $amplifyPost,
                    TimelineVisibilitySource::SelfAuthored->value,
                ));
            }

            // Dispatch event
            PostAmplified::dispatch($user, $originalPost, $amplifyPost);

            // Clear caches
            $this->postCache->forget($originalPost);
            $this->postCache->forget($amplifyPost);
            $this->timelineCache->forgetForUsers([$user, $originalPost->author]);
            $this->timelineCache->forgetForPost($originalPost);

            return $amplifyPost;
        });
    }

    /**
     * Unamplify a post.
     */
    public function unamplify(User $user, Post $originalPost): void
    {
        DB::transaction(function () use ($user, $originalPost): void {
            $repost = Repost::query()
                ->where('user_id', $user->getKey())
                ->where('post_id', $originalPost->getKey())
                ->first();

            if ($repost === null) {
                return;
            }

            $amplifyPost = $repost->repostPost;

            // Delete the amplify post (this will cascade delete timeline entries)
            $amplifyPost->delete();

            // Delete repost record
            $repost->delete();

            // Decrement reposts_count on original post
            if ($originalPost->reposts_count > 0) {
                $originalPost->decrement('reposts_count');
            }

            // Dispatch event
            PostUnamplified::dispatch($user, $originalPost);

            // Clear caches
            $this->postCache->forget($originalPost);
            $this->timelineCache->forgetForUsers([$user, $originalPost->author]);
            $this->timelineCache->forgetForPost($originalPost);
        });
    }
}
