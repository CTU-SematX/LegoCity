# Data and brokers

This page explains in detail how the **data layer** of LegoCity is organised around NGSI-LD context brokers and update servers.

It focuses on:

- what the broker is expected to store and provide,
- how data is grouped into domains,
- how update servers are designed and operated,
- how decisions about history, quality and source-of-truth are made.

It does not cover deployment commands or infrastructure automation; those are documented in the Deployment section.

---

## 1. Overall data flow

The basic data flow in a LegoCity deployment is:

1. An external system (for example, a weather API, a sensor gateway, a flood model, a transport feed) exposes raw data.
2. An update server for that domain reads the raw data on a schedule.
3. The update server converts the raw data into **NGSI-LD entities** that follow the agreed models and conventions.
4. The update server writes those entities into a **context broker**.
5. The dashboard and other application services read entities from the broker (usually via a proxy) and turn them into map layers and UI elements.

The important constraints are:

- update servers are the only components that write to the broker in normal operation,
- the broker is the only source where the dashboard reads city context,
- if something is not in the broker, it does not exist from LegoCity’s point of view.

---

## 2. Context broker role

The context broker is responsible for:

- storing all **current state** of city entities that LegoCity needs,
- exposing a standard NGSI-LD API for create, update, query and subscription,
- providing a consistent, canonical view of “what the city looks like right now”.

From LegoCity’s perspective, the broker must:

- store entities for all domains in scope (for example, environment, flooding, mobility, public services),
- support geospatial queries and filtering on attributes that the UI will need,
- handle the expected volume and update frequency of the entities.

The broker is not expected to:

- perform heavy analytics,
- render maps,
- be aware of UI concepts like pages, blocks or permissions inside the dashboard.

Those concerns are external to the broker.

### 2.1 What is stored in the broker

For each domain, the broker stores:

- entity identifiers that represent real-world objects or observations,
- current values of attributes (status, measurements, capacities, etc.),
- geospatial attributes (locations, geometries, coverage areas),
- timestamps that indicate when the information was observed or last updated.

Examples of what is in scope for the broker:

- “There is a flood zone with this polygon and this current risk level.”
- “There is a parking facility with this capacity and this current occupancy.”
- “There is a weather observation at this location with this temperature and humidity.”

If the dashboard needs to show a value for the user, that value should be present or derivable from entities in the broker.

### 2.2 What is not stored in the broker

The broker is not required to store:

- UI configuration (map styles, layer visibility defaults, panel layouts),
- user accounts, roles or permissions,
- documentation or descriptive text that is only relevant for the admin UI.

These items belong to PayloadCMS or other parts of the LegoCity stack.

---

## 3. Broker topology

A LegoCity deployment must choose how many brokers to run and what each one is responsible for. This is a structural decision that affects every other part of the system.

### 3.1 Single-broker deployments

In a single-broker deployment:

- one broker instance stores all entities for the deployment (all domains, all city areas),
- all update servers write to that broker,
- all dashboards and application services read from that broker.

This is usually the default for:

- proofs of concept,
- small to medium deployments,
- a single city or campus.

Advantages:

- fewer endpoints to configure,
- simpler monitoring and logging,
- easier for new team members to understand.

Risks and constraints:

- if the broker is unavailable, all domains are affected,
- all domains share the same performance and scaling limits,
- careful naming and scoping is needed to avoid conflicts between domains.

In practice, a single-broker deployment should still separate environments (for example, one broker for development and one for production).

### 3.2 Multi-broker deployments

In a multi-broker deployment, different brokers are used for different scopes. Common patterns:

- one broker per environment (development, staging, production),
- one broker per city or administrative region,
- one broker for high-frequency telemetry and another for more static reference data.

Advantages:

- clearer separation between environments or cities,
- different tuning and retention policies per broker,
- failures in one broker do not immediately affect all domains.

Costs and constraints:

- more endpoints and credentials to manage,
- update servers must know which broker to write to,
- dashboards and proxies must be configured to query the correct broker for each context.

The documentation of a LegoCity deployment should explicitly list:

- each broker instance (name and base URL),
- which domains and entity types each broker owns,
- which update servers and applications are allowed to access each broker.

---

## 4. Domains and ownership

