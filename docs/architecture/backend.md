# Backend Architecture

This document details the architecture and design of the Lego City backend API server.

## Overview

The backend is a lightweight Go-based REST API server that provides weather and air quality data integration for smart city applications.

## Technology Stack

- **Language**: Go 1.21+
- **Web Framework**: Gin
- **Configuration**: godotenv
- **Protocol**: HTTP/REST (gRPC planned)

## Project Structure

```
backend/
├── client/              # External API clients
│   ├── weather.go       # OpenWeather API integration
│   └── air.go          # Air quality API integration
├── config/             # Configuration management
│   └── config.go       # Environment variable loading
├── handlers/           # HTTP request handlers
│   └── handlers.go     # Route handler implementations
├── server/             # Server setup and routing
│   └── server.go       # Gin server configuration
├── types/              # Data structures
│   └── *.pb.go        # Protocol Buffer generated types
├── interfaces/         # Interface definitions
│   └── *.go           # Interface contracts
├── orion-ld/          # FIWARE Orion-LD integration
├── main.go            # Application entry point
├── .env.example       # Environment template
├── go.mod             # Go module definition
└── go.sum             # Dependency checksums
```

## Design Patterns

### 1. Dependency Injection

Handlers receive dependencies through constructors:

```go
type Handler struct {
    weatherClient WeatherClient
    airClient     AirClient
}

func NewHandler(wc WeatherClient, ac AirClient) *Handler {
    return &Handler{
        weatherClient: wc,
        airClient: ac,
    }
}
```

**Benefits:**
- Testability (easy to mock dependencies)
- Loose coupling
- Clear dependencies

### 2. Interface-Based Design

Use interfaces for external dependencies:

```go
type WeatherClient interface {
    GetWeather(ctx context.Context, city string) (*WeatherData, error)
}

type AirClient interface {
    GetAirQuality(ctx context.Context, location string) (*AirData, error)
}
```

**Benefits:**
- Easy testing with mocks
- Flexibility to swap implementations
- Clear contracts

### 3. Configuration via Environment

All configuration through environment variables:

```go
type Config struct {
    WeatherAPIKey string
    AirAPIKey     string
    Port          string
}

func Load() *Config {
    return &Config{
        WeatherAPIKey: os.Getenv("OPENWEATHER_API_KEY"),
        AirAPIKey:     os.Getenv("OPENAIR_API_KEY"),
        Port:          getEnv("PORT", "8080"),
    }
}
```

## API Endpoints

### Health Check

```
GET /health
```

**Purpose**: Verify service is running

**Response**:
```json
{
  "status": "ok"
}
```

### Weather Endpoints

#### Get Weather by City

```
GET /api/weather/city?q=<city_name>
```

**Parameters:**
- `q` (string, required): City name

**Response Example**:
```json
{
  "name": "London",
  "main": {
    "temp": 15.5,
    "feels_like": 14.2,
    "humidity": 72
  },
  "weather": [{
    "main": "Clouds",
    "description": "scattered clouds"
  }]
}
```

#### Complex Weather Query

```
POST /api/weather/get
```

**Purpose**: Advanced weather queries

### Air Quality Endpoints

#### Get Locations

```
GET /api/air/locations
```

**Purpose**: List available monitoring locations

#### Get by Country

```
GET /api/air/countries?country=<country_id>
```

**Parameters:**
- `country` (integer, required): Country ID

## Request Flow

```
HTTP Request
    │
    ▼
Gin Router
    │
    ▼
Middleware (logging, CORS, etc.)
    │
    ▼
Handler Function
    │
    ▼
Client (weather/air)
    │
    ▼
External API
    │
    ▼
Response Processing
    │
    ▼
JSON Response
```

## Error Handling

### Standard Error Response

```json
{
  "error": "error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Error Handling Pattern

```go
func (h *Handler) GetWeather(c *gin.Context) {
    city := c.Query("q")
    if city == "" {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "city parameter is required",
        })
        return
    }

    data, err := h.weatherClient.GetWeather(c.Request.Context(), city)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "failed to fetch weather data",
        })
        return
    }

    c.JSON(http.StatusOK, data)
}
```

## External API Integration

### Weather API Client

```go
type WeatherClient struct {
    apiKey     string
    baseURL    string
    httpClient *http.Client
}

