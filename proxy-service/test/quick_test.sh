#!/bin/bash

# Quick Test Script - Simple version
# Usage: ./quick_test.sh [user_id]

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Configuration
TOKEN_SECRET=${TOKEN_SECRET:-"your-secret-key"}
MONGO_URI=${MONGO_URI:-"mongodb://localhost:27017"}
MONGO_DB_NAME=${MONGO_DB_NAME:-"smartcity"}
MONGO_COLLECTION=${MONGO_COLLECTION:-"users"}
PROXY_URL=${PROXY_URL:-"http://localhost:1026"}
USER_ID=${1:-"test-user-123"}

# Function to create base64url encoding
base64url_encode() {
    openssl base64 -e -A | tr '+/' '-_' | tr -d '='
}

# Create JWT token
echo "Creating JWT token for user: $USER_ID"

header='{"alg":"HS256","typ":"JWT"}'
header_b64=$(echo -n "$header" | base64url_encode)

iat=$(date +%s)
exp=$((iat + 86400))
payload="{\"user_id\":\"$USER_ID\",\"iat\":$iat,\"exp\":$exp,\"nbf\":$iat}"
payload_b64=$(echo -n "$payload" | base64url_encode)

signature_input="${header_b64}.${payload_b64}"
signature=$(echo -n "$signature_input" | openssl dgst -sha256 -hmac "$TOKEN_SECRET" -binary | base64url_encode)

TOKEN="${header_b64}.${payload_b64}.${signature}"

echo "Token: $TOKEN"
echo ""

# Store in MongoDB
echo "Storing token in MongoDB..."
mongosh "$MONGO_URI/$MONGO_DB_NAME" --quiet --eval "
db.$MONGO_COLLECTION.updateOne(
    { _id: '$USER_ID' },
    { \$set: { _id: '$USER_ID', token: '$TOKEN' } },
    { upsert: true }
)
" > /dev/null 2>&1

echo "✓ Token stored"
echo ""

# Test with curl
echo "Testing with curl..."
echo "===================="
echo ""

echo "1. POST with valid token:"
curl -X POST "$PROXY_URL/ngsi-ld/v1/entities" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/ld+json" \
  -d "{\"id\":\"urn:ngsi-ld:Test:$(date +%s)\",\"type\":\"TestEntity\",\"value\":{\"type\":\"Property\",\"value\":42},\"@context\":[\"https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld\"]}" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s
echo ""
echo ""

echo "2. POST without token (should fail):"
curl -X POST "$PROXY_URL/ngsi-ld/v1/entities" \
  -H "Content-Type: application/ld+json" \
  -d "{\"id\":\"urn:ngsi-ld:Test:$(date +%s)\",\"type\":\"TestEntity\",\"@context\":[\"https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld\"]}" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s
echo ""
echo ""

echo "3. GET without token (should work):"
curl -X GET "$PROXY_URL/version" \
  -H "Accept: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s
echo ""
echo ""

echo "===================="
echo "Token saved as:"
echo "export TEST_TOKEN='$TOKEN'"
