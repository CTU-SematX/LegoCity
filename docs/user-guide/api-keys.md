# API keys and access control

This page describes how write access to the context broker is controlled in a LegoCity deployment and how API keys or tokens are shared with update servers and read clients.

It is intended for people who:

- configure security on the broker and proxy,
- operate update servers,
- need to understand how credentials are managed across environments.

---

## Access patterns

In LegoCity, there are three main classes of access to the broker and related APIs:

- **Write access to the broker**  
  Granted only to update servers and administrative tools. Used to create and update NGSI-LD entities.

- **Internal read access to the broker**  
  Used by the proxy and internal services to query entities. May have broader permissions but is not exposed to browsers.

- **Public read access via the proxy**  
  Used by the dashboard and any external clients. Constrained to specific endpoints, often with rate limits.

LegoCity recommends:

- limiting write access to a small set of controlled services,
- exposing read access to the UI through a proxy layer, not directly to the broker.

---

## Configuration variables

A deployment should standardise how broker endpoints and credentials are passed into services.

Typical variables:

- `BROKER_URL`  
  Base URL of the NGSI-LD context broker, for example:  
  `https://broker.example.com/ngsi-ld/v1`

- `BROKER_WRITE_KEY` or `BROKER_WRITE_TOKEN`  
  Credential (token, API key, etc.) for write access.

- `BROKER_READ_KEY` (optional)  
  Credential for read access, if the broker enforces read authentication.

These variables are:

- defined per environment (development, staging, production),
- set as environment variables or stored in a secret manager,
- never committed to the source repository.

Example `.env` for local development:

    BROKER_URL=https://dev-broker.example.com/ngsi-ld/v1
    BROKER_WRITE_KEY=dev-broker-write-key
    BROKER_READ_KEY=dev-broker-read-key

`.env` files should be ignored by version control.

---

## Authentication mechanisms

The actual authentication mechanism depends on the chosen broker and infrastructure. Common options:

- **Static API keys or tokens**  
  Keys sent in a header such as `Authorization` or `X-API-Key`. Simple to configure.

- **Mutual TLS (mTLS)**  
  Client certificates used to authenticate services. Stronger security, more complex management.

- **OAuth2 / OpenID Connect**  
  Tokens issued by an identity provider. Useful when the broker is part of a larger identity-aware platform.

LegoCity expects that:

- update servers use non-interactive methods (no manual logins),
- credentials are configurable, not hard-coded,
- the chosen mechanism and required headers are documented for the deployment.

---

## Patterns for write keys

There are multiple ways to assign write keys to update servers. The deployment must choose one and document it.

### Single shared write key

All update servers use the same key or token to write to the broker.

**Characteristics**

- one write key per broker or per environment.

**Advantages**

- simple to reason about,
- low administrative overhead.

**Drawbacks**

- if one server is compromised, the same key can be abused from anywhere,
- revoking the key requires updating all servers at once.

Suitable for small deployments or prototypes.

### Separate keys per update server

Each update server has its own write key or token.

**Characteristics**

- different credentials for each domain server (`env-weather-server`, `water-flood-server`, `mobility-parking-server`, etc.).

**Advantages**

- compromise of one server does not expose write access from others,
- access can be revoked for a single server without affecting the rest,
- possible to assign different scopes per key.

**Drawbacks**

- more credentials to manage,
- more documentation required to track ownership.

Recommended for serious deployments.

### Hybrid patterns

Some deployments may use one key per domain:

- one key for environment-related servers,
- one key for water and flooding,
- one key for mobility.

The important point is that the pattern is stable, documented, and reflected in monitoring and incident response.

---

## Storage and distribution

Regardless of the pattern, keys must be stored and distributed securely.

### Acceptable storage

- environment variables injected at deployment time,
- secret managers provided by cloud platforms,
- secure configuration stores, separate from the application image.

### Unacceptable storage

- hard-coded keys in source code,
- keys committed to git repositories,
- keys shared informally over unencrypted channels.

### Example configuration

For three update servers:

