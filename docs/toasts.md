# Toast Delivery System

## Overview

- Toasts are ephemeral notifications intended for immediate delivery to authenticated users.
- Payloads are cached per user via the `App\Services\Toasts\ToastBus` service; nothing is persisted in the database.
- Each payload supports basic notifications as well as actionable CTAs with optional metadata.
- Toasts remain queued until they are acknowledged, an action is resolved, or they expire.
- Future realtime delivery (Laravel Echo) will plug into the `ToastPushed` event and the `useToastSubscription` hook.

## Backend Usage

- Dispatch toasts through the `ToastBus`, which automatically emits `ToastPushed`:

```php
use App\Services\Toasts\ToastBus;

public function handle(): void
{
    $toast = $this->toastBus->success($this->user, 'Scene published successfully.', [
        'title' => 'Scene live',
        'actions' => [
            [
                'key' => 'view-post',
                'label' => 'Open post',
                'method' => 'router.visit',
                'route' => route('dashboard'),
            ],
        ],
    ]);
}
```

- Build custom payloads with `ToastPayload::make([...])` for finer control.
- Helpful convenience methods:
  - `info`, `success`, `warning`, `danger` – quick message helpers.
  - `notify(User $user, array $attributes)` – hydrate arbitrary payload data.
- `ToastBus::peek($user)` exposes queued toasts without removing them.
- `ToastBus::find($user, $id)` and `ToastBus::forget($user, $id)` power lifecycle endpoints and manual clean-up.

### Events

- `ToastPushed` — dispatched whenever a toast is queued.
- `ToastAcknowledged` — fired when a toast is dismissed from the client.
- `ToastActionResolved` — fired once an actionable toast completes (includes action key + input payload).

These events provide natural hooks for metrics, logging, or future broadcast delivery.

## HTTP Endpoints

| Route | Purpose | Notes |
| --- | --- | --- |
| `POST /toasts/{toast}/acknowledge` (`toasts.acknowledge`) | Marks a toast as complete | Returns `204 No Content`. Fires `ToastAcknowledged`. |
| `POST /toasts/{toast}/action` (`toasts.action`) | Resolves an actionable toast | Accepts `action` (required) and optional `payload`. Responds with `{"toast": {...}, "action": {...}, "input": {...}}` and fires `ToastActionResolved`. |

Generated Wayfinder helpers live at:

```ts
import { acknowledge, action } from '@/routes/toasts'
```

Use these helpers when bundling requests in client code.

## Frontend Integration

- `ToastProvider` (registered in `resources/js/app.tsx`) hydrates toasts from Inertia shared props and listens to subsequent Inertia navigations.
- `ToastViewport` renders stackable toasts in the top-right corner with Tailwind styling.
- Access the context anywhere via:

```tsx
import { useToasts } from '@/components/toasts/toast-context'

const { show, resolveAction, registerClientAction } = useToasts()
```

- Local/client-only handlers can be registered:

```tsx
useEffect(() => registerClientAction('open-reply', async (toast, action) => {
    openReplyComposer(action.payload?.threadId)
}), [registerClientAction])
```

- Toast actions honour the `method` field:
  - `client` — invokes registered handlers.
  - `router.visit` — navigates to `action.route` then acknowledges the toast.
  - `inertia.{post|put|patch|delete}` — issues an Inertia request using `action.route` + payload.
  - Default (`http.post`) — posts to `toasts.action`.

- Auto-dismiss is enabled for non-interactive toasts; customise via `timeoutSeconds`.
- `useToastSubscription` is a no-op placeholder to attach Laravel Echo listeners when broadcasting lands.

## Middleware Contract

- `HandleInertiaRequests::share()` exposes queued toasts on every authenticated response (`$page.props.toasts`).
- Toasts remain in the cache until acknowledged or resolved, preventing accidental loss during navigation.

## Roadmap for Broadcasting

1. Register broadcasting routes via `Application::withBroadcasting`.
2. Broadcast `ToastPushed` on a private channel like `private-users.{id}.toasts`.
3. Implement `useToastSubscription` to listen via Echo and call `show(payload)`.

This architecture preserves today's server-driven delivery while making realtime fan-out a drop-in enhancement.

