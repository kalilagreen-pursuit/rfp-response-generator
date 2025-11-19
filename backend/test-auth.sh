#!/bin/bash

# Test Authentication Endpoints
# Run with: bash backend/test-auth.sh

API_URL="http://localhost:3001/api"

echo "========================================="
echo "Testing RFP Generator Authentication API"
echo "========================================="
echo ""

# Test 1: Register a new user
echo "1. Testing User Registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!",
    "companyName": "Test Company LLC"
  }')

echo "$REGISTER_RESPONSE" | python3 -m json.tool
echo ""

# Extract access token
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('session', {}).get('access_token', ''))" 2>/dev/null || echo "")

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Registration failed or user already exists"
  echo "Trying to login instead..."
  echo ""

  # Test 2: Login with existing user
  echo "2. Testing User Login..."
  LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "testuser@example.com",
      "password": "SecurePass123!"
    }')

  echo "$LOGIN_RESPONSE" | python3 -m json.tool
  echo ""

  # Extract access token from login
  ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('session', {}).get('access_token', ''))" 2>/dev/null || echo "")
else
  echo "✅ Registration successful!"
  echo ""
fi

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Failed to get access token. Stopping tests."
  exit 1
fi

echo "🔑 Access Token: ${ACCESS_TOKEN:0:50}..."
echo ""

# Test 3: Get current user
echo "3. Testing Get Current User..."
curl -s -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | python3 -m json.tool
echo ""

# Test 4: Get user profile
echo "4. Testing Get User Profile..."
curl -s -X GET "$API_URL/profile" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | python3 -m json.tool
echo ""

# Test 5: Update user profile
echo "5. Testing Update User Profile..."
curl -s -X PUT "$API_URL/profile" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Updated Test Company LLC",
    "industry": "Technology",
    "contactInfo": {
      "phone": "555-1234",
      "website": "https://example.com"
    },
    "visibility": "public"
  }' | python3 -m json.tool
echo ""

# Test 6: Get marketplace profiles
echo "6. Testing Get Marketplace Profiles..."
curl -s -X GET "$API_URL/profile/marketplace" | python3 -m json.tool
echo ""

# Test 7: Test protected endpoint without token
echo "7. Testing Protected Endpoint Without Token..."
curl -s -X GET "$API_URL/auth/me" | python3 -m json.tool
echo ""

echo "========================================="
echo "Authentication Tests Complete!"
echo "========================================="
