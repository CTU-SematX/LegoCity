🌐 English | [Tiếng Việt](./i18n/README.vi.md)

![](./docs/assets/project_banner.png)

# LegoCity

[![Documentation](https://img.shields.io/badge/docs-Lego--Doc-blue?logo=materialformkdocs&logoColor=fff)](https://ctu-sematx.github.io/Lego-Doc/)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/CTU-SematX/LegoCity/badge)](https://scorecard.dev/viewer/?uri=github.com/CTU-SematX/LegoCity)
[![Version](https://img.shields.io/github/v/release/CTU-SematX/LegoCity?label=Version)](https://github.com/CTU-SematX/LegoCity/releases)
[![Commit activity](https://img.shields.io/github/commit-activity/m/CTU-SematX/LegoCity.svg 'Commit activity')](https://github.com/CTU-SematX/LegoCity/graphs/commit-activity)
[![GitHub contributors](https://img.shields.io/github/contributors/CTU-SematX/LegoCity.svg 'Github contributors')](https://github.com/CTU-SematX/LegoCity/graphs/contributors)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Short description

LegoCity is a lightweight Smart City template designed for rapid experimentation and teaching within the CTU-SematX ecosystem. It provides example components to demonstrate how to connect data sources, an API gateway, and a dashboard using NGSI-LD and FIWARE enablers.

Documentation: https://ctu-sematx.github.io/Lego-Doc/

Lego-Dashboard: https://github.com/CTU-SematX/Lego-Dashboard 

Orion-Nginx: https://github.com/CTU-SematX/Orion-Nginx


## Table of Contents

- [Installation and Requirements](#installation-and-requirements)
- [Quickstart Instructions](#quickstart-instructions)
- [Usage](#usage)
- [Known Issues](#known-issues)
- [Support](#support)
- [Contributing](#contributing)
- [Development](#development)
- [License](#license)
- [Maintainers](#maintainers)
- [Credits and References](#credits-and-references)


## Installation and Requirements

Detailed instructions on how to install, configure, and get the project running.

Prerequisites

- Docker & Docker Compose
- Node.js 20+ / Bun (for the dashboard)
- Git

Clone repository

```bash
git clone https://github.com/CTU-SematX/LegoCity.git
cd LegoCity
```

## Quickstart Instructions

Start the entire stack (recommended)

```bash
# Start all services with unified docker compose
docker compose up -d

# View logs
docker compose logs -f

# Stop everything
docker compose down
```

Or start components individually:

```bash
# Start broker only
cd broker && docker compose up -d

# Run dashboard locally
cd dashboard && pnpm install && pnpm dev
```

## Usage

The repository contains example Data Source servers and a dashboard that demonstrate NGSI-LD integration and FIWARE enablers.

### Sample servers

| Server | Port | Framework | Purpose |
|--------|------|-----------|--------|
| `demo-server` | 8004 | Elysia + Bun | Interactive demo with Swagger UI |
| `weather-server` | 8005 | Elysia + Bun | Auto-updating weather/AQ data |

Each server includes:

- REST API for CRUD operations
- NGSI-LD integration with Context Broker
- Swagger UI for interactive API docs
- Health checks

### Open Data

The `opendata/` directory contains seed data for the Context Broker and real-world geospatial datasets.

#### Seed Data (CSV)
Data files in `opendata/seed-data/` are automatically loaded into the Context Broker on startup:
- Traffic flow, Flood sensors, Flood zones
- Emergency incidents, Emergency vehicles
- Medical facilities, Weather stations, Air quality monitors

#### Geospatial Datasets (GeoJSON)
Real-world datasets covering various aspects of Vietnam:

| Dataset | Description | Format |
|---------|-------------|--------|
| **giaothong/** | Traffic infrastructure (highways, national roads) | GeoJSON |
| **heritage/** | Cultural and historical heritage sites | GeoJSON |
| **khu_bao_ton_quoc_gia/** | National conservation areas and nature reserves | GeoJSON |
| **thunhapbinhquan/** | Provincial-level average income statistics | GeoJSON |
| **thuydien/** | Hydroelectric power plants and facilities | GeoJSON |

All geospatial datasets use **WGS84 (EPSG:4326)** coordinate system and are licensed under **CC-BY-4.0**.

For detailed information about each dataset, see [opendata/README.md](./opendata/README.md) and individual folder READMEs.

## Known Issues

- Docker builds for some language images may fail on musl-based distributions (Alpine). Use Debian-based images for Go (`golang:1.21-bookworm`) when building locally or in CI.

If you encounter other issues, please open an issue with steps to reproduce.

## Support

- File issues: https://github.com/CTU-SematX/LegoCity/issues
- Security reports: see `SECURITY.md` or use GitHub Security Advisories

## Contributing

Contributions are welcome. See `CONTRIBUTING.md` for guidelines on code style, commits, and reviews.

## Development

Refer to component READMEs in `broker/`, `servers/`, and `dashboard/` for development notes and local run instructions.


## License

This project uses multiple licenses depending on the content:

- **Source Code**: MIT License — see the [LICENSE](./LICENSE) file
- **Open Data**: CC-BY-4.0 (Creative Commons Attribution 4.0 International) — see [LICENSES/CC-BY-4.0.txt](./LICENSES/CC-BY-4.0.txt)
- **Documentation**: Content may be subject to different terms

Please refer to individual files and directories for specific licensing information.


## Maintainers

- CTU-SematX Team — https://github.com/CTU-SematX

## Credits and References

- **FIWARE Foundation** — Orion Context Broker
- **Smart Data Models** — NGSI-LD data models
- **PayloadCMS** — Example dashboard framework
- **Open Data Sources** — Various Vietnamese government and public data sources
- [IEEE Open Source Maintainers Manual](https://opensource.ieee.org/community/manual/)

### Data Attribution

The geospatial datasets in the `opendata/` directory are compiled from various sources including:
- Vietnamese government open data portals
- Energy sector data (EVN, hydroelectric companies)
- Provincial statistics bureaus
- Environmental protection agencies
- Cultural heritage preservation organizations

When using these datasets, please provide appropriate attribution as specified in the [CC-BY-4.0 license](./LICENSES/CC-BY-4.0.txt).