func (wc *WeatherClient) GetWeather(ctx context.Context, city string) (*WeatherData, error) {
    url := fmt.Sprintf("%s/weather?q=%s&appid=%s", 
        wc.baseURL, city, wc.apiKey)
    
    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil {
        return nil, err
    }
    
    // ... make request and parse response
}
```

**Features:**
- Context support for cancellation
- Error handling
- Response parsing
- Timeout configuration

### Air Quality Client

Similar pattern to weather client, with specific endpoints for air quality data.

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `OPENWEATHER_API_KEY` | OpenWeather API key | Yes | - |
| `OPENAIR_API_KEY` | Air quality API key | Yes | - |
| `PORT` | Server port | No | 8080 |
| `GIN_MODE` | Gin mode (debug/release) | No | release |

### Loading Configuration

```go
func main() {
    // Load .env file
    err := godotenv.Load()
    if err != nil {
        log.Fatal("Error loading .env file")
    }
    
    // Load configuration
    cfg := config.Load()
    
    // Initialize clients and server
    // ...
}
```

## Testing Strategy

### Unit Tests

Test individual components in isolation:

```go
func TestWeatherClient_GetWeather(t *testing.T) {
    // Create mock HTTP server
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        json.NewEncoder(w).Encode(mockWeatherData)
    }))
    defer server.Close()
    
    // Create client with test server URL
    client := NewWeatherClient("test-key", server.URL)
    
    // Test
    data, err := client.GetWeather(context.Background(), "London")
    assert.NoError(t, err)
    assert.Equal(t, "London", data.Name)
}
```

### Integration Tests

Test API endpoints end-to-end:

```go
func TestHealthEndpoint(t *testing.T) {
    router := setupRouter()
    
    w := httptest.NewRecorder()
    req, _ := http.NewRequest("GET", "/health", nil)
    router.ServeHTTP(w, req)
    
    assert.Equal(t, http.StatusOK, w.Code)
    assert.Contains(t, w.Body.String(), "ok")
}
```

## Performance Considerations

### Concurrency

Go's goroutines handle concurrent requests efficiently:

```go
// Gin handles each request in a goroutine
router.GET("/api/data", func(c *gin.Context) {
    // This runs concurrently
    // No need for manual goroutine management
})
```

### Connection Pooling

Use HTTP client with connection pooling:

```go
var httpClient = &http.Client{
    Timeout: 10 * time.Second,
    Transport: &http.Transport{
        MaxIdleConns:        100,
        MaxIdleConnsPerHost: 100,
        IdleConnTimeout:     90 * time.Second,
    },
}
```

### Caching (Planned)

Future implementation with Redis:

```go
func (h *Handler) GetWeatherWithCache(c *gin.Context) {
    city := c.Query("q")
    
    // Check cache
    cached, err := h.cache.Get(city)
    if err == nil {
        c.JSON(http.StatusOK, cached)
        return
    }
    
    // Fetch from API
    data, err := h.weatherClient.GetWeather(c.Request.Context(), city)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    // Store in cache
    h.cache.Set(city, data, 10*time.Minute)
    
    c.JSON(http.StatusOK, data)
}
```

## Security

### API Key Protection

- Never commit API keys
- Use environment variables
- Rotate keys regularly

### Input Validation

```go
func validateCity(city string) error {
    if city == "" {
        return errors.New("city cannot be empty")
    }
    if len(city) > 100 {
        return errors.New("city name too long")
    }
    return nil
}
```

### Rate Limiting (Planned)

```go
// Use middleware for rate limiting
router.Use(rateLimit.Middleware())
```

## Deployment

### Build

```bash
# Standard build
go build -o bin/smartcity main.go

# Optimized build
go build -ldflags="-s -w" -o bin/smartcity main.go

# Cross-compile for Linux
GOOS=linux GOARCH=amd64 go build -o bin/smartcity-linux main.go
```

### Docker

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -ldflags="-s -w" -o smartcity main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /app/smartcity /usr/local/bin/
EXPOSE 8080
CMD ["smartcity"]
```

### Environment-Based Config

```bash
# Development
export GIN_MODE=debug
./smartcity

# Production
export GIN_MODE=release
./smartcity
```

## Monitoring

### Logging

```go
// Structured logging
log.Printf("Weather request - city: %s, status: %d, duration: %v", 
    city, statusCode, duration)
```

### Metrics (Planned)

- Request count
- Response times
- Error rates
- Active connections

### Health Checks

```go
func HealthCheck(c *gin.Context) {
    // Check external dependencies
    if err := checkWeatherAPI(); err != nil {
        c.JSON(http.StatusServiceUnavailable, gin.H{
            "status": "unhealthy",
            "reason": "weather API unavailable",
        })
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
```

## Future Enhancements

### gRPC Support

```protobuf
service WeatherService {
  rpc GetWeather (WeatherRequest) returns (WeatherResponse);
  rpc StreamWeather (WeatherRequest) returns (stream WeatherResponse);
}
```

### Message Queue Integration

For async processing:

```go
// Publish weather updates
publisher.Publish("weather.updates", weatherData)

// Subscribe to updates
subscriber.Subscribe("weather.updates", handleWeatherUpdate)
```

### Database Integration

For caching and persistence:

```go
// Store historical data
db.Insert("weather_history", weatherData)

// Query historical data
history := db.Query("weather_history", filters)
```

## Best Practices

✅ **Use context for cancellation**
✅ **Handle errors explicitly**
✅ **Write table-driven tests**
✅ **Keep handlers thin**
✅ **Use structured logging**
✅ **Document exported functions**
✅ **Follow Go conventions**

## Resources

- [Effective Go](https://golang.org/doc/effective_go)
- [Gin Documentation](https://gin-gonic.com/docs/)
- [Go Testing Guide](https://golang.org/pkg/testing/)

---

For more information, see:
- [Architecture Overview](overview.md)
- [Development Guide](../../DEVELOPMENT.md)
- [Backend README](../../backend/README.md)
