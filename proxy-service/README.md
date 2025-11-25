# Reverse Proxy Service

A lightweight HTTP reverse proxy with JWT authentication for POST requests.

## Features

- **Selective Authentication**: Only validates JWT tokens for POST requests
- **Pass-through for other methods**: GET, PUT, DELETE, etc. are forwarded without authentication
- **JWT Validation**: HMAC-SHA256 signature verification with expiration checking
- **Graceful Shutdown**: Handles SIGINT/SIGTERM signals properly
- **Request Streaming**: Efficiently handles large request/response bodies
- **Structured Logging**: Logs method, path, status, and validation status

## How It Works

### Request Flow

1. **Client Request** → Proxy Server (port 8080)
2. **Token Validation** (only for POST requests):
   - Extract `Authorization: Bearer <token>` header
   - Validate JWT signature using `TOKEN_SECRET`
   - Check token expiration (`exp` claim)
   - Reject with 401 if invalid
3. **Forward Request** → Upstream Server
   - Preserves: method, path, query, headers, body
   - Sets correct Host header for upstream
4. **Stream Response** → Client
   - Returns status code, headers, and body unchanged

### For POST Requests

```
Client → [Proxy: Validate JWT] → Upstream Server → [Proxy: Stream Response] → Client
         ↓ (if invalid)
         401 Unauthorized
```

### For Other Requests (GET, PUT, DELETE, etc.)

```
Client → [Proxy: No Validation] → Upstream Server → [Proxy: Stream Response] → Client
```

## Setup

### 1. Install Dependencies

```bash
cd proxy-service
go mod download
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```bash
PORT=8080
UPSTREAM_BASE_URL=http://localhost:9000
TOKEN_SECRET=your-secret-key-for-jwt-validation
```

### 3. Run the Proxy

```bash
# Load environment variables and run
export PORT=8080
export UPSTREAM_BASE_URL=http://localhost:9000
export TOKEN_SECRET=mysecret123

go run main.go
```

Or build and run:

```bash
go build -o proxy-service main.go
./proxy-service
```

## Usage Examples

### 1. GET Request (No Authentication Required)

```bash
curl http://localhost:8080/api/users
```

The proxy forwards this directly to `http://localhost:9000/api/users` without checking tokens.

### 2. POST Request (Authentication Required)

```bash
# With valid JWT token
curl -X POST http://localhost:8080/api/data \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

The proxy:
1. Validates the JWT token
2. If valid, forwards to `http://localhost:9000/api/data`
3. If invalid, returns 401

### 3. POST Request Without Token (Will Fail)

```bash
curl -X POST http://localhost:8080/api/data \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

Response:
```json
{
  "error": "Missing authorization header",
  "success": false
}
```

## Testing with a Sample Upstream Server

Create a simple test server on port 9000:

```bash
# In another terminal
cd /tmp
cat > test-server.go << 'EOF'
package main

import (
    "encoding/json"
    "log"
    "net/http"
)

func main() {
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        log.Printf("Received: %s %s", r.Method, r.URL.Path)
        json.NewEncoder(w).Encode(map[string]string{
            "message": "Hello from upstream",
            "method": r.Method,
            "path": r.URL.Path,
        })
    })
    log.Println("Test server listening on :9000")
    http.ListenAndServe(":9000", nil)
}
EOF

go run test-server.go
```

Now test the proxy with this upstream server.

## Generating Test JWT Tokens

To generate a test JWT token for testing:

```bash
# Using a simple JWT generator (you can install jwt-cli or use online tools)
# Example token payload:
# {
#   "sub": "user123",
#   "exp": 9999999999
# }

# Or use this Go snippet:
cat > generate-token.go << 'EOF'
package main

import (
    "fmt"
    "time"
    "github.com/golang-jwt/jwt/v5"
)

func main() {
    secret := []byte("mysecret123") // Use your TOKEN_SECRET
    
    claims := jwt.RegisteredClaims{
        Subject:   "test-user",
        ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
        IssuedAt:  jwt.NewNumericDate(time.Now()),
    }
    
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    tokenString, _ := token.SignedString(secret)
    
    fmt.Println("Token:", tokenString)
}
EOF

go run generate-token.go
```

## Logging Output

The proxy logs all requests:

```
2025/11/25 10:30:15 Starting reverse proxy server on port 8080
2025/11/25 10:30:15 Forwarding requests to: http://localhost:9000
2025/11/25 10:30:15 Proxy server is ready and listening on :8080
2025/11/25 10:30:20 Forwarding: GET /api/users to http://localhost:9000/api/users
2025/11/25 10:30:20 Response: method=GET path=/api/users status=200 tokenValidated=false
2025/11/25 10:30:25 Token validated successfully: path=/api/data subject=user123
2025/11/25 10:30:25 Forwarding: POST /api/data to http://localhost:9000/api/data
2025/11/25 10:30:25 Response: method=POST path=/api/data status=201 tokenValidated=true
```

## Architecture

```
┌─────────┐         ┌──────────────┐         ┌──────────────┐
│ Client  │────────>│ Proxy :8080  │────────>│ Upstream     │
│         │         │              │         │ :9000        │
│         │<────────│ - Validate   │<────────│              │
└─────────┘         │   POST only  │         └──────────────┘
                    │ - Forward    │
                    │ - Stream     │
                    └──────────────┘
```

## Production Considerations

1. **Use HTTPS**: Deploy behind a TLS terminator or add TLS directly
2. **Rate Limiting**: Add rate limiting to prevent abuse
3. **Monitoring**: Add metrics (Prometheus, etc.)
4. **Circuit Breaker**: Handle upstream failures gracefully
5. **Caching**: Consider caching for GET requests
6. **Load Balancing**: Use multiple upstream servers
7. **Security Headers**: Add security headers to responses

## Testing

### Quick Test

Run the automated test script to generate a JWT token, store it in MongoDB, and test authentication:

```bash
# Run comprehensive test suite
./scripts/test_auth.sh

# Or run quick test
./scripts/quick_test.sh

# Test with custom user ID
./scripts/test_auth.sh my-user-id
```

### Manual Testing

1. **Generate a token and store in MongoDB:**

```bash
# Run the test script to generate a token
./scripts/test_auth.sh

# The script will output a token like:
# export TEST_TOKEN='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

2. **Test POST request with authentication:**

```bash
# Set the token from script output
export TEST_TOKEN='your-token-here'

# Test authenticated POST request
curl -X POST "http://localhost:8080/v2/entities" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "urn:ngsi-ld:Test:001",
    "type": "TestEntity",
    "temperature": {
      "value": 25.5,
      "type": "Number"
    }
  }'
```

3. **Test without authentication (should fail):**

```bash
curl -X POST "http://localhost:8080/v2/entities" \
  -H "Content-Type: application/json" \
  -d '{"id":"urn:ngsi-ld:Test:002","type":"TestEntity"}'
```

4. **Test GET request (no authentication required):**

```bash
curl -X GET "http://localhost:8080/v2/entities" \
  -H "Accept: application/json"
```

### Test Requirements

The test scripts require:
- `mongosh` - MongoDB Shell ([install guide](https://www.mongodb.com/docs/mongodb-shell/install/))
- `jq` - JSON processor (`brew install jq` on macOS)
- `openssl` - For HMAC signing (usually pre-installed)

See [scripts/README.md](scripts/README.md) for detailed testing documentation.

## License

MIT
