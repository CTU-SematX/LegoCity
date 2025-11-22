![](./docs/assets/project_banner.png)

# Lego City [![MkDocs](https://img.shields.io/badge/MkDocs-526CFE?logo=materialformkdocs&logoColor=fff)](https://ctu-sematx.github.io/LegoCity/)

Project logo and badges goes here.


[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/CTU-SematX/SmartCity/badge)](https://scorecard.dev/viewer/?uri=github.com/CTU-SematX/SmartCity)
[![Version](https://img.shields.io/github/v/release/CTU-SematX/SmartCity?label=Version)](https://github.com/CTU-SematX/SmartCity/releases)
[![Commit activity](https://img.shields.io/github/commit-activity/m/CTU-SematX/SmartCity.svg 'Commit activity')](https://github.com/CTU-SematX/SmartCity/graphs/commit-activity)
[![GitHub contributors](https://img.shields.io/github/contributors/CTU-SematX/SmartCity.svg 'Github contributors')](https://github.com/CTU-SematX/SmartCity/graphs/contributors)
![](./docs/images/new_banner.png)

**Description**: Lego City is a Smart City Builder using FIWARE Enablers and NGSI-LD under the hood, with PayloadCMS as a modern Wirecloud alternative featuring a fully customizable UI. Build your Smart City platform the fastest and easiest way.

The project consists of:
- **Backend**: Go-based API server providing weather and air quality data integration
- **Dashboard**: Next.js-based web application powered by PayloadCMS for content management and visualization

## Table of Contents

- [Installation and Requirements](#installation-and-requirements)
- [Quickstart Instructions](#quick-start-instructions)
- [Usage](#usage)
- [Known Issues](#known-issues)
- [Support](#support)
- [Contributing](#contributing)
- [Development](#development)
- [License](#license)
- [Maintainers](#maintainers)
- [Credits and References](#credits-and-references)

## Installation and Requirements

### Prerequisites

- **Go**: Version 1.21 or higher (for backend)
- **Node.js**: Version 18 or higher (for dashboard)
- **pnpm**: Package manager (for dashboard)
- **Database**: MongoDB or PostgreSQL (for dashboard)
- **API Keys**:
  - OpenWeather API key (for weather data)
  - OpenAir API key (for air quality data)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy the environment file and configure your API keys:
   ```bash
   cp .env.example .env
   # Edit .env and add your OPENWEATHER_API_KEY and OPENAIR_API_KEY
   ```

3. Install dependencies:
   ```bash
   go mod download
   ```

4. Build the backend:
   ```bash
   go build -o ../bin/smartcity main.go
   ```

### Dashboard Setup

1. Navigate to the dashboard directory:
   ```bash
   cd dashboard
   ```

2. Copy the environment file and configure:
   ```bash
   cp .env.example .env
   # Edit .env with your database URI, secrets, and server URL
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Build the dashboard:
   ```bash
   pnpm build
   ```

## Quick start instructions

The fastest way to get started with Lego City:

### Backend (API Server)

```bash
# From the repository root
cd backend
cp .env.example .env
# Edit .env with your API keys
go run main.go
```

The backend API will be available at `http://localhost:8080`

### Dashboard (Web UI)

```bash
# From the repository root
cd dashboard
cp .env.example .env
# Edit .env with your configuration
pnpm install
pnpm dev
```

The dashboard will be available at `http://localhost:3000`

### Using Make (Optional)

From the repository root, you can use the Makefile:

```bash
# Build the backend
make build

# Run the backend
make run

# Run tests
make test

# Lint code
make lint
```

## Usage

### Backend API Endpoints

The backend provides the following REST API endpoints:

- `GET /health` - Health check endpoint
- `POST /api/weather/get` - Get detailed weather data
- `GET /api/weather/city?q=<city_name>` - Get weather for a specific city
- `GET /api/air/locations` - Get air quality monitoring locations
- `GET /api/air/countries?country=<country_id>` - Get air quality data by country

**Example Requests:**

```bash
# Get weather for Ho Chi Minh City
curl "http://localhost:8080/api/weather/city?q=Ho%20Chi%20Minh%20City"

# Get air quality data for country ID 56
curl "http://localhost:8080/api/air/countries?country=56"

# Check health status
curl "http://localhost:8080/health"
```

### Dashboard

The dashboard provides a user-friendly interface for:

- Content management through PayloadCMS
- Visualizing weather and air quality data
- Creating and managing pages, posts, and media
- Building custom layouts with the layout builder

Access the admin panel at `http://localhost:3000/admin` after seeding the database.

For more detailed API documentation, see [backend/README.md](backend/README.md).

## Known issues

- The dashboard requires a seeded database for initial login. Run the seed script from the admin panel after first setup.
- API rate limits apply to third-party weather and air quality services. Consider implementing caching for production use.
- Some OpenSSF scorecard checks require additional CI/CD configuration for full compliance.

For a complete list of known issues and bugs, please check our [GitHub Issues](https://github.com/CTU-SematX/LegoCity/issues).

## Support

If you have questions, concerns, bug reports, or need help with this software:

- **File an issue**: Submit bug reports and feature requests in our [GitHub Issue Tracker](https://github.com/CTU-SematX/LegoCity/issues)
- **Check documentation**: Visit our [documentation site](https://ctu-sematx.github.io/LegoCity/)
- **Review existing issues**: Search for similar issues before creating a new one
- **Follow our templates**: Use the provided issue templates for bug reports and feature requests

For security vulnerabilities, please follow the guidelines in our [SECURITY.md](SECURITY.md) file.

## Contributing

We welcome and encourage contributions from the community! Here's how you can help:

**Key Areas for Contribution:**
- Adding new FIWARE enablers integration
- Improving UI/UX in the dashboard
- Enhancing API performance and caching
- Writing tests and improving code coverage
- Improving documentation and examples
- Reporting bugs and suggesting features

**How to Contribute:**
1. Read our [Contributing Guide](CONTRIBUTING.md) for detailed instructions
2. Check our [Code of Conduct](CODE_OF_CONDUCT.md)
3. Review the [Open Source Checklist](docs/Open_Source_Checklist.md)
4. Look at open issues or create a new one
5. Fork the repository and create a feature branch
6. Make your changes following our conventions
7. Submit a pull request

All contributions should follow:
- [Conventional Commits](https://www.conventionalcommits.org) standard
- Sign-off commits with DCO (Developer Certificate of Origin)
- Include appropriate tests where applicable

## Development

For developers who want to contribute or set up a development environment:

### Development Prerequisites
- Go 1.21+ with golangci-lint for backend development
- Node.js 18+ with pnpm for dashboard development  
- Protocol Buffers compiler (`protoc`) for gRPC development
- Git with commit signing configured

### Development Workflow

1. **Clone and setup**:
   ```bash
   git clone https://github.com/CTU-SematX/LegoCity.git
   cd LegoCity
   ```

2. **Backend development**:
   ```bash
   cd backend
   go mod download
   go run main.go  # Start development server
   ```

3. **Dashboard development**:
   ```bash
   cd dashboard
   pnpm install
   pnpm dev  # Start development server with hot reload
   ```

4. **Protocol Buffer generation**:
   ```bash
   make proto  # Generate Go and TypeScript types from .proto files
   ```

5. **Running tests**:
   ```bash
   make test  # Run backend tests
   cd dashboard && pnpm test  # Run dashboard tests
   ```

6. **Code quality**:
   ```bash
   make lint  # Lint backend code
   cd dashboard && pnpm lint  # Lint dashboard code
   ```

For comprehensive development guidelines, architectural decisions, and best practices, see [DEVELOPMENT.md](DEVELOPMENT.md).

### Project Structure

```
LegoCity/
├── backend/          # Go API server
│   ├── client/       # External API clients
│   ├── handlers/     # HTTP request handlers
│   ├── config/       # Configuration management
│   └── main.go       # Application entry point
├── dashboard/        # Next.js + PayloadCMS application
│   └── src/          # Source code
├── docs/             # Documentation
├── proto/            # Protocol Buffer definitions
└── i18n/             # Internationalization
```

---

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

The project follows the [REUSE specification](https://reuse.software/) for clear license compliance.

---

## Maintainers

This project is maintained by:

- **CTU-SematX Team** - [@CTU-SematX](https://github.com/CTU-SematX)

For security issues, please contact the maintainers as specified in [SECURITY.md](SECURITY.md).

## Credits and References

Special thanks to:

- [IEEE Open Source Maintainers Manual](https://opensource.ieee.org/community/manual/)
- [FIWARE Foundation](https://www.fiware.org/) - For NGSI-LD and Smart City enablers
- [PayloadCMS](https://payloadcms.com/) - For the excellent headless CMS framework
- [OpenSSF](https://openssf.org/) - For open source security best practices
- All our [contributors](https://github.com/CTU-SematX/LegoCity/graphs/contributors)

### Related Projects

- [FIWARE Orion Context Broker](https://fiware-orion.readthedocs.io/)
- [NGSI-LD API Specification](https://www.etsi.org/deliver/etsi_gs/CIM/001_099/009/01.08.01_60/gs_cim009v010801p.pdf)
- [PayloadCMS Website Template](https://github.com/payloadcms/payload/tree/main/templates/website)
