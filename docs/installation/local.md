# Local Development Setup

This guide explains how to set up a local development environment for LegoCity.

!!! info "Target Audience"
This guide is for contributors who want to:

    - Run the dashboard and PayloadCMS locally
    - Experiment with new blocks and views
    - Develop update servers and proxy behaviour

The instructions are generic and can be applied whether you run everything with Docker, on a VM, or directly on your laptop.

---

## Prerequisites

### Required Tools

=== "Git"
Clone the repository and manage branches

    ```bash
    git --version
    ```

=== "Node.js"
Use a version compatible with the dashboard and PayloadCMS

    - Check `.nvmrc` or `engines` field in `package.json`
    - Otherwise, use a recent LTS version

    ```bash
    node --version
    ```

=== "Package Manager"
Use the package manager indicated by the repository:

    - `pnpm-lock.yaml` present → use **pnpm**
    - `yarn.lock` present → use **yarn**
    - Otherwise → use **npm**

=== "Docker (Optional)"
Recommended for running supporting services

    - Context broker
    - Databases
    - Simplifies matching deployment configuration

    ```bash
    docker --version
    docker compose version
    ```

### Mapbox Access Token

!!! warning "Required for Map Rendering"
You'll need a Mapbox access token to render maps in the dashboard.

    Get one at [mapbox.com](https://www.mapbox.com/) and provide it via:
    ```
    NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here
    ```

---

## Repository Structure

```
LegoCity/
├── dashboard/          # Next.js application
│   ├── src/           # Source code
│   ├── public/        # Static assets
│   └── package.json   # Dependencies
├── docs/              # MkDocs documentation
│   ├── index.md      # This site
│   └── mkdocs.yml    # Config
├── orion-ld/         # NGSI-LD broker config
├── proto/            # Prototypes
└── README.md         # Project overview
```

**Core pattern:** `dashboard` + `docs` + `broker` + `support`

---

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/CTU-SematX/LegoCity.git
cd LegoCity
```

### 2. Create Feature Branch

```bash
git checkout -b feature/my-change
```

### 3. Install Dependencies

=== "Using pnpm"
`bash
    cd dashboard
    pnpm install
    `

=== "Using npm"
`bash
    cd dashboard
    npm install
    `

=== "Using yarn"
`bash
    cd dashboard
    yarn install
    `

---

## Environment Configuration

### Create Environment File

Create `.env` or `.env.local` in the `dashboard/` directory:

```env title="dashboard/.env"
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here

# PayloadCMS Database
DATABASE_URI=mongodb://localhost:27017/legocity

# PayloadCMS Secret (min 32 chars)
PAYLOAD_SECRET=your-secret-key-here-min-32-chars

# NGSI-LD Broker
BROKER_URL=http://localhost:1026

# Optional: Domain-specific write keys
BROKER_WRITE_KEY_ENVIRONMENT=key_env
BROKER_WRITE_KEY_MOBILITY=key_mobility
```

!!! danger "Security Note"
Never commit `.env` files containing real secrets to version control!

---

## Running the Application

### Option 1: Docker Compose (Recommended)

Start all services at once:

```bash
# From repository root
docker compose up
```

Or using Makefile:

```bash
make dev
```

This starts:

- Context broker
- MongoDB database
- PayloadCMS
- Dashboard
- Proxy (if configured)
- Update servers (if configured)

**Access URLs:**

| Service          | URL                         |
| ---------------- | --------------------------- |
| Dashboard        | http://localhost:3000       |
| PayloadCMS Admin | http://localhost:3000/admin |
| Context Broker   | http://localhost:1026       |

### Option 2: Manual Mode

Run services individually:

#### Start Dashboard

=== "pnpm"
`bash
    cd dashboard
    pnpm dev
    `

=== "npm"
`bash
    cd dashboard
    npm run dev
    `

=== "yarn"
`bash
    cd dashboard
    yarn dev
    `

#### Start PayloadCMS

If separate from dashboard:

```bash
cd cms  # or relevant directory
npm run dev
```

!!! tip "Database Connection"
Ensure MongoDB is accessible before starting PayloadCMS

---

## Initial Setup

### 1. Create Admin Account

1. Navigate to http://localhost:3000/admin
2. Fill in registration form:
   - Email
   - Password (min 8 characters)
3. Confirm account creation

### 2. Seed Data (Optional)

Run seed scripts to populate sample data:

```bash
# Example command (check package.json for actual script)
npm run seed
```

See [Seed Database guide](../development/seed-data.md) for details.

---

## Development Commands

Common commands from `dashboard/` directory:

| Command         | Description                      |
| --------------- | -------------------------------- |
| `npm run dev`   | Start dev server with hot reload |
| `npm run build` | Build production bundle          |
| `npm run start` | Start production server          |
| `npm run lint`  | Lint codebase                    |
| `npm run test`  | Run tests                        |

!!! tip "Check package.json"
Actual commands may vary. Always check `package.json` for available scripts.

---

## Git Workflow

### Best Practices

1.  **Work on feature branches** (not `main`)
2.  **Keep commits focused** and coherent
3.  **Run tests before PR** (if configured)
4.  **Update docs** when adding features
5.  **Follow CONTRIBUTING.md** guidelines (if exists)

### Example Workflow

```bash
# Create feature branch
git checkout -b feature/new-block

# Make changes
# ... edit files ...

# Stage and commit
git add .
git commit -m "feat: add weather block component"

# Push to remote
git push origin feature/new-block

# Create Pull Request on GitHub
```

---

## Troubleshooting

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:** Change port or kill process:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### MongoDB Connection Failed

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:** Ensure MongoDB is running:

```bash
# With Docker
docker compose up mongodb

# Or check service status
docker ps | grep mongo
```

### Missing Environment Variables

```
Error: NEXT_PUBLIC_MAPBOX_TOKEN is not defined
```

**Solution:** Check `.env` file exists and contains required variables.

---

## Summary

!!! success "Development Environment Ready"
You should now have:

    -  Repository cloned and dependencies installed
    -  Environment variables configured
    -  Services running (Docker or manual)
    -  Admin account created
    -  Understanding of development workflow

**Next Steps:**

- [Create custom blocks](../development/blocks.md)
- [Write PayloadCMS plugins](../development/plugins.md)
- [Add seed data](../development/seed-data.md)
