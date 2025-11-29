# Coolify deployment

This page describes how to deploy LegoCity using **Coolify** or a similar self-hosted application platform.

It focuses on:

- mapping LegoCity components to Coolify “services”,
- a ready-to-use pattern for a single server or small cluster,
- how to configure environment variables, domains and TLS,
- basic maintenance (updates, backups, monitoring) in this setup.

Coolify acts as a control plane for containers, making it easier to deploy without managing raw Docker commands and reverse proxies manually.

---

## When to use Coolify

A Coolify-based deployment is a good fit when:

- you have one or a small number of servers,
- you want a **UI-driven** way to deploy Dockerised applications,
- you want automatic domain, routing and TLS handling,
- you do not want to manage Kubernetes or complex AWS services.

It may be less suitable when:

- you need large-scale, multi-region high availability,
- the organisation mandates a specific cloud platform and tooling.

---

## Components as Coolify services

In Coolify, each LegoCity component becomes one or more services:

- **Context broker service**

  - runs the NGSI-LD broker container.

- **PayloadCMS service**

  - runs PayloadCMS (Node.js) container.

- **Database service for PayloadCMS**

  - PostgreSQL or MongoDB container.

- **Proxy / API service**

  - backend between UI and broker.

- **Dashboard service**

  - Next.js frontend (can be SSR or static build).

- **Update server services**
  - one service per update server (long-running worker).

Optionally, you can:

- add a separate reverse proxy or let Coolify manage routing directly,
- add other supporting services (metrics, monitoring, etc.) if needed.

---

## Pre-requisites

To use this pattern, you need:

- a server (or VM) on which Coolify is installed,
- a domain name with DNS control (for example `city.example`),
- ability to point DNS records to the Coolify server.

On the LegoCity side:

- container images for broker, PayloadCMS, proxy, dashboard and update servers,
- repository URLs (Git) if you let Coolify build images from source.

---

## High-level architecture on Coolify

Logically, the deployment looks like:

- **Coolify host**

  - runs all LegoCity services as containers,
  - manages:
    - container lifecycle,
    - routing and domains,
    - TLS certificates.

- **LegoCity services**
  - database service (PayloadCMS DB),
  - context broker service,
  - PayloadCMS service,
  - proxy service,
  - dashboard service,
  - update servers.

Network layout:

- Coolify manages internal networks between containers,
- external traffic comes through:
  - Coolify’s reverse proxy and domain configuration.

The broker and database are not directly exposed, unless explicitly configured.

---

## Planning services and domains

Before creating services, decide:

- which domains or subdomains you want:

  - e.g. `city.example` → dashboard,
  - `api.city.example` → proxy,
  - `admin.city.example` → PayloadCMS.

- where each service should be reachable:
  - some only internal (broker, DB, update servers),
  - some external (dashboard, proxy, PayloadCMS admin).

Typical mapping:

- **Dashboard** → `city.example`
- **Proxy** → `api.city.example`
- **PayloadCMS admin** → `admin.city.example`
- **Broker** → no public domain (internal only)
- **Update servers** → no public domain (internal only)

Coolify allows you to assign domains per service and will request TLS certificates automatically.

---

## Defining services in Coolify

### 1. Database service (PayloadCMS DB)

- Add a new **Database** service in Coolify:

  - choose PostgreSQL or MongoDB, according to your PayloadCMS configuration.

- Configuration:

  - database name: `payload_db` (example),
  - user: `payload_user`,
  - password: secure random password.

- Make note of:
  - internal host,
  - port,
  - database name,
  - user and password.

Coolify usually provides a connection string you can use directly in environment variables.

### 2. Context broker service

- Add a new **Application** (container) service:

  - choose “Docker image” as source,
  - specify the broker image (e.g. `orion-ld` or your custom image).

- Configuration:

  - internal port: whatever the broker uses (e.g. `1026`),
  - no public domain if you want it internal only,
  - internal networking enabled so other services can reach it.

- Environment variables:
  - any broker configuration required (depending on broker implementation).

Coolify will manage the container; other LegoCity services will use the broker’s internal hostname and port.

### 3. PayloadCMS service

- Add another **Application** service:

  - source: Git repo or Docker image for PayloadCMS.

- If using Git:

  - configure build:
    - Node.js version,
    - build command (`npm run build` or similar),
    - start command (`npm run start`),
    - or use a Dockerfile.

- Attach a domain:

  - e.g. `admin.city.example` for the PayloadCMS admin UI.

- Environment variables:
  - `PAYLOAD_DB_URL` or equivalent:
    - use the connection string provided by the database service,
  - `PAYLOAD_SECRET`, `NODE_ENV`, etc.,
  - any other variables required by your PayloadCMS configuration (e.g. auth, storage).

Ensure:

- service is in the same internal network as the DB service,
- DB service is not exposed externally.

### 4. Proxy / API service

- Add an **Application** service for the proxy backend:

  - source: Git repo or Docker image holding the proxy.

- Attach a domain:

  - e.g. `api.city.example`.

- Environment variables:
  - `BROKER_URL` set to the internal URL of the broker service,
  - other config (e.g. allowed origins, API keys),
  - `NODE_ENV` / `APP_ENV`.

The proxy is the only component that needs network access to the broker (besides update servers).

