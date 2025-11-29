# Docker Setup Guide

Run LegoCity in containers with Docker Compose - the fastest way to get started.

## Overview

**Advantages**:

- ✅ One-command setup
- ✅ All services containerized (Next.js, MongoDB, Orion-LD)
- ✅ Consistent across environments
- ✅ Easy to clean up

**Disadvantages**:

- ⚠️ Less flexible for development
- ⚠️ Requires Docker Desktop (Windows/Mac) or Docker Engine (Linux)

## Prerequisites

### Install Docker

=== "Windows"

    Download and install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)

    ```powershell
    # Verify installation
    docker --version
    docker compose version
    ```

=== "macOS"

    Download and install [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)

    ```bash
    # Verify installation
    docker --version
    docker compose version
    ```

=== "Linux"

    ```bash
    # Install Docker Engine
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh

    # Install Docker Compose
    sudo apt install docker-compose-plugin

    # Add user to docker group
    sudo usermod -aG docker $USER
    newgrp docker

    # Verify
    docker --version
    docker compose version
    ```

### System Requirements

- **RAM**: 4 GB minimum, 8 GB recommended
- **Storage**: 10 GB free space
- **CPU**: 2 cores minimum

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/CTU-SematX/LegoCity.git
cd LegoCity
```

### 2. Configure Environment

```bash
# Copy example environment file
cp dashboard/.env.example dashboard/.env
```

Edit `dashboard/.env`:

```env
# Database (use Docker service name)
DATABASE_URI=mongodb://mongodb:27017/legocity

# Security
PAYLOAD_SECRET=your-secret-key-min-32-chars

# Server (expose to host)
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_token

# NGSI-LD Broker (use Docker service name)
NGSI_LD_BROKER_URL=http://orion:1026
```

### 3. Start All Services

```bash
# Start in detached mode
docker compose up -d

# Or with logs visible
docker compose up
```

This starts:

- **dashboard**: Next.js + PayloadCMS (port 3000)
- **mongodb**: MongoDB 6.x (port 27017)
- **orion**: Orion-LD context broker (port 1026)

### 4. Wait for Services

```bash
# Check status
docker compose ps

# Follow logs
docker compose logs -f dashboard
```

Wait until you see:

```
dashboard | ✓ Ready in 3.5s
dashboard | ○ Local:   http://0.0.0.0:3000
```

### 5. Access Dashboard

Open browser:

- **Dashboard**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **Orion-LD API**: http://localhost:1026/ngsi-ld/v1/entities

## Docker Compose Configuration

### Default `docker-compose.yml`

```yaml
version: "3.8"

services:
  # Next.js Dashboard
  dashboard:
    build:
      context: ./dashboard
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URI=mongodb://mongodb:27017/legocity
      - PAYLOAD_SECRET=${PAYLOAD_SECRET}
      - NEXT_PUBLIC_SERVER_URL=http://localhost:3000
    depends_on:
      - mongodb
    volumes:
      - ./dashboard:/app
      - /app/node_modules
    command: pnpm dev

  # MongoDB Database
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=legocity

  # NGSI-LD Context Broker
  orion:
    image: fiware/orion-ld:latest
    ports:
      - "1026:1026"
    depends_on:
      - mongodb
    command: -dbhost mongodb

volumes:
  mongodb_data:
```

### Custom Configuration

Create `docker-compose.override.yml` for local changes:

```yaml
version: "3.8"

services:
  dashboard:
    environment:
      - NODE_ENV=development
      - DEBUG=payload:*
    ports:
      - "3001:3000" # Use different port
```

## Docker Commands

### Starting & Stopping

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose stop

# Stop and remove containers
docker compose down

# Stop and remove containers + volumes
docker compose down -v
```

### Viewing Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f dashboard

# Last 100 lines
docker compose logs --tail=100 dashboard
```

### Rebuilding

```bash
# Rebuild images
docker compose build

# Rebuild and start
docker compose up -d --build

# Rebuild specific service
docker compose build dashboard
```

### Accessing Containers

```bash
# Execute command in running container
docker compose exec dashboard sh

# Or bash if available
docker compose exec dashboard bash

# Run one-off command
docker compose run dashboard pnpm lint
```

## Development with Docker

### Hot Reload

The default setup mounts your code as a volume, enabling hot reload:

```yaml
volumes:
  - ./dashboard:/app # Your code
  - /app/node_modules # Don't overwrite
