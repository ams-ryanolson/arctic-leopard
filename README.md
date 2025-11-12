# Real Kink Men

The Real Kink Men platform is a Laravel 12 + Inertia (React 19) application built for creators and viewers in the kink community. It delivers a real-time social feed with audience segmentation, gated media, polls, purchases, and a polished authoring workflow powered by queues, Redis caching, and websockets.

- **Backend:** Laravel 12, Sanctum + Fortify auth, Spatie Activity Log & Permissions, Pusher-powered broadcasting.
- **Frontend:** Inertia v2 with React 19, Tailwind CSS v4, Radix UI primitives, TypeScript-first components.
- **Tooling:** Laravel Wayfinder route generation, Pest 4 test suite (feature + browser), Pint, ESLint/Prettier, Vite 7.

## Requirements

- PHP 8.3+ with required extensions (`pdo_sqlite`, `openssl`, `mbstring`, `gd`, etc.)
- Composer 2.7+
- Node.js 20+ and npm 10+ (Vite 7 workflow)
- SQLite (default) or a configured Laravel-supported database
- Redis (recommended for cache + queues; array driver works for local smoke tests)
- Pusher credentials (or Laravel Echo server) for real-time timeline updates

## First-Time Setup

```bash
git clone https://github.com/<your-org>/real-kink-men.git
cd real-kink-men
composer setup
```

The `composer setup` script will:

1. Install PHP dependencies.
2. Copy `.env.example` to `.env`.
3. Generate an app key.
4. Run pending migrations against `database/database.sqlite`.
5. Install JavaScript dependencies.
6. Produce a production-ready asset build (`npm run build`).

If you prefer a manual setup, run the individual commands in the order shown inside the script.

## Environment Configuration

- All env vars live in `.env`. Consult `config/*.php` for defaults.
- Update `APP_URL` and the `SANCTUM_STATEFUL_DOMAINS` list when exposing the app under new hosts.
- Configure your queue, cache, and session drivers (Redis recommended for feature parity).
- Set media storage credentials (`FILESYSTEM_DISK`, S3 keys) for non-local deployments.
- Provide Pusher credentials (`PUSHER_APP_*`) to enable live timeline banners and toast notifications.
- Payments and tipping flows rely on the keys defined in `config/payments.php`; seed dummy keys for local environments until real providers are wired.

## Seed Demo Content

Populate a demo creator, viewer, and sample posts (text, media, polls, paywall) with:

```bash
php artisan db:seed --class=SampleContentSeeder
```

- Creator login: `creator@example.com` / `password`
- Viewer login: `viewer@example.com` / `password`

The seeder also provisions hashtags, purchases, and timeline rows so the dashboard showcases real data immediately.

## Running the Dev Stack

```bash
composer run dev
```

This color-coded, multi-process runner starts:

- Laravel HTTP server (`php artisan serve`)
- Queue listener (`php artisan queue:listen --tries=1`)
- Real-time log stream (`php artisan pail --timeout=0`)
- Vite dev server (`npm run dev`)

You can stop everything with `Ctrl+C`. For SSR previews use `composer run dev:ssr`, which starts the Inertia SSR server in place of the log stream.

### Alternative Commands

- `npm run dev`: Vite only (useful when pointing to an external PHP server).
- `npm run build` / `npm run build:ssr`: Production bundles (client-only or client + SSR).
- `php artisan schedule:run`: Manually trigger scheduled jobs (e.g., metrics aggregation).
- `php artisan migrate:fresh --seed`: Rebuild the database with sample content.

## Feature Overview

### Feed & Timeline

- Denormalized timelines backed by `TimelineFanOutJob` and `TimelineCacheService`.
- Optimistic UI refresh with `useFeed` hook and Inertia reload merging.
- Real-time “new drops” banner via `TimelineEntryBroadcast` on private Echo channels.

### Post Authoring

- Rich composer with media uploads, poll builders, tip goals, and paywall metadata.
- Pay-to-view posts integrate with purchase flows that unlock timeline visibility.
- Hashtag syncing, audience targeting (public, followers, subscribers, paywall), and metrics aggregation.

### Community & Safety

- Follow, block, bookmark, like, and comment APIs protected by Sanctum.
- Fortify extends SPA login/out flows with JSON responses and session cookies.
- Policy-driven access control enforced across controllers and resources.

### Payments & Events

- Overtrue payment/like/follow packages manage relationships.
- Payments emit domain events that invalidate caches and refresh feeds.
- Spatie Activity Log captures audit trails for key actions.

### Testing & Quality

- Extensive Pest feature coverage for posts, feeds, purchases, metrics, comments, and broadcasts.
- Pest browser tests exercise timeline banners end-to-end (skips gracefully without Playwright).
- Pint, ESLint, Prettier, and TypeScript keep the codebase consistent.

## Testing

```bash
php artisan test             # Full suite
php artisan test tests/Feature/Feed/FeedControllerTest.php
php artisan test tests/Browser --parallel
vendor/bin/pint --dirty
npm run lint && npm run types
```

Run targeted feature suites during development (see `docs/backend-feed.md` for suggestions). Browser tests require Node/Playwright tooling; they are skipped automatically if dependencies are missing.

## Architecture Highlights

- **Caching:** Redis tagged caches for timelines and post payloads, flushed on mutations and membership changes.
- **Queues:** Heavy lifting (fan-out, metrics aggregation, notifications) handled asynchronously via Laravel queues.
- **Broadcasting:** Pusher (Laravel Echo) powers live timeline updates, toasts, and follow notifications.
- **Wayfinder:** Type-safe route/action helpers sync Laravel routes to the React side for forms and navigation.
- **Storage:** File uploads handled via Filepond, with S3-ready configuration for production.

## Deployment Notes

- Run `npm run build` (and optionally `npm run build:ssr`) as part of your CI pipeline.
- Ensure queue workers and scheduler (`php artisan schedule:work`) are running.
- Configure cache + queue drivers to Redis to retain tag support.
- Keep `APP_URL`, session domains, and CORS settings aligned across API + SPA hosts.
- Re-run `php artisan wayfinder:generate` if deployment skips Vite plugin auto-generation.

## Support & Further Reading

- Domain docs live in `docs/` (feed architecture, payments, blocking, toasts).
- Review `UPLOADS.md` for media handling specifics.
- Follow Laravel, Inertia, React, and Tailwind documentation linked via the Boost integration inside this project.

Enjoy the dungeon ✨ — contributions and feedback are always welcome.

