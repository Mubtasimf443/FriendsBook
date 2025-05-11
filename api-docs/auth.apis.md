I'll help you create API documentation for both the authentication and search routes based on the code you've shared. I'll create comprehensive markdown documentation that follows best practices.

Let me create two separate markdown files for better organization:

```markdown name=auth-routes-api.md
# Authentication API Documentation

## Base URL
```
http://your-domain.com/api/auth
```

## Authentication Endpoints

### 1. Create Registration Session
Creates a new registration session for a user.

**Endpoint:** `POST /create-registration-session`

**Request Body:**
```json
{
  "profileCreatedBy": "self | parent | siblings | relative | friend",
  "age": 25,
  "gender": "male | female",
  "name": "string",
  "dateOfBirth": "2000-01-01T00:00:00.000Z",
  "email": "user@example.com",
  "height": "5 foot 8 inch",
  "weight": 70,
  "isEducated": true,
  "education": [
    {
      "level": "Bachelor's Degree",
      "certificate": "BSc in Computer Science",
      "institution": "University Name",
      "yearOfCompletion": 2022,
      "grade": "3.5 CGPA",
      "additionalInfo": "string"
    }
  ],
  "address": {
    "country": "Bangladesh",
    "division": {
      "id": "1",
 
    },
    "district": {
      "id": "1",
     
    },
    "upazila": {
      "id": "1",
   
    },
    "union": {
      "id": "1",
  
    }
  },
  "phoneInfo": {
    "number": "01234567890",
    "country": {
      "name": "Bangladesh",
      "phone_code": "+88"
    }
  },
  "languages": ["Bengali", "English"],
  "religion": "Islam",
  "password": "StrongPassword123!",
  "confirmPassword": "StrongPassword123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Registration session created successfully",
  "data": {
    "sessionKey": "64-character-hex-string"
  }
}
```

### 2. Request Registration OTP
Requests an OTP for registration verification.

**Endpoint:** `POST /request-registration-otp`

**Request Body:**
```json
{
  "sessionKey": "64-character-hex-string"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": null
}
```

### 3. Verify Registration OTP
Verifies the OTP and completes user registration.

**Endpoint:** `POST /verify-registration-otp`

**Request Body:**
```json
{
  "sessionKey": "64-character-hex-string",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP verified and registration successful",
  "data": {
    "userId": "user-id",
    "authToken": "64-character-hex-string"
  }
}
```

### 4. Login
Authenticates a user using email/phone and password.

**Endpoint:** `POST /login`

**Request Body:**
```json
{
  "loginType": "with_email",
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```
OR
```json
{
  "loginType": "with_phone",
  "phoneInfo": {
    "number": "1234567890",
    "phone_code": "+880"
  },
  "password": "StrongPassword123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful.",
  "value": {
    "email": "user@example.com",
    "userId": "user-id",
    "authToken": "64-character-hex-string"
  }
}
```

### 5. Reset Password
Resets the password for an authenticated user.

**Endpoint:** `POST /reset-password`

**Request Body:**
```json
{
  "userId": "user-id",
  "password": "CurrentPassword123!",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successful",
  "data": null
}
```

### 6. Create Forget Password Session
Initiates a forget password session.

**Endpoint:** `POST /create-forget-password-session`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Forget password session created successfully",
  "data": {
    "sessionKey": "64-character-hex-string"
  }
}
```

### 7. Request Forget Password OTP
Requests an OTP for password reset.

**Endpoint:** `POST /request-forget-password-otp`

**Request Body:**
```json
{
  "sessionKey": "64-character-hex-string"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": null
}
```

### 8. Verify Forget Password OTP
Verifies OTP and sets new password.

**Endpoint:** `POST /verify-forget-password-otp`

**Request Body:**
```json
{
  "sessionKey": "64-character-hex-string",
  "otp": "123456",
  "newPassword": "NewPassword123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successful",
  "data": null
}
```

### 9. Logout
Logs out the current user.

**Endpoint:** `POST /log-out`

**Headers:**
```
Authorization: Bearer <auth-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout completed successfully",
  "data": null
}
```

## Error Responses

All endpoints can return the following error responses:

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Error message describing the issue",
  "data": null,
  "errors": [
    {
      "field": "field_name",
      "message": "Validation error message"
    }
  ]
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Invalid authorization token",
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
```
