Backend Feed Architecture
=========================

Data Model
----------
- `posts`: owns canonical activity content with type, audience, metrics, paywall metadata.
- `post_media`, `post_polls`, `post_poll_options`, `post_poll_votes`: optional structures for media and polls.
- `post_hashtag`: maintains ordered hashtags with usage counts.
- `comments`: threaded replies (depth 0–2) with soft deletes, like totals, reply counts.
- `post_purchases`: records pay-to-view unlocks, provider metadata, and optional expiry times.
- `timelines`: denormalised visibility rows per viewer post, storing visibility source/context for caching.
- `post_metrics_daily`: nightly rollups driven by `PostMetricsAggregatorJob`.

Caching Strategy
----------------
- `TimelineCacheService`: Redis tagged caches for following and profile feeds, invalidated whenever posts mutate (create/update/delete, purchases, votes, comments, audience changes, blocks). Tags: `timeline`, `timeline:user:{id}`.
- `PostCacheService`: Redis tagged caches for post show payloads, flushed alongside timeline updates.
- Controllers retrieve cached payloads (`PostController@show`, feed endpoints) and services/listeners flush caches after mutations.

Event & Queue Flow
------------------
- `PostPublished`, `PostAudienceChanged`, `PostDeleted`, `PostPurchased`, `UserBlocked` events trigger listeners that enqueue fan-out jobs, rebuild timelines, clear caches, and maintain denormalised data.
- `TimelineFanOutJob`: batches follower/subscriber distribution.
- `TimelineEntryBroadcast`: broadcast event emitted after timeline rows are created so dashboards can react in real time (private `timeline.{user}` channel).
- `RebuildTimelineJob`: regenerates a user’s timeline (invoked for future extensions) and now emits broadcasts for new rows.
- `PostMetricsAggregatorJob`: scheduled daily via `routes/console.php` to update `post_metrics_daily`.

API Surface
-----------
- `POST /api/posts`, `PUT /api/posts/{post}`, `DELETE /api/posts/{post}`: authoring workflows with form requests and resources.
- `GET /api/posts/{post}`: cached show response.
- `GET /api/feed/users/{user}` (profile feed) & `GET /api/feed/following` (authenticated timeline).
- `POST /api/polls/{poll}/vote`, `DELETE /api/polls/{poll}/vote/{vote}`: poll participation with depth-limited comment replies via `POST /api/posts/{post}/comments`.
- `POST /api/posts/{post}/purchase`: unlock pay-to-view posts and seed timeline entries.

Testing
-------
Feature suites cover:
- Post creation/update/delete flows, hashtag sync, poll replacement.
- Paywall purchases producing timeline entries.
- Poll voting and post metrics aggregation job.
- Comment depth limits and feed endpoints.

Seed Data
---------
`SampleContentSeeder` creates:
- Creator/viewer accounts with deterministic credentials.
- Text, media, poll, and pay-to-view posts with media, polls, and hashtags.
- Example purchase and timeline rows for demo environments.

Testing & Tooling
-----------------
- Feature coverage: posts (create/update/delete), paywall purchases, poll voting, comments, feeds, metrics aggregation.
- Run targeted suites: `php artisan test tests/Feature/Posts`, `php artisan test tests/Feature/Comments/CommentApiTest.php`, `php artisan test tests/Feature/Feed/FeedControllerTest.php`, `php artisan test tests/Feature/Jobs/PostMetricsAggregatorJobTest.php`.
- Full feature sweep: `php artisan test tests/Feature` (password reset complexity test from auth scaffolding still runs; adjust assertions if global rules change).

Developer Notes
---------------
- Queue-backed listeners require redis-backed cache in production; tests default to array cache with tags removed.
- Timeline cache uses tag flushing; ensure `CACHE_DRIVER` supports tags (redis, database).
- Seeder can be invoked via `php artisan db:seed --class=SampleContentSeeder` to populate demo data before UI smoke tests.

