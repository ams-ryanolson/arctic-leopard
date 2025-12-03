# Content Moderation System

## Overview

The content moderation system provides a centralized queue for reviewing all user-generated content (posts, stories, comments) before or after publication.

## Features

### Two Modes

1. **Pre-Moderation Mode** (Feature Flag Enabled)
   - All content requires approval before publishing
   - Content remains hidden until approved
   - Users see "pending review" status

2. **Post-Moderation Mode** (Feature Flag Disabled)
   - Content publishes immediately
   - Content still appears in moderation queue
   - Admins can review and take action after publication

### Moderation Actions

- **Approve**: Content is published/remains published
- **Reject**: Content is hidden/deleted, user notified
- **Dismiss**: Remove from queue without action

### Bulk Actions

- Select multiple items
- Approve or reject in bulk
- Useful for clearing large backlogs

## Implementation

### Feature Flag

Set `content_moderation_required` in `admin_settings`:

```php
AdminSetting::create([
    'key' => 'content_moderation_required',
    'value' => 'true', // or 'false'
    'type' => 'boolean',
    'category' => 'moderation',
]);
```

### Content Types

The system supports moderation for:
- Posts
- Stories
- Comments

All use polymorphic relationships with `ContentModerationQueue`.

### Queue Entry

When content requires moderation:
1. Queue entry created with status 'pending'
2. Content marked with moderation_status
3. If pre-moderation: content hidden
4. If post-moderation: content visible

### Moderation Process

1. Admin/Moderator views moderation queue
2. Filters by type, status, or searches
3. Reviews content details
4. Takes action (approve/reject/dismiss)
5. Adds optional notes
6. User notified if rejected

## Models

- `ContentModerationQueue` - Polymorphic queue entries
- `Post`, `Story`, `Comment` - Content models with moderation fields

## Services

- `ContentModerationService` - Handles queue operations and moderation logic

## Routes

- `GET /admin/moderation` - Queue index
- `GET /admin/moderation/{type}/{id}` - Content detail
- `POST /admin/moderation/{type}/{id}/approve` - Approve content
- `POST /admin/moderation/{type}/{id}/reject` - Reject content
- `POST /admin/moderation/bulk-approve` - Bulk approve
- `POST /admin/moderation/bulk-reject` - Bulk reject

## Best Practices

1. **Enable pre-moderation for new platforms** - Catch issues early
2. **Disable for established communities** - Trust users, review retroactively
3. **Use bulk actions efficiently** - Don't approve everything blindly
4. **Provide clear rejection reasons** - Help users understand violations
5. **Review regularly** - Don't let queue build up

## Future Enhancements

- Automated content filters
- ML-based content detection
- Moderation analytics
- Content scoring system
- Priority queue for reported content




