# RFP Response Generator API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [Profile Endpoints](#profile-endpoints)
3. [Error Responses](#error-responses)
4. [Testing Guide](#testing-guide)

---

## Authentication Endpoints

### Register New User

Create a new user account and company profile.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "companyName": "My Company" // Optional
}
```

**Success Response (201):**
```json
{
  "message": "Registration successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "emailConfirmed": false
  },
  "profile": {
    "id": "uuid",
    "user_id": "uuid",
    "company_name": "My Company",
    "industry": null,
    "contact_info": {},
    "visibility": "private",
    "profile_strength": 0,
    "created_at": "2025-11-17T...",
    "updated_at": "2025-11-17T..."
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "...",
    "expires_at": 1234567890,
    "expires_in": 3600
  }
}
```

**Error Responses:**
- `400` - Missing required fields or invalid input
- `400` - Email already registered
- `400` - Password too short (minimum 8 characters)

---

### Login

Authenticate existing user.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "emailConfirmed": true
  },
  "profile": {
    "id": "uuid",
    "company_name": "My Company",
    "industry": "Technology",
    "visibility": "private",
    "profile_strength": 60
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "...",
    "expires_at": 1234567890,
    "expires_in": 3600
  }
}
```

**Error Responses:**
- `400` - Missing required fields
- `401` - Invalid credentials

---

### Get Current User

Get authenticated user's information.

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "emailConfirmed": true,
    "createdAt": "2025-11-17T..."
  },
  "profile": {
    "id": "uuid",
    "company_name": "My Company",
    "industry": "Technology",
    "contact_info": {
      "phone": "555-1234",
      "website": "https://example.com"
    },
    "visibility": "public",
    "profile_strength": 80
  }
}
```

**Error Responses:**
- `401` - No token provided
- `401` - Invalid or expired token

---

### Refresh Token

Refresh an expired access token.

**Endpoint:** `POST /api/auth/refresh`

**Request Body:**
```json
{
  "refresh_token": "..."
}
```

**Success Response (200):**
```json
{
  "message": "Token refreshed successfully",
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "...",
    "expires_at": 1234567890,
    "expires_in": 3600
  }
}
```

**Error Responses:**
- `400` - Missing refresh token
- `401` - Invalid refresh token

---

### Logout

Logout current user.

**Endpoint:** `POST /api/auth/logout`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "message": "Logout successful"
}
```

**Error Responses:**
- `401` - No token provided

---

### Forgot Password

Request password reset email.

**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "message": "Password reset email sent"
}
```

**Error Responses:**
- `400` - Missing email
- `400` - Email not found

---

### Reset Password

Reset password with token.

**Endpoint:** `POST /api/auth/reset-password`

**Headers:**
```
Authorization: Bearer <reset_token>
```

**Request Body:**
```json
{
  "password": "NewSecurePassword123"
}
```

**Success Response (200):**
```json
{
  "message": "Password reset successful"
}
```

**Error Responses:**
- `400` - Invalid password (must be at least 8 characters)
- `401` - Invalid or expired reset token

---

## Profile Endpoints

### Get Own Profile

Get authenticated user's company profile.

**Endpoint:** `GET /api/profile`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "profile": {
    "id": "uuid",
    "user_id": "uuid",
    "company_name": "My Company",
    "industry": "Technology",
    "contact_info": {
      "phone": "555-1234",
      "website": "https://example.com",
      "address": "123 Main St"
    },
    "visibility": "private",
    "profile_strength": 75,
    "created_at": "2025-11-17T...",
    "updated_at": "2025-11-17T..."
  }
}
```

**Error Responses:**
- `401` - Not authenticated
- `404` - Profile not found

---

### Update Profile

Create or update company profile.

**Endpoint:** `PUT /api/profile`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "companyName": "Updated Company Name",
  "industry": "Technology",
  "contactInfo": {
    "phone": "555-1234",
    "website": "https://example.com",
    "address": "123 Main St",
    "email": "contact@example.com"
  },
  "visibility": "public"
}
```

**Success Response (200):**
```json
{
  "message": "Profile updated successfully",
  "profile": {
    "id": "uuid",
    "user_id": "uuid",
    "company_name": "Updated Company Name",
    "industry": "Technology",
    "contact_info": {...},
    "visibility": "public",
    "profile_strength": 85,
    "updated_at": "2025-11-17T..."
  }
}
```

**Error Responses:**
- `401` - Not authenticated
- `400` - Invalid input data

---

### Delete Profile

Delete company profile (does not delete user account).

**Endpoint:** `DELETE /api/profile`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "message": "Profile deleted successfully"
}
```