SPA Authentication Notes
------------------------
- Sanctum is installed alongside Fortify to support stateful SPA authentication. `config/sanctum.php` lists allowed domains and Laravel's `statefulApi()` middleware is enabled in `bootstrap/app.php`.
- Custom Fortify response bindings return JSON payloads for login/logout when `Accept: application/json` is sent. Session cookies are still used for Inertia navigation.
- New API endpoints require `auth:sanctum`; run `php artisan migrate` to ensure the `personal_access_tokens` table exists and keep `stateful` domains updated when adding preview hosts.
- Frontend fetch helpers in `resources/js/lib/feed-client.ts` default to `credentials: 'include'` so cookies are attached to follow Sanctum's requirements.

Frontend Feed Experience
------------------------
- `resources/js/pages/Dashboard/Index.tsx` renders the following timeline using infinite scroll with IntersectionObserver, optimistic like toggles, and purchase flows that hit `/api/posts/{post}/like` and `/api/posts/{post}/purchase`.
- Dashboard subscribes to `window.Echo.private('timeline.{id}')` and surfaces a “new drops” banner when `TimelineEntryBroadcast` payloads arrive; the banner triggers a refresh via `useFeed.refresh()`.
- `resources/js/pages/Profile/Show.tsx` mirrors the timeline behaviour for author profiles, including optimistic UI updates, tip goal display, and refresh/actions parity with the dashboard.
- `FeedPostComposer` now powers real post creation with character counts, paywall validation, media uploads, poll builder, and optional tip goal metadata persisted via `extra_attributes.tip_goal`.
- Shared TypeScript types in `resources/js/types/feed.ts` and the feed client utilities keep pagination and optimistic updates consistent between dashboard and profile contexts.

Recent Enhancements (2025‑11)
-----------------------------
- `PostResource` zeroes metric fields (`likes_count`, `comments_count`, etc.) and guarantees `extra_attributes` resolves to an array, preventing null payloads in SPA responses.
- `TimelineEntryResource` eagerly hydrates missing post payloads, ensuring cached timeline rows always embed the latest `PostResource` data.
- Dashboard feed requests now sanitize paginated payloads client-side to drop orphaned entries before rendering, eliminating “entry removed” placeholders.
- `FeedPostComposer` submits via Inertia `useForm.post`, triggers a scoped `router.reload({ only: ['timeline', 'pulse', 'trending'] })`, and ships with the redesigned authoring UI (avatar, toolbar selects, dashed media dropzone, gradient paywall/tip panels).
- Feature coverage expanded in `tests/Feature/Posts/PostApiTest.php` and `tests/Feature/Feed/FeedControllerTest.php` to assert metric defaults and feed shape; run `php artisan test tests/Feature/Posts/PostApiTest.php tests/Feature/Feed/FeedControllerTest.php` after backend changes.
- `RefreshFollowerTimeline` listener queues `RebuildTimelineJob` whenever a follow request is approved and flushes the follower timeline cache, ensuring the dashboard immediately reflects newly accepted creators.
- `TimelineCacheService` now provides `rememberCircleFeed`, and circle cache tags are flushed whenever related posts or memberships change so `/api/feed/circles/{slug}` always returns fresh data.
- Dashboard, profile, circle, and bookmark feeds share the `useFeed` hook along with the `FeedLoadingPlaceholder` component for consistent infinite-scroll UX and error handling.
- `TimelineFanOutJob` and `RebuildTimelineJob` broadcast new timeline entries and tag-flush caches so online viewers get push updates.
- `resources/views/app.blade.php` stubs `window.Echo` during feature/browser tests to let Playwright simulate timeline broadcasts.
- `tests/Feature/Feed/TimelineBroadcastTest.php` covers backend broadcasting, while `tests/Browser/FeedTimelineTest.php` exercises the dashboard banner through Pest’s browser plugin (skips automatically if Playwright is unavailable).

