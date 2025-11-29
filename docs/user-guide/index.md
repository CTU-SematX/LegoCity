# Usage overview

This section explains how to work with the **data layer** in LegoCity and how it connects to the dashboard.

It is intended for people who:

- operate or configure **context brokers**,
- build or maintain **update servers** that push data into the broker,
- need to understand how data becomes visible as **map layers** and **blocks** in the UI.

The Usage section is organised into the following pages.

---

## Data & brokers

Describes the overall data flow and the roles of:

- the **context broker**, which stores all NGSI-LD entities, and
- **update servers**, which fetch external data, transform it into entities, and write to the broker.

This page focuses on:

- typical broker setups (single vs multiple brokers),
- how responsibilities are split between broker and update servers,
- why the dashboard reads but does not write to the broker.

---

## Entities

Describes how city information is represented as **NGSI-LD entities** and how **Smart Data Models** are used.

This page covers:

- common entity types in a LegoCity deployment,
- how Smart Data Models influence attribute naming and structure,
- conventions for identifiers, types and geospatial attributes,
- guidelines for defining new entity types when requirements change.

---

## API keys & access

Describes how **write access** to the context broker is controlled.

This page explains:

- how update servers obtain write access,
- patterns for sharing or separating write keys across servers,
- where keys and tokens should be stored,
- basic expectations for key rotation and incident response.

Read access and the role of read-only proxies are also introduced at a high level.

---

## Sample update server

Describes the **sample update server** included with LegoCity.

This page clarifies:

- the purpose and scope of the sample,
- how it is configured (environment variables, external API, broker access),
- the typical workflow to run it end-to-end,
- how teams can extend it to build their own update servers.

---

## How to use this section

A typical reading order is:

1. **Data & brokers** – to understand the overall data flow.
2. **Entities** – to learn how city concepts are modeled.
3. **API keys & access** – to see how write access is controlled.
4. **Sample update server** – to run a minimal, practical example.

After working through these pages, you should have a clear picture of how data enters the broker and how it is expected to be structured before it is used by the dashboard.