Without structure, a broker can become a random collection of entities. LegoCity encourages grouping entities into **domains** and assigning clear responsibility.

Typical domains are:

- Environment (weather, air quality, noise),
- Water and flooding,
- Mobility and transport,
- Public services (health, education, administration),
- Infrastructure assets (parking, charging stations, cameras).

For each domain, the documentation should state:

- which entity types belong to it (by `type` name),
- which update server(s) are responsible for creating and updating those entities,
- which broker instance stores those entities,
- which dashboards or map views consume that domain.

This gives a clear answer to questions like:

- “If flood data is wrong, which server should we check?”
- “Where does the air quality data come from?”
- “If we add a new city, which domains need new brokers or new servers?”

Domains are a documentation and ownership concept; they are not a new technical component.

---

## 5. Update servers

Update servers are **integration services**. They connect external systems to the context broker and are the only regular writers of entities.

### 5.1 Responsibilities

An update server is responsible for a complete loop:

1. **Configuration**  
   It reads all its configuration from environment variables or configuration files, including:
   - broker URL and credentials,
   - external API endpoints and keys,
   - update frequency and any domain-specific parameters (for example, list of locations to monitor).

2. **Data ingestion**  
   It contacts external data sources:
   - fetches raw data,
   - handles paging, rate limits and temporary errors,
   - validates that the received data is structurally sound.

3. **Transformation**  
   It converts raw data into the internal entity representation:
   - chooses the entity type,
   - sets identifiers according to the project’s conventions,
   - fills attributes that match the chosen Smart Data Model,
   - sets locations and timestamps.

4. **Publishing**  
   It writes entities to the broker:
   - creates entities that do not exist yet,
   - updates attributes for existing entities,
   - handles partial failures and retries where appropriate.

5. **Reporting and health**  
   It logs key events:
   - how many entities were created or updated,
   - when the last successful update occurred,
   - whether there were errors and of what kind.

This loop can be implemented as a continuously running service with a timer or as a scheduled job.

### 5.2 Granularity and scope

The recommended approach is to keep update servers narrow in scope:

- one server per external data source,
- or one server per domain when sources are tightly related.

This avoids:

- mixing unrelated concerns in a single codebase,
- making one failure affect many domains,
- creating hidden couplings that are hard to debug.

Each server should have a clear name and documented scope, for example:

- `env-weather-server` – reads weather API, writes `WeatherObserved`,
- `water-flood-server` – reads flood model outputs, writes `FloodZone`,
- `mobility-parking-server` – reads parking backend, writes `ParkingFacility` and `ParkingSpot`.

### 5.3 Idempotency and conflict handling

Update servers should be designed to be **idempotent**:

- running the same update twice in a row should not create duplicate entities,
- updates should always converge to the correct state.

This has implications for:

- how IDs are generated (stable IDs vs new random IDs),
- how updates are applied (replace vs patch),
- how deleted or obsolete entities are handled (explicit deletion, or marking as inactive).

The project should define how deletions and deactivations are represented, so the UI can interpret them correctly (for example, whether inactive entities are hidden or styled differently).

---

## 6. Current state and history

NGSI-LD brokers can support both **current context** and **temporal** queries, but LegoCity must define how it uses this capability.

### 6.1 Current state

For many dashboards, only the current state matters. For example:

- current water level,
- current parking occupancy,
- current flood risk level.

In this mode:

- the broker holds one entity per real-world object,
- each update overwrites relevant attributes,
- old values are not kept in the broker.

This is simpler to operate and often sufficient for monitoring-style use cases.

### 6.2 History and trends

For some use cases, LegoCity may need short-term history, for example:

- charts of the last 24 hours of weather or air quality,
- recent evolution of water levels during a flood event.

Two approaches are possible:

- use the broker’s temporal features (if available and enabled) to store attribute history,
- forward data to a specialised time-series database while keeping only the latest values in the broker.

The choice should be documented for each domain:

- which domains store only current state,
- which domains retain a limited history,
- where long-term analytics data is stored if not in the broker.

The dashboard and proxy must be aligned with this decision so that queries are realistic and efficient.

---

## 7. Data contracts and conventions

To keep the data layer coherent, LegoCity relies on explicit **data contracts** between update servers, brokers and the UI.

