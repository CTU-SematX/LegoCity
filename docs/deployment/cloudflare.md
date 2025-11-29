# Cloudflare deployment

This page describes how to use **Cloudflare** as part of a LegoCity deployment.

It focuses on:

- hosting the **dashboard** on Cloudflare Pages,
- running a **proxy layer** on Cloudflare Workers,
- connecting to a broker and PayloadCMS that run elsewhere (for example on a VM or AWS),
- basic deployment and maintenance steps.

This is useful when you want:

- fast, global delivery of the frontend,
- simple, serverless proxy logic close to users,
- but you still host the core backend (broker, PayloadCMS, DB) on your own infrastructure.

---

## When to use Cloudflare

Cloudflare integration is a good fit when:

- the dashboard is public-facing,
- you want low-latency map interaction for users in many locations,
- you prefer a managed, serverless runtime for simple API/proxy logic.

It is less suitable when:

- you want to keep all traffic inside a closed network with no external edge provider,
- you need complex backend logic that does not fit well into Workers (CPU or memory heavy).

---

## High-level architecture

In a Cloudflare-powered deployment, the architecture can be split as:

- **Edge (Cloudflare):**
  - Cloudflare Pages serves the dashboard static assets,
  - Cloudflare Workers provide a thin proxy/API layer.

- **Backend (your infrastructure – VM / AWS / other):**
  - context broker,
  - PayloadCMS,
  - database for PayloadCMS,
  - any legacy backend services.

- **Update servers:**
  - usually run in the backend environment (VM, AWS ECS, etc.),
  - write to the broker directly.

Traffic flow:

1. User’s browser requests `https://city.example` → Cloudflare Pages (static dashboard).
2. Dashboard calls `/api/...` → Cloudflare Worker.
3. Cloudflare Worker:
   - authenticates/validates the request if needed,
   - calls the internal backend API or broker proxy endpoint (over HTTPS),
   - returns a simplified response to the browser.

The broker and PayloadCMS are **not** exposed directly; only the Worker and Pages endpoints are visible.

---

## Required components on Cloudflare

You will typically create:

- one **Cloudflare Pages project**:
  - builds the Next.js dashboard into static assets,
  - serves them at your domain (or subdomain).

- one or more **Cloudflare Workers**:
  - handle `/api/*` requests from the dashboard,
  - forward requests to your backend,
  - handle responses and errors.

Optionally:

- route `/admin` or a separate host (e.g. `admin.city.example`) directly to your backend (PayloadCMS) instead of going through Workers.

---

## Dashboard on Cloudflare Pages

### Project setup

1. Prepare the dashboard repo (Next.js):
   - ensure you have a build script, e.g. `npm run build`,
   - ensure you have an export or static build step if needed (for Pages static mode).

2. Create a Cloudflare Pages project:
   - connect it to the dashboard repository (GitHub, GitLab, etc.),
   - configure:
     - build command: `npm run build` (or your specific command),
     - output directory:
       - if using `next export`: `out`,
       - if using the official Next.js Pages integration: follow Cloudflare docs.

3. Configure environment variables for the build:
   - `NEXT_PUBLIC_API_BASE_URL`:
     - set to your Worker’s base path, e.g. `https://city.example/api`,
   - any map token or public configuration:
     - `NEXT_PUBLIC_MAPBOX_TOKEN`,
     - etc.

4. Trigger a build:
   - on push to main / specific branch,
   - verify that Pages successfully builds and deploys the dashboard.

### DNS and domain

- In Cloudflare DNS:
  - configure `city.example` or `dashboard.city.example` as a CNAME pointing to the Pages project,
  - ensure HTTPS is enabled (Cloudflare handles TLS certificates).

- Access the site:
  - confirm the dashboard loads,
  - expect that data/API calls may fail until Workers and backend are ready.

---

## API proxy using Workers

The dashboard should never talk directly to the broker. Instead, it calls:

- `https://city.example/api/...` → Cloudflare Worker.

### Worker responsibilities

The Worker should:

- accept incoming `/api/...` requests from the dashboard,
- validate or authenticate the request if needed (for example, check a header or cookie),
- forward the request to the backend proxy/broker API (in your infrastructure),
- handle errors (e.g. timeouts, 5xx from backend),
- return a simplified JSON response to the frontend.

Example flow:

1. Browser: `GET https://city.example/api/flood-zones?bbox=...`
2. Worker:
   - send a request to `"https://backend.internal/api/flood-zones?bbox=..."`,
   - include any necessary auth for the backend,
   - check the response status,
   - return JSON to the browser.

### Backend API endpoint

In your backend environment (VM, AWS, etc.), expose a proxy or API endpoint:

- base URL, e.g. `https://backend.city.example` (behind your own load balancer or reverse proxy),
- endpoints:
  - `/api/flood-zones`,
  - `/api/weather`,
  - `/api/parking`, etc.

These endpoints call the broker, process entities, and return UI-friendly data.

The Worker will only talk to `https://backend.city.example`, not directly to the broker.