```

Edit files locally → changes appear in container → browser auto-refreshes.

### Installing Dependencies

```bash
# Add new package
docker compose exec dashboard pnpm add package-name

# Install dev dependency
docker compose exec dashboard pnpm add -D package-name

# Rebuild after package.json changes
docker compose down
docker compose up -d --build
```

### Running Scripts

```bash
# Lint code
docker compose exec dashboard pnpm lint

# Run tests
docker compose exec dashboard pnpm test

# Generate Payload types
docker compose exec dashboard pnpm payload generate:types

# Seed database
docker compose exec dashboard pnpm seed
```

## Database Management

### Access MongoDB Shell

```bash
# Connect to MongoDB
docker compose exec mongodb mongosh legocity

# List collections
show collections

# Query data
db.pages.find().pretty()
```

### Backup Database

```bash
# Export database
docker compose exec mongodb mongodump --db legocity --out /data/backup

# Copy backup to host
docker compose cp mongodb:/data/backup ./backup
```

### Restore Database

```bash
# Copy backup to container
docker compose cp ./backup mongodb:/data/backup

# Restore
docker compose exec mongodb mongorestore --db legocity /data/backup/legocity
```

### Reset Database

```bash
# Drop all data
docker compose exec mongodb mongosh legocity --eval "db.dropDatabase()"

# Or remove volume
docker compose down -v
docker compose up -d
```

## Troubleshooting

### Services Won't Start

**Check ports are free**:

```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :27017

# Linux/macOS
lsof -i :3000
lsof -i :27017
```

**Kill conflicting processes** or change ports in `docker-compose.yml`.

### Container Keeps Restarting

```bash
# Check logs for errors
docker compose logs dashboard

# Common issues:
# - Missing environment variables
# - MongoDB not ready
# - Port conflicts
```

### Can't Connect to Database

**Verify MongoDB is running**:

```bash
docker compose ps mongodb

# Should show "Up"
```

**Check connection string** in `.env`:

```env
# Use service name, not localhost
DATABASE_URI=mongodb://mongodb:27017/legocity
```

### Build Fails

```bash
# Clear build cache
docker compose build --no-cache

# Remove old images
docker image prune -a

# Check Dockerfile syntax
docker compose config
```

### Slow Performance

**Increase Docker resources**:

- Docker Desktop → Settings → Resources
- Allocate more CPU and RAM

**Use production build**:

```yaml
# docker-compose.override.yml
services:
  dashboard:
    command: pnpm start # Instead of pnpm dev
```

### Permission Issues (Linux)

```bash
# Fix file permissions
sudo chown -R $USER:$USER ./dashboard

# Or run as current user
docker compose run --user "$(id -u):$(id -g)" dashboard pnpm dev
```

## Production Deployment

For production, use optimized configuration:

### `docker-compose.prod.yml`

```yaml
version: "3.8"

services:
  dashboard:
    build:
      context: ./dashboard
      dockerfile: Dockerfile
      args:
        - NODE_ENV=production
    environment:
      - NODE_ENV=production
    command: pnpm start
    restart: unless-stopped

  mongodb:
    restart: unless-stopped
    volumes:
      - mongodb_data:/data/db

  orion:
    restart: unless-stopped

volumes:
  mongodb_data:
    driver: local
```

**Deploy**:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Cleanup

### Remove Everything

```bash
# Stop and remove all containers, networks, volumes
docker compose down -v

# Remove images
docker compose down --rmi all

# Prune Docker system
docker system prune -a --volumes
```

### Keep Data, Remove Containers

```bash
# Stop and remove containers (keep volumes)
docker compose down
```

## Next Steps

- **Configure**: [Configuration Guide](../configuration/index.md)
- **Use**: [User Guide](../user-guide/index.md)
- **Deploy**: [Production Deployment](../deployment/index.md)

## Resources

- 📖 [Docker Documentation](https://docs.docker.com/)
- 📖 [Docker Compose Reference](https://docs.docker.com/compose/)
- 🐛 [Report Issues](https://github.com/CTU-SematX/LegoCity/issues)

---

**Docker setup complete?** Continue to the [Configuration Guide](../configuration/index.md).
