# Broadcasting Events & Subscriptions Audit

## Summary
All broadcasting events, channels, and subscriptions have been verified and are correctly formatted.

## Event Naming Rules
- **PrivateChannel** + `broadcastAs()` → Use **dot prefix** (`.EventName`)
- **PresenceChannel** + `broadcastAs()` → Use **no dot prefix** (`EventName`)
- **Laravel built-in notifications** → Use **dot prefix with escaped namespace** (`.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated`)

## Events & Subscriptions

### 1. ToastPushed ✅
- **Type**: PrivateChannel
- **Channel**: `users.{id}.toasts`
- **Event Name**: `ToastPushed`
- **Subscription**: `.ToastPushed` ✅
- **Location**: `resources/js/hooks/use-toast-subscription.ts`
- **Channel Auth**: `routes/channels.php` line 8 ✅
- **Broadcasts Immediately**: Yes (no queue) ✅

### 2. TimelineEntryBroadcast ✅
- **Type**: PrivateChannel
- **Channel**: `timeline.{userId}`
- **Event Name**: `TimelineEntryBroadcast`
- **Subscription**: `.TimelineEntryBroadcast` ✅
- **Location**: `resources/js/pages/Dashboard/Index.tsx` line 271
- **Channel Auth**: `routes/channels.php` line 14 ✅

### 3. MessageSent ✅
- **Type**: PresenceChannel
- **Channel**: `conversations.{conversation_id}`
- **Event Name**: `MessageSent`
- **Subscription**: `MessageSent` ✅ (no dot - correct for PresenceChannel)
- **Location**: `resources/js/hooks/use-conversation-channel.ts` line 169
- **Channel Auth**: `routes/channels.php` line 44 ✅

### 4. MessageDeleted ✅
- **Type**: PresenceChannel
- **Channel**: `conversations.{conversation_id}`
- **Event Name**: `MessageDeleted`
- **Subscription**: `MessageDeleted` ✅ (no dot - correct for PresenceChannel)
- **Location**: `resources/js/hooks/use-conversation-channel.ts` line 225
- **Channel Auth**: `routes/channels.php` line 44 ✅

### 5. BroadcastNotificationCreated ✅
- **Type**: PrivateChannel (Laravel built-in)
- **Channel**: `users.{id}.notifications`
- **Event Name**: `Illuminate\Notifications\Events\BroadcastNotificationCreated`
- **Subscription**: `.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated` ✅
- **Location**: `resources/js/hooks/use-notification-subscription.ts` line 52
- **Channel Auth**: `routes/channels.php` line 10 ✅
- **Note**: Uses `channel.notification()` helper when available, falls back to `.listen()`

## Channel Authorizations

All channels in `routes/channels.php` are properly configured:

1. ✅ `users.{id}.toasts` - User ID match check
2. ✅ `users.{id}.notifications` - User ID match check
3. ✅ `users.{id}.timeline` - User ID match check
4. ✅ `timeline.{id}` - User ID match check
5. ✅ `conversations.{conversation}` - Participant check with role
6. ✅ `circles.{circle}` - Circle membership check
7. ✅ `stream.{stream}` - Stream join permission check
8. ✅ `private-stream.{stream}` - Stream owner/moderator check
9. ✅ `private-stream-chat.{stream}` - Stream join permission check
10. ✅ `private-stream-stage.{stream}` - Stream owner/moderator check

## Verification Status

✅ All events use correct channel types
✅ All subscriptions use correct event name format (dot prefix where needed)
✅ All channel authorizations are properly configured
✅ ToastPushed broadcasts immediately (no queue)
✅ All channel names match between events and subscriptions

## Notes

- PresenceChannels don't require dot prefix for `broadcastAs()` events
- PrivateChannels require dot prefix for `broadcastAs()` events
- Laravel's built-in notification events use full namespace with dot prefix and escaped backslashes


