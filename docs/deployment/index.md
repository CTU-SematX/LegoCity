# Deployment overview

This page describes how to deploy and operate a LegoCity installation.

It focuses on:

- the main components that need to be deployed,
- common deployment patterns (single VM, cloud platforms, platform-as-a-service),
- operational tasks such as updates, monitoring and backups.

Separate pages provide concrete guidance for specific platforms:

- AWS
- Cloudflare-based setups
- virtual machines and Docker
- Coolify

---

## Components to deploy

A LegoCity deployment typically includes the following components:

- **Context broker**  
  NGSI-LD broker that stores entities (FIWARE Orion-LD or equivalent).

- **Update servers**  
  One or more services that fetch external data, transform it and write entities to the broker.

- **Proxy / API layer**  
  A small backend service that:
  - reads from the broker,
  - exposes simplified, UI-friendly endpoints,
  - applies access control, caching and rate limits.

- **Dashboard (frontend)**  
  The Next.js + Mapbox UI built from the LegoCity codebase.

- **PayloadCMS**  
  The admin interface for configuring map views, layers, blocks and content.

- **Supporting services** (optional, depending on the deployment):
  - database for PayloadCMS,
  - logging / monitoring stack,
  - reverse proxies or load balancers.

The deployment architecture decides:

- where each component runs,
- how components communicate,
- how configuration and secrets are managed.

---

## Deployment modes

There are several ways to deploy LegoCity. The most common modes are:

- **Single virtual machine using Docker or process managers**  
  Simple to set up, suitable for development and small pilots.

- **Cloud provider (e.g. AWS)**  
  Components are split across managed services (containers, databases, storage).

- **Static hosting + serverless APIs (Cloudflare, etc.)**  
  Frontend hosted on an edge platform, APIs and proxy as serverless functions.

- **Application platforms (Coolify, etc.)**  
  A platform that manages containers, routing and TLS for you.

Each mode has different trade-offs in terms of:

- ease of setup,
- cost,
- scalability,
- operational complexity.

The following sections describe a generic approach that can be adapted to each platform.

---

## Environments

LegoCity deployments should use at least two environments:

- **Development / staging**  
  Used for:
  - testing new views, layers and blocks,
  - experimenting with update servers,
  - validating entity models.

- **Production**  
  Used for:
  - live dashboards,
  - public or internal users,
  - stable data feeds.

Each environment should have:

- its own context broker (or clearly separated broker namespaces),
- its own PayloadCMS instance,
- its own configuration (API keys, database URLs, etc.),
- a clear process for promoting changes from development to production.

---

## Configuration and secrets

Regardless of the deployment platform, configuration should be externalised.

Typical configuration items:

- broker URLs and credentials,
- PayloadCMS database URL and credentials,
- proxy configuration (allowed origins, rate limits),
- external API endpoints and keys (for update servers),
- environment identifiers (e.g. `NODE_ENV`, `APP_ENV`).

Best practices:

- store configuration in environment variables or configuration files that are not committed to version control,
- store secrets (tokens, passwords) in a secret manager or encrypted store,
- avoid hard-coding any credentials in the codebase.

In production:

- changes to configuration should be applied through a controlled process,
- all configuration changes should be traceable (who changed what and when).

---

## Network and security basics

At a high level, the network structure should ensure that:

- the context broker is not directly exposed to the public internet,
- update servers and proxy have access to the broker,
- the dashboard is reachable by the intended users,
- PayloadCMS admin is restricted to authorised users and networks.

Typical patterns:

- place broker, update servers, PayloadCMS and proxy in a private network or VPC,
- expose only:
  - the dashboard URL,
  - the proxy API URL,
  - the PayloadCMS admin URL (optionally restricted by IP or VPN),
- terminate TLS at a reverse proxy, load balancer or platform gateway.

Each platform-specific page will describe how to achieve this using its tools (for example, AWS security groups and load balancers, Cloudflare routing rules, Coolify domains and TLS).

---

## Single-VM / Docker-based deployment (conceptual)

The simplest deployment pattern is:

- one virtual machine,
- all services run as Docker containers,
- a reverse proxy like Nginx or Traefik routes requests.

The typical containers are:

- `broker` – context broker,
- `payload` – PayloadCMS and its database,
- `proxy` – API layer between UI and broker,
- `dashboard` – Next.js frontend (either server-rendered or static build served by a web server),
- `update-*` – one or more update servers.

Advantages:

- minimal infrastructure,
- easy to reason about and debug,
- suitable for demos, workshops and pilots.

Limitations:

- scaling is limited to the capacity of the single machine,
- no automatic high availability,
- maintenance windows may affect all components.

Details for setting up this pattern are provided in the “Virtual machines & Docker” documentation.

---

## Cloud deployments (AWS, etc.)

When deploying to a cloud provider such as AWS, the common approach is to:

- run services in containers (for example, ECS or Kubernetes),
- use managed databases for PayloadCMS and other persistence,
- use load balancers and DNS for traffic routing.

Typical AWS architecture:

- ECS or EKS services for:
  - broker,
  - proxy,
  - update servers,
  - PayloadCMS and dashboard (if not fully static),
- RDS or a managed database service for PayloadCMS data,
- Application Load Balancer for HTTP routing,
- Route 53 for DNS,
- CloudWatch for logs and metrics.

