# Appeals System

## Overview

The appeals system allows users who have been suspended or banned to contest the decision and request a review from the moderation team.

## User Experience

### Submitting an Appeal

1. User is suspended or banned
2. User logs in and is redirected to account status page
3. Page displays reason for action and any active warnings
4. If eligible, user sees "Submit Appeal" button
5. User fills out appeal form with detailed explanation
6. Appeal is submitted and marked as "pending"

### Appeal Eligibility

Users can submit an appeal if:
- They are currently suspended OR banned
- They do not have a pending appeal for the same action type

### Appeal Status

- **Pending**: Awaiting review
- **Approved**: Appeal granted, action reversed
- **Rejected**: Appeal denied, action upheld
- **Dismissed**: Appeal dismissed without decision

## Admin Experience

### Reviewing Appeals

1. Navigate to `/admin/appeals`
2. Filter by status, type, or search
3. Click on appeal to view details
4. Review user's explanation and account history
5. Choose action: Approve, Reject, or Dismiss
6. Add review notes (visible to user)
7. Submit decision

### Automatic Actions

When an appeal is **approved**:
- Suspension appeals automatically unsuspend the user
- Ban appeals automatically unban the user
- User is immediately able to access the platform

When an appeal is **rejected** or **dismissed**:
- Original action remains in effect
- User can see the decision and review notes

## Implementation Details

### Models

- `UserAppeal` - Stores appeal data and status
- `User` - Has many appeals

### Controllers

- `UserAppealController` - User-facing appeal submission
- `AdminAppealController` - Admin appeal review

### Policies

- Users can create appeals for their own account
- Admins/Moderators can view and review all appeals

### Events

- `AppealSubmitted` - Fired when user submits appeal
- `AppealReviewed` - Fired when admin reviews appeal

## Best Practices

1. **Review appeals promptly** - Users are waiting for decisions
2. **Be thorough in review notes** - Explain your decision clearly
3. **Consider context** - Review user's full history, not just the incident
4. **Be fair** - Reverse actions when appeals are legitimate
5. **Document everything** - Review notes help maintain consistency




