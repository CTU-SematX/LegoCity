# Development Guide

This guide provides comprehensive information for developers contributing to Lego City.

## Table of Contents

- [Development Environment Setup](#development-environment-setup)
- [Project Architecture](#project-architecture)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Building and Deployment](#building-and-deployment)
- [Troubleshooting](#troubleshooting)

## Development Environment Setup

### Required Tools

#### Backend Development
- **Go**: Version 1.21 or higher
  ```bash
  # Verify installation
  go version
  ```
- **golangci-lint**: For code linting
  ```bash
  go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
  ```

#### Dashboard Development
- **Node.js**: Version 18 or higher
  ```bash
  # Verify installation
  node --version
  ```
- **pnpm**: Package manager
  ```bash
  npm install -g pnpm
  ```

#### Protocol Buffers (Optional)
- **protoc**: Protocol Buffer compiler
  ```bash
  # On macOS
  brew install protobuf
  
  # On Ubuntu/Debian
  apt-get install protobuf-compiler
  ```

#### Additional Tools
- **Git**: With GPG signing configured for commits
- **Docker**: For containerized development (optional)
- **MongoDB or PostgreSQL**: Database for dashboard

### Initial Setup

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/LegoCity.git
   cd LegoCity
   ```

2. **Set up backend**:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your API keys:
   # OPENWEATHER_API_KEY=your_key_here
   # OPENAIR_API_KEY=your_key_here
   go mod download
   ```

3. **Set up dashboard**:
   ```bash
   cd ../dashboard
   cp .env.example .env
   # Edit .env with your configuration:
   # DATABASE_URI=mongodb://127.0.0.1/legocity
   # PAYLOAD_SECRET=your-secret-here
   # NEXT_PUBLIC_SERVER_URL=http://localhost:3000
   pnpm install
   ```

4. **Verify setup**:
   ```bash
   # Test backend
   cd ../backend && go test ./...
   
   # Test dashboard
   cd ../dashboard && pnpm test
   ```

## Project Architecture

### Backend Architecture

The backend is built with Go using the Gin web framework:

```
backend/
├── client/           # External API client implementations
│   ├── weather.go    # OpenWeather API client
│   └── air.go        # OpenAir API client
├── config/           # Configuration management
│   └── config.go     # Environment variable loading
├── handlers/         # HTTP request handlers
│   └── handlers.go   # Route handlers
├── server/           # Server setup
│   └── server.go     # HTTP server configuration
├── types/            # Data types and structs
├── interfaces/       # Interface definitions
└── main.go           # Application entry point
```

**Key Design Patterns:**
- **Dependency Injection**: Handlers receive clients via constructor
- **Interface-based Design**: Enables testing with mocks
- **Configuration via Environment**: All secrets in .env file

### Dashboard Architecture

The dashboard uses Next.js 14+ App Router with PayloadCMS:

```
dashboard/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── collections/      # PayloadCMS collections
│   ├── components/       # React components
│   ├── payload.config.ts # Payload configuration
│   └── ...
├── public/               # Static assets
└── package.json
```

**Key Technologies:**
- **PayloadCMS**: Headless CMS for content management
- **Next.js**: React framework with SSR/SSG
- **TypeScript**: Type-safe development
- **TailwindCSS**: Utility-first styling

## Development Workflow

### Daily Development

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and test**:
   ```bash
   # Backend
   cd backend && go run main.go
   
   # Dashboard (in new terminal)
   cd dashboard && pnpm dev
   ```

3. **Run quality checks**:
   ```bash
   # Backend linting
   cd backend && golangci-lint run
   
   # Dashboard linting
   cd dashboard && pnpm lint
   ```

4. **Run tests**:
   ```bash
   # Backend tests
   make test
   
   # Dashboard tests
   cd dashboard && pnpm test
   ```

5. **Commit with conventional commits**:
   ```bash
   git commit --signoff -S -m "feat: add new weather endpoint"
   ```

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Example:**
```bash
git commit --signoff -S -m "feat(api): add air quality caching

Implements Redis caching for air quality data to reduce
API calls and improve response times.

Closes #123"
```

### Protocol Buffer Changes

If modifying `.proto` files:

```bash
# Generate new types
make proto

# This generates:
# - backend/types/*.pb.go (Go)
# - frontend/types/*.ts (TypeScript)
```

## Coding Standards

### Go (Backend)

- Follow [Effective Go](https://golang.org/doc/effective_go)
- Use `gofmt` for formatting (automatic with golangci-lint)
- Write table-driven tests
- Handle errors explicitly, never ignore
- Use context for cancellation and timeouts
- Document exported functions and types

**Example:**
```go
// GetWeatherData retrieves weather information for a city.
// It returns an error if the API call fails or the city is not found.
func (c *WeatherClient) GetWeatherData(ctx context.Context, city string) (*WeatherData, error) {
    if city == "" {
        return nil, errors.New("city cannot be empty")
    }
    // ... implementation
}
```

### TypeScript/JavaScript (Dashboard)

- Follow the existing code style
- Use TypeScript for type safety
- Follow React best practices and hooks guidelines
- Use functional components
- Keep components small and focused
- Write meaningful prop types

**Example:**
```typescript
interface WeatherCardProps {
  city: string
  temperature: number
  conditions: string
}

export const WeatherCard: React.FC<WeatherCardProps> = ({ 
  city, 
  temperature, 
  conditions 
}) => {
  // ... implementation
}
```

### Code Review Checklist

Before submitting a PR, ensure:

- [ ] Code follows project conventions
- [ ] All tests pass
- [ ] New code has test coverage
- [ ] Documentation is updated
- [ ] Commits are signed and follow conventional format
- [ ] No secrets or credentials in code
- [ ] Error handling is appropriate
- [ ] Code is formatted correctly

## Testing

### Backend Testing

```bash
# Run all tests
cd backend && go test ./...

# Run with coverage
go test -cover ./...

# Run specific test
go test -run TestWeatherClient ./client

# Verbose output
go test -v ./...
```

**Writing Tests:**
```go
func TestWeatherClient_GetCity(t *testing.T) {
    tests := []struct {
        name    string
        city    string
        want    string
        wantErr bool
    }{
        {
            name: "valid city",
            city: "London",
            want: "London",
            wantErr: false,
        },
        // ... more test cases
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // ... test implementation
        })
    }
}
```

### Dashboard Testing

```bash
# Run all tests
cd dashboard && pnpm test

# Run with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Watch mode
pnpm test:watch
```

## Building and Deployment

### Backend

```bash
# Development build
cd backend && go build -o ../bin/smartcity main.go

# Production build with optimizations
go build -ldflags="-s -w" -o ../bin/smartcity main.go

# Cross-compile for Linux
GOOS=linux GOARCH=amd64 go build -o ../bin/smartcity-linux main.go
```

### Dashboard

```bash
# Development build
cd dashboard && pnpm build

# Production build
pnpm build
pnpm start

# Generate static export (if applicable)
pnpm build && pnpm export
```

### Docker

```bash
# Build backend image
docker build -t legocity-backend -f backend/Dockerfile .

# Build dashboard image
docker build -t legocity-dashboard -f dashboard/Dockerfile .

# Run with docker-compose
docker-compose up
```

## Troubleshooting

### Common Issues

#### Backend

**Issue**: `go: cannot find main module`
```bash
# Solution: Ensure you're in the backend directory
cd backend
go mod download
```

**Issue**: API keys not working
```bash
# Solution: Check .env file exists and has correct values
cat .env
# Restart the server after updating .env
```

**Issue**: Port 8080 already in use
```bash
# Solution: Find and kill the process
lsof -ti:8080 | xargs kill
# Or use a different port in config
```

#### Dashboard

**Issue**: `Cannot connect to database`
```bash
# Solution: Ensure MongoDB/PostgreSQL is running
# For MongoDB:
brew services start mongodb-community
# or
docker run -d -p 27017:27017 mongo
```

**Issue**: `Module not found` errors
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules .next
pnpm install
```

**Issue**: Build errors after dependency updates
```bash
# Solution: Clear Next.js cache
rm -rf .next
pnpm build
```

### Debug Mode

**Backend**:
```bash
# Run with delve debugger
dlv debug main.go

# Or use VS Code debugger with launch.json
```

**Dashboard**:
```bash
# Run with debug logging
DEBUG=* pnpm dev

# Use React DevTools browser extension
```

### Getting Help

- Check existing [GitHub Issues](https://github.com/CTU-SematX/LegoCity/issues)
- Review [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines
- Read [docs/Open_Source_Checklist.md](docs/Open_Source_Checklist.md)
- Contact maintainers via issue tracker

## Performance Tips

### Backend

- Use connection pooling for database connections
- Implement caching for frequently accessed data
- Use context with timeouts for external API calls
- Profile with `pprof` for bottlenecks

### Dashboard

- Optimize images with Next.js Image component
- Use dynamic imports for code splitting
- Implement proper caching strategies
- Monitor bundle size with `pnpm analyze`

## Security Best Practices

- Never commit secrets or API keys
- Use environment variables for all sensitive data
- Keep dependencies updated
- Run security scanners (CodeQL, Dependabot)
- Sign all commits with GPG
- Use 2FA on GitHub account
- Review security advisories regularly

## Continuous Integration

The project uses GitHub Actions for CI/CD:

- **Pull Request Workflow**: Runs tests and lints on PRs
- **Release Workflow**: Builds and tags releases
- **OpenSSF Scorecard**: Monitors security health
- **MkDocs Deploy**: Publishes documentation

Check `.github/workflows/` for workflow configurations.

---

**Happy Coding!** For questions, open an issue or reach out to the maintainers.
