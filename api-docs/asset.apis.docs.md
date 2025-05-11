# Assets API Documentation

## Upload Image Asset
Upload an image file to the server and store it in Cloudinary.

**Endpoint:** `POST /upload/image`

**Authentication:** Required

**Rate Limit:** 120 requests per 120 seconds

**Request:**
- Content-Type: `multipart/form-data`
- Body Parameters:
  - `image` (File, required): Image file to upload
    - Supported formats: JPEG, JPG, PNG, WEBP
    - Maximum size: 5MB

**Validation:**
- File name must contain only alphanumeric characters, hyphens, underscores, dots, and spaces
- File must be a valid image type
- File size must not exceed 5MB

**Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "asset": {
      "id": "string",
      "url": "string",
      "name": "string",
      "size": "number",
      "type": "string"
    }
  }
}
```

**Error Responses:**
- `400 Bad Request`:
  ```json
  {
    "success": false,
    "message": "Image validation failed",
    "error": "Validation error details"
  }
  ```
- `422 Unprocessable Entity`:
  ```json
  {
    "success": false,
    "message": "Failed to upload image to cloud storage"
  }
  ```
- `500 Internal Server Error`:
  ```json
  {
    "success": false,
    "message": "Failed to process image upload",
    "error": "Internal server error during upload process"
  }
  ```