![](./docs/assets/project_banner.png)

# LegoCity

[![Documentation](https://img.shields.io/badge/docs-Lego--Doc-blue?logo=materialformkdocs&logoColor=fff)](https://ctu-sematx.github.io/Lego-Doc/)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/CTU-SematX/LegoCity/badge)](https://scorecard.dev/viewer/?uri=github.com/CTU-SematX/LegoCity)
[![Version](https://img.shields.io/github/v/release/CTU-SematX/LegoCity?label=Version)](https://github.com/CTU-SematX/LegoCity/releases)
[![Commit activity](https://img.shields.io/github/commit-activity/m/CTU-SematX/LegoCity.svg 'Commit activity')](https://github.com/CTU-SematX/LegoCity/graphs/commit-activity)
[![GitHub contributors](https://img.shields.io/github/contributors/CTU-SematX/LegoCity.svg 'Github contributors')](https://github.com/CTU-SematX/LegoCity/graphs/contributors)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

LegoCity is a lightweight Smart City template designed for rapid experimentation and teaching within the CTU-SematX ecosystem. It provides example components to demonstrate how to connect data sources, an API gateway, and a dashboard using NGSI-LD and FIWARE enablers.

Documentation: https://ctu-sematx.github.io/Lego-Doc/

Key features

- Broker: NGINX gateway and Orion Context Broker integration
- Dashboard: PayloadCMS + Next.js example dashboard
- Sample data source servers for common Smart City domains
- Example open datasets in JSON format under `opendata/`

Repository layout

```
LegoCity/
├── broker/           # NGINX Gateway + Orion Context Broker + MongoDB
├── dashboard/        # PayloadCMS + Next.js Dashboard
├── servers/          # Sample Data Source Servers
│   ├── traffic-flow/        # FastAPI + Python (Port 8001)
│   ├── environment-monitor/ # Gin + Go (Port 8002)
│   ├── public-lighting/     # Elysia + Bun (Port 8003)
│   └── urban-infra/         # Elysia + Bun (Port 8004)
├── opendata/         # Sample datasets (JSON)
└── docs/             # Documentation assets
```

Quick start

Prerequisites

- Docker & Docker Compose
- Node.js 20+ / Bun (for the dashboard)
- Git

Clone repository

```bash
git clone https://github.com/CTU-SematX/LegoCity.git
cd LegoCity
```

Start the broker (Orion + MongoDB)

```bash
cd broker
docker compose up -d
```

Start sample data servers

```bash
cd servers
docker compose up -d --build
```

Run the dashboard (local development)

```bash
cd dashboard
pnpm install
pnpm dev
```

Sample data servers

| Server | Port | Framework | Domain |
|--------|------|-----------|--------|
| `traffic-flow` | 8001 | FastAPI + Python | Traffic flow |
| `environment-monitor` | 8002 | Gin + Go | Air quality / environment |
| `public-lighting` | 8003 | Elysia + Bun | Street lighting |
| `urban-infra` | 8004 | Elysia + Bun | Urban infrastructure |

Each server includes:

- REST API for CRUD operations
- NGSI-LD conversion endpoints
- Health checks

Open data

The `opendata/` directory contains sample JSON datasets used to seed the example servers:

- `traffic.json`
- `environment.json`
- `lighting.json`
- `infrastructure.json`

Documentation & links

- Full docs: https://ctu-sematx.github.io/Lego-Doc/
- Contributing: `CONTRIBUTING.md`
- License: Apache-2.0 (see `LICENSE`)

Contributing

Contributions are welcome. See `CONTRIBUTING.md` for guidelines.

Maintainers

- CTU-SematX Team — https://github.com/CTU-SematX

Credits

- FIWARE Foundation — Orion Context Broker
- Smart Data Models — NGSI-LD data models
- PayloadCMS — example dashboard
