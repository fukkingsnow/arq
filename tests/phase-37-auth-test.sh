#!/bin/bash

# Phase 37 Authentication Testing Script
# Test register, login, profile endpoints

BASE_URL="http://localhost:8000"
API_URL="$BASE_URL/api/v1"

echo "=== Phase 37 Authentication Tests ==="
echo ""

# Test 1: User Registration
echo "TEST 1: User Registration (POST /auth/register)"
echo "Payload: {email, password, firstName, lastName}"
REG_RESPONSE=$(curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "authtest@example.com",
    "password": "TestPassword123!",
    "firstName": "Auth",
    "lastName": "Test"
  }')

echo "Response: $REG_RESPONSE"
echo ""

# Extract tokens from registration response
ACCESS_TOKEN=$(echo $REG_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
REFRESH_TOKEN=$(echo $REG_RESPONSE | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)

echo "Access Token: $ACCESS_TOKEN"
echo "Refresh Token: $REFRESH_TOKEN"
echo ""

# Test 2: Login
echo "TEST 2: User Login (POST /auth/login)"
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "authtest@example.com",
    "password": "TestPassword123!"
  }')

echo "Response: $LOGIN_RESPONSE"
echo ""

# Test 3: Access Protected Endpoint
echo "TEST 3: Access Protected Profile (GET /auth/profile with JWT)"
PROFILE_RESPONSE=$(curl -s -X GET $API_URL/auth/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Response: $PROFILE_RESPONSE"
echo ""

# Test 4: Unauthorized Access
echo "TEST 4: Unauthorized Access (GET /auth/profile without token)"
UNAUTH_RESPONSE=$(curl -s -X GET $API_URL/auth/profile)

echo "Response: $UNAUTH_RESPONSE"
echo ""

echo "=== Tests Complete ==="
