# Backend API Server

The backend is a Go-based REST API server that provides weather and air quality data integration for the Lego City smart city platform.

## Features

- Weather data integration via OpenWeather API
- Air quality data from OpenAir API
- RESTful API endpoints
- Health check endpoint
- Environment-based configuration
- Lightweight and fast performance

## Quick Start

1. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your API keys:
   ```env
   OPENWEATHER_API_KEY=your_openweather_api_key
   OPENAIR_API_KEY=your_openair_api_key
   ```

3. Run the server:
   ```bash
   go run main.go
   ```

The API will be available at `http://localhost:8080`

## API Endpoints

### Health Check
```bash
GET /health
```
Returns the health status of the API server.

### Weather Endpoints

#### Get Weather by City

```bash
GET /api/weather/city?q=<city_name>
```

**Parameters:**
- `q` (required): City name (URL encoded)

**Example:**
```bash
curl "http://localhost:8080/api/weather/city?q=Ho%20Chi%20Minh%20City"
```

**Example Response:**
See `example_image/HCMCity.png` for sample output.

#### Get Detailed Weather Data
```bash
POST /api/weather/get
```

**Note:** This endpoint has complex usage requirements. Refer to the API client implementation for details.

### Air Quality Endpoints

#### Get Air Quality Locations
```bash
GET /api/air/locations
```
Returns a list of available air quality monitoring locations.

#### Get Air Quality by Country
```bash
GET /api/air/countries?country=<country_id>
```

**Parameters:**
- `country` (required): Country ID

**Example:**
```bash
curl "http://localhost:8080/api/air/countries?country=56"
```

**Example Response:**
See `example_image/country=56.png` for sample output.

## Development

### Prerequisites
- Go 1.21 or higher
- OpenWeather API key ([Get one here](https://openweathermap.org/api))
- OpenAir API key

### Installation

```bash
# Install dependencies
go mod download

# Run tests
go test ./...

# Build
go build -o ../bin/smartcity main.go

# Run
./bin/smartcity
```

### Project Structure

```
backend/
├── client/          # External API clients
│   ├── weather.go   # OpenWeather API client
│   └── air.go       # OpenAir API client
├── config/          # Configuration loader
├── handlers/        # HTTP request handlers
├── server/          # Server setup
├── types/           # Data types and Protocol Buffer definitions
├── interfaces/      # Interface definitions
├── main.go          # Application entry point
└── .env.example     # Environment variables template
```

### Environment Variables

Required environment variables (set in `.env`):

- `OPENWEATHER_API_KEY`: Your OpenWeather API key
- `OPENAIR_API_KEY`: Your OpenAir API key

### Running Tests

```bash
# Run all tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run tests verbosely
go test -v ./...
```

### Code Quality

```bash
# Install linter
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Run linter
golangci-lint run
```

### Building for Production

```bash
# Standard build
go build -o ../bin/smartcity main.go

# Optimized build
go build -ldflags="-s -w" -o ../bin/smartcity main.go

# Cross-compile for Linux
GOOS=linux GOARCH=amd64 go build -o ../bin/smartcity-linux main.go
```

## Configuration

The server uses environment variables for configuration. All sensitive data like API keys should be stored in the `.env` file and never committed to version control.

## API Rate Limits

Both OpenWeather and OpenAir APIs have rate limits. For production use, consider:

- Implementing caching (Redis, Memcached)
- Rate limiting on your endpoints
- Upgrading to paid API tiers if needed

## Troubleshooting

### Common Issues

**Issue**: Server fails to start
- **Solution**: Check that `.env` file exists and contains valid API keys

**Issue**: API requests returning errors
- **Solution**: Verify API keys are valid and haven't exceeded rate limits

**Issue**: Port already in use
- **Solution**: Change the port in server configuration or kill the process using port 8080

### Debug Mode

To run with verbose logging, you can modify the Gin mode:

```go
// In main.go or server setup
gin.SetMode(gin.DebugMode)
```

## Contributing

See the main [CONTRIBUTING.md](../CONTRIBUTING.md) and [DEVELOPMENT.md](../DEVELOPMENT.md) for guidelines.

## License

This backend is part of the Lego City project and is licensed under the Apache License 2.0 - see the [LICENSE](../LICENSE) file for details.