#!/bin/bash

# Comprehensive Test Script with detailed output
# Usage: ./full_test.sh [user_id]

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Configuration
TOKEN_SECRET=${TOKEN_SECRET:-"your-secret-key"}
MONGO_URI=${MONGO_URI:-"mongodb://localhost:27017"}
MONGO_DB_NAME=${MONGO_DB_NAME:-"smartcity"}
MONGO_COLLECTION=${MONGO_COLLECTION:-"users"}
PROXY_URL=${PROXY_URL:-"http://localhost:8080"}
USER_ID=${1:-"test-user-$(date +%s)"}

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

# Function to create base64url encoding
base64url_encode() {
    openssl base64 -e -A | tr '+/' '-_' | tr -d '='
}

# Step 1: Create JWT token
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Creating JWT Token"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

header='{"alg":"HS256","typ":"JWT"}'
header_b64=$(echo -n "$header" | base64url_encode)

iat=$(date +%s)
exp=$((iat + 86400))
payload="{\"user_id\":\"$USER_ID\",\"iat\":$iat,\"exp\":$exp,\"nbf\":$iat}"
payload_b64=$(echo -n "$payload" | base64url_encode)

signature_input="${header_b64}.${payload_b64}"
signature=$(echo -n "$signature_input" | openssl dgst -sha256 -hmac "$TOKEN_SECRET" -binary | base64url_encode)

TOKEN="${header_b64}.${payload_b64}.${signature}"

echo "  Header:  $header"
echo "  Payload: $payload"
echo ""
echo -e "${GREEN}✓ Token created${NC}"
echo "  Token: $TOKEN"
echo ""

# Step 2: Store in MongoDB
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Storing Token in MongoDB"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

mongosh "$MONGO_URI/$MONGO_DB_NAME" --quiet --eval "
db.$MONGO_COLLECTION.updateOne(
    { _id: '$USER_ID' },
    { \$set: { _id: '$USER_ID', token: '$TOKEN' } },
    { upsert: true }
)
" > /dev/null 2>&1

# Verify storage
STORED=$(mongosh "$MONGO_URI/$MONGO_DB_NAME" --quiet --eval "
const doc = db.$MONGO_COLLECTION.findOne({_id: '$USER_ID'});
print(doc ? 'yes' : 'no');
" 2>/dev/null | tail -1)

if [ "$STORED" = "yes" ]; then
    echo -e "${GREEN}✓ Token stored successfully${NC}"
else
    echo -e "${RED}✗ Failed to store token${NC}"
    exit 1
fi
echo ""

# Step 3: Test Authentication
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3: Testing Authentication"
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
echo "  Expected: HTTP 401 Unauthorized"
echo "  Request:  POST $PROXY_URL/ngsi-ld/v1/entities (no auth header)"
echo ""

HTTP_CODE=$(curl -X POST "$PROXY_URL/ngsi-ld/v1/entities" \
  -H "Content-Type: application/ld+json" \
  -d "{\"id\":\"urn:ngsi-ld:Test:noauth\",\"type\":\"TestEntity\",\"@context\":[\"https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld\"]}" \
  -w "%{http_code}" \
  -o /tmp/response.txt \
  -s 2>&1)

echo "  Response: HTTP $HTTP_CODE"
if [ "$HTTP_CODE" = "401" ]; then
    echo -e "  ${GREEN}✓ PASS - Correctly rejected${NC}"
else
    echo -e "  ${RED}✗ FAIL - Expected 401, got $HTTP_CODE${NC}"
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

# Test 4: GET without authentication (should succeed)
echo "${YELLOW}Test 4: GET without authentication${NC}"
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
echo "Save this token for manual testing:"
echo -e "${YELLOW}export TEST_TOKEN='$TOKEN'${NC}"
echo ""
echo "Then you can test manually:"
echo "  curl -X POST $PROXY_URL/ngsi-ld/v1/entities \\"
echo "    -H \"Authorization: Bearer \$TEST_TOKEN\" \\"
echo "    -H \"Content-Type: application/ld+json\" \\"
echo "    -d '{\"id\":\"urn:ngsi-ld:Test:manual\",\"type\":\"TestEntity\",\"@context\":[\"https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld\"]}'"
echo ""
