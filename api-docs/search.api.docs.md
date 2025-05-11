### 10. Get Users by Location Match
Find profiles in nearby districts based on user's current location.

**Endpoint:** `GET /users/matching/location`

**Query Parameters:**
```typescript
{
  page: number;    // Page number for pagination
  limit: number;   // Number of results per page
  count: boolean;  // Whether to include total count
}
```

**Headers:**
```
Authorization: Bearer <auth-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "districts": [
      {
        "name": "District Name",
        "bn_name": "জেলার নাম"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "totalPages": 5,
      "totalUsers": 50
    },
    "users": [
      {
        "mid": "BD123456",
        "name": "User Name",
        // ... other user details
      }
    ]
  }
}
```

### 11. Get Daily Matches
Get recommended matches for the day.

**Endpoint:** `GET /users/matching/daily`

**Query Parameters:**
```typescript
{
  limit: number;  // Number of matches to return
}
```

**Headers:**
```
Authorization: Bearer <auth-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "mid": "BD123456",
        "name": "User Name",
        // ... other user details
      }
    ]
  }
}
```

### 12. Get Not Viewed Profiles
Get profiles that the user hasn't viewed yet.

**Endpoint:** `GET /users/not-viewed`

**Query Parameters:**
```typescript
{
  page: number;    // Page number for pagination
  limit: number;   // Number of results per page
  count: boolean;  // Whether to include total count
}
```

**Headers:**
```
Authorization: Bearer <auth-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "mid": "BD123456",
        "name": "User Name",
        // ... other user details
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "totalPages": 5,
      "totalUsers": 50
    }
  }
}
```

### 13. Get Online Users
Get currently online users matching preferences.

**Endpoint:** `GET /users/online`

**Query Parameters:**
```typescript
{
  page: number;    // Page number for pagination
  limit: number;   // Number of results per page
  count: boolean;  // Whether to include total count
}
```

**Headers:**
```
Authorization: Bearer <auth-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "mid": "BD123456",
        "name": "User Name",
        "onlineStatus": {
          "isOnline": true,
          "lastActive": "2025-05-11T06:56:58Z"
        }
        // ... other user details
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "totalPages": 5,
      "totalUsers": 50
    }
  }
}
```

### 14. Get Profile Viewers
Get users who have viewed your profile.

**Endpoint:** `GET /users/others-viewed-my-profile`

**Headers:**
```
Authorization: Bearer <auth-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "mid": "BD123456",
        "name": "User Name",
        // ... other user details
      }
    ]
  }
}
```

### 15. Get Mutual Connections
Get users who have accepted connection requests with current user.

**Endpoint:** `GET /users/mutual`

**Query Parameters:**
```typescript
{
  page: number;    // Page number for pagination
  limit: number;   // Number of results per page
  count: boolean;  // Whether to include total count
}
```

**Headers:**
```
Authorization: Bearer <auth-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "mid": "BD123456",
        "name": "User Name",
        // ... other user details
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "totalPages": 5,
      "totalUsers": 50
    }
  }
}
```

### 16. Get Viewed But Not Contacted Profiles
Get users who viewed profile but haven't sent connection requests.

**Endpoint:** `GET /users/viewed-not-contact`

**Query Parameters:**
```typescript
{
  page: number;    // Page number for pagination
  limit: number;   // Number of results per page
  count: boolean;  // Whether to include total count
}
```

**Headers:**
```
Authorization: Bearer <auth-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "mid": "BD123456",
        "name": "User Name",
        "viewedAt": "2025-05-11T06:56:58Z",
        // ... other user details
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "totalPages": 5,
      "totalUsers": 50
    }
  }
}
```

### 17. Get Liked By Me Profiles
Get profiles that the current user has liked.

**Endpoint:** `GET /users/liked-by-me`

**Query Parameters:**
```typescript
{
  page: number;    // Page number for pagination
  limit: number;   // Number of results per page
  count: boolean;  // Whether to include total count
}
```

**Headers:**
```
Authorization: Bearer <auth-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "mid": "BD123456",
        "name": "User Name",
        // ... other user details
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "totalPages": 5,
      "totalUsers": 50
    }
  }
}
```

### 18. Get Profiles Who Liked Me
Get profiles that have liked the current user.

**Endpoint:** `GET /users/liked-me`

**Query Parameters:**
```typescript
{
  page: number;    // Page number for pagination
  limit: number;   // Number of results per page
  count: boolean;  // Whether to include total count
}
```

**Headers:**
```
Authorization: Bearer <auth-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "mid": "BD123456",
        "name": "User Name",
        // ... other user details
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "totalPages": 5,
      "totalUsers": 50
    }
  }
}
```