### 5. Dashboard service

There are two main ways to host the dashboard:

#### Option A – Next.js SSR (Application service)

- Add an **Application** service:

  - source: dashboard repo or image,
  - build and start commands as usual for Next.js.

- Attach domain:

  - e.g. `city.example`.

- Environment variables:
  - `NEXT_PUBLIC_API_BASE_URL=https://api.city.example`,
  - `NEXT_PUBLIC_MAPBOX_TOKEN` and any other public config.

This option runs Next.js as a Node.js process behind Coolify’s reverse proxy.

#### Option B – Static build (Application + static mode)

- Build dashboard into static files (e.g. `next export`).
- Configure the service in Coolify to serve static files only.
- Simplifies runtime but restricts SSR functionality.

The exact configuration depends on how your dashboard is built; the key is:

- `NEXT_PUBLIC_API_BASE_URL` must point to the proxy,
- static assets must be served on your chosen domain.

### 6. Update server services

- For each update server, add an **Application** service:

  - source: Git repo or Docker image,
  - type: background worker / long-running process.

- Environment variables:

  - `BROKER_URL` → internal broker URL,
  - `BROKER_WRITE_KEY` → write key for the relevant domain,
  - external API keys (e.g. `WEATHER_API_KEY`),
  - any schedule configuration (if workers handle their own timing).

- Networking:
  - same internal network as broker,
  - no public domains (no need for HTTP ingress).

You can run different update servers for environment, flooding, mobility, etc.

---

## Environment separation

To keep dev and prod separate, you can:

- run **two Coolify instances** on different servers, or
- run:
  - dev services and prod services on the same Coolify but:
    - with different domains (e.g. `dev.city.example` vs `city.example`),
    - with separate DB instances,
    - with different broker instances.

Recommended for clarity:

- one Coolify instance per environment, or
- at least clear naming and isolation of services and databases.

---

## Configuration and secrets in Coolify

Coolify allows you to:

- define environment variables per service,
- mark some as secrets,
- override values per deployment.

Best practices:

- do not put secrets in the repository,
- define DB passwords, broker write keys, external API keys as secrets in Coolify,
- keep non-secret configuration (like map style names) as plain variables.

For each service, document:

- which variables must be set,
- where values come from (DB service, broker, external provider).

---

## Deployment workflow in Coolify

A typical workflow for deploying a change:

1. Push new code to the Git repository.
2. In Coolify:
   - either:
     - configure automatic deployment on push, or
     - trigger deployment manually.
3. Coolify:
   - pulls the latest code,
   - builds the application image or bundle,
   - restarts the service with new version.

For image-based services:

- update image tag in Coolify service configuration,
- trigger redeploy.

Order of changes:

- backend/proxy updates first,
- then dashboard,
- occasionally PayloadCMS or broker if data contracts change.

---

## Monitoring and logs

Coolify provides basic management and access to logs:

- you can view logs per service from the UI,
- you can see container status (running, failed, restarting).

Recommended:

- periodically check logs for:
  - update servers (data ingestion),
  - proxy (API errors),
  - PayloadCMS (DB issues),
  - broker (resource or context errors).

If needed, you can:

- export logs to an external system (ELK, Loki, etc.),
- add health endpoints to services and use Coolify health checks.

---

## Backups and maintenance

Stateful components on a Coolify server:

- PayloadCMS database:

  - critical to back up regularly,
  - use DB-native tooling or a backup add-on if Coolify supports it.

- Broker storage (if using persistent volume):

  - remember where it is stored on the host,
  - snapshot or backup this directory.

- Coolify configuration:
  - backup Coolify configuration and metadata,
  - keep a copy of deployment definitions and environment variables in a safe place (text export or IaC).

Maintenance tasks:

- apply OS updates on the host (kernel, security),
- update Docker engine if relevant,
- update Coolify itself (following their upgrade guide),
- rotate credentials (DB passwords, broker keys, external API keys).

Test:

- restoration of DB backups in a staging environment,
- service restart after host reboot.

---

## Scaling and limitations

Coolify simplifies deployment but does not remove all infrastructure limits.

Scaling strategies:

- increase CPU/memory assigned to specific services,
- move DB to a separate, more powerful server,
- split heavy services (e.g. broker and PayloadCMS) across multiple hosts managed by the same Coolify instance (if supported).

Limitations:

- horizontal scaling across multiple data centres is not automatic,
- you still depend on the health and capacity of the underlying host(s).

For larger deployments, you may later migrate:

- broker and DB to dedicated infrastructure (AWS/RDS, etc.),
- keep Coolify mainly for frontend and smaller services.

---

## Summary

- Coolify provides a UI-driven way to deploy LegoCity components as Docker containers on a single server or small set of servers.
- Each major component (broker, PayloadCMS, DB, proxy, dashboard, update servers) is defined as a separate service with its own environment variables and, where needed, domain.
- Domains such as `city.example`, `api.city.example` and `admin.city.example` are mapped through Coolify’s reverse proxy, which also manages TLS certificates.
- Configuration and secrets are handled via service-level environment variables; stateful services like the DB and broker use persistent volumes and require regular backups.
- This pattern is suitable for teams who want to avoid managing low-level Docker/NGINX but do not need the complexity of full cloud platforms or Kubernetes.
