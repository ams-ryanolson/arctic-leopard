# Admin User Management System

## Overview

This document describes the comprehensive admin user management and moderation system implemented for the platform. This system allows administrators and moderators to manage user accounts, issue warnings, suspensions, and bans, handle appeals, and moderate content.

## Features

### User Management

- **Suspend Users**: Temporarily restrict user access with optional expiry date
- **Ban Users**: Permanently restrict user access
- **Warn Users**: Issue warnings that expire after 90 days
- **Grant Free Memberships**: Award temporary premium access with expiry dates
- **View User Status**: See warnings, suspensions, bans, and appeals

### Appeals System

- **User Appeals**: Banned/suspended users can submit appeals with detailed explanations
- **Admin Review**: Admins and moderators can review, approve, reject, or dismiss appeals
- **Automatic Actions**: Approved appeals automatically reverse suspensions/bans

### Content Moderation

- **Feature Flag Controlled**: Optional pre-moderation requirement
- **Moderation Queue**: Centralized view of all content pending review
- **Bulk Actions**: Approve/reject multiple items at once
- **Infinite Scroll**: Efficient browsing of large content queues

## User Flow

### Suspension/Ban Flow

1. Admin/Moderator takes action via admin panel or user profile
2. User is redirected to account status page on next login
3. User can view reason, expiry (if suspended), and active warnings
4. User can submit an appeal if eligible
5. Appeal is reviewed by admin/moderator
6. If approved, suspension/ban is automatically reversed

### Warning Flow

1. Admin/Moderator issues warning with reason and optional internal notes
2. Warning count increments on user account
3. Warnings expire after 90 days automatically
4. Multiple warnings may lead to suspension or ban

### Content Moderation Flow

1. Content is created (post, story, comment)
2. If feature flag enabled: content requires approval before publishing
3. If feature flag disabled: content publishes immediately but appears in queue
4. Admin/Moderator reviews content in moderation queue
5. Content is approved, rejected, or dismissed
6. User is notified if content is rejected

## Database Schema

### Users Table Additions

- `suspended_at` - Timestamp when user was suspended
- `suspended_until` - Optional expiry date for temporary suspensions
- `suspended_reason` - Reason for suspension
- `suspended_by_id` - Admin who issued suspension
- `banned_at` - Timestamp when user was banned
- `banned_reason` - Reason for ban
- `banned_by_id` - Admin who issued ban
- `warning_count` - Total number of warnings
- `last_warned_at` - Timestamp of most recent warning

### User Warnings Table

- `user_id` - User who received warning
- `warned_by_id` - Admin who issued warning
- `reason` - Public reason for warning
- `notes` - Internal notes (not visible to user)
- `expires_at` - Warning expires after 90 days

### User Appeals Table

- `user_id` - User submitting appeal
- `appeal_type` - 'suspension' or 'ban'
- `reason` - User's appeal explanation
- `status` - 'pending', 'approved', 'rejected', 'dismissed'
- `reviewed_by_id` - Admin who reviewed appeal
- `review_notes` - Admin's response to user

### Content Moderation Queue Table

- `moderatable_type` - Polymorphic type (Post, Story, Comment)
- `moderatable_id` - ID of the content
- `status` - 'pending', 'approved', 'rejected', 'dismissed'
- `moderated_by_id` - Admin who moderated content
- `moderation_notes` - Internal notes
- `rejection_reason` - Reason if rejected

## API Endpoints

### User Management

- `POST /admin/users/{user}/suspend` - Suspend user
- `POST /admin/users/{user}/unsuspend` - Unsuspend user
- `POST /admin/users/{user}/ban` - Ban user
- `POST /admin/users/{user}/unban` - Unban user
- `POST /admin/users/{user}/warn` - Warn user
- `POST /admin/users/{user}/grant-free-membership` - Grant free membership

### Appeals

- `GET /admin/appeals` - List all appeals
- `GET /admin/appeals/{appeal}` - View appeal details
- `POST /admin/appeals/{appeal}/review` - Review appeal
- `POST /account/appeals` - Submit appeal (user)

### Account Status

- `GET /account/banned` - Banned account page
- `GET /account/suspended` - Suspended account page

### Content Moderation

- `GET /admin/moderation` - Moderation queue
- `GET /admin/moderation/{type}/{id}` - View content details
- `POST /admin/moderation/{type}/{id}/approve` - Approve content
- `POST /admin/moderation/{type}/{id}/reject` - Reject content
- `POST /admin/moderation/{type}/{id}/dismiss` - Dismiss from queue
- `POST /admin/moderation/bulk-approve` - Bulk approve
- `POST /admin/moderation/bulk-reject` - Bulk reject

## Middleware

### CheckUserStatus

Automatically redirects banned/suspended users to appropriate status pages. Allows access to:
- Account status pages
- Appeals routes
- Logout
- Admin routes (for admins)

## Permissions

### Admin Role

- Can suspend/unsuspend users
- Can ban/unban users
- Can warn users
- Can grant free memberships
- Can review appeals
- Can moderate content

### Moderator Role

- Can warn users
- Can review appeals
- Can moderate content
- Cannot suspend/ban users

## Events & Listeners

### User Events

- `UserSuspended` - Logged to activity log
- `UserUnsuspended` - Logged to activity log
- `UserBanned` - Logged to activity log
- `UserUnbanned` - Logged to activity log
- `UserWarned` - Logged to activity log
- `FreeMembershipGranted` - Logged to activity log
- `AppealSubmitted` - Logged to activity log
- `AppealReviewed` - Logged to activity log, may trigger unsuspend/unban

### Content Events

- `ContentQueuedForModeration` - Logged to activity log
- `ContentApproved` - Content published
- `ContentRejected` - Content hidden/deleted
- `ContentDismissed` - Removed from queue

## Scheduled Jobs

### Expire User Warnings

Runs daily to automatically expire warnings older than 90 days.

## Configuration

### Content Moderation Feature Flag

Set `content_moderation_required` in `admin_settings` table:

- `true` - All content requires approval before publishing
- `false` - Content publishes immediately but appears in queue for review

## Testing

Comprehensive test coverage includes:

- User suspension/ban/warning tests
- Appeals submission and review tests
- Middleware redirect tests
- Account status page tests
- Content moderation tests

## Frontend Pages

### User-Facing

- `/account/banned` - Banned account status page
- `/account/suspended` - Suspended account status page
- `/account/appeal/create` - Submit appeal form
- `/account/appeal/{id}` - View appeal status

### Admin

- `/admin/users` - User directory with moderation actions
- `/admin/appeals` - Appeals list
- `/admin/appeals/{id}` - Appeal review page
- `/admin/moderation` - Content moderation queue
- `/admin/moderation/{type}/{id}` - Content detail/review

## Best Practices

1. **Always provide clear reasons** when suspending/banning/warning users
2. **Use warnings before suspensions** for minor violations
3. **Document internal notes** for transparency and audit trail
4. **Review appeals promptly** to maintain user trust
5. **Use bulk moderation** for efficiency but review carefully
6. **Set appropriate expiry dates** for temporary suspensions

## Future Enhancements

- Automated moderation rules
- Warning escalation system (X warnings = auto-suspend)
- Appeal templates
- Moderation analytics dashboard
- User notification preferences
- Moderation history export