### 19. Get Email Sent Profiles
Get profiles to whom current user has sent emails.

**Endpoint:** `GET /users/send-mails-by-me`

**Query Parameters:**
```typescript
{
  page: number;    // Page number for pagination
  limit: number;   // Number of results per page
  count: boolean;  // Whether to include total count
}
```

**Headers:**
```
Authorization: Bearer <auth-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "mid": "BD123456",
        "name": "User Name",
        // ... other user details
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "totalPages": 5,
      "totalUsers": 50
    }
  }
}
```

### 20. Get Email Received Profiles
Get profiles who have sent emails to current user.

**Endpoint:** `GET /users/send-mails-to-me`

**Query Parameters:**
```typescript
{
  page: number;    // Page number for pagination
  limit: number;   // Number of results per page
  count: boolean;  // Whether to include total count
}
```

**Headers:**
```
Authorization: Bearer <auth-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "mid": "BD123456",
        "name": "User Name",
        // ... other user details
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "totalPages": 5,
      "totalUsers": 50
    }
  }
}
```

### 21. Get SMS Sent Profiles
Get profiles to whom current user has sent SMS.

**Endpoint:** `GET /users/send-sms-by-me`

**Query Parameters:**
```typescript
{
  page: number;    // Page number for pagination
  limit: number;   // Number of results per page
  count: boolean;  // Whether to include total count
}
```

**Headers:**
```
Authorization: Bearer <auth-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "mid": "BD123456",
        "name": "User Name",
        // ... other user details
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "totalPages": 5,
      "totalUsers": 50
    }
  }
}
```

### 22. Get SMS Received Profiles
Get profiles who have sent SMS to current user.

**Endpoint:** `GET /users/send-sms-to-me`

**Query Parameters:**
```typescript
{
  page: number;    // Page number for pagination
  limit: number;   // Number of results per page
  count: boolean;  // Whether to include total count
}
```

**Headers:**
```
Authorization: Bearer <auth-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "mid": "BD123456",
        "name": "User Name",
        // ... other user details
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "totalPages": 5,
      "totalUsers": 50
    }
  }
}
```

### 23. Get Phone Number Viewed Profiles
Get profiles whose phone numbers the current user has viewed.

**Endpoint:** `GET /users/seen-phone-details`

**Query Parameters:**
```typescript
{
  page: number;    // Page number for pagination
  limit: number;   // Number of results per page
  count: boolean;  // Whether to include total count
}
```

**Headers:**
```
Authorization: Bearer <auth-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "mid": "BD123456",
        "name": "User Name",
        // ... other user details
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "totalPages": 5,
      "totalUsers": 50
    }
  }
}
```

### 24. Get Profiles Who Viewed My Phone Number
Get profiles who have viewed the current user's phone number.

**Endpoint:** `GET /users/seen-my-phone-details`

**Query Parameters:**
```typescript
{
  page: number;    // Page number for pagination
  limit: number;   // Number of results per page
  count: boolean;  // Whether to include total count
}
```

**Headers:**
```
Authorization: Bearer <auth-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "mid": "BD123456",
        "name": "User Name",
        // ... other user details
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "totalPages": 5,
      "totalUsers": 50
    }
  }
}
```

### 25. Get Suggested Profiles
Get profiles suggested based on user preferences and matching criteria.

**Endpoint:** `GET /users/suggested-for-you`

**Query Parameters:**
```typescript
{
  page: number;    // Page number for pagination
  limit: number;   // Number of results per page
  count: boolean;  // Whether to include total count
}
```

**Headers:**
```
Authorization: Bearer <auth-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "mid": "BD123456",
        "name": "User Name",
        // ... other user details
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "totalPages": 5,
      "totalUsers": 50
    }
  },
  "message": "SUGGESTED_USERS_FOUND"
}
```

### Common Error Responses for All Endpoints

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Authentication required",
  "data": null
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Insufficient permissions",
  "data": null
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Resource not found",
  "data": null
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal server error",
  "data": null
}
```

### Error Handler

The API implements a global error handler that:
- Logs all errors with timestamps and stack traces
- Sanitizes error messages for production
- Returns consistent error response formats
- Handles validation errors from Zod
- Manages MongoDB/Mongoose errors
- Processes authentication/authorization errors

### Caching Strategy

Most endpoints implement the following caching strategy:
- GET requests are cached for 60 seconds by default
- Cache-Control headers are included in responses
- User-specific data uses private cache
- Public data uses shared cache
- Premium user data has shorter cache duration

### Rate Limiting

The search routes implement rate limiting:
- Basic users: 100 requests per hour
- Premium users: 500 requests per hour
- Applies per IP address and user token
- Includes custom error responses for rate limits