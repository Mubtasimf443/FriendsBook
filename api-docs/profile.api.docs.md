# Profile API Documentation

## Overview

This documentation covers the Profile API endpoints for user profile management in the matrimony application. All endpoints require authentication and are subject to rate limiting.

**Base URL:** `/profile`  
**Authentication:** Bearer token required for all endpoints  
**Rate Limit:** 150 requests per 120 seconds

---

## User Details API Documentation

### Overview
The User Details API endpoint allows retrieving specific user profile fields with enhanced validation and flexible field selection.

### Endpoint
```
GET /user-details
```

#### Query Parameters
| Parameter | Type | Description | Optional | Default |
|-----------|------|-------------|----------|---------|
| `fields` | string[] | Array of user profile fields to retrieve | Yes | [Default Fields](#default-fields) |

#### Available Fields
- `name`
- `mid`
- `email`
- `phoneInfo`
- `gender`
- `age`
- `dateOfBirth`
- `height`
- `weight`
- `maritalStatus`
- `profileCreatedBy`
- `profileImage`
- `coverImage`
- `userImages`
- `address`
- `religion`
- `languages`
- `isEducated`
- `education`
- `occupation`
- `annualIncome`
- `aboutMe`
- `familyInfo`
- `createdAt`
- `onlineStatus`
- `partnerPreference`
- `enhancedSettings`

#### Default Fields
By default, if no fields are specified, the following fields will be returned:
- `name`
- `mid`
- `email`
- `phoneInfo`
- `gender`
- `age`
- `dateOfBirth`
- `height`
- `weight`
- `maritalStatus`
- `profileCreatedBy`
- `profileImage`
- `coverImage`
- `userImages`
- `religion`
- `languages`
- `isEducated`
- `education`
- `occupation`
- `annualIncome`

### Request Examples

### Retrieve Default Fields
```http
GET /user-details
```

### Retrieve Specific Fields
```http
GET /user-details?fields=name&fields=email&fields=age
```

## Response

### Successful Response
```json
{
  "success": true,
  "data": {
    "userDetails": {
      // Selected user details
    }
  },
  "error": null,
  "message": "User details retrieved successfully"
}
```

### Error Responses

#### Invalid Fields
```json
{
  "success": false,
  "message": "Invalid request parameters",
  "error": [
    // Zod validation error details
  ],
  "data": null
}
```

#### User Not Found
```json
{
  "success": false,
  "message": "User details not found",
  "data": null
}
```

#### Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "InternalServerError",
  "data": null
}
```

## Validation Rules
- Maximum of 22 fields can be requested per query
- Fields must be valid from the predefined list
- Invalid fields will result in a 400 Bad Request error

## Authentication
- Requires user authentication
- Uses `authSession` to retrieve the current user's ID

## Potential Error Messages
- **Invalid Field**: "Invalid field requested: '{field}'. Please refer to the API documentation for valid fields"
- **Too Many Fields**: "Too many fields requested. Maximum 22 fields allowed per request"
- **Access Restricted**: "Access to requested fields is restricted by privacy settings"
- **Premium Required**: "This field requires a premium subscription"

## Notes
- The API uses Zod for robust input validation
- All field selections are case-sensitive
- Unexpected or unauthorized field requests will be rejected
## Update User Details

Update various user profile information.

### Request

```http
PUT /user-details
```

### Authentication

Bearer token required

### Request Body

The request body can include any of the following fields to update:

```json
{
  "name": "John Doe",
  "gender": "MALE",
  "dateOfBirth": "1990-01-01",
  "age": 33,
  "weight": 75,
  "height": 178,
  "maritalStatus": "SINGLE",
  "phoneInfo": {
    "countryCode": "+1",
    "number": "1234567890"
  },
  "address": {
    "country": "United States",
    "state": "California",
    "city": "San Francisco",
    "street": "123 Main St",
    "postalCode": "94105"
  },
  "religion": "ISLAM",
  "languages": ["ENGLISH", "ARABIC"],
  "occupation": "SOFTWARE_ENGINEER",
  "annualIncome": {
    "amount": 100000,
    "currency": "USD"
  },
  "aboutMe": {
    "bio": "I am a software engineer who loves to travel",
    "interestedSports": ["CRICKET", "FOOTBALL"],
    "interestedHobbies": ["READING", "COOKING"],
    "interestedFoodTypes": ["ITALIAN", "CHINESE"],
    "interestedMusicTypes": ["ROCK", "CLASSICAL"],
    "badHabits": []
  },
  "familyInfo": {
    "fatherStatus": "ALIVE",
    "motherStatus": "ALIVE",
    "noOfBrothers": 1,
    "noOfSisters": 1,
    "familyType": "NUCLEAR",
    "familyValues": "MODERATE"
  },
  "enhancedSettings" :{
    "privacy": {
     "whoCanViewProfile" : true ,
     "whoCanContactMe" : true ,
     "showShortlistedNotification" : true ,
     "showProfileViewNotification" : true 
    },
    "notifications" :{
     "dailyRecommendations" : true ,
     "todaysMatch" : true ,
     "profileViews" : true ,
     "shortlists" : true ,
     "messages" : true ,
     "connectionRequests" : true 
    }
  },
  "fcmToken": "firebase-cloud-messaging-token"
}
```

### Response

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "User details updated successfully",
  "data": {
    // Updated user profile
  }
}
```

