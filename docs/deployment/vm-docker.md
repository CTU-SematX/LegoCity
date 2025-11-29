# Virtual machines and Docker

This page describes how to deploy LegoCity on one or more virtual machines using Docker and Docker Compose.

It focuses on a **ready-to-use pattern** for:

- small to medium deployments,
- demos and pilots,
- teams without a dedicated DevOps platform.

It also covers basic maintenance tasks: updating services, viewing logs and backing up data.

---

## When to use this approach

A VM + Docker deployment is a good fit when:

- you have access to one or a few virtual machines (for example on a university or city server),
- you want to run all components on the same host or a small number of hosts,
- you prefer a simple setup over a fully managed cloud solution.

It may not be ideal when:

- you require high availability across data centres,
- you expect very high traffic or strict SLAs,
- your organisation enforces specific cloud-native platforms (Kubernetes, ECS, etc.).

---

## Components in this setup

In a typical VM + Docker deployment, you run the following components as containers:

- context broker (NGSI-LD broker),
- PayloadCMS,
- database for PayloadCMS (for example PostgreSQL or MongoDB),
- proxy / API layer (backend between UI and broker),
- dashboard (Next.js / Mapbox frontend),
- one or more update servers.

A typical single-VM setup will have:

- one Docker host,
- one reverse proxy (optional but recommended),
- multiple containers for the services above.

---

## High-level architecture on a single VM

On a single VM, the logical architecture is:

- external network:
  - users access:
    - dashboard URL,
    - API (proxy) URL,
    - PayloadCMS admin URL (controlled access).

- internal network (Docker network):
  - context broker,
  - database,
  - PayloadCMS,
  - proxy,
  - update servers.

Network access:

- only the reverse proxy or a limited set of containers expose ports to the host,
- most services communicate on an internal Docker network,
- broker and database are not directly exposed to the internet.

---

## Prerequisites

On the virtual machine:

- a supported Linux distribution (for example Ubuntu LTS),
- Docker Engine installed,
- Docker Compose (v2 or integrated in Docker),
- access to the VM as a user with permission to run Docker (often via SSH),
- domain names or subdomains for:
  - the dashboard (optional but recommended),
  - the API/proxy,
  - PayloadCMS admin.

Optional but recommended:

- a reverse proxy such as Nginx or Traefik to terminate TLS and route incoming HTTP requests to the correct containers.

---

## Directory layout

A simple directory layout on the VM might be:

    /opt/legocity/
      docker-compose.yml
      .env
      reverse-proxy/
        docker-compose.yml (if using separate compose)
        config/...
      data/
        broker/
        db/
      logs/
        ...

Alternative layouts are possible as long as:

- volumes for persistent data (database, broker storage) are clearly separated,
- configuration (.env, compose files) is checked into version control (without secrets).

---

## Environment configuration

All secrets and environment-specific configuration should be taken from a `.env` file or equivalent, not hard-coded in `docker-compose.yml`.

Example `.env` (illustrative, not exhaustive):

    # General
    APP_ENV=production

    # Broker
    BROKER_IMAGE=orion-ld:latest
    BROKER_PORT=1026

    # PayloadCMS
    PAYLOAD_IMAGE=legocity-payload:latest
    PAYLOAD_PORT=3000
    PAYLOAD_DB_URL=postgres://payload_user:payload_pass@db:5432/payload_db

    # Postgres (for PayloadCMS)
    POSTGRES_IMAGE=postgres:16
    POSTGRES_DB=payload_db
    POSTGRES_USER=payload_user
    POSTGRES_PASSWORD=payload_pass

    # Proxy/API
    PROXY_IMAGE=legocity-proxy:latest
    PROXY_PORT=4000

    # Dashboard
    DASHBOARD_IMAGE=legocity-dashboard:latest
    DASHBOARD_PORT=3001

    # Update servers (example)
    UPDATE_ENV_IMAGE=legocity-update-env:latest

    # Broker auth (example)
    BROKER_WRITE_KEY_ENV=change-me-env
    BROKER_WRITE_KEY_WATER=change-me-water
    BROKER_WRITE_KEY_MOBILITY=change-me-mobility

    # External APIs (example)
    WEATHER_API_KEY=change-me-weather

