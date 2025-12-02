# Orion Nginx Gateway

The Orion Nginx Gateway is the front door to your SematX deployment. It handles authentication, rate limiting, routing, and security for all API requests.

## Overview

The gateway sits between clients and backend services (Orion-LD and Lego Dashboard), providing:

- **Authentication**: JWT token validation
- **Authorization**: Permission checking
- **Rate Limiting**: Request throttling
- **Routing**: Request forwarding to correct service
- **Security**: CORS, SSL/TLS, security headers
- **Monitoring**: Access logging and metrics

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Orion Nginx Gateway                   │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │           Nginx Core (C/C++)                   │    │
│  │  • Event Loop                                  │    │
│  │  • Connection Handling                         │    │
│  │  • SSL/TLS Termination                         │    │
│  └────────────────────────────────────────────────┘    │
│                         │                               │
│  ┌──────────────────────┴────────────────────────┐    │
│  │                                                │    │
│  ▼                                                ▼    │
│  ┌─────────────────────┐         ┌─────────────────┐  │
│  │  Lua Authentication │         │  Rate Limiting  │  │
│  │  Module             │         │  Module         │  │
│  │                     │         │                 │  │
│  │  • JWT Decode       │         │  • Token Bucket │  │
│  │  • Signature Verify │         │  • Redis Cache  │  │
│  │  • Claims Extract   │         │  • Per-key Limit│  │
│  └─────────────────────┘         └─────────────────┘  │
│                         │                               │
│  ┌──────────────────────┴────────────────────────┐    │
│  │           Request Routing                      │    │
│  │  • /ngsi-ld/* → Orion-LD                      │    │
│  │  • /api/* → Dashboard                         │    │
│  │  • /admin/* → Dashboard UI                    │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## JWT Authentication

### How JWT Works in SematX

1. **User obtains API key** from Lego Dashboard
2. **API key IS the JWT token** (no separate auth step needed)
3. **Client includes token** in Authorization header
4. **Nginx validates token** using Lua script
5. **Request forwarded** to backend if valid

### JWT Token Structure

```javascript
// Header
{
  "alg": "HS256",
  "typ": "JWT"
}

// Payload
{
  "userId": "6587f2a123456789",
  "email": "user@example.com",
  "permissions": ["read:entities", "write:entities"],
  "tenant": "my-iot-project",
  "rateLimit": 100,
  "iat": 1704153600,    // Issued at
  "exp": 1712015600     // Expires at
}

// Signature
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

### Nginx JWT Validation

The Lua script that validates JWTs:

```lua
-- /etc/nginx/lua/jwt_verify.lua

local jwt = require "resty.jwt"
local cjson = require "cjson"

-- Read JWT from Authorization header
local auth_header = ngx.var.http_authorization
if not auth_header then
    ngx.status = 401
    ngx.say('{"error": "Missing Authorization header"}')
    ngx.exit(401)
end

-- Extract token (format: "Bearer <token>")
local token = string.match(auth_header, "Bearer%s+(.+)")
if not token then
    ngx.status = 401
    ngx.say('{"error": "Invalid Authorization format"}')
    ngx.exit(401)
end

-- Verify JWT signature
local jwt_secret = os.getenv("JWT_SECRET")
local jwt_obj = jwt:verify(jwt_secret, token)

if not jwt_obj.verified then
    ngx.status = 401
    ngx.say('{"error": "Invalid token: ' .. jwt_obj.reason .. '"}')
    ngx.exit(401)
end

-- Check expiration
local now = ngx.time()
if jwt_obj.payload.exp and jwt_obj.payload.exp < now then
    ngx.status = 401
    ngx.say('{"error": "Token expired"}')
    ngx.exit(401)
end

-- Extract claims for downstream use
ngx.var.jwt_user_id = jwt_obj.payload.userId
ngx.var.jwt_tenant = jwt_obj.payload.tenant or "default"
ngx.var.jwt_rate_limit = jwt_obj.payload.rateLimit or 100

-- Set tenant header for Orion-LD
if jwt_obj.payload.tenant then
    ngx.req.set_header("NGSILD-Tenant", jwt_obj.payload.tenant)
end
```

### Nginx Configuration

```nginx
# /etc/nginx/nginx.conf

http {
    # Load Lua modules
    lua_package_path "/usr/local/openresty/lualib/?.lua;;";

    # JWT secret from environment
    env JWT_SECRET;

    # Rate limiting zones
    limit_req_zone $jwt_user_id zone=api_limit:10m rate=100r/m;

    upstream dashboard {
        server dashboard:3000 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    upstream orion {
        server orion:1026 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    server {
        listen 80;
        server_name _;

        # Redirect HTTP to HTTPS
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name api.sematx.io;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # CORS headers
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PATCH, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, NGSILD-Tenant" always;

        # Handle OPTIONS preflight
        if ($request_method = OPTIONS) {
            return 204;
        }

        # Health check endpoint (no auth)
        location /health {
            access_log off;
            return 200 "OK\n";
            add_header Content-Type text/plain;
        }

        # Dashboard UI (no auth for login page)
        location /admin {
            proxy_pass http://dashboard;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Dashboard API (requires auth)
        location /api/ {
            access_by_lua_file /etc/nginx/lua/jwt_verify.lua;

            limit_req zone=api_limit burst=20 nodelay;

            proxy_pass http://dashboard;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-User-ID $jwt_user_id;
            proxy_set_header X-Tenant $jwt_tenant;
        }

        # Orion-LD NGSI-LD API (requires auth)
        location /ngsi-ld/ {
            access_by_lua_file /etc/nginx/lua/jwt_verify.lua;

            limit_req zone=api_limit burst=20 nodelay;

            proxy_pass http://orion;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header NGSILD-Tenant $jwt_tenant;

            # Timeouts for long queries
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Access logs
        access_log /var/log/nginx/access.log combined;
        error_log /var/log/nginx/error.log warn;
    }
}
```

## Rate Limiting

### How Rate Limiting Works

SematX uses **token bucket algorithm**:

1. Each API key has a bucket of tokens
2. Bucket refills at a constant rate (e.g., 100 tokens/minute)
3. Each request consumes 1 token
4. If bucket is empty, request is rejected with 429

### Rate Limit Configuration

```nginx
# Define rate limit zone
limit_req_zone $jwt_user_id zone=api_limit:10m rate=100r/m;

# Apply to location
location /ngsi-ld/ {
    # Allow bursts of 20 requests
    # nodelay = don't delay requests, reject immediately if over limit
    limit_req zone=api_limit burst=20 nodelay;

    # Custom error response
    limit_req_status 429;
}
```

### Rate Limit Headers

Nginx adds headers to inform clients:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1704153660
```

### Per-Key Rate Limits

Different API keys can have different limits:

```lua
-- In jwt_verify.lua
local rate_limit = jwt_obj.payload.rateLimit or 100

-- Set dynamic rate limit
ngx.var.rate_limit = rate_limit .. "r/m"
```

```nginx
# Use variable rate limit
limit_req_zone $jwt_user_id zone=api_limit:10m rate=$rate_limit;
```

## Request Routing

### Routing Table

| Path Pattern | Backend   | Description     |
| ------------ | --------- | --------------- |
| `/health`    | Local     | Health check    |
| `/admin/*`   | Dashboard | Admin UI        |
| `/api/*`     | Dashboard | Dashboard API   |
| `/ngsi-ld/*` | Orion-LD  | NGSI-LD API     |
| `/*`         | Dashboard | Frontend assets |

### Path Rewriting

Some paths need rewriting:

```nginx
# Rewrite /api/v1/entities to /entities
location /api/v1/ {
    rewrite ^/api/v1/(.*)$ /$1 break;
    proxy_pass http://dashboard;
}
```

### Load Balancing

For multiple backend instances:

```nginx
upstream orion_cluster {
    # Round-robin (default)
    server orion-1:1026 weight=1;
    server orion-2:1026 weight=1;
    server orion-3:1026 weight=2;  # More powerful server

    # Health checks
    keepalive 32;
    keepalive_timeout 60s;
}

location /ngsi-ld/ {
    proxy_pass http://orion_cluster;
}
```

### Sticky Sessions

If needed for stateful applications:

```nginx
upstream dashboard_cluster {
    ip_hash;  # Route same IP to same backend
    server dashboard-1:3000;
    server dashboard-2:3000;
}
```

## SSL/TLS Configuration

### Generate Self-Signed Certificate (Development)

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/key.pem \
  -out /etc/nginx/ssl/cert.pem \
  -subj "/CN=localhost"
```

### Production Certificate (Let's Encrypt)

```bash
# Install certbot
apt-get install certbot python3-certbot-nginx

# Obtain certificate
certbot --nginx -d api.sematx.io

# Auto-renewal (cron job)
0 0 * * * certbot renew --quiet
```

### SSL Best Practices

```nginx
server {
    listen 443 ssl http2;

    # Certificates
    ssl_certificate /etc/letsencrypt/live/api.sematx.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.sematx.io/privkey.pem;

    # Protocols (disable old versions)
    ssl_protocols TLSv1.2 TLSv1.3;

    # Ciphers (strong only)
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;

    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;

    # Session cache
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS header
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
}
```

## Security Headers

### Essential Security Headers

```nginx
# Prevent clickjacking
add_header X-Frame-Options "SAMEORIGIN" always;

# Prevent MIME sniffing
add_header X-Content-Type-Options "nosniff" always;

# XSS protection
add_header X-XSS-Protection "1; mode=block" always;

# Referrer policy
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Content Security Policy
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;

# Permissions policy
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

## Performance Optimization

### Connection Pooling

```nginx
upstream orion {
    server orion:1026;

    # Keep 32 idle connections open
    keepalive 32;
    keepalive_timeout 60s;
    keepalive_requests 100;
}

location /ngsi-ld/ {
    proxy_pass http://orion;

    # Use HTTP/1.1 for keepalive
    proxy_http_version 1.1;
    proxy_set_header Connection "";
}
```

### Caching

```nginx
# Define cache zone
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

location /ngsi-ld/v1/entities {
    # Cache GET requests only
    proxy_cache api_cache;
    proxy_cache_valid 200 1m;
    proxy_cache_key "$request_uri|$jwt_user_id";
    proxy_cache_methods GET HEAD;

    # Add cache status header
    add_header X-Cache-Status $upstream_cache_status;

    proxy_pass http://orion;
}
```

### Compression

```nginx
http {
    # Enable gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/ld+json;
    gzip_comp_level 6;
}
```

### Buffer Tuning

```nginx
http {
    # Client buffers
    client_body_buffer_size 128k;
    client_max_body_size 10m;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 8k;

    # Proxy buffers
    proxy_buffer_size 4k;
    proxy_buffers 8 4k;
    proxy_busy_buffers_size 8k;
}
```

## Monitoring and Logging

### Access Log Format

```nginx
log_format main '$remote_addr - $remote_user [$time_local] '
                '"$request" $status $body_bytes_sent '
                '"$http_referer" "$http_user_agent" '
                'rt=$request_time uct="$upstream_connect_time" '
                'uht="$upstream_header_time" urt="$upstream_response_time" '
                'tenant="$jwt_tenant" user="$jwt_user_id"';

access_log /var/log/nginx/access.log main;
```

### Metrics Endpoint

```nginx
# Nginx stub_status module
location /nginx_status {
    stub_status on;
    access_log off;
    allow 127.0.0.1;
    deny all;
}
```

Output:

```
Active connections: 245
server accepts handled requests
 1000 1000 3000
Reading: 0 Writing: 1 Waiting: 244
```

### Prometheus Exporter

Use `nginx-prometheus-exporter`:

```bash
docker run -p 9113:9113 nginx/nginx-prometheus-exporter:latest \
  -nginx.scrape-uri=http://localhost/nginx_status
```

## Troubleshooting

### Common Issues

#### 502 Bad Gateway

**Causes**:

- Backend service down
- Connection timeout
- Backend overloaded

**Debug**:

```bash
# Check backend health
curl http://orion:1026/version

# Check Nginx error logs
tail -f /var/log/nginx/error.log

# Test backend connection
telnet orion 1026
```

#### 401 Unauthorized

**Causes**:

- Invalid JWT token
- Expired token
- Wrong secret key

**Debug**:

```bash
# Decode JWT (without verification)
echo "YOUR_TOKEN" | base64 -d

# Check Nginx Lua logs
tail -f /var/log/nginx/error.log | grep lua
```

#### 429 Too Many Requests

**Causes**:

- Exceeded rate limit
- Rate limit zone full

**Debug**:

```nginx
# Increase zone size
limit_req_zone $jwt_user_id zone=api_limit:50m rate=100r/m;

# Check current usage
# View /var/cache/nginx/rate_limit
```

### Debug Mode

Enable debug logging:

```nginx
error_log /var/log/nginx/error.log debug;

# Reload Nginx
nginx -s reload
```

## Best Practices

### Security

✅ **Do**:

- Use HTTPS in production
- Rotate JWT secrets regularly
- Implement rate limiting
- Validate all inputs
- Keep Nginx updated
- Use strong SSL ciphers

❌ **Don't**:

- Expose Nginx status publicly
- Use default SSL certificates
- Allow unlimited request sizes
- Trust client headers blindly
- Run Nginx as root

### Performance

✅ **Do**:

- Enable keepalive connections
- Use connection pooling
- Enable gzip compression
- Cache static content
- Tune buffer sizes
- Monitor metrics

❌ **Don't**:

- Keep too many idle connections
- Cache dynamic content
- Use synchronous I/O
- Ignore memory limits

## Next Steps

- [**Lego Dashboard Internals →**](lego-dashboard.md) - Learn about dashboard architecture
- [**Deployment Guide →**](../deployment/index.md) - Deploy to production
- [**Configuration →**](../configuration/index.md) - Configure your instance

## Further Reading

- [Nginx Official Docs](https://nginx.org/en/docs/)
- [OpenResty Lua](https://github.com/openresty/lua-nginx-module)
- [JWT RFC 7519](https://tools.ietf.org/html/rfc7519)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
