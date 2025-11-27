#!/bin/bash

# Test Authentication Script
# This script creates a JWT token, stores it in MongoDB, and tests it with curl

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables from .env if it exists
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

# Check dependencies
command -v mongosh >/dev/null 2>&1 || { 
    echo -e "${RED}Error: mongosh is required but not installed.${NC}" >&2
    echo "Install it from: https://www.mongodb.com/docs/mongodb-shell/install/"
    exit 1
}

command -v jq >/dev/null 2>&1 || { 
    echo -e "${RED}Error: jq is required but not installed.${NC}" >&2
    echo "Install it with: brew install jq (macOS) or apt-get install jq (Linux)"
    exit 1
}

command -v base64 >/dev/null 2>&1 || { 
    echo -e "${RED}Error: base64 is required but not installed.${NC}" >&2
    exit 1
}

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}           JWT Token Generation and Authentication Test${NC}"
echo -e "${BLUE}======================================================================${NC}"
echo ""

# Function to create base64url encoding
base64url_encode() {
    openssl base64 -e -A | tr '+/' '-_' | tr -d '='
}

# Function to create JWT token
create_jwt() {
    local user_id=$1
    local secret=$2
    
    # Create header
    local header='{"alg":"HS256","typ":"JWT"}'
    local header_b64=$(echo -n "$header" | base64url_encode)
    
    # Create payload with timestamps
    local iat=$(date +%s)
    local exp=$((iat + 86400)) # 24 hours from now
    local payload=$(cat <<EOF
{
  "user_id": "$user_id",
  "iat": $iat,
  "exp": $exp,
  "nbf": $iat
}
EOF
)
    local payload_b64=$(echo -n "$payload" | base64url_encode)
    
    # Create signature
    local signature_input="${header_b64}.${payload_b64}"
    local signature=$(echo -n "$signature_input" | openssl dgst -sha256 -hmac "$secret" -binary | base64url_encode)
    
    # Return complete token
    echo "${header_b64}.${payload_b64}.${signature}"
}

# Generate JWT token
echo -e "${YELLOW}Step 1: Generating JWT token...${NC}"
TOKEN=$(create_jwt "$USER_ID" "$TOKEN_SECRET")
echo -e "${GREEN}✓ Token generated${NC}"
echo -e "  User ID: ${BLUE}$USER_ID${NC}"
echo -e "  Token: ${BLUE}$TOKEN${NC}"
echo ""

# Decode and display token payload
echo -e "${YELLOW}Step 2: Decoding token payload...${NC}"
PAYLOAD=$(echo "$TOKEN" | cut -d '.' -f2 | base64 -d 2>/dev/null || echo "$TOKEN" | cut -d '.' -f2 | base64 -D 2>/dev/null)
echo "$PAYLOAD" | jq .
echo ""

# Store token in MongoDB
echo -e "${YELLOW}Step 3: Storing token in MongoDB...${NC}"
MONGO_RESULT=$(mongosh "$MONGO_URI/$MONGO_DB_NAME" --quiet --eval "
db.$MONGO_COLLECTION.updateOne(
    { _id: '$USER_ID' },
    { \$set: { _id: '$USER_ID', token: '$TOKEN' } },
    { upsert: true }
)
" 2>&1)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Token stored in MongoDB${NC}"
    echo -e "  Database: ${BLUE}$MONGO_DB_NAME${NC}"
    echo -e "  Collection: ${BLUE}$MONGO_COLLECTION${NC}"
    echo -e "  User ID: ${BLUE}$USER_ID${NC}"
else
    echo -e "${RED}✗ Failed to store token in MongoDB${NC}"
    echo "$MONGO_RESULT"
    exit 1
fi
echo ""

# Verify token was stored
echo -e "${YELLOW}Step 4: Verifying token in MongoDB...${NC}"
STORED_TOKEN=$(mongosh "$MONGO_URI/$MONGO_DB_NAME" --quiet --eval "
const user = db.$MONGO_COLLECTION.findOne({ _id: '$USER_ID' });
if (user) { print(user.token); } else { print('NOT_FOUND'); }
" 2>&1 | tail -1)

if [ "$STORED_TOKEN" = "$TOKEN" ]; then
    echo -e "${GREEN}✓ Token verified in database${NC}"
else
    echo -e "${RED}✗ Token mismatch or not found${NC}"
    exit 1
fi
echo ""

# Run curl tests
echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}                         Running Tests${NC}"
echo -e "${BLUE}======================================================================${NC}"
echo ""

# Test 1: POST with valid token (should succeed)
echo -e "${YELLOW}Test 1: POST request WITH valid authentication${NC}"
echo -e "Expected: ${GREEN}Success (200-201)${NC}"
echo ""
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$PROXY_URL/ngsi-ld/v1/entities" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "urn:ngsi-ld:Test:001",
    "type": "TestEntity",
    "temperature": {
      "value": 25.5,
      "type": "Number"
    }
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
    echo -e "${GREEN}✓ PASSED${NC} - HTTP Status: $HTTP_CODE"
elif [ "$HTTP_CODE" -eq 422 ] || [ "$HTTP_CODE" -eq 409 ]; then
    echo -e "${GREEN}✓ PASSED${NC} - HTTP Status: $HTTP_CODE (entity may already exist)"
else
    echo -e "${RED}✗ FAILED${NC} - HTTP Status: $HTTP_CODE"
fi
echo "Response: $BODY"
echo ""

# Test 2: POST without token (should fail with 401)
echo -e "${YELLOW}Test 2: POST request WITHOUT authentication${NC}"
echo -e "Expected: ${RED}Fail (401 Unauthorized)${NC}"
echo ""
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$PROXY_URL/ngsi-ld/v1/entities" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "urn:ngsi-ld:Test:002",
    "type": "TestEntity"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -eq 401 ]; then
    echo -e "${GREEN}✓ PASSED${NC} - HTTP Status: $HTTP_CODE"