**Error Responses:**
- `401` - Not authenticated

---

### Get Marketplace Profiles

Get public company profiles (for team building).

**Endpoint:** `GET /api/profile/marketplace`

**Query Parameters:**
- `industry` (optional) - Filter by industry
- `search` (optional) - Search company names
- `limit` (optional, default: 20) - Results per page
- `offset` (optional, default: 0) - Pagination offset

**Example:**
```
GET /api/profile/marketplace?industry=Technology&search=consulting&limit=10&offset=0
```

**Success Response (200):**
```json
{
  "profiles": [
    {
      "id": "uuid",
      "company_name": "Tech Consulting LLC",
      "industry": "Technology",
      "contact_info": {...},
      "visibility": "public",
      "profile_strength": 90
    },
    ...
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 45
  }
}
```

---

### Get Profile by ID

Get a specific public profile.

**Endpoint:** `GET /api/profile/:id`

**Success Response (200):**
```json
{
  "profile": {
    "id": "uuid",
    "company_name": "Public Company",
    "industry": "Technology",
    "contact_info": {...},
    "visibility": "public",
    "profile_strength": 95
  }
}
```

**Error Responses:**
- `404` - Profile not found or not public

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Testing Guide

### Prerequisites

1. **Configure Supabase Email Settings**

   Go to: https://supabase.com/dashboard/project/xqdpyzotshklfdgweakb/auth/providers

   For **development testing**, you can:
   - Disable email confirmation temporarily
   - OR use a real email address to receive confirmation emails

2. **Enable Email Provider**

   Make sure the Email provider is enabled in Supabase Authentication settings.

### Using cURL

#### 1. Register a new user

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-real-email@gmail.com",
    "password": "SecurePassword123",
    "companyName": "My Test Company"
  }'
```

#### 2. Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-real-email@gmail.com",
    "password": "SecurePassword123"
  }'
```

Save the `access_token` from the response.

#### 3. Get current user

```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 4. Update profile

```bash
curl -X PUT http://localhost:3001/api/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Updated Company Name",
    "industry": "Technology",
    "contactInfo": {
      "phone": "555-1234",
      "website": "https://example.com"
    },
    "visibility": "public"
  }'
```

#### 5. Get marketplace profiles

```bash
curl -X GET "http://localhost:3001/api/profile/marketplace?limit=10"
```

### Using Postman

1. Import the API endpoints using the base URL: `http://localhost:3001/api`
2. Set up environment variables:
   - `BASE_URL`: `http://localhost:3001/api`
   - `ACCESS_TOKEN`: (will be set after login)
3. For authenticated requests, add header:
   - Key: `Authorization`
   - Value: `Bearer {{ACCESS_TOKEN}}`

### Using the Test Script

Run the automated test script:

```bash
bash backend/test-auth.sh
```

Note: Update the email in the script to use a real email address that can receive confirmation emails.

---

## Profile Strength Calculation

Profile strength is automatically calculated based on:

- **Company Name** (20 points)
- **Industry** (10 points)
- **Contact Info** (20 points)
- **Documents** (10 points per document, max 50 points)

**Total: 100 points maximum**

The calculation runs automatically when you update your profile.

---

## Session Management

- **Access tokens** expire in 1 hour
- **Refresh tokens** expire in 7 days
- Use the `/api/auth/refresh` endpoint to get a new access token
- Store tokens securely (never in localStorage for production)

---

## Security Notes

1. **All passwords must be at least 8 characters**
2. **Row Level Security (RLS)** is enabled on all database tables
3. **Users can only access their own data** (except public profiles)
4. **CORS is configured** to only allow requests from the frontend URL
5. **Tokens are verified** on every protected endpoint

---

## Next Steps

After authentication is working:

1. **Week 1, Day 3-4**: Document upload endpoints
2. **Week 1, Day 5**: RFP parsing with Gemini AI
3. **Week 2**: Proposal generation and team building
4. **Week 3**: Proposal refinement and export
5. **Week 4**: Testing and deployment

---

## Support

If you encounter issues:

1. Check the backend logs in the terminal
2. Verify Supabase connection: `http://localhost:3001/api/test/supabase`
3. Check API status: `http://localhost:3001/api`
4. Review Supabase dashboard for authentication errors

For email-related issues:
- Check Supabase Auth logs: https://supabase.com/dashboard/project/xqdpyzotshklfdgweakb/logs/explorer
- Verify email settings: https://supabase.com/dashboard/project/xqdpyzotshklfdgweakb/auth/providers

---

**Created:** 2025-11-17
**Version:** 1.0.0
**Status:** Authentication & Profile endpoints complete ✅
