# Profile API Documentation

## Get User Details
Retrieve user profile details.

**Endpoint:** `GET /user-details`

**Authentication:** Required

**Rate Limit:** 120 requests per 120 seconds

**Query Parameters:**

- `fields` (array, optional): Specific fields to retrieve
  - Default: First 10 basic profile fields
  - Maximum: 37 fields per request



### Available Profile Fields
The following fields can be requested in the `fields` parameter:

```typescript
const Fields = [
    'name',
    'mid',
    'email',
    'phoneInfo',
    'gender',
    'age',
    'dateOfBirth',
    'height',
    'weight',
    'maritalStatus',
    'profileCreatedBy',
    'profileImage',
    'coverImage',
    'userImages',
    'address',
    'religion',
    'languages',
    'isEducated',
    'education',
    'occupation',
    'annualIncome',
    'aboutMe',
    'familyInfo',
    'aboutMe.interestedSports',
    'aboutMe.interestedHobbies',
    'aboutMe.interestedFoodTypes',
    'aboutMe.interestedMusicTypes',
    'aboutMe.badHabits',
    'createdAt',
    'onlineStatus',
    'preferences.age',
    'preferences.height',
    'preferences.weight',
    'preferences.education',
    'preferences.location',
    'enhancedSettings.privacy.whoCanViewProfile',
    'enhancedSettings.privacy.whoCanContactMe'
]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userDetails": {
      // Requested user profile fields
    }
  },
  "error": null,
  "message": "User details retrieved successfully"
}
```

## Update User Details
Update user profile information.

**Endpoint:** `PUT /user-details`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "string",
  "gender": "string",
  "dateOfBirth": "string",
  "age": "number",
  "weight": "number",
  "height": "number",
  "maritalStatus": "string",
  "phoneInfo": "object",
  "address": "object",
  "religion": "string",
  "languages": "array",
  "occupation": "string",
  "annualIncome": "object",
  "aboutMe": "object",
  "familyInfo": "object",
  "preferences": "object",
  "fcmToken": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User details updated successfully",
  "data": {
    // Updated user profile
  }
}
```

## Update Education Details
Update user's education information.

**Endpoint:** `PUT /user-details/education`

**Authentication:** Required

**Request Body:**
```json
{
  "isEducated": "boolean",
  "education": [
    {
      "level": "string",
      "certificate": "string",
      "institution": "string",
      "yearOfCompletion": "number",
      "grade": "string",
      "additionalInfo": "string"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Education details updated successfully",
  "data": {
    "isEducated": "boolean",
    "education": "array"
  }
}
```

## Create Membership Request
Create a new membership request.

**Endpoint:** `POST /membership-request`

**Authentication:** Required

**Request Body:**
```json
{
  "startDate": "string",
  "duration": "number"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Membership request created successfully",
  "data": {
    // Membership request details
  }
}
```

## Update User Photo
Update profile, cover, or user images.

**Endpoint:** `POST /update-photo`

**Authentication:** Required

**Request Body:**
```json
{
  "photoType": "string",
  "asset_id": "string"
}
```

**Photo Types:**
- `profileImage`
- `coverImage`
- `userImages`

**Response:**
```json
{
  "success": true,
  "data": {
    "photoType": "string",
    "url": "string"
  },
  "error": null,
  "message": "Photo updated successfully"
}
```

## Delete User Image
Delete a user's photo.

**Endpoint:** `DELETE /user-image`

**Authentication:** Required

**Request Body:**
```json
{
  "photoType": "string",
  "imageId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully",
  "data": null
}
```

## Get Membership Request History
Retrieve membership request history.

**Endpoint:** `GET /membership-request`

**Authentication:** Required

**Query Parameters:**
- `page` (number, optional): Page number
- `limit` (number, optional): Items per page
- `status` (string, optional): Filter by status
- `count` (string, optional): Include total count

**Response:**
```json
{
  "success": true,
  "data": {
    "requests": "array",
    "pagination": "object",
    "filterCriteria": {
      "status": "string"
    }
  }
}
```

## Cancel Membership Request
Cancel a pending membership request.

**Endpoint:** `PUT /membership-request/cancel`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Membership request cancelled successfully",
  "data": {
    // Cancelled membership request details
  }
}
```

## Delete Cancelled Membership Request
Delete a cancelled membership request.

**Endpoint:** `DELETE /membership-request`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Membership request deleted successfully",
  "data": null
}
```