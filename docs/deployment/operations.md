# Operations and maintenance

This page describes how to **run LegoCity in the long term**:

- what to monitor,
- what to back up,
- how to update components safely,
- how to handle incidents and security.

It is platform-agnostic: the same ideas apply whether you deploy on a VM, AWS, Coolify or another platform. Platform-specific pages show _how_ to implement these ideas with concrete tools.

---

## Operational responsibilities

A LegoCity deployment is more than just the first `deploy`:

- **Availability**  
  The dashboard, PayloadCMS and API endpoints should be reachable and responsive.

- **Data freshness**  
  Update servers must continue to ingest data and update entities.

- **Consistency**  
  Entity models and APIs must stay in sync across services and documentation.

- **Security**  
  Broker write access, admin UI and secrets must be protected and rotated.

- **Recoverability**  
  It must be possible to restore the system after data loss or misconfiguration.

This page assumes that:

- deployment is already running,
- you have at least one environment (dev) and ideally a separate prod.

---

## What to monitor

Monitoring should cover both **infrastructure** and **application-level** health.

### Core components

At minimum, track the following:

- **Context broker**

  - process/container health,
  - response time and error rate on key endpoints,
  - storage usage and any internal metrics (if available).

- **Update servers**

  - last successful run time,
  - number of entities created/updated per run,
  - error rates when calling external APIs or the broker.

- **PayloadCMS**

  - HTTP error rates (4xx/5xx),
  - response time for admin UI,
  - database connection errors.

- **Proxy / API**

  - response time and error rate for `/api/...` endpoints,
  - timeouts to the broker,
  - volume of requests per endpoint.

- **Dashboard**
  - basic availability (can it be loaded at all),
  - critical UI errors (if you collect frontend error reports).

### Signals and thresholds

Examples of useful alerts:

- broker down or returning 5xx on health endpoints,
- update servers failing consecutively for a period (e.g. 10–15 minutes),
- payload admin returning frequent 500 errors,
- sudden drop in entity counts (may indicate bad updates),
- unbounded growth in entity counts (may indicate duplication).

The exact thresholds depend on:

- data update frequency,
- expected traffic,
- tolerance for delay in dashboards.

---

## Logs and observability

Logs are the first source of truth when something goes wrong.

### What to log

Each component should log at least:

- **startup**:

  - configuration summary (sanitised, no secrets),
  - version or commit hash.

- **normal operations**:

  - update servers:
    - number of entities processed per cycle,
    - key external API calls,
    - partial failures (time-limited, but informative).
  - proxy:
    - upstream errors when calling broker,
    - validation errors on incoming requests.

- **errors**:
  - network timeouts,
  - broker write failures,
  - database errors (PayloadCMS).

Logs should be structured enough that:

- you can filter by component, severity and time,
- you can correlate events between update servers and broker/proxy.

### Where to store logs

Depends on deployment:

- VM / Docker:

  - Docker logs (via `docker logs`),
  - log files on disk,
  - optionally shipped to a central system.

- AWS:

  - CloudWatch Logs per ECS service,
  - CloudWatch metrics and alarms.

- Coolify:
  - logs per service via Coolify UI,
  - optional integration with external log systems.

Whatever the platform, operators should:

- know how to view logs for each component,
- have a short list of log locations and commands.

---

## Backups

Backups are essential for **PayloadCMS data** and any **stateful broker storage**.

### What to back up

Minimum:

- **PayloadCMS database**

  - all collections (layers, blocks, UI configs, content),
  - user accounts and permissions.

- **Broker data** (if it is persisted on disk and not fully reconstructible):
  - entity store or database used by the broker,
  - configuration files (if not already version-controlled).

Important but often overlooked:

- **Configuration**:
  - `.env`-like configuration files (without secrets) under version control,
  - infrastructure-as-code or deployment definitions,
  - SSM/Secrets Manager parameter names and structure (values are secret, but keys/paths are needed).

### How often to back up

Baseline recommendations:

- production database:

  - automatic daily backups,
  - manual snapshot before major releases or schema changes.

- development database:

  - periodic backups if needed, but lower strictness.

- broker data:
  - backup frequency depends on whether entities can be rebuilt from sources:
    - if external sources can recreate state → less frequent or optional,
    - if broker holds unique or manually curated data → back up in line with DB.

### Testing restores

Backups are only useful if they can be restored.

- periodically restore PayloadCMS DB into a test environment:

  - verify that:
    - admin can log in,
    - pages and map configurations load correctly,
    - no corruption or missing tables/collections.

- if broker data is backed up:
  - restore into a test broker instance,
  - run basic queries to ensure entities appear as expected.

Document:

- exact procedures to restore:
  - from which backup source,
  - into which environment,
  - who is responsible.

---

## Updating components

LegoCity consists of multiple components that may evolve at different speeds.

### General principles

When updating:

- change **one layer at a time** where possible,
- keep dev and prod environments separate,
- ensure backward compatibility for data contracts whenever feasible.

Typical update order:

