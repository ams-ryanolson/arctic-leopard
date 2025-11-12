# User Blocking Requirements

## Overview

The blocking system is a privacy-first feature. When one user blocks another:

- The relationship is immediately severed in both directions.
- All content authored by the blocked user is hidden from the blocker and vice versa, across all timelines, feeds, discovery surfaces, notifications, and search results.
- Comments authored by the blocked user are replaced with a “hidden” placeholder; replies from other users remain visible.
- Direct interactions (follows, likes, comments, purchases, profile visits, etc.) must be prevented going forward.
- Attempts to view a blocked profile should render a dedicated “This profile is not available at this time.” experience.

## Invariants

1. A user cannot block themselves.
2. A unique block record exists per `(blocker_id, blocked_id)` pair; duplicate rows are disallowed.
3. Blocking **must** remove pre-existing relationships and pending actions:
   - Follow / follower relationships
   - Active or pending friend relationships
   - Pending follow requests or other approvals
   - Future-safe: queued invites, collaboration requests, or similar interactions
4. Blocks are bilateral for visibility: neither user should see the other’s content regardless of who initiated the block.
5. Unblocking does **not** restore prior relationships automatically.

## Content Visibility Rules

- Feed, timeline, bookmark, and search queries must filter out rows where either party is blocked.
- Notification delivery must be skipped when a block exists in either direction.
- Existing cached artefacts (timelines, recommendation caches, search indexes) must be purged when a block is created.
- Comments authored by a blocked user render as a placeholder while leaving child comments available when the child author is unblocked.

## User Experience

- Blocking actions should ship with confirmation prompts and clear success feedback.
- When a user is blocked, surfaces that would normally show content must display a neutral fallback message instead of error states.
- The block/unblock controls belong in the profile header and the account settings “Blocked Users” management page.

## Future Considerations

- Messaging history remains accessible for transparency, but new message delivery is halted when either party is blocked.
- Analytics and moderation tooling must respect the privacy guarantee—no manual overrides or hidden visibility toggles are allowed.

## Implementation Summary

- Data persists in the `user_blocks` table with factory support and convenience scopes on the `UserBlock` model.
- `App\Services\UserBlockService` encapsulates block/unblock flows and prunes follows, bookmarks, likes, and other social interactions.
- Model events dispatch `UserBlocked` / `UserUnblocked` which trigger cache flushes (`FlushTimelinesOnBlock`), notification purges, and activity logging (`LogUserBlockLifecycle`).
- HTTP layer exposes:
  - `POST /users/{user}/block` (`users.block.store`)
  - `DELETE /users/{user}/block` (`users.block.destroy`)
  - `GET /settings/blocked-users`
- Frontend includes:
  - Block action and confirmation dialog on `Profile/Show`
  - Profile fallback page `Profile/Blocked`
  - Settings management page at `/settings/blocked-users`
  - Hidden comment placeholders when viewing legacy conversations

## Feature Flag

- Controlled via `config/block.php` (`FEATURE_USER_BLOCKS` environment variable).
- Requests abort with `404` and navigation hides the feature when disabled.
- Shared with the client through the global Inertia props (`features.blocking`).

## Observability

- Every block/unblock is written to the activity log (`activity('user-blocks')`) for auditing.
- The `events` queue handles notification purges and activity logging; ensure workers process that queue in production.

## Testing

- Automated coverage:
  - `tests/Unit/Services/UserBlockServiceTest.php`
  - `tests/Feature/UserBlockTest.php`
  - `tests/Feature/Comments/CommentApiTest.php` (hidden comment regression)
  - `tests/Browser/UserBlockFlowTest.php` (skipped placeholder until the Pest browser plugin is installed)
- Suggested commands:

```bash
php artisan test --filter=UserBlock
php artisan test tests/Feature/Comments/CommentApiTest.php --filter=hides
```

Enable browser automation by installing `pestphp/pest-plugin-browser`, installing Playwright Browsers, and removing the skip from the browser spec.

## Deployment Checklist

1. Run database migrations (`php artisan migrate`) to ensure `user_blocks` exists.
2. Publish the feature flag to the target environment (`FEATURE_USER_BLOCKS=true`) and clear config cache if required.
3. Ensure queue workers listen to the `events` queue for activity logging.
4. Rebuild frontend assets (`npm run build` or `npm run dev`) so the new Inertia screens are available.
5. Optionally regenerate Wayfinder routes if you do not rely on the Vite plugin (`php artisan wayfinder:generate`).