### Worker configuration

For each Worker, configure environment variables (Worker bindings or plain strings):

- `BACKEND_API_BASE_URL`:
  - e.g. `https://backend.city.example/api`,
- any API keys or tokens required to call your backend (if applicable).

Worker code (conceptually) uses these values to construct requests to the backend.

---

## Network and security considerations

### Exposing the backend

Your backend endpoint (`backend.city.example`) must be reachable from the Cloudflare Worker:

- it needs a public DNS name and HTTPS endpoint,
- access should be restricted as much as possible:
  - allow only Cloudflare IP ranges (via firewall rules), or
  - enforce additional authentication (API keys, tokens).

The broker and PayloadCMS:

- should remain on internal networks,
- should be behind a reverse proxy in the backend environment,
- should not be directly reachable from the internet.

The Worker only talks to your backend proxy, which then talks to the broker.

### Authentication

Options for securing Worker → backend traffic:

- **Static backend token**:
  - Worker includes a header like `X-Backend-Token: <value>`,
  - backend checks the token before handling the request.

- **Mutual TLS or IP-based allowlisting**:
  - if your backend supports it and you want stronger controls.

Regardless of the method:

- broker write keys remain in the backend,
- only read access or aggregated views are exposed through the backend API to the Worker.

---

## Configuration management

You will have configuration in two places:

- **Cloudflare**:
  - Pages project env vars:
    - `NEXT_PUBLIC_API_BASE_URL`,
    - `NEXT_PUBLIC_MAPBOX_TOKEN`, etc.
  - Worker env vars:
    - `BACKEND_API_BASE_URL`,
    - `BACKEND_API_KEY` if used.

- **Backend environment** (VM/AWS):
  - broker URL, write keys, etc. (as described in other deployment docs),
  - PayloadCMS DB URL,
  - external API keys for update servers.

Guidelines:

- keep secrets (API keys, tokens) out of the dashboard build and `.env` files committed to git,
- only expose public config (Mapbox public token, base URL) to the dashboard,
- keep Worker secrets and backend secrets in secure stores or environment configuration.

---

## Deployment workflow

A typical workflow with Cloudflare in place:

1. **Update backend logic** (broker proxy, PayloadCMS, update servers):
   - push code to your backend repo,
   - deploy to your VM or AWS setup,
   - verify backend API endpoints.

2. **Update Worker** (if API shape changes or new endpoints are needed):
   - update Worker code to handle new paths,
   - deploy Worker via Cloudflare,
   - test calls from the browser or using `curl` to `/api/...`.

3. **Update dashboard**:
   - update UI components in the dashboard repo,
   - ensure the code calls the correct `/api/...` paths,
   - push changes to the branch connected to Cloudflare Pages,
   - let Pages rebuild and deploy,
   - verify the UI and data flow.

This keeps the frontend deployment (Pages) decoupled from backend deployment.

---

## Monitoring and debugging

Monitoring components:

- **Cloudflare Pages**:
  - build logs,
  - deployment history.

- **Workers**:
  - logs and metrics via Cloudflare dashboard,
  - see errors for `/api` requests.

- **Backend**:
  - logs and metrics from your backend platform (VM logs, AWS CloudWatch, etc.).

Typical debugging flow for a failing map/API call:

1. Check the browser network tab:
   - see which `/api/...` call fails,
   - note the status code and response.

2. Check Worker logs:
   - see if the Worker received the request,
   - see if the request to backend failed (timeout, DNS, 5xx).

3. Check backend logs:
   - inspect the backend proxy or broker service that handles the request,
   - check connectivity to the broker.

4. Fix in the appropriate layer:
   - Worker (incorrect URL or header),
   - backend (missing route, logic error, broker connectivity),
   - dashboard (wrong request parameters).

---

## Integration with other deployments

Cloudflare deployment works together with other patterns:

- you can host the **backend** on:
  - a VM + Docker (as in the VM/Docker doc),
  - AWS ECS/RDS (as in the AWS doc),
  - Coolify, etc.

Cloudflare then becomes:

- the public face for the dashboard,
- and optionally the public face for API requests (via Workers).

This separation allows:

- changing backend platform (e.g. from VM to AWS) with minimal changes in the dashboard,  
- keeping brokers and PayloadCMS behind controlled endpoints.

---

## Summary

- Cloudflare is used to host the LegoCity dashboard (via Pages) and a thin API proxy layer (via Workers).
- The broker, PayloadCMS and update servers remain in your backend infrastructure (VM / AWS / other).
- The dashboard calls `/api/...` on your domain; Workers forward these to your backend API, which in turn talks to the broker.
- Security is handled by:
  - keeping broker and DB off the public internet,
  - restricting backend endpoints and protecting them with tokens or firewall rules,
  - exposing only Workers + Pages publicly.
- Deployment is split into three steps: backend deployment, Worker deployment, and dashboard deployment.
- Monitoring uses Cloudflare logs for edge components and your usual tooling for backend components.