In production, the actual secrets should be:

- set via deployment automation or configuration management,
- stored in a secure location (not committed to a public repository).

---

## Docker Compose structure

A minimal `docker-compose.yml` for a single-VM deployment could include services for:

- broker,
- database,
- PayloadCMS,
- proxy,
- dashboard,
- one sample update server.

Conceptually:

    version: "3.9"

    services:
      broker:
        image: ${BROKER_IMAGE}
        container_name: legocity-broker
        ports:
          - "${BROKER_PORT}:1026"
        environment:
          # broker-specific configuration here
        volumes:
          - ./data/broker:/data
        networks:
          - internal

      db:
        image: ${POSTGRES_IMAGE}
        container_name: legocity-db
        environment:
          POSTGRES_DB: ${POSTGRES_DB}
          POSTGRES_USER: ${POSTGRES_USER}
          POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
        volumes:
          - ./data/db:/var/lib/postgresql/data
        networks:
          - internal

      payload:
        image: ${PAYLOAD_IMAGE}
        container_name: legocity-payload
        environment:
          PAYLOAD_DB_URL: ${PAYLOAD_DB_URL}
          APP_ENV: ${APP_ENV}
          # more PayloadCMS variables as needed
        ports:
          - "${PAYLOAD_PORT}:3000"
        depends_on:
          - db
        networks:
          - internal

      proxy:
        image: ${PROXY_IMAGE}
        container_name: legocity-proxy
        environment:
          BROKER_URL: http://broker:1026/ngsi-ld/v1
          APP_ENV: ${APP_ENV}
          # any API keys or config needed
        ports:
          - "${PROXY_PORT}:4000"
        depends_on:
          - broker
        networks:
          - internal

      dashboard:
        image: ${DASHBOARD_IMAGE}
        container_name: legocity-dashboard
        environment:
          NEXT_PUBLIC_API_BASE_URL: http://proxy:4000
          APP_ENV: ${APP_ENV}
        ports:
          - "${DASHBOARD_PORT}:3001"
        depends_on:
          - proxy
        networks:
          - internal

      update-env:
        image: ${UPDATE_ENV_IMAGE}
        container_name: legocity-update-env
        restart: unless-stopped
        environment:
          BROKER_URL: http://broker:1026/ngsi-ld/v1
          BROKER_WRITE_KEY: ${BROKER_WRITE_KEY_ENV}
          WEATHER_API_KEY: ${WEATHER_API_KEY}
          APP_ENV: ${APP_ENV}
        depends_on:
          - broker
        networks:
          - internal

    networks:
      internal:
        driver: bridge

Notes:

- the example assumes:
  - a simple broker on port 1026,
  - PayloadCMS listening on port 3000 internally,
  - a proxy on port 4000,
  - the dashboard on port 3001.

- in production, you will typically place a reverse proxy in front to:
  - terminate HTTPS,
  - map public routes to these internal ports.

---

## Reverse proxy (optional but recommended)

On the same VM, you can run a reverse proxy such as Nginx or Traefik:

- listens on ports 80/443,
- routes traffic based on hostname or path.

For example:

- `https://city.example/dashboard` → dashboard container (port 3001),
- `https://city.example/api` → proxy container (port 4000),
- `https://admin.city.example` → PayloadCMS (port 3000, restricted access).

The reverse proxy can:

- manage TLS certificates (for example via Let’s Encrypt),
- enforce some access control,
- provide basic logging.

In Docker-based setups, the reverse proxy itself is often another container on the same network.

---

## Step-by-step deployment on a single VM

A typical initial deployment workflow:

1. Prepare the VM

   - provision a VM (for example Ubuntu LTS),
   - install security updates,
   - install Docker and Docker Compose,
   - configure firewall rules to allow HTTP/HTTPS and SSH only.

2. Create the LegoCity directory

   - create a directory, e.g. `/opt/legocity`,
   - place `docker-compose.yml` and `.env` there,
   - create subdirectories for persistent data:
     
         mkdir -p /opt/legocity/data/broker
         mkdir -p /opt/legocity/data/db

