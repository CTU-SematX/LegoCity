#!/bin/bash

# Comprehensive Test Script with detailed output
# Usage: ./full_test.sh [user_id]

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration - hardcoded values
MONGO_URI="mongodb://localhost:27017"
MONGO_DB_NAME="smartcity"
MONGO_COLLECTION="users"
PROXY_URL="http://localhost:8080"
USER_ID="ewq"

# Simple token (can be any string, no JWT encoding needed)
TOKEN="test-token-${USER_ID}-$(date +%s)"

echo "======================================================================"
echo "                  Proxy Service Test Script                          "
echo "======================================================================"
echo ""
echo "Configuration:"
echo "  User ID:      $USER_ID"
echo "  Proxy URL:    $PROXY_URL"
echo "  MongoDB:      $MONGO_URI/$MONGO_DB_NAME"
echo "  Collection:   $MONGO_COLLECTION"
echo ""
echo "Simple token (no JWT needed): $TOKEN"
echo ""

# Step 1: Store token and entity IDs in MongoDB
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Storing Token and Entity IDs in MongoDB"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

mongosh "$MONGO_URI/$MONGO_DB_NAME" --quiet --eval "
db.$MONGO_COLLECTION.updateOne(
    { _id: '$USER_ID' },
    { \$set: { 
        _id: '$USER_ID', 
        token: '$TOKEN',
        entity_ids: [
            'urn:ngsi-ld:Test:${USER_ID}',
            'urn:ngsi-ld:Test:authorized',
            'urn:ngsi-ld:Weather:${USER_ID}'
        ]
    } },
    { upsert: true }
)
" > /dev/null 2>&1

