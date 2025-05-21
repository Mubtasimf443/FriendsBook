# Random Video Call System Documentation

This document provides a comprehensive overview of the random video calling feature, which connects users for short 20-second video chats.

## Overview

The system consists of:
1. A Node.js backend using Socket.io for signaling
2. WebRTC via PeerJS for peer-to-peer video communication
3. MongoDB for tracking call sessions and user data

## Call Duration

**Video calls automatically terminate after 20 seconds.** This is enforced by a server-side timer that triggers when peer details are exchanged.

## Server-Side Implementation

### Socket Events (Emitted by Server)

| Event Name | Description | Payload |
|------------|-------------|---------|
| `connected` | Confirms successful socket connection | `{ data: null }` |
| `video-call-initialized` | Confirms video call initialization | `{ data: { roomId: string } }` |
| `call-initialization-error` | Error creating video call request | `{ message: string }` |
| `connecting` | Notifies client that connection process started | `{ data: null }` |
| `not-connected` | Notifies client that no match was found | `{ data: null }` |
| `connection-creation-failed` | Error establishing connection | `{ message: string }` |
| `call-user` | Forwards peer details to the other user | `signal` (WebRTC signal data) |
| `invalid-peer-details` | Error with provided peer details | `{ data: null }` |
| `caller-details` | Provides information about the caller | `{ name: string, photo: string, email: string }` |
| `caller-details-error` | Error retrieving caller details | `{ message: string }` |
| `leave-calling-room-error` | Error leaving call room | `{ data: null }` |
| `end-call` | Notifies clients to end the call | `roomId` (string) |
| `give-peer-details` | Requests peer to provide their WebRTC details | `roomId` (string) |
| `connection-created` | Confirms successful connection creation | `{ data: null }` |

### Client Events (Listened for by Server)

| Event Name | Description | Parameters |
|------------|-------------|------------|
| `init-video-call` | Initialize a new video call | None |
| `connect-video-call` | Connect to a video call | `roomId` (string) |
| `peer-details` | Send WebRTC peer details | `signal`, `userBRoomId` |
| `caller-details-request` | Request information about caller | None |
| `leave-call-room` | Leave a call room | `roomId` (string) |
| `stop-video-call` | Stop an ongoing video call | `roomId` (string) |
| `disconnect` | Client disconnected | None |

## Client-Side Implementation

The client implementation uses:
- Socket.io client for signaling
- PeerJS for WebRTC connections
- Navigator MediaDevices API for camera/microphone access

### Key Components

- **Authentication**: Token-based auth required for connection
- **Video Elements**: Local and remote video streams
- **Connection Flow**: Button-triggered connection process
- **Call Termination**: Manual stop button + auto-termination after 20 seconds

## Connection Flow

1. **Initial Connection**:
   - Client connects with authentication token
   - Client initializes PeerJS
   - Client requests camera/microphone access

2. **Call Initialization**:
   - Client emits `init-video-call`
   - Server creates room, responds with `video-call-initialized`
   - Connect button becomes visible

3. **Matching Process**:
   - User clicks Connect button → Client emits `connect-video-call`
   - Server matches with opposite gender user or waits 5 seconds
   - If match found, server emits `give-peer-details`

4. **WebRTC Connection**:
   - Client emits `peer-details` with PeerJS ID
   - Server forwards to matched user with `call-user`
   - Receiving user confirms and establishes WebRTC connection
   - Video streams exchange directly between peers

5. **Call Termination**:
   - After 20 seconds, server automatically emits `end-call`
   - Or user can manually end call with Stop button
   - Client cleans up by closing PeerJS connection and leaving socket room

## Authentication

Socket connections require:
- Valid token in handshake auth
- Profile type must be 'video_calling_member'

## Matching Algorithm

- Users are matched with users of the opposite gender
- Random chance of immediate match attempt or 5-second delay
- Server cleans up existing sessions for reconnecting users

## ICE Servers Configuration

The client uses multiple STUN servers for optimal connection:
- Google STUN servers
- Various public STUN servers for NAT traversal

## Database Schema

The system uses MongoDB with two main models:
- **VideoProfile**: Stores user data and auth credentials
- **RandomVideoCall**: Tracks call sessions with fields for:
  - userId
  - status ('searching', 'connected', 'ended')
  - roomId
  - gender
  - connectedWith