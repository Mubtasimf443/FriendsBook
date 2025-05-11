# Activity API Documentation

## Add Profile to Shortlist
Add a user profile to the shortlist.

**Endpoint:** `POST /users/short-list/add`

**Authentication:** Required

**Request Body:**
```json
{
  "shortListedId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile added to shortlist"
}
```

## Remove Profile from Shortlist
Remove a user profile from the shortlist.

**Endpoint:** `DELETE /users/short-list/remove`

**Request Body:**
```json
{
  "shortListedId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile removed from shortlist"
}
```

## Update Online Status
Mark user as online.

**Endpoint:** `PUT /users/online/active`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "User marked as online"
}
```

## Update Offline Status
Mark user as offline.

**Endpoint:** `PUT /users/online/in-active`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "User marked as offline"
}
```

## Record Profile Visit
Record when a user visits another user's profile.

**Endpoint:** `POST /users/visit-profile`

**Authentication:** Required

**Request Body:**
```json
{
  "visitedId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile visit recorded"
}
```

## Like Profile
Record a like on a user's profile.

**Endpoint:** `POST /users/like-profile`

**Authentication:** Required

**Request Body:**
```json
{
  "likedId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile like recorded"
}
```

## Send Mail to Profile
Send an email to another user.

**Endpoint:** `POST /users/send-mail`

**Authentication:** Required

**Request Body:**
```json
{
  "receiverId": "string",
  "message": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email queued for sending"
}
```

## Send SMS to Profile
Send an SMS to another user.

**Endpoint:** `POST /users/send-sms`

**Authentication:** Required

**Request Body:**
```json
{
  "receiverId": "string",
  "message": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "SMS queued for sending"
}
```

## Get Activity History
Retrieve user activity history.

**Endpoint:** `GET /users/activity-history`

**Authentication:** Required

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `type` (string): Activity type ('likes', 'emails', 'sms')
- `count` (string, optional): Include total count ('yes'/'no')

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "string",
    "activities": "array",
    "pagination": {
      "currentPage": "number",
      "pageSize": "number",
      "totalPages": "number",
      "totalActivities": "number"
    }
  }
}
```

## Request Phone Number View
Request to view another user's phone number.

**Endpoint:** `POST /request-phone-view`

**Authentication:** Required

**Request Body:**
```json
{
  "requestedUserId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "phoneInfo": "object"
    }
  },
  "message": "OK"
}
```

## Block User
Block a user.

**Endpoint:** `POST /block/user/:id`

**Authentication:** Required

**Request Parameters:**
- `id` (string): User ID to block

**Request Body:**
```json
{
  "reason": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "blockedUser": {
      "id": "string",
      "name": "string"
    },
    "blockedAt": "date",
    "reason": "string"
  },
  "message": "User blocked successfully"
}
```

## Unblock User
Unblock a previously blocked user.

**Endpoint:** `POST /unblock/user/:id`

**Authentication:** Required

**Request Parameters:**
- `id` (string): User ID to unblock

**Response:**
```json
{
  "success": true,
  "data": {
    "unBlockedUser": {
      "id": "string",
      "name": "string"
    },
    "unBlockedAt": "date"
  },
  "message": "User unblocked successfully"
}
```

## Get Match Result
Calculate match score between two users.

**Endpoint:** `GET /match-result`

**Authentication:** Required

**Request Body:**
```json
{
  "profile_id": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Match score calculated successfully",
  "data": {
    "overallScore": "number",
    "compatibility": "string",
    "categoryScores": "object",
    "details": "object"
  }
}
```