#### Error Responses

**400 Bad Request**
```json
{
  "success": false,
  "message": "Validation error",
  "data": null,
  "errors": [
    // Validation errors
  ]
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "User not found",
  "data": null
}
```

**409 Conflict**
```json
{
  "success": false,
  "message": "MongoDB duplicate key error",
  "data": null,
  "error": "Field name already exists"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "Internal server error",
  "data": null
}
```

---

## Update Education Details

Update user's education information.

### Request

```http
PUT /user-details/education
```

### Authentication

Bearer token required

### Request Body

```json
{
  "isEducated": true,
  "education": [
    {
      "level": "BACHELORS",
      "certificate": "B.Sc in Computer Science",
      "institution": "Stanford University",
      "yearOfCompletion": 2015,
      "grade": "A",
      "additionalInfo": "Graduated with honors"
    },
    {
      "level": "MASTERS",
      "certificate": "M.Sc in Software Engineering",
      "institution": "MIT",
      "yearOfCompletion": 2017,
      "grade": "A-",
      "additionalInfo": "Specialized in AI/ML"
    }
  ]
}
```

If `isEducated` is set to `false`, the `education` array will be cleared even if provided.

### Response

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Education details updated successfully",
  "data": {
    "isEducated": true,
    "education": [
      // Education details array
    ]
  }
}
```

#### Error Responses

**400 Bad Request**
```json
{
  "success": false,
  "message": "Validation error",
  "error": [
    // Validation errors
  ],
  "data": null
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "User not found",
  "data": null
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "Internal server error",
  "data": null
}
```

---

## Create Membership Request

Create a new membership request.

### Request

```http
POST /membership-request
```

### Authentication

Bearer token required

### Request Body

```json
{
  "startDate": "2025-06-01",  // ISO format date string
  "duration": 3               // Duration in months
}
```

### Response

#### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Membership request created successfully",
  "data": {
    "requesterID": "user_id",
    "startDate": "2025-06-01T00:00:00.000Z",
    "duration": 3,
    "endDate": "2025-09-01T00:00:00.000Z",
    "requestStatus": "PENDING",
    "requestDate": "2025-05-11T10:30:00.000Z"
    // Other membership request details
  }
}
```

#### Error Responses

**400 Bad Request**
```json
{
  "success": false,
  "message": "You already have a pending membership request",
  "data": null
}
```

**400 Bad Request**
```json
{
  "success": false,
  "message": "User Already has an active membership, You can not request membership when User has a membership active",
  "data": null
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "User not found",
  "data": null
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "Internal server error",
  "data": null
}
```

---

## Update User Photo

Update profile, cover, or add to user image gallery.

### Request

```http
POST /update-photo
```

### Authentication

Bearer token required

### Request Body

