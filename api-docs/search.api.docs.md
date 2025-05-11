
```markdown name=search-routes-api.md
# Search API Documentation

## Base URL
```
http://your-domain.com/api/search
```

## Search Endpoints

### 1. Filter Users
Search for users based on multiple criteria.

**Endpoint:** `GET /filter-users`

**Query Parameters:**
```typescript
{
  // Pagination
  page: number;
  limit: number;
  count: boolean;

  // Basic Filters
  religion?: "Islam" | "Christianity" | "Hinduism" | "Buddhism" | "Judaism" | /* other religions */;
  languages?: string[]; // Array of languages
  countries?: string[]; // Array of country names
  division_ids?: string[]; // Required for Bangladesh
  
  // Education & Professional
  isEducated?: "yes" | "no";
  maritalStatuses?: ("never_married" | "divorced" | "widowed" | "separated" | "annulled")[];
  occupations?: string[]; // Array of occupations

  // Physical Attributes
  minWeight?: number; // 30-200
  maxWeight?: number; // 30-200
  minHeight?: number; // 4-8 feet
  maxHeight?: number; // 5-9 feet
  
  // Age Range
  minAge?: number; // 18-70
  maxAge?: number; // 18-70

  // Income
  minAnnualIncome?: number;
  maxAnnualIncome?: number;
  incomeCurrency?: string; // 3-letter currency code
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
  "message": "Users filtered successfully",
  "data": {
    "users": [
      {
        "mid": "BD123456",
        "name": "User Name",
        "age": 25,
        "height": "5 foot 8 inch",
        "weight": 70,
        "religion": "Islam",
        "occupation": "Software Engineer",
        "education": [
          {
            "level": "Bachelor's Degree",
            "certificate": "BSc in Computer Science",
            "institution": "University Name"
          }
        ],
        "location": {
          "country": "Bangladesh",
          "division": "Dhaka",
          "district": "Dhaka"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalCount": 100,
      "hasMore": true
    }
  }
}
```

### 2. Today's Matches
Get matches recommended for today.

**Endpoint:** `GET /todays-matches`

**Query Parameters:**
```typescript
{
  limit: number; // Number of matches to return
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
  "message": "Today's matches retrieved successfully",
  "data": {
    "matches": [
      {
        "userId": "user-id",
        "matchScore": 85,
        "matchingCriteria": [
          "location",
          "education",
          "age"
        ],
        "userDetails": {
          "mid": "BD123456",
          "name": "User Name",
          "age": 25,
          // ... other user details
        }
      }
    ]
  }
}
```

### 3. Just Joined Users
Get recently joined users matching preferences.

**Endpoint:** `GET /just-joined`

**Query Parameters:**
```typescript
{
  page: number;
  limit: number;
  count: boolean;
  timeRange?: "7" | "15" | "30"; // Days (default: 7)
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
  "message": "Recently joined users retrieved successfully",
  "data": {
    "users": [
      {
        "mid": "BD123456",
        "name": "User Name",
        "joinedAt": "2025-05-10T12:00:00Z",
        // ... other user details
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 50,
      "hasMore": true
    }
  }
}
```

### 4. Search by Matrimony ID
Find a user by their matrimony ID.

**Endpoint:** `GET /user/:mid`

**Path Parameters:**
- `mid`: Matrimony ID (e.g., "BD123456")

**Headers:**
```
Authorization: Bearer <auth-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User found",
  "data": {
    "user": {
      "mid": "BD123456",
      "name": "User Name",
      "age": 25,
      // ... other user details
    }
  }
}
```

### 5. Search by Preferred Criteria

#### Education-based Search
**Endpoint:** `GET /preferred/education`

**Query Parameters:**
```typescript
{
  page: number;
  limit: number;
  count: boolean;
  educationLevels: string[]; // Array of education levels
}
```

#### Location-based Search
**Endpoint:** `GET /preferred/location`

**Query Parameters:**
```typescript
{
  page: number;
  limit: number;
  count: boolean;
  countries: string[];
  division_ids?: string[]; // Required for Bangladesh
}
```

#### Occupation-based Search
**Endpoint:** `GET /preferred/occupation`

**Query Parameters:**
```typescript
{
  page: number;
  limit: number;
  count: boolean;
  occupations: string[]; // Array of occupations
}
```

## Error Responses

All search endpoints can return these error responses:

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Invalid search parameters",
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
  "message": "Insufficient permissions to perform this search",
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

These API documentation files provide comprehensive details about the authentication and search endpoints, including:
- Request/response formats
- Required parameters
- Authentication requirements
- Error handling
- Success responses
- Data validation rules

Would you like me to explain any specific part in more detail or make any adjustments to the documentation?



### 6. Save Search Query
Save a user's search criteria for future use.

**Endpoint:** `POST /save-search`

**Request Body:**
```typescript
{
  title: string;  // 3-80 characters, required
  searchQuery: {
    // All filter parameters from filter-users endpoint
    religion?: string;
    languages?: string[];
    countries?: string[];
    division_ids?: string[];
    isEducated?: boolean;
    maritalStatuses?: string[];
    occupations?: string[];
    minWeight?: number;
    maxWeight?: number;
    minHeight?: number;
    maxHeight?: number;
    minAge?: number;
    maxAge?: number;
    minAnnualIncome?: number;
    maxAnnualIncome?: number;
    incomeCurrency?: string;
  }
}
```

**Headers:**
```
Authorization: Bearer <auth-token>
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Search query saved successfully",
  "data": {
    "id": "search_history_id",
    "title": "My Saved Search",
    "searchQuery": { /* saved search parameters */ },
    "savedAt": "2025-05-11T06:28:25Z"
  }
}
```

### 7. Get Saved Searches
Retrieve user's saved search queries.

**Endpoint:** `GET /saved-searches`

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
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
  "message": "Saved searches retrieved successfully",
  "data": {
    "searches": [
      {
        "id": "search_history_id",
        "title": "My Saved Search",
        "searchQuery": { /* saved search parameters */ },
        "savedAt": "2025-05-11T06:28:25Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalCount": 1
    }
  }
}
```

### 8. Delete Saved Search
Remove a saved search query.

**Endpoint:** `DELETE /saved-search/:id`

**Parameters:**
- `id`: Search history ID (string)

**Headers:**
```
Authorization: Bearer <auth-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Search query deleted successfully"
}
```

### 9. Search Near Me
Find profiles in nearby districts based on user's current location.

**Endpoint:** `GET /near-me`

**Query Parameters:**
```typescript
{
  radius?: number;  // Search radius in kilometers (default: 50)
  page?: number;
  limit?: number;
  count?: boolean;
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
  "message": "Nearby profiles retrieved successfully",
  "data": {
    "users": [
      {
        "mid": "BD123456",
        "name": "User Name",
        "distance": 15.5, // Distance in kilometers
        // ... other user details
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 50,
      "hasMore": true
    }
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
  "message": "Insufficient permissions to perform this search",
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

### API Rate Limiting

- Basic users: 100 requests per hour
- Premium users: 500 requests per hour
- Search results are cached for 5 minutes

### Search Result Ordering

Results are ordered based on the following criteria:
1. Online status (online users first)
2. Premium membership status
3. Profile completion percentage
4. Last active timestamp
5. Match percentage with search criteria

### Note on Location-Based Searches

For Bangladesh-specific searches:
- Division IDs are required when country is set to Bangladesh
- District-level matching is supported with coordinates
- Upazila-level filtering is available for premium users