Benefits:

- easier horizontal scaling,
- managed databases and storage,
- integration with AWS identity and security features.

Costs:

- higher operational complexity,
- more moving parts to monitor and configure.

The AWS-specific page will outline recommended mappings from LegoCity components to AWS services and provide step-by-step guidance for a minimal deployment.

---

## Edge and serverless deployments (Cloudflare, etc.)

In some scenarios, it is useful to:

- host the dashboard as static assets on an edge platform,
- run the proxy and some APIs as serverless functions,
- keep the broker and PayloadCMS in a more traditional environment.

For example, using Cloudflare:

- static dashboard built and deployed to Cloudflare Pages,
- proxy implemented as Cloudflare Workers calling the broker,
- PayloadCMS and broker run elsewhere (for example, a VM or another cloud provider),
- DNS and TLS handled by Cloudflare.

Benefits:

- fast global delivery of the dashboard,
- simplified scaling and management for frontend and proxy,
- good fit for public-facing portals.

Considerations:

- broker and PayloadCMS still need reliable hosting elsewhere,
- connectivity between Cloudflare Workers and the broker must be secure and monitored.

The Cloudflare-specific page will describe the division of responsibilities and the basic deployment flow.

---

## Application platforms (Coolify and similar)

Platforms such as Coolify aim to:

- run containerised applications on a server or cluster,
- manage deploys, domains and TLS certificates,
- provide a UI to configure and maintain services.

In this model:

- each LegoCity component is a service in the platform,
- platform configuration defines:
  - container image or build method,
  - environment variables,
  - exposed ports and domains.

Typical setup:

- one Coolify instance running on a VM or server,
- services for:
  - broker,
  - PayloadCMS,
  - proxy,
  - dashboard,
  - update servers.

This approach:

- reduces the amount of low-level infrastructure work,
- still allows per-service control and logs,
- is well suited for teams without a dedicated DevOps function.

The Coolify-specific page will describe concrete service definitions and deployment steps.

---

## Maintenance and operations

Deployment is only one part of the lifecycle. A LegoCity installation must also be maintained.

Key operational activities:

- **Monitoring and alerting**
  - monitor:
    - broker availability,
    - update server success/failure rates,
    - PayloadCMS and proxy health,
    - resource usage (CPU, memory, disk).
  - define alerts for:
    - broker down,
    - repeated update failures,
    - unexpected increase or drop in entity counts.

- **Backups**
  - databases used by PayloadCMS must be backed up regularly,
  - if the broker persists entities, its storage should be backed up or replicated,
  - configuration and documentation should be version-controlled.

- **Updates**
  - establish a process for:
    - building and testing new versions of the dashboard, proxy, update servers and PayloadCMS,
    - deploying updates to development first,
    - rolling out to production with minimal disruption.
  - maintain a changelog for major changes in:
    - entity models,
    - APIs,
    - configuration structure.

- **Security**
  - rotate API keys and tokens periodically,
  - apply security updates to underlying platforms (VMs, container runtimes, OS images),
  - review access to PayloadCMS and admin endpoints.

Each platform-specific page should tie these tasks to platform tools (for example, CloudWatch alarms on AWS, Coolify health checks, Cloudflare analytics).

---

## Choosing a deployment strategy

When selecting a deployment strategy, teams should consider:

- expected load and number of users,
- number of domains and update servers in scope,
- available operational expertise,
- constraints from the host organisation (preferred cloud, existing tools).

Rough guidelines:

- **Single VM + Docker**  
  Good for:
  - initial prototypes,
  - internal demos,
  - small deployments managed by a single team.

- **Cloud provider (AWS)**  
  Suitable when:
  - high availability or scaling is required,
  - there is an existing cloud infrastructure,
  - integration with other cloud services is needed.

- **Cloudflare-based setup**  
  Useful when:
  - the dashboard is public and benefits from edge delivery,
  - the proxy can be implemented as lightweight functions,
  - existing backends (broker, PayloadCMS) are hosted elsewhere.

- **Coolify or similar platform**  
  Appropriate when:
  - the team prefers UI-driven deployment and management,
  - the deployment is small to medium sized,
  - the focus is on quickly getting a working platform rather than managing raw infrastructure.

---

## Relationship to other documentation

This deployment overview is intentionally high-level. It is complemented by:

- **AWS deployment** – mapping LegoCity components to AWS services and ready-to-use patterns,
- **Cloudflare deployment** – static frontend + serverless proxy design,
- **Virtual machines & Docker** – single-VM and multi-VM deployments using containers,
- **Coolify deployment** – defining LegoCity services inside Coolify and managing them over time.

These pages provide more concrete, platform-specific guidance and should be consulted when implementing a specific deployment.

---

## Summary

- A LegoCity deployment consists of a context broker, update servers, a proxy, a dashboard, PayloadCMS and supporting services.
- There are multiple deployment modes: single VM, cloud provider, edge/serverless combinations and application platforms.
- Each environment (development, production) needs clearly separated brokers, configurations and credentials.
- Security, configuration management, monitoring, backups and update processes are core parts of the deployment design, not afterthoughts.
- Platform-specific pages refine this overview into ready-to-use steps for AWS, Cloudflare, virtual machines and Coolify.