else
    echo -e "${RED}✗ FAILED${NC} - HTTP Status: $HTTP_CODE (expected 401)"
fi
echo "Response: $BODY"
echo ""

# Test 3: POST with invalid token (should fail with 401)
echo -e "${YELLOW}Test 3: POST request with INVALID token${NC}"
echo -e "Expected: ${RED}Fail (401 Unauthorized)${NC}"
echo ""
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$PROXY_URL/ngsi-ld/v1/entities" \
  -H "Authorization: Bearer invalid.token.here" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "urn:ngsi-ld:Test:003",
    "type": "TestEntity"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -eq 401 ]; then
    echo -e "${GREEN}✓ PASSED${NC} - HTTP Status: $HTTP_CODE"
else
    echo -e "${RED}✗ FAILED${NC} - HTTP Status: $HTTP_CODE (expected 401)"
fi
echo "Response: $BODY"
echo ""

# Test 4: GET without token (should succeed - no auth required for GET)
echo -e "${YELLOW}Test 4: GET request WITHOUT authentication${NC}"
echo -e "Expected: ${GREEN}Success (200)${NC}"
echo ""
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$PROXY_URL/ngsi-ld/v1/entities?limit=1" \
  -H "Accept: application/json")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ PASSED${NC} - HTTP Status: $HTTP_CODE"
else
    echo -e "${YELLOW}⚠ WARNING${NC} - HTTP Status: $HTTP_CODE (expected 200, but upstream may be unavailable)"
fi
echo "Response: $(echo "$BODY" | head -c 200)..."
echo ""

# Summary
echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}                         Test Summary${NC}"
echo -e "${BLUE}======================================================================${NC}"
echo ""
echo -e "User ID:       ${BLUE}$USER_ID${NC}"
echo -e "Token:         ${BLUE}$TOKEN${NC}"
echo -e "Proxy URL:     ${BLUE}$PROXY_URL${NC}"
echo -e "MongoDB:       ${BLUE}$MONGO_URI/$MONGO_DB_NAME.$MONGO_COLLECTION${NC}"
echo ""
echo -e "${YELLOW}Manual curl command with this token:${NC}"
echo ""
echo "curl -X POST \"$PROXY_URL/ngsi-ld/v1/entities\" \\"
echo "  -H \"Authorization: Bearer $TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"id\":\"urn:ngsi-ld:Test:$(date +%s)\",\"type\":\"TestEntity\"}'"
echo ""
echo -e "${YELLOW}Export token for other scripts:${NC}"
echo "export TEST_TOKEN='$TOKEN'"
echo ""
echo -e "${YELLOW}View token in MongoDB:${NC}"
echo "mongosh \"$MONGO_URI/$MONGO_DB_NAME\" --eval \"db.$MONGO_COLLECTION.findOne({_id: '$USER_ID'})\""
echo ""
echo -e "${YELLOW}Delete test user:${NC}"
echo "mongosh \"$MONGO_URI/$MONGO_DB_NAME\" --eval \"db.$MONGO_COLLECTION.deleteOne({_id: '$USER_ID'})\""
echo ""
echo -e "${BLUE}======================================================================${NC}"
