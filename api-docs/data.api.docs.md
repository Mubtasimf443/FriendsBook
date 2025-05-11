# Data Routes API Documentation

## Base URL
```
http://your-domain.com/api/data
```

## Available Endpoints

### 1. Get Countries List
Get list of available countries with their names and codes.

**Endpoint:** `GET /countries`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "countries": [
      {
        "name": "Bangladesh",
        "code": "BD",
        "bn_name": "বাংলাদেশ"
      },
      // ... other countries
    ]
  }
}
```

### 2. Get Districts List
Get list of districts. For Bangladesh, includes both English and Bangla names.

**Endpoint:** `GET /districts`

**Query Parameters:**
```typescript
{
  division_id?: string;  // Optional: Filter districts by division ID
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "districts": [
      {
        "id": "district_id",
        "name": "District Name",
        "bn_name": "জেলার নাম",
        "division_id": "division_id",
        "lat": 23.8103,
        "long": 90.4125
      }
    ]
  }
}
```

### 3. Get Divisions List
Get list of administrative divisions (primarily for Bangladesh).

**Endpoint:** `GET /divisions`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "divisions": [
      {
        "id": "division_id",
        "name": "Division Name",
        "bn_name": "বিভাগের নাম"
      }
    ]
  }
}
```

### 4. Get Languages List
Get list of available languages.

**Endpoint:** `GET /languages`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "languages": [
      {
        "name": "Bengali",
        "code": "bn",
        "native": "বাংলা"
      }
      // ... other languages
    ]
  }
}
```

### 5. Get Occupations List
Get list of available occupations.

**Endpoint:** `GET /occupations`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "occupations": [
      "SOFTWARE_ENGINEER",
      "DOCTOR",
      "TEACHER",
      // ... other occupations
    ]
  }
}
```

### 6. Get Education Levels
Get list of available education levels.

**Endpoint:** `GET /education-levels`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "educationLevels": [
      "HIGH_SCHOOL",
      "BACHELORS_DEGREE",
      "MASTERS_DEGREE",
      // ... other education levels
    ]
  }
}
```

### 7. Get Currency Codes
Get list of available currency codes.

**Endpoint:** `GET /currency-codes`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "currencyCodes": [
      {
        "code": "USD",
        "name": "US Dollar",
        "symbol": "$"
      },
      {
        "code": "BDT",
        "name": "Bangladeshi Taka",
        "symbol": "৳"
      }
      // ... other currencies
    ]
  }
}
```

### 8. Get Religions List
Get list of available religions.

**Endpoint:** `GET /religions`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "religions": [
      "ISLAM",
      "HINDUISM",
      "CHRISTIANITY",
      "BUDDHISM",
      // ... other religions
    ]
  }
}
```

### 9. Get Religions Branch List
Get list of available religions.

**Endpoint:** `GET /religional-branch`

**Query Parameters:**
```typescript
{
  religion: 'Islam' | 'Hinduism' | 'Buddhism' | 'Christianity' | 'OHTERS';  // Optional: Filter districts by division ID
}
```


**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "branches": [
     
    ]
  }
}
```

### 9. Get Religions Branch List
Get list of available religions.

**Endpoint:** `GET /religional-branch`

**Query Parameters:**
```typescript
{
  education_level:  "Primary Education (PSC)" |
  "Junior Secondary (JSC)"|  
  "Secondary School Certificate (SSC)"| 
  "Higher Secondary Certificate (HSC)"|    
  "Diploma (Technical/Vocational)"|
  "Bachelor's Degree"|
  "Master's Degree"|
  "Doctorate (PhD)"|
  "Religious Education"|
  "Certificate Course"|
  "Technical/Vocational"|
  "Other";  // Optional: Filter districts by division ID
}
```


**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "certificates": [
     
    ]
  }
}
```

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Invalid request parameters",
  "errors": [
    {
      "field": "parameter_name",
      "message": "Validation error message"
    }
  ]
}
```

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

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal server error",
  "data": null
}
```

## API Features

### Caching
All data routes implement aggressive caching as they serve relatively static data:
- GET requests are cached for 24 hours by default
- Cache-Control headers are included in responses
- ETag headers for cache validation
- Public caching enabled for CDN support

### Rate Limiting
Data routes have generous rate limits:
- 1000 requests per hour per IP
- 5000 requests per hour per authenticated user
- Separate quota for authenticated and unauthenticated requests

### Data Updates
- Data is updated daily at 00:00 UTC
- Force refresh available with admin privileges
- Changes are logged and monitored

### Validation
- All responses are validated against Zod schemas
- Strict type checking for all parameters
- Consistent error format for validation failures

### Language Support
- All text data supports multiple languages
- Default language is English
- Bangla (বাংলা) translations available for most data
- ISO language codes used throughout

### Performance Optimization
- Responses are compressed
- JSON responses are minified
- Binary data is properly encoded
- Database queries are optimized and indexed

### Security Measures
- Input sanitization
- Output encoding
- Rate limiting
- Authentication checks
- XSS protection
- CORS configuration