3. Configure environment variables

   - edit `.env`:
     - set database credentials,
     - set broker image and ports,
     - set PayloadCMS DB URL,
     - set write keys and any external API keys,
     - set hostnames if needed by the application.

4. Pull images

   - run:
     
         docker compose pull

   - this will download images referenced by `docker-compose.yml`.

5. Start services

   - run:
     
         docker compose up -d

   - wait for containers to start. Check status:
     
         docker compose ps

6. Verify components

   - broker:
     - check container logs,
     - optionally call a health endpoint (if available) from the VM.
   - database:
     - check that the DB container is running.
   - PayloadCMS:
     - access the configured port (or reverse proxy route) from a browser,
     - complete any initial setup (admin user).
   - proxy:
     - call a simple API endpoint to confirm it can reach the broker.
   - dashboard:
     - open the dashboard URL and confirm that it loads,
     - accept that map and data may be empty until update servers are running.
   - update servers:
     - check logs to ensure they are fetching external data and writing entities.

7. Set up the reverse proxy (if not already)

   - configure hostnames and routes,
   - obtain TLS certificates,
   - ensure that only the reverse proxy ports are exposed externally.

---

## Logs and troubleshooting

For a running deployment:

- list containers:

      docker compose ps

- view logs for a specific service:

      docker compose logs -f broker
      docker compose logs -f payload
      docker compose logs -f proxy
      docker compose logs -f dashboard
      docker compose logs -f update-env

Typical troubleshooting steps:

- if the dashboard shows empty maps:
  - check that update servers are running and writing entities,
  - check that the proxy can query the broker.

- if PayloadCMS is unreachable:
  - confirm the container is running,
  - check reverse proxy configuration and port mappings.

- if the broker is unresponsive:
  - check its container logs,
  - check disk usage for its storage volume.

---

## Updating services

To deploy a new version of any component (for example, dashboard or proxy):

1. Build and publish new container images  
   - update the image tag in `.env` or `docker-compose.yml`,
   - or ensure `latest` points to the new version.

2. Pull new images on the VM

       docker compose pull

3. Restart services

       docker compose up -d

4. Verify behaviour

   - check logs for errors,
   - validate the dashboard and APIs in a browser.

For safer updates:

- update non-critical services first (for example, dashboard),
- update critical services (broker, database) with planned maintenance windows,
- keep a record of which version is running in each environment.

---

## Backups and data persistence

At minimum, you should back up:

- PayloadCMS database (PostgreSQL or MongoDB),
- any broker persistence volume (if the broker stores state on disk),
- configuration files (`docker-compose.yml`, `.env`, documentation).

Typical backup strategies:

- for the database:
  - use database-level tools (e.g. `pg_dump` for PostgreSQL),
  - schedule backups via cron jobs or external tools,
  - store backups on separate storage or remote locations.

- for broker data:
  - if using persistent volumes, periodically snapshot or copy the storage directory,
  - depending on the broker configuration, consider exporting entity data via API.

Backups should be:

- tested periodically (restore in a separate environment),
- documented (what is backed up, how often, where it is stored).

---

## Scaling and multi-VM extensions

A single VM is sufficient for small deployments. As needs grow, you can:

- move certain services to separate VMs:
  - run the database on a dedicated host,
  - run broker and update servers on another,
  - keep PayloadCMS and dashboard on a third.

- or use multiple Docker hosts with additional orchestration.

Even in multi-VM scenarios, you can still use Docker Compose if:

- you keep groups of services tightly coupled per host,
- you use DNS or IP addresses between hosts.

For larger-scale or highly available deployments, consider:

- moving to a managed container platform (see the AWS deployment page),
- or using an orchestration system such as Kubernetes.

---

## Summary

- A VM + Docker deployment is the simplest way to run LegoCity in a real environment.
- All core components (broker, PayloadCMS, database, proxy, dashboard, update servers) run as containers on a single host or a small number of hosts.
- Configuration and secrets are handled via environment variables and a `.env` file, not hard-coded in the compose file.
- Maintenance tasks include checking container logs, updating images via `docker compose pull` and `docker compose up -d`, and backing up the database and broker storage.
- This pattern is suitable for pilots, demos and small deployments, and can be extended to multi-VM setups as requirements grow.
