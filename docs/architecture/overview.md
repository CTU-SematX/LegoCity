# Architecture Overview

This document provides a high-level overview of the Lego City architecture, design decisions, and system components.

## System Architecture

Lego City follows a microservices architecture with two main components that can operate independently or together:

```
┌─────────────────────────────────────────────────────────────┐
│                        Lego City                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │   Dashboard      │         │    Backend API   │         │
│  │  (Next.js +      │         │   (Go + Gin)     │         │
│  │   PayloadCMS)    │◄────────┤                  │         │
│  │                  │         │                  │         │
│  │  Port: 3000      │         │  Port: 8080      │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
│           │                            │                    │
│           │                            │                    │
│           ▼                            ▼                    │
│  ┌────────────────┐         ┌──────────────────┐          │
│  │   Database     │         │  External APIs   │          │
│  │  (MongoDB/     │         │  - OpenWeather   │          │
│  │   PostgreSQL)  │         │  - OpenAir       │          │
│  └────────────────┘         └──────────────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Backend API Server

**Technology Stack:**
- Language: Go 1.21+
- Framework: Gin (HTTP web framework)
- Configuration: godotenv (environment management)

**Responsibilities:**
- Provide RESTful API endpoints
- Integrate with external weather and air quality services
- Handle API rate limiting and caching (planned)
- Serve real-time smart city data

**Key Features:**
- Lightweight and fast
- Low memory footprint
- Concurrent request handling
- Easy to deploy and scale

[Learn more →](backend.md)

### 2. Dashboard (Frontend + CMS)

**Technology Stack:**
- Framework: Next.js 14+ (App Router)
- CMS: PayloadCMS 3.x
- Language: TypeScript
- Styling: TailwindCSS
- Database: MongoDB or PostgreSQL

**Responsibilities:**
- Content management system
- User authentication and authorization
- Page and post creation
- Media management
- Layout building
- SEO optimization

**Key Features:**
- Server-side rendering (SSR)
- Static site generation (SSG)
- Real-time preview
- Responsive design
- Dark mode support

[Learn more →](dashboard.md)

## Design Principles

### 1. Separation of Concerns

The backend and dashboard are completely independent:

- **Backend**: Pure API server with no frontend dependencies
- **Dashboard**: Can be used standalone or integrated with backend
- **Communication**: RESTful APIs (future: gRPC via Protocol Buffers)

**Benefits:**
- Independent deployment and scaling
- Technology flexibility
- Easier testing and maintenance
- Team specialization

### 2. Microservices Architecture

Each component is a self-contained service:

```
Backend Service          Dashboard Service
     │                        │
     ├─► Weather API          ├─► Content Management
     ├─► Air Quality API      ├─► User Management
     └─► Health Check         └─► Media Management
```

**Benefits:**
- Service isolation
- Independent scaling
- Fault tolerance
- Technology diversity

### 3. API-First Design

All functionality exposed through well-defined APIs:

- RESTful endpoints
- JSON responses
- Clear error handling
- Versioning support (planned)

### 4. Configuration via Environment

All configuration through environment variables:

- No hardcoded secrets
- Easy deployment to different environments
- 12-factor app compliance

### 5. Open Standards

Following industry standards:

- FIWARE for smart city enablers
- NGSI-LD for linked data
- OpenAPI for API documentation (planned)
- Conventional Commits for git history

## Data Flow

### Weather Data Flow

```
User Request
    │
    ▼
Dashboard (Frontend)
    │
    ▼
Backend API (/api/weather/city)
    │
    ▼
OpenWeather API
    │
    ▼
Response with Weather Data
    │
    ▼
User sees formatted weather
```

### Content Management Flow

```
Admin User
    │
    ▼
Dashboard Admin Panel
    │
    ▼
PayloadCMS
    │
    ▼
Database (MongoDB/PostgreSQL)
    │
    ▼
Content Published
    │
    ▼
Public User sees content
```

## Technology Choices

### Why Go for Backend?

✅ **Performance**: Fast execution, low latency
✅ **Concurrency**: Built-in goroutines for handling multiple requests
✅ **Simple Deployment**: Single binary, no dependencies
✅ **Strong Typing**: Type safety without excessive boilerplate
✅ **Good Ecosystem**: Excellent libraries for web services

### Why Next.js for Dashboard?

✅ **Modern React**: Latest features and best practices
✅ **SSR/SSG**: Better SEO and performance
✅ **Developer Experience**: Hot reload, TypeScript support
✅ **Production Ready**: Used by major companies
✅ **Vercel Integration**: Easy deployment

### Why PayloadCMS?

✅ **Modern Stack**: TypeScript, React, MongoDB/PostgreSQL
✅ **Flexible**: Headless CMS, use anywhere
✅ **Developer Friendly**: Code-first configuration
✅ **Feature Rich**: Authentication, media, workflow
✅ **Open Source**: Active community, extensible

## Communication Patterns

### Current: REST API

```http
GET /api/weather/city?q=London
Host: localhost:8080
Accept: application/json

