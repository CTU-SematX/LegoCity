# Changelog

All notable changes to LegoCity will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Unified Docker Compose** - Single `docker-compose.yml` at project root to start entire stack
- **Seed Data Loader** - Python script to load CSV data into Context Broker on startup
- **Demo Server** (`demo-server`) - Interactive Swagger UI for learning NGSI-LD operations
- **Weather Server** (`weather-server`) - Auto-updating weather/air quality data with linear interpolation
- GeoJSON datasets for Vietnam: Hydroelectric plants, Heritage sites, Conservation areas, Traffic infrastructure, Average income
- Centralized license management in `LICENSES/` folder

### Changed
- Reorganized `servers/` folder: `data_server1` → `demo-server`, `data_server2` → `weather-server`
- Reorganized `opendata/` folder: `generatedData` → `seed-data`
- Updated docker-compose.yml with proper health checks and startup ordering
- Updated all READMEs with new architecture

### Removed
- Deprecated individual docker-compose files (consolidated into root)
- Old multi-language server architecture (traffic-flow, environment-monitor, etc.)

## [0.3.0-alpha] - Unreleased

### Added
- Sync functionality with Lego-Dashboard upstream
- Dashboard upgraded to v0.3.0-alpha with NGSI-LD features

### Changed
- License changed from Apache 2.0 to MIT
- Updated community contact to Discord

### Fixed
- Dashboard sync configuration issues

## [0.2.0-alpha] - 2025-XX-XX

### Added
- Sample open datasets for Smart City (traffic, environment, lighting, infrastructure)
- Four data source servers:
  - `traffic-flow` (FastAPI + Python) - Traffic flow data
  - `environment-monitor` (Gin + Go) - Air quality monitoring
  - `public-lighting` (Elysia + Bun) - Street lighting
  - `urban-infra` (Elysia + Bun) - Urban infrastructure
- NGSI-LD conversion endpoints for all servers
- Dashboard with NGSI-LD Entities management (CRUD + sync to Context Broker)
- NGSI Sources, Entities, Data Models, and Domains collections
- AI plugin integration (OpenRouter) for content generation
- Internationalization support (English, Vietnamese)
- Bilingual documentation

### Changed
- Updated README with improved structure and content
- Added language switch button

### Fixed
- GitHub Actions workflow issues
- Clean up unused files

## [0.1.0] - 2025-XX-XX

### Added
- Initial project setup
- Orion-LD Context Broker with MongoDB
- Nginx API Gateway with JWT authentication
- Basic project documentation
- MkDocs documentation site
- Project governance files (CODE_OF_CONDUCT, CONTRIBUTING, SECURITY)

---

## Component Versions

| Component | Version | Notes |
|-----------|---------|-------|
| Lego-Dashboard | 0.3.0-alpha | PayloadCMS + Next.js |
| Orion-LD | 1.6.0 | NGSI-LD Context Broker |
| MongoDB | 5.0.26 | Database (broker) |
| Demo Server | 2.0.0 | Elysia + Bun |
| Weather Server | 1.0.0 | Elysia + Bun |

## Links

- [Documentation](https://ctu-sematx.github.io/Lego-Doc/)
- [Lego-Dashboard](https://github.com/CTU-SematX/Lego-Dashboard)
- [Orion-Nginx](https://github.com/CTU-SematX/Orion-Nginx)