- `env-weather-server`

  - `BROKER_URL`
  - `BROKER_WRITE_KEY_ENV`

- `water-flood-server`

  - `BROKER_URL`
  - `BROKER_WRITE_KEY_WATER`

- `mobility-parking-server`
  - `BROKER_URL`
  - `BROKER_WRITE_KEY_MOBILITY`

Each service reads its configuration from the environment or a secret manager at startup.

---

## Key rotation

Key rotation replaces existing keys with new ones without long service interruption.

A simple rotation process:

1. **Generate new keys**  
   Create new keys or tokens at the broker or gateway. Store them in the secret manager or configuration system.

2. **Update services**  
   Update environment variables or config for each update server to use the new key. Restart or reload the servers.

3. **Verify operation**  
   Check that update servers continue to write entities successfully. Monitor logs and metrics for write failures.

4. **Revoke old keys**  
   Once all services are confirmed to use the new keys, remove or disable the old keys.

The documentation should state:

- where keys are defined,
- who is allowed to rotate them,
- which monitoring signals indicate a failed rotation.

---

## Read access and the proxy

Write access and read access must be treated differently.

### Internal read access

Internal services (proxy, analytics) may read directly from the broker. Depending on configuration, read operations may be:

- unrestricted inside a trusted network, or
- protected by a read-only key or token.

If a read-only key is used, it should be:

- distinct from write keys,
- not exposed to browsers.

### Public read access via proxy

The dashboard and public clients should call the **proxy**, not the broker directly. The proxy:

- issues read queries to the broker,
- transforms responses into simpler structures,
- enforces caching, rate limits and access control.

Broker credentials (read or write) are never embedded in frontend code. Browsers only see the proxy URL and any proxy-level keys or user authentication mechanisms.

---

## Example scenario

Consider a deployment with:

- a broker at `https://broker.city.example/ngsi-ld/v1`,
- three update servers: `env-weather-server`, `water-flood-server`, `mobility-parking-server`,
- one proxy at `https://api.city.example`.

### Broker

Write tokens configured at the broker or gateway:

- `TOKEN_ENV` for environment entities,
- `TOKEN_WATER` for water and flooding entities,
- `TOKEN_MOBILITY` for mobility entities.

### Update servers

- `env-weather-server`

  - `BROKER_URL=https://broker.city.example/ngsi-ld/v1`
  - `BROKER_WRITE_TOKEN=TOKEN_ENV`

- `water-flood-server`

  - `BROKER_URL=https://broker.city.example/ngsi-ld/v1`
  - `BROKER_WRITE_TOKEN=TOKEN_WATER`

- `mobility-parking-server`
  - `BROKER_URL=https://broker.city.example/ngsi-ld/v1`
  - `BROKER_WRITE_TOKEN=TOKEN_MOBILITY`

Each server sends its token in the appropriate header when writing entities.

### Proxy

- runs at `https://api.city.example`,
- uses internal credentials or network trust to query the broker,
- exposes endpoints such as:
  - `/map/weather`
  - `/map/flood-zones`
  - `/map/parking-facilities`

The dashboard calls these endpoints and never sees broker-level tokens.

---

## Incident handling

If a key is exposed or suspected to be compromised:

- identify which key was exposed and which services use it,
- revoke or disable the key at the broker or gateway,
- generate and distribute a replacement key where necessary,
- update configuration and restart affected services,
- review logs for unauthorised write attempts or suspicious patterns.

The documentation should indicate:

- where keys can be revoked,
- which logs or dashboards show broker access,
- how to verify that entities have not been corrupted.

---

## Summary

- Update servers are the only components with write access to the broker and use keys or tokens defined via configuration, not in code.
- A deployment must choose and document a clear pattern for write keys (shared, per-server, or hybrid).
- Keys must be stored securely, rotated regularly, and revoked immediately if compromised.
- The dashboard and public clients obtain data through the proxy; broker credentials are never exposed to browsers.
- Internal read access, external read access, and write access should be configured and monitored separately.