# Verify storage
STORED=$(mongosh "$MONGO_URI/$MONGO_DB_NAME" --quiet --eval "
const doc = db.$MONGO_COLLECTION.findOne({_id: '$USER_ID'});
print(doc ? 'yes' : 'no');
" 2>/dev/null | tail -1)

if [ "$STORED" = "yes" ]; then
    echo -e "${GREEN}✓ Token and entity IDs stored successfully${NC}"
    echo "  Authorized entity IDs:"
    echo "    - urn:ngsi-ld:Test:${USER_ID}"
    echo "    - urn:ngsi-ld:Test:authorized"
    echo "    - urn:ngsi-ld:Weather:${USER_ID}"
else
    echo -e "${RED}✗ Failed to store token${NC}"
    exit 1
fi
echo ""
exit 0

# Step 2: Test Authentication
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Testing Authentication"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: POST with valid token (should succeed)
echo "${YELLOW}Test 1: POST with valid authentication token${NC}"
echo "  Expected: HTTP 201 (or 40x if data invalid)"
echo "  Request:  POST $PROXY_URL/ngsi-ld/v1/entities"
echo ""

HTTP_CODE=$(curl -X POST "$PROXY_URL/ngsi-ld/v1/entities" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/ld+json" \
  -d "{\"id\":\"urn:ngsi-ld:Test:${USER_ID}\",\"type\":\"TestEntity\",\"description\":{\"type\":\"Property\",\"value\":\"Test entity\"},\"@context\":[\"https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld\"]}" \
  -w "%{http_code}" \
  -o /tmp/response.txt \
  -s 2>&1)

echo "  Response: HTTP $HTTP_CODE"
if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "409" ]; then
    echo -e "  ${GREEN}✓ PASS - Authentication successful${NC}"
elif [ "$HTTP_CODE" = "400" ]; then
    echo -e "  ${YELLOW}⚠ WARN - Bad request (auth worked, but data issue)${NC}"
    echo "  Body: $(cat /tmp/response.txt)"
else
    echo -e "  ${RED}✗ FAIL - Expected 201 or 400, got $HTTP_CODE${NC}"
    echo "  Body: $(cat /tmp/response.txt)"
fi
echo ""

# Test 2: POST without authentication (should fail with 401)
echo "${YELLOW}Test 2: POST without authentication token${NC}"
echo "  Expected: HTTP 403 Unauthorized"
echo "  Request:  POST $PROXY_URL/ngsi-ld/v1/entities (no auth header)"
echo ""

HTTP_CODE=$(curl -X POST "$PROXY_URL/ngsi-ld/v1/entities" \
  -H "Content-Type: application/ld+json" \
  -d "{\"id\":\"urn:ngsi-ld:Test:noauth\",\"type\":\"TestEntity\",\"@context\":[\"https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld\"]}" \
  -w "%{http_code}" \
  -o /tmp/response.txt \
  -s 2>&1)

echo "  Response: HTTP $HTTP_CODE"
if [ "$HTTP_CODE" = "403" ]; then
    echo -e "  ${GREEN}✓ PASS - Correctly rejected${NC}"
else
    echo -e "  ${RED}✗ FAIL - Expected 403, got $HTTP_CODE${NC}"
    echo "  Body: $(cat /tmp/response.txt)"
fi
echo ""

# Test 3: POST with invalid token (should fail with 401)
echo "${YELLOW}Test 3: POST with invalid authentication token${NC}"
echo "  Expected: HTTP 401 Unauthorized"
echo "  Request:  POST $PROXY_URL/ngsi-ld/v1/entities (bad token)"
echo ""

HTTP_CODE=$(curl -X POST "$PROXY_URL/ngsi-ld/v1/entities" \
  -H "Authorization: Bearer invalid.token.here" \
  -H "Content-Type: application/ld+json" \
  -d "{\"id\":\"urn:ngsi-ld:Test:invalid\",\"type\":\"TestEntity\",\"@context\":[\"https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld\"]}" \
  -w "%{http_code}" \
  -o /tmp/response.txt \
  -s 2>&1)

echo "  Response: HTTP $HTTP_CODE"
if [ "$HTTP_CODE" = "401" ]; then
    echo -e "  ${GREEN}✓ PASS - Correctly rejected invalid token${NC}"
else
    echo -e "  ${RED}✗ FAIL - Expected 401, got $HTTP_CODE${NC}"
    echo "  Body: $(cat /tmp/response.txt)"
fi
echo ""

# Test 4: POST with unauthorized entity ID (should fail with 403)
echo "${YELLOW}Test 4: POST with unauthorized entity ID${NC}"
echo "  Expected: HTTP 403 Forbidden"
echo "  Request:  POST $PROXY_URL/ngsi-ld/v1/entities (entity not in user's entity_ids)"
echo ""

HTTP_CODE=$(curl -X POST "$PROXY_URL/ngsi-ld/v1/entities" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/ld+json" \
  -d "{\"id\":\"urn:ngsi-ld:Test:unauthorized\",\"type\":\"TestEntity\",\"description\":{\"type\":\"Property\",\"value\":\"Unauthorized test\"},\"@context\":[\"https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld\"]}" \
  -w "%{http_code}" \
  -o /tmp/response.txt \
  -s 2>&1)

echo "  Response: HTTP $HTTP_CODE"
if [ "$HTTP_CODE" = "403" ]; then
    echo -e "  ${GREEN}✓ PASS - Correctly rejected unauthorized entity${NC}"
else
    echo -e "  ${RED}✗ FAIL - Expected 403, got $HTTP_CODE${NC}"
    echo "  Body: $(cat /tmp/response.txt)"
fi
echo ""

# Test 5: POST with authorized entity ID (should succeed)
echo "${YELLOW}Test 5: POST with authorized entity ID${NC}"
echo "  Expected: HTTP 201 (or 409 if exists)"
echo "  Request:  POST $PROXY_URL/ngsi-ld/v1/entities (entity in user's entity_ids)"
echo ""

HTTP_CODE=$(curl -X POST "$PROXY_URL/ngsi-ld/v1/entities" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/ld+json" \
  -d "{\"id\":\"urn:ngsi-ld:Test:authorized\",\"type\":\"TestEntity\",\"description\":{\"type\":\"Property\",\"value\":\"Authorized test\"},\"@context\":[\"https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld\"]}" \
  -w "%{http_code}" \
  -o /tmp/response.txt \
  -s 2>&1)

echo "  Response: HTTP $HTTP_CODE"
if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "409" ]; then
    echo -e "  ${GREEN}✓ PASS - Authorized entity accepted${NC}"
elif [ "$HTTP_CODE" = "400" ]; then
    echo -e "  ${YELLOW}⚠ WARN - Bad request (auth worked, but data issue)${NC}"
    echo "  Body: $(cat /tmp/response.txt)"
else
    echo -e "  ${RED}✗ FAIL - Expected 201 or 409, got $HTTP_CODE${NC}"
    echo "  Body: $(cat /tmp/response.txt)"
fi
echo ""

# Test 6: POST without entity ID in body (should fail with 400)
echo "${YELLOW}Test 6: POST without entity ID in request body${NC}"
echo "  Expected: HTTP 400 Bad Request"
echo "  Request:  POST $PROXY_URL/ngsi-ld/v1/entities (missing id field)"
echo ""

HTTP_CODE=$(curl -X POST "$PROXY_URL/ngsi-ld/v1/entities" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/ld+json" \
  -d "{\"type\":\"TestEntity\",\"@context\":[\"https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld\"]}" \
  -w "%{http_code}" \
  -o /tmp/response.txt \
  -s 2>&1)

echo "  Response: HTTP $HTTP_CODE"
if [ "$HTTP_CODE" = "400" ]; then
    echo -e "  ${GREEN}✓ PASS - Correctly rejected missing entity ID${NC}"
else
    echo -e "  ${RED}✗ FAIL - Expected 400, got $HTTP_CODE${NC}"
    echo "  Body: $(cat /tmp/response.txt)"
fi
echo ""

# Test 7: GET without authentication (should succeed)
echo "${YELLOW}Test 7: GET without authentication${NC}"
echo "  Expected: HTTP 200 (GET doesn't require auth)"
echo "  Request:  GET $PROXY_URL/version"
echo ""

HTTP_CODE=$(curl -X GET "$PROXY_URL/version" \
  -H "Accept: application/json" \
  -w "%{http_code}" \
  -o /tmp/response.txt \
  -s 2>&1)

echo "  Response: HTTP $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "  ${GREEN}✓ PASS - GET request works without auth${NC}"
else
    echo -e "  ${RED}✗ FAIL - Expected 200, got $HTTP_CODE${NC}"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Authentication validates TWO things for POST requests:"
echo "  1. Token exists in MongoDB (simple string match, no JWT decoding)"
echo "  2. Entity ID is in the authorized entity_ids list for that token"
echo ""
echo "Both checks happen in a single DB query (count > 0 means approved)."
echo ""
echo "Save this token for manual testing:"
echo -e "${YELLOW}export TEST_TOKEN='$TOKEN'${NC}"
echo ""
echo "Authorized entities for user '$USER_ID':"
echo "  - urn:ngsi-ld:Test:${USER_ID}"
echo "  - urn:ngsi-ld:Test:authorized"
echo "  - urn:ngsi-ld:Weather:${USER_ID}"
echo ""
echo "Test with authorized entity:"
echo "  curl -X POST http://localhost:8080/ngsi-ld/v1/entities \\"
echo "    -H \"Authorization: Bearer \$TEST_TOKEN\" \\"
echo "    -H \"Content-Type: application/ld+json\" \\"
echo "    -d '{\"id\":\"urn:ngsi-ld:Test:authorized\",\"type\":\"TestEntity\",\"@context\":[\"https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld\"]}'"
echo ""
echo "Test with unauthorized entity (should get 403):"
echo "  curl -X POST http://localhost:8080/ngsi-ld/v1/entities \\"
echo "    -H \"Authorization: Bearer \$TEST_TOKEN\" \\"
echo "    -H \"Content-Type: application/ld+json\" \\"
echo "    -d '{\"id\":\"urn:ngsi-ld:Test:unauthorized\",\"type\":\"TestEntity\",\"@context\":[\"https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld\"]}'"
echo ""