```json
{
  "photoType": "profileImage",  // "profileImage", "coverImage", or "userImages"
  "asset_id": "uuid-of-uploaded-asset"
}
```

### Response

#### Success Response (200 OK)

For profileImage or coverImage:
```json
{
  "success": true,
  "data": {
    "photoType": "profileImage",
    "url": "https://example.com/photos/123.jpg"
  },
  "error": null,
  "message": "Profile photo updated successfully"
}
```

For userImages:
```json
{
  "success": true,
  "data": {
    "photoType": "userImages",
    "totalPhotos": 3,
    "remainingSlots": 7
  },
  "error": null,
  "message": "Photo successfully added to your gallery"
}
```

#### Error Responses

**400 Bad Request**
```json
{
  "success": false,
  "message": "Invalid request parameters",
  "error": [
    // Validation errors
  ],
  "data": null
}
```

**400 Bad Request**
```json
{
  "success": false,
  "message": "Maximum photo limit reached. You can upload up to 10 photos.",
  "error": "MAX_PHOTOS_LIMIT_REACHED",
  "data": null
}
```

**400 Bad Request**
```json
{
  "success": false,
  "message": "This photo has already been added to your gallery.",
  "error": "DUPLICATE_PHOTO",
  "data": null
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Asset not found. Please ensure you are using a valid asset ID.",
  "error": "ASSET_NOT_FOUND",
  "data": null
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "An error occurred while updating your photo. Please try again later.",
  "error": "INTERNAL_SERVER_ERROR",
  "data": null
}
```

---

## Delete User Image

Delete a user's photo (profile, cover, or from gallery).

### Request

```http
DELETE /user-image
```

### Authentication

Bearer token required

### Request Body

```json
{
  "photoType": "userImages",  // "profileImage", "coverImage", or "userImages"
  "imageId": "uuid-of-image-to-delete"
}
```

### Response

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Image deleted successfully",
  "data": null
}
```

#### Error Responses

**400 Bad Request**
```json
{
  "success": false,
  "message": "Invalid request parameters",
  "error": [
    // Validation errors
  ],
  "data": null
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Image not found in user images",
  "data": null
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "Internal server error",
  "data": null
}
```

---

## Get Membership Request History

Retrieve membership request history with pagination and filtering.

### Request

```http
GET /membership-request
```

### Authentication

Bearer token required

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | Number | No | Page number (default: 1) |
| `limit` | Number | No | Items per page (default: 25, options: 10, 25, 50, 100) |
| `status` | String | No | Filter by status (options: "PENDING", "APPROVED", "REJECTED", "CANCELLED", "all") |
| `count` | String | No | Include total count (options: "yes", "no", default: "no") |

### Response

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "requests": [
      // Array of membership requests
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 25,
      "totalPages": 3,        // Only included if count=yes
      "totalRequests": 60     // Only included if count=yes
    },
    "filterCriteria": {
      "status": "PENDING"     // or whichever status was requested
    }
  }
}
```

#### Error Responses

**400 Bad Request**
```json
{
  "success": false,
  "message": "Invalid query parameters",
  "error": [
    // Validation errors
  ],
  "data": null
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "Internal server error",
  "data": null
}
```

---

## Cancel Membership Request

Cancel a pending membership request.

### Request

```http
PUT /membership-request/cancel
```

### Authentication

Bearer token required

### Response

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Membership request cancelled successfully",
  "data": {
    // Cancelled membership request details
    "requestStatus": "CANCELLED",
    // Other details
  }
}
```

#### Error Responses

**404 Not Found**
```json
{
  "success": false,
  "message": "No pending membership request found",
  "data": null
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "Internal server error",
  "data": null
}
```

---

## Delete Cancelled Membership Request

Delete a cancelled membership request from history.

### Request

```http
DELETE /membership-request
```

### Authentication

Bearer token required

### Response

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Membership request deleted successfully",
  "data": null
}
```

#### Error Responses

**404 Not Found**
```json
{
  "success": false,
  "message": "No cancelled membership request found",
  "data": null
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "Internal server error",
  "data": null
}
```