Response:
{
  "city": "London",
  "temperature": 15.5,
  "conditions": "Cloudy"
}
```

### Future: gRPC (Protocol Buffers)

```protobuf
service WeatherService {
  rpc GetWeather (WeatherRequest) returns (WeatherResponse);
}

message WeatherRequest {
  string city = 1;
}

message WeatherResponse {
  string city = 1;
  float temperature = 2;
  string conditions = 3;
}
```

**Benefits:**
- Type safety across services
- Better performance (binary protocol)
- Built-in code generation
- Bi-directional streaming

## Security Architecture

### Authentication & Authorization

```
User Login
    │
    ▼
PayloadCMS Auth
    │
    ▼
JWT Token Generated
    │
    ▼
Token stored in httpOnly cookie
    │
    ▼
Subsequent requests use token
```

### API Security

- Environment-based secrets
- No credentials in code
- CORS configuration
- Rate limiting (planned)
- Input validation
- SQL injection prevention

### Data Security

- Encrypted database connections
- Secure password hashing (bcrypt)
- HTTPS in production
- Regular security audits (OpenSSF Scorecard)

## Scalability Considerations

### Horizontal Scaling

Both components can be scaled independently:

```
Load Balancer
     │
     ├─► Backend Instance 1
     ├─► Backend Instance 2
     └─► Backend Instance 3

Load Balancer
     │
     ├─► Dashboard Instance 1
     └─► Dashboard Instance 2
```

### Database Scaling

- **MongoDB**: Replica sets, sharding
- **PostgreSQL**: Read replicas, connection pooling
- **Caching**: Redis for frequently accessed data

### API Rate Limiting

Planned features:
- Per-user rate limits
- IP-based throttling
- API key management
- Queue-based processing

## Deployment Architecture

### Development

```
Local Machine
├── Backend (localhost:8080)
├── Dashboard (localhost:3000)
└── Database (localhost:27017)
```

### Production (Cloud)

```
Cloud Infrastructure
├── Backend Cluster
│   ├── Load Balancer
│   ├── Auto-scaling Group
│   └── Health Checks
├── Dashboard Cluster
│   ├── CDN (Static Assets)
│   ├── Application Servers
│   └── Database Connection Pool
└── Managed Database
    ├── Primary
    └── Replicas
```

## Integration with FIWARE

Future integration points:

### Orion Context Broker

```
Lego City Backend
     │
     ▼
Orion Context Broker (NGSI-LD)
     │
     ▼
Smart City IoT Devices
```

### FIWARE Enablers

Planned integrations:
- **Orion**: Context management
- **Keyrock**: Identity management
- **Quantum Leap**: Time series data
- **Cygnus**: Data persistence
- **STH-Comet**: Historical data

## Performance Characteristics

### Backend Performance

- **Response Time**: < 100ms (local APIs)
- **Throughput**: 1000+ requests/second (single instance)
- **Memory**: ~50MB idle, ~200MB under load
- **Concurrency**: Handles 1000+ concurrent connections

### Dashboard Performance

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Lighthouse Score**: 90+ (target)
- **Bundle Size**: Optimized with code splitting

## Monitoring & Observability

### Metrics to Track

**Backend:**
- Request rate
- Response times
- Error rates
- Active connections
- Memory usage
- CPU usage

**Dashboard:**
- Page load times
- User sessions
- Content updates
- Database queries
- Cache hit rates

### Logging Strategy

```
Application Logs
     │
     ▼
Structured JSON Logs
     │
     ▼
Log Aggregation (e.g., ELK Stack)
     │
     ▼
Alerts & Dashboards
```

## Future Enhancements

### Short Term (3-6 months)

- [ ] Add Redis caching
- [ ] Implement gRPC communication
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Enhance error handling and logging
- [ ] Add more FIWARE enablers

### Medium Term (6-12 months)

- [ ] Kubernetes deployment templates
- [ ] GraphQL API option
- [ ] Real-time data with WebSockets
- [ ] Advanced analytics dashboard
- [ ] Multi-language support

### Long Term (12+ months)

- [ ] Machine learning integration
- [ ] Predictive analytics
- [ ] Mobile applications
- [ ] Plugin system
- [ ] Marketplace for extensions

## Contributing to Architecture

We welcome architectural improvements! See:

- [Development Guide](../../DEVELOPMENT.md)
- [Contributing Guide](../../CONTRIBUTING.md)
- [Open Source Checklist](../Open_Source_Checklist.md)

## Related Documentation

- [Backend Architecture](backend.md)
- [Dashboard Architecture](dashboard.md)
- [Getting Started](../getting-started/overview.md)

---

**Questions?** Open an issue or discussion on GitHub!