These contracts cover:

- which entity types are used,
- which attributes must be present,
- which naming conventions are followed.

### 7.1 Entity types and models

For each entity type used in LegoCity, the documentation should specify:

- the name of the entity type (for example, `WeatherObserved`),
- whether it follows a FIWARE Smart Data Model directly, an extended version, or a custom schema,
- which attributes are mandatory (must always be present),
- which attributes are optional and under which conditions they appear.

Update servers must respect these definitions when creating or updating entities.

### 7.2 Identifiers

Identifiers (`id`) need to be:

- stable over time for the same real-world object or location,
- predictable enough that systems can refer to entities by ID if needed,
- unique across the broker, or at least across a domain.

The documentation should state:

- how IDs are constructed (for example, URN patterns that include domain and location),
- whether IDs are derived from external identifiers or generated internally,
- how ID changes are handled if an external system renames something.

### 7.3 Geospatial attributes

Because LegoCity is map-centric, geospatial attributes must be consistent:

- which attribute name is used for location (for example, always `location`),
- which types of geometries are expected for each entity type (point, line, polygon),
- how coordinate reference systems are handled (typically WGS84).

This consistency allows:

- generic map layers that can handle many entity types,
- simple filtering by bounding box or area of interest.

### 7.4 Time attributes

Time is critical for context:

- each observation-type entity should have a clear observation timestamp,
- entities representing static objects (for example, a public facility) may have creation or last-update timestamps.

The documentation should list:

- which attributes carry time information,
- how they are used in the UI (for example, to mark stale data).

---

## 8. Multiple sources for the same entity type

Sometimes more than one external source can provide data for the same conceptual entity type. For example, different agencies might publish partially overlapping flood maps.

In such cases, LegoCity needs explicit rules to avoid confusion:

- whether one source is considered the **authoritative** source and others are ignored,
- whether entities from different sources are kept separate by ID and metadata,
- whether a dedicated aggregation service combines data from multiple sources into a single set of entities.

If multiple sources are used, the documentation should specify for each entity type:

- which sources feed this type,
- how conflicts are resolved,
- which attributes indicate the origin or quality of each entity.

---

## 9. Subscriptions and reactive flows

NGSI-LD supports subscriptions so that services can be notified when entities change. LegoCity may use subscriptions to drive backend workflows, but not as a primary mechanism for the dashboard.

Possible uses include:

- a service that updates aggregated indicators when sensor entities change,
- a monitoring component that alerts when certain thresholds are crossed.

If subscriptions are used:

- the components that create and manage subscriptions should be identified,
- the scopes of subscriptions (which entity types, which conditions) should be documented,
- error handling and recovery strategies should be defined (what happens when notification delivery fails).

The dashboard is expected to continue using normal queries; any “push” logic should be mediated by application services.

---

## 10. Relationship to the dashboard and proxy

The data layer and the UI layer communicate through a narrow interface.

In a typical setup:

- the proxy layer exposes a small set of HTTP endpoints tailored to the UI,
- these endpoints internally query the broker using NGSI-LD and project the results into simpler structures,
- the dashboard calls these endpoints to obtain the data it needs for map views and blocks.

Consequences:

- the broker’s internal details are not exposed directly to browsers or untrusted clients,
- changes in entity structures can be absorbed by the proxy without immediately breaking the UI,
- security policies (who can read what) can be implemented in one place.

The design of these proxy endpoints is documented in the Development section; from the data-layer perspective, it is enough to understand that:

- read access is centralised,
- write access remains with update servers,
- the broker remains the single source of truth.

---

## 11. Summary

- The context broker stores the current representation of the city as NGSI-LD entities and is treated as the source of truth.
- A deployment must choose and document its broker topology (single or multiple brokers) and domain structure.
- Domains group related entity types and update servers; each domain has clear ownership and responsibilities.
- Update servers are the only regular writers to the broker and must follow shared data contracts for entity structure, identifiers, geospatial attributes and timestamps.
- Decisions about history, retention and multiple data sources must be explicit so that the dashboard and analytics behave predictably.
- The dashboard reads from the broker through a proxy, keeping UI concerns clearly separated from data ingestion and storage.