1. **Update servers and proxy** (backwards compatible changes).
2. **Dashboard** (UI changes that consume existing APIs).
3. **PayloadCMS** (if schema or admin UI changes are required).
4. **Broker and core data models** (only when necessary, with planning).

### Update process

A safe path for a new release:

1. **Dev environment**

   - deploy new images to dev,
   - apply migrations (if any) to dev DB/broker,
   - run smoke tests:
     - can update servers start and update entities,
     - can the proxy and dashboard read entities correctly.

2. **Staging (if available)**

   - repeat with more realistic data and users.

3. **Production**

   - choose a maintenance window if updates are disruptive,
   - back up PayloadCMS DB and broker state beforehand,
   - deploy new versions:
     - update containers (image tags),
     - apply migrations,
     - monitor logs and dashboards closely.

4. **Post-deployment checks**

   - validate:
     - admin login,
     - key dashboards,
     - data freshness (update servers running normally),
   - confirm metrics and error rates remain within expected ranges.

---

## Schema and data contract changes

Changes to entity models or APIs are high-risk.

### Planning schema changes

For any change to entity structure (new attributes, renamed fields, removed attributes):

- update the **entity documentation** first:

  - type name,
  - attributes,
  - ID patterns,
  - relationships.

- identify all consumers:

  - proxy endpoints,
  - dashboard views and blocks,
  - any external integrations.

- decide migration strategy:
  - temporary dual-structure support (old and new attributes),
  - one-step break (only in controlled scenarios).

### Applying schema changes

Suggested pattern:

- add new attributes first, while keeping old ones:

  - update update servers to write both,
  - update proxy and dashboard to use the new attributes,
  - monitor for any regressions.

- remove or deprecate old attributes last:
  - only after confirming the new structure is fully used,
  - communicating changes to all teams.

Any breaking change should be clearly recorded in a **changelog** or release notes.

---

## Security operations

Security is not a one-time setup; it requires ongoing maintenance.

### Credential management

Areas to focus on:

- **Broker write keys**:

  - confined to update servers,
  - rotated on a regular schedule or when team membership changes,
  - never logged or displayed in plaintext.

- **PayloadCMS admin accounts**:

  - strong passwords,
  - limited to required admins,
  - periodic review of user list and roles.

- **External API keys** (weather, mobility data providers, etc.):
  - stored in secret managers or deployment configuration,
  - rotated according to provider recommendations.

Whenever a key is suspected to be exposed:

- revoke and replace it,
- check logs for unusual activity involving that key.

### Surface reduction

Reduce the attack surface by:

- exposing only:
  - proxy and dashboard to general users,
  - PayloadCMS admin UI to admins (use IP filtering, VPN or access control),
- keeping broker and DB on internal networks,
- ensuring update servers are not publicly reachable unless strictly required.

---

## Incident response

Incidents will happen: broker downtime, external API failures, bad deployments, etc.

### Basic playbooks

Prepare short, practical checklists for common incidents:

- **Dashboard cannot reach backend**:

  - check proxy container or service status,
  - check DNS and reverse proxy routing,
  - check TLS certificate validity.

- **Dashboard shows no data**:

  - check update server logs:
    - are there recent updates?
  - check broker entities:
    - are they present but filtered incorrectly?
  - check proxy:
    - does it return entities for basic queries?

- **PayloadCMS unreachable**:

  - check Payload service status,
  - check DB connectivity,
  - check admin domain and TLS.

- **Broker errors**:
  - check resource usage (CPU, memory, disk),
  - check write error logs from update servers,
  - check whether entity volume or request patterns have changed.

### Communication

For larger incidents:

- decide who:

  - triages and mitigates,
  - communicates status to stakeholders,
  - documents what happened.

- record:
  - timeline of the incident,
  - root cause (if identified),
  - actions taken,
  - follow-up improvements.

---

## Routine operational tasks

For a stable deployment, define regular tasks:

### Daily or per-shift

- check dashboard for obvious errors or missing data,
- glance at broker and update server logs for any recurring errors,
- confirm that at least one update cycle has succeeded recently.

### Weekly

- review alerts and thresholds; tune if there is alert fatigue,
- check for available updates in critical dependencies (if you track them manually),
- run basic health queries against the broker.

### Monthly or quarterly

- test restore of PayloadCMS DB (in non-production),
- rotate selected credentials (API keys, write tokens) as a practice,
- review entity documentation and update it if the implementation has drifted,
- evaluate resource usage against capacity.

---

## Summary

- Operations and maintenance for LegoCity revolve around availability, data freshness, consistency, security and recoverability.
- Monitoring should cover brokers, update servers, PayloadCMS, proxy and dashboard, with clear alerts for failures and abnormal behaviour.
- Backups, especially of PayloadCMS DB and any broker storage that cannot be easily recreated, must be regular and tested.
- Updates should flow through dev (and staging, if available) before production, with particular care when changing entity schemas and APIs.
- Security operations include managing broker write keys, admin access, external API keys and limiting exposed surfaces.
- Clear incident playbooks and routine operational tasks help keep the deployment predictable and easier to maintain over time.
