#!/bin/bash

# Test script to verify anonymous access is blocked
# Replace YOUR_SUPABASE_URL with your actual Supabase project URL

SUPABASE_URL="https://your-project-ref.supabase.co"
ANON_KEY="your_supabase_anon_key_here"

echo "Testing anonymous access to files table..."

# Test 1: Try to select from files table without authentication (should fail)
echo "1. Testing SELECT on files table without auth:"
curl -X GET \
  "$SUPABASE_URL/rest/v1/files" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json"
echo -e "\n"

# Test 2: Try to select from files table with invalid JWT (should fail)  
echo "2. Testing SELECT on files table with invalid JWT:"
curl -X GET \
  "$SUPABASE_URL/rest/v1/files" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer invalid_jwt_token" \
  -H "Content-Type: application/json"
echo -e "\n"

# Test 3: Try to access storage bucket without authentication (should fail)
echo "3. Testing storage bucket access without auth:"
curl -X GET \
  "$SUPABASE_URL/storage/v1/object/user-files/test-file.txt" \
  -H "apikey: $ANON_KEY"
echo -e "\n"

# Test 4: Try to list storage bucket contents without authentication (should fail)
echo "4. Testing storage bucket listing without auth:"
curl -X GET \
  "$SUPABASE_URL/storage/v1/object/list/user-files" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json"
echo -e "\n"

echo "All tests completed. If RLS is properly configured, all requests should be denied or return empty results."
