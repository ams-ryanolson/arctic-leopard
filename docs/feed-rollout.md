Feed Rollout Playbook
=====================

Deployment Checklist
--------------------
- **Database**: run `php artisan migrate` (adds posts ecosystem tables) before web traffic hits the node.
- **Cache Driver**: ensure `CACHE_DRIVER=redis` (or other tag-aware store). Clear stale entries with `php artisan cache:clear`.
- **Queue Workers**: start workers processing the `timelines` queue (listeners and fan-out jobs depend on it).
- **Config Cache**: refresh config and routes after deployment: `php artisan config:cache` and `php artisan route:cache`.
- **Wayfinder/Vite**: run `npm run build` (or `npm run dev` for dev) so new Inertia/Wayfinder endpoints are available.

Post-Deploy Verification
------------------------
- Hit `/api/feed/following` and `/api/feed/users/{id}` with a test account; confirm HTTP 200 and expected payload shape.
- Post creation smoke: `php artisan test tests/Feature/Posts/PostApiTest.php`.
- Purchase flow smoke: `php artisan test tests/Feature/Posts/PurchaseApiTest.php`.
- Poll vote smoke: `php artisan test tests/Feature/Posts/PollVoteApiTest.php`.
- Metrics job: run `php artisan app:aggregate-post-metrics` and inspect the latest `post_metrics_daily` row.
- Cache sanity: tail `storage/logs/laravel.log` to confirm no `Cache::tags` or queue exceptions after the above exercises.

Operational Runbook
-------------------
- **Timeline Fan-out Failures**: requeue stuck jobs with `php artisan queue:retry timeline-fan-out`. If the cache becomes inconsistent, call `TimelineCacheService::flushAll()` via tinker or clear redis tags.
- **Blocked User Updates**: run `php artisan queue:work --queue=timelines` to flush block-related jobs quickly after large import operations.
- **Metrics Aggregation**: schedule `php artisan app:aggregate-post-metrics` daily (e.g., cron `0 2 * * *`) so `post_metrics_daily` stays fresh.
- **Seeder Usage**: `php artisan db:seed --class=SampleContentSeeder` to stage demo data for QA or marketing preview environments.
- **Cache Warmup**: optional `php artisan queue:work --queue=timelines` + custom script to hit feeds and prime redis before launch windows.

Media Support Notes
-------------------
- Video attachments render with a static thumbnail and a “Video” badge inside the feed grid until inline playback ships. The lightbox still opens the full asset, so keep thumbnails generated when uploading to avoid empty tiles.

