<?php

namespace Database\Seeders;

use App\Enums\PostAudience;
use App\Enums\PostType;
use App\Enums\TimelineVisibilitySource;
use App\Models\Hashtag;
use App\Models\Post;
use App\Models\PostMedia;
use App\Models\PostPoll;
use App\Models\PostPollOption;
use App\Models\PostPurchase;
use App\Models\Timeline;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class SampleContentSeeder extends Seeder
{
    public function run(): void
    {
        $author = User::firstOrCreate(
            ['email' => 'creator@example.com'],
            [
                'username' => 'SampleCreator',
                'username_lower' => 'samplecreator',
                'name' => 'Sample Creator',
                'display_name' => 'Sample Creator',
                'pronouns' => 'they/them',
                'bio' => 'Seeded account representing a performer on Real Kink Men.',
                'birthdate' => '1994-06-01',
                'location_city' => 'Los Angeles',
                'location_region' => 'CA',
                'location_country' => 'USA',
                'location_latitude' => 34.0522,
                'location_longitude' => -118.2437,
                'accepted_terms_at' => now(),
                'accepted_privacy_at' => now(),
                'profile_completed_at' => now(),
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]
        );

        $viewer = User::firstOrCreate(
            ['email' => 'viewer@example.com'],
            [
                'username' => 'SampleViewer',
                'username_lower' => 'sampleviewer',
                'name' => 'Sample Viewer',
                'display_name' => 'Sample Viewer',
                'pronouns' => 'he/him',
                'bio' => 'Enjoys rope and impact play.',
                'birthdate' => '1995-03-12',
                'location_city' => 'Chicago',
                'location_region' => 'IL',
                'location_country' => 'USA',
                'location_latitude' => 41.8781,
                'location_longitude' => -87.6298,
                'accepted_terms_at' => now(),
                'accepted_privacy_at' => now(),
                'profile_completed_at' => now(),
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]
        );

        $textPost = Post::factory()
            ->for($author, 'author')
            ->create([
                'type' => PostType::Text->value,
                'audience' => PostAudience::Public->value,
                'body' => 'Welcome to the dungeon recap. Consent, negotiation, and plenty of aftercare.',
                'published_at' => Carbon::now()->subDays(2),
            ]);

        $this->syncHashtags($textPost, ['community', 'aftercare']);

        $mediaPost = Post::factory()
            ->for($author, 'author')
            ->create([
                'type' => PostType::Media->value,
                'audience' => PostAudience::Followers->value,
                'body' => 'Behind the scenes lighting setup from last night.',
                'published_at' => Carbon::now()->subDay(),
            ]);

        PostMedia::factory()->count(2)->for($mediaPost)->sequence(
            ['mime_type' => 'image/jpeg', 'is_primary' => true, 'position' => 0],
            ['mime_type' => 'image/jpeg', 'is_primary' => false, 'position' => 1],
        )->create();

        $this->syncHashtags($mediaPost, ['lighting', 'behindthescenes']);

        $pollPost = Post::factory()
            ->for($author, 'author')
            ->create([
                'type' => PostType::Poll->value,
                'audience' => PostAudience::Subscribers->value,
                'body' => 'Subscribers choose the next workshop focus.',
                'published_at' => Carbon::now()->subHours(12),
            ]);

        $poll = PostPoll::factory()->for($pollPost)->create([
            'question' => 'What should we film next?',
            'allow_multiple' => false,
        ]);

        collect(['Dynamic Suspension', 'Sensory Deprivation'])->each(function (string $title, int $index) use ($poll): void {
            PostPollOption::factory()->for($poll, 'poll')->create([
                'title' => $title,
                'position' => $index,
            ]);
        });

        $this->syncHashtags($pollPost, ['vote', 'subscribers']);

        $paywallPost = Post::factory()
            ->for($author, 'author')
            ->create([
                'type' => PostType::Media->value,
                'audience' => PostAudience::PayToView->value,
                'body' => 'Full workshop recording unlocked for pay-to-view supporters.',
                'paywall_price' => 2500,
                'paywall_currency' => 'USD',
                'published_at' => Carbon::now()->subHours(4),
            ]);

        PostMedia::factory()->for($paywallPost)->create([
            'mime_type' => 'video/mp4',
            'is_primary' => true,
            'position' => 0,
        ]);

        $this->syncHashtags($paywallPost, ['workshop']);

        Timeline::query()->updateOrCreate(
            ['user_id' => $author->getKey(), 'post_id' => $textPost->getKey()],
            ['visibility_source' => TimelineVisibilitySource::SelfAuthored->value]
        );

        Timeline::query()->updateOrCreate(
            ['user_id' => $author->getKey(), 'post_id' => $mediaPost->getKey()],
            ['visibility_source' => TimelineVisibilitySource::SelfAuthored->value]
        );

        Timeline::query()->updateOrCreate(
            ['user_id' => $author->getKey(), 'post_id' => $pollPost->getKey()],
            ['visibility_source' => TimelineVisibilitySource::SelfAuthored->value]
        );

        Timeline::query()->updateOrCreate(
            ['user_id' => $author->getKey(), 'post_id' => $paywallPost->getKey()],
            ['visibility_source' => TimelineVisibilitySource::SelfAuthored->value]
        );

        Timeline::query()->updateOrCreate(
            ['user_id' => $viewer->getKey(), 'post_id' => $mediaPost->getKey()],
            ['visibility_source' => TimelineVisibilitySource::Following->value]
        );

        PostPurchase::query()->updateOrCreate(
            [
                'post_id' => $paywallPost->getKey(),
                'user_id' => $viewer->getKey(),
            ],
            [
                'amount' => 2500,
                'currency' => 'USD',
                'status' => 'completed',
            ]
        );

        Timeline::query()->updateOrCreate(
            ['user_id' => $viewer->getKey(), 'post_id' => $paywallPost->getKey()],
            ['visibility_source' => TimelineVisibilitySource::PaywallPurchase->value]
        );
    }

    /**
     * @param  list<string>  $names
     */
    protected function syncHashtags(Post $post, array $names): void
    {
        $ids = collect($names)->map(function (string $name) {
            $normalized = Str::title($name);

            return Hashtag::firstOrCreate(['name' => $normalized])->getKey();
        });

        $post->hashtags()->sync($ids->all());
    }
}
