# Live Streaming Mock Feature

## Overview

This is a comprehensive live streaming mock feature that combines elements of cam sites, TikTok Live, and Twitch. It's designed as a fully functional mock that uses WebRTC for local camera access and Laravel Echo for real-time chat/tips, but does not connect to an actual streaming service yet.

## Feature Flag

The live streaming feature is controlled by the `feature_live_streaming_enabled` feature flag in admin settings. When disabled, all live streaming routes and UI elements are hidden.

**To enable:**
1. Go to Admin Settings
2. Navigate to Features section
3. Enable "Live Streaming" toggle

## Database Schema

### Tables

- `live_streams` - Main stream records
- `live_stream_participants` - Users on stage (host, co-host, guest, viewer)
- `live_stream_moderators` - Moderators assigned to streams
- `live_stream_chat_messages` - Chat messages in streams
- `live_stream_tips` - Tips given during streams

## Models

- `LiveStream` - Main stream model with relationships and scopes
- `LiveStreamParticipant` - Participant model
- `LiveStreamModerator` - Moderator model
- `LiveStreamChatMessage` - Chat message model
- `LiveStreamTip` - Tip model

## Enums

- `LiveStreamStatus` - scheduled, live, ended
- `LiveStreamCategory` - entertainment, gaming, adult, music, talk, education, other
- `LiveStreamVisibility` - public, followers, subscribers
- `LiveStreamParticipantRole` - host, co_host, guest, viewer
- `LiveStreamChatMessageType` - text, tip, system
- `LiveStreamTipStatus` - pending, completed, failed

## Routes

### Public Routes (Feature Flag Protected)
- `GET /live` - Browse all live streams
- `GET /live/{stream}` - View a specific stream

### Authenticated Routes (Feature Flag + Auth Protected)
- `GET /live/broadcast/start` - Pre-stream setup page
- `POST /live/broadcast/start` - Start a stream
- `POST /live/broadcast/{stream}/end` - End a stream
- `GET /live/broadcast/{stream}/obs` - OBS settings page
- `PATCH /live/broadcast/{stream}/settings` - Update stream settings

### Stage Management
- `POST /live/{stream}/stage/invite` - Invite user to stage
- `DELETE /live/{stream}/stage/{user}` - Remove from stage
- `POST /live/{stream}/stage/{user}/promote` - Promote to co-host

### Chat
- `GET /live/{stream}/chat` - Get chat messages
- `POST /live/{stream}/chat` - Send chat message

### Tips
- `POST /live/{stream}/tips` - Send tip
- `GET /live/{stream}/tips/leaderboard` - Get tip leaderboard

## Broadcasting Channels

- `stream.{streamId}` - Public channel for viewers
- `private-stream.{streamId}` - Private channel for stream control
- `private-stream-chat.{streamId}` - Chat channel
- `private-stream-stage.{streamId}` - Stage management channel

## Events

- `StreamStarted` - Fired when a stream starts
- `StreamEnded` - Fired when a stream ends
- `StreamUpdated` - Fired when stream details are updated
- `ParticipantJoined` - Fired when someone joins the stage
- `ParticipantLeft` - Fired when someone leaves the stage
- `ParticipantPromoted` - Fired when a participant is promoted
- `ChatMessageSent` - Fired when a chat message is sent
- `TipReceived` - Fired when a tip is received
- `ViewerCountUpdated` - Fired periodically with viewer count updates

## Frontend Pages

### Implemented
- `LiveStreaming/Browse.tsx` - Browse all live streams page

### TODO
- `LiveStreaming/Show.tsx` - Viewer page
- `LiveStreaming/Broadcast/Start.tsx` - Pre-stream setup
- `LiveStreaming/Broadcast/Live.tsx` - Broadcaster control panel
- `LiveStreaming/Broadcast/OBSSettings.tsx` - OBS configuration

## Mock Implementation Details

### Streaming Service Mock
- Stream keys are generated as UUIDs
- RTMP URLs are mock: `rtmp://mock-server.example.com/stream/{streamKey}`
- Display "Ready to Stream" status (no actual connection)

### Camera Mock
- Uses actual WebRTC `getUserMedia` for real camera access
- Displays local preview
- No actual streaming to server

### Chat
- Real Laravel Echo integration
- Messages stored in database
- Real-time broadcast works

### Tips
- Integration with existing `TipService`
- Real payment processing (use existing payment gateway)
- Mock tip animations on screen
- Tip leaderboard updates in real-time

### Viewer Count Mock
- Simulate viewer count with random increments
- Update every 10-30 seconds via Echo
- No actual connection tracking

## Implementation Status

### Completed
- ✅ Database migrations
- ✅ All models with relationships and scopes
- ✅ All enums
- ✅ Feature flag integration
- ✅ Broadcasting channel definitions
- ✅ All events
- ✅ Routes structure
- ✅ Header button with feature flag check
- ✅ Browse page for listing all streams
- ✅ Basic LiveStreamController with index and show methods

### In Progress / TODO
- ⏳ Complete remaining controller methods
- ⏳ Frontend viewer page
- ⏳ Frontend broadcaster pages
- ⏳ Chat system implementation
- ⏳ Tips integration
- ⏳ Moderation panel
- ⏳ OBS settings page
- ⏳ Stage management UI
- ⏳ Real-time Echo integration on frontend
- ⏳ WebRTC camera preview component
- ⏳ Responsive mobile layouts

## Future Integration Notes

When integrating a real streaming service:

1. Replace mock RTMP URL generation with real service API calls
2. Replace mock stream key generation with real service keys
3. Implement actual stream status checking
4. Connect viewer count to real tracking
5. Integrate actual video streaming (WebRTC, HLS, etc.)
6. Add recording functionality
7. Implement bandwidth/quality controls

## Testing

Since this is a mock, focus on:
- UI/UX flow testing
- Responsive design testing
- Real-time updates (Echo)
- Camera permissions handling
- Error states (no camera, permissions denied)
- Mobile vs Desktop experience




