# Entities

This page describes how LegoCity represents city information as **NGSI-LD entities**, how **Smart Data Models** are used, and what conventions apply to identifiers, attributes and domains.

It is intended for people who:

- design the data model for a LegoCity deployment,
- implement update servers that create and update entities,
- build proxy endpoints or UI layers that query entities.

---

## 1. Role of entities in LegoCity

In LegoCity, almost everything that appears on the map or in the dashboard is backed by one or more entities.

Examples:

- a sensor measuring temperature and humidity  
  → one `WeatherObserved` entity per observation point;
- a flood-prone area  
  → one `FloodZone` entity with a polygon geometry;
- a public hospital  
  → a `HealthFacility` entity with service attributes and a point location;
- a parking garage  
  → a `ParkingFacility` entity with capacity, occupancy and status.

The rules are:

- if a concept needs to appear in the UI or be queried, it should have a corresponding **entity type**,
- update servers create and update entities according to domain-specific logic,
- the broker stores these entities and provides a consistent view of the city.

---

### 1.1 Anatomy of an Entity (Example)

- Before diving into details, here is what a concrete entity looks like in LegoCity (represented in JSON-LD).
- Notice the `type`, the `id`, and how properties are structured with `value` and `unitCode`.

````json
{
  "id": "urn:ngsi-ld:WeatherObserved:ctu:station:STATION_001",
  "type": "WeatherObserved",
  "@context": "[https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld](https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld)",
  "temperature": {
    "type": "Property",
    "value": 30.5,
    "unitCode": "CEL"
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [105.78, 10.04]
    }
  },
  "observedAt": {
    "type": "Property",
    "value": "2023-11-29T10:00:00Z"
  }
}
## 2. Entity types and domains

A LegoCity deployment should maintain a clear list of **entity types** in use, grouped by **domain**.

### 2.1 Example domain structure

The exact domains depend on the project, but a typical breakdown is:

- **Environment**
  - `WeatherObserved` – point observations of weather at specific locations.
  - `AirQualityObserved` – air quality measurements from fixed or mobile sensors.

- **Water and flooding**
  - `FloodZone` – polygons representing areas at risk or currently flooded.
  - `WaterLevel` – current water levels at specific stations.

- **Mobility and transport**
  - `ParkingFacility` – off-street parking structures (garages, lots).
  - `ParkingSpot` – individual parking spaces (optional, if needed).
  - `PublicTransportStop` – bus or transit stops with location and lines served.

- **Public services**
  - `HealthFacility` – hospitals, clinics and related services.
  - `EducationalFacility` – schools and universities.
  - `PublicService` – administrative or general-purpose public services.

- **Infrastructure and assets**
  - `ChargingStation` – EV charging points.
  - `Camera` – monitoring cameras.

> Example:
> A flood dashboard might use `FloodZone` and `WaterLevel` entities, while a mobility dashboard uses `ParkingFacility` and `PublicTransportStop`.
> Both dashboards read from the same broker but focus on different entity types.

### 2.2 Entity catalogue

For each entity type in the deployment, the documentation should maintain a catalogue entry.

---

## 3. Smart Data Models

Where possible, LegoCity should base entity definitions on **FIWARE Smart Data Models**.

### 3.1 Why use Smart Data Models

Using Smart Data Models provides:

- consistent attribute names across deployments,
- a clear starting point for new domains,
- easier reuse of community examples and tools,
- less ambiguity when multiple teams work on the same domain.

### 3.2 Adoption strategies

For each entity type, decide one of the following:

- **Direct adoption**
  Use the Smart Data Model as defined.
  Example: use `WeatherObserved` exactly as defined in the Smart Data Models documentation.

- **Adoption with extensions**
  Use the Smart Data Model as a base, but add project-specific attributes.
  Example:
  - `WeatherObserved` with an extra attribute `localAlertCode` used only in this city.

- **Custom model**
  Define a project-specific entity type when no suitable Smart Data Model exists.
  Example:
  - `FloodZone` defined around a custom flood risk map that has attributes `riskLevel`, `sourceDataset`, `validUntil`.

For each type, the entity catalogue should state which strategy was chosen.

### 3.3 The JSON-LD Context (`@context`)

In NGSI-LD, every entity must include (or link to) a `@context`. This tells the system how to interpret attribute names (e.g., that `temperature` refers to a specific definition in the Smart Data Models dictionary).

In LegoCity:
- Update servers must append the correct `@context` URL when sending data.
- Proxies and dashboards usually work with expanded data or a default context.

---

## 4. Identifiers (`id`)

Entity identifiers must be:

- unique within the broker (or at least within the relevant domain),
- stable for the lifetime of the entity,
- predictable enough to support linking between systems.

### 4.1 Identifier patterns

A LegoCity deployment should choose a pattern and document it.

Example patterns:

- For static assets (parking facilities, hospitals):
  `urn:ngsi-ld:ParkingFacility:ctu:parking:CTU_PARK_A`
  `urn:ngsi-ld:HealthFacility:ctu:hospital:CTU_HOSP_01`

- For observation entities where one entity represents a **time series at a location**:
  `urn:ngsi-ld:WeatherObserved:ctu:station:STATION_001`
  (attributes updated over time, no timestamp in ID)

- For observation entities where each entity represents a **single point in time**:
  `urn:ngsi-ld:WeatherObserved:ctu:station:STATION_001:2025-11-29T10:00:00Z`

The choice between the last two patterns affects:

- whether you keep only the latest state in the broker, or
- whether you want many entities over time for temporal queries.

### 4.2 ID lifecycle

The docs should clarify for each type:

- whether IDs are permanent (never reused) or can be reassigned,
- how deletions are handled.

Example:

- `ParkingFacility` entities: IDs are permanent. If a facility closes, a `status` attribute changes to `closed` instead of deleting the entity.
- `WeatherObserved` (latest-only model): entity persists, attributes are updated; old values are not separately addressed.

---

## 5. Geospatial attributes

Because LegoCity is map-centric, geospatial attributes must be handled consistently.

### 5.1 Common conventions

A typical convention is:

- use `location` as the main geospatial attribute,
- represent:
  - sensors and facilities as **Points**,
  - zones (flood, administrative) as **Polygons**.

Examples:

- `WeatherObserved.location` → Point at sensor coordinates.
- `ParkingFacility.location` → Point at entrance or centroid.
- `FloodZone.location` → Polygon representing the area at risk.

All coordinates should use the same coordinate reference system, typically WGS84 (`[longitude, latitude]`).

### 5.2 Geospatial expectations per type

For each entity type, the entity catalogue should specify:

- whether `location` is mandatory,
- which geometry types are valid.

Example:

- `WeatherObserved` – `location` required, geometry type: Point.
- `FloodZone` – `location` required, geometry type: Polygon.
- `PublicTransportStop` – `location` required, geometry type: Point.
- `PublicService` – `location` required, geometry type: Point; may also include an address as a separate attribute.

---

## 6. Time attributes

Time attributes indicate when data was observed or last updated.

### 6.1 Observation vs system timestamps

Examples:

- `WeatherObserved`:
  - `observedAt` – when the measurement was taken at the station,
  - `lastUpdate` – when the update server last wrote this entity (optional).

- `WaterLevel`:
  - `observedAt` – time of the water level reading.

- `FloodZone`:
  - `validFrom` and `validTo` – interval during which the flood map is valid, or
  - `lastAssessment` – when the zone was last assessed.

For static entities (e.g. `HealthFacility`):

- `createdAt` – when the entity was created in the system,
- `modifiedAt` – when key attributes were last updated.

### 6.2 Usage in LegoCity

The documentation should specify, per entity type:

- which time attribute the UI uses to decide whether data is “fresh”,
- whether entries older than a certain threshold should be highlighted or hidden.

Example:

- For `WeatherObserved`, if `observedAt` is older than 3 hours, the UI might:
  - show a warning icon, or
  - de-emphasise the marker on the map.

---

## 7. Core attributes and quality

Beyond IDs, location and time, each entity type has domain-specific attributes.

### 7.1 Core attributes

Each entity type should have a small set of **core attributes** that:

- are required for meaningful display,
- are expected in normal operations,
- are used for styling and filtering.

Examples:

- `WeatherObserved` (Environment):
  - `temperature`, `relativeHumidity`, `pressure`, `observedAt`, `location`.

- `FloodZone` (Water & flooding):
  - `riskLevel` (e.g. low / medium / high),
  - `status` (e.g. active / inactive),
  - `location` (Polygon).

- `ParkingFacility` (Mobility):
  - `totalCapacity`,
  - `currentOccupancy`,
  - `status` (open / closed),
  - `location`.

The entity catalogue should list these core attributes explicitly.

### 7.2 Data quality and status

Some domains require quality indicators.

Examples:

- `WeatherObserved`:
  - `qualityIndex` or `validity` flag for sensor readings.

- `AirQualityObserved`:
  - `aqi` (air quality index),
  - `source` (provider name),
  - `confidence` (optional).

- `FloodZone`:
  - `sourceDataset`,
  - `confidenceLevel`.

These attributes can be used to:

- filter out low-quality data in the proxy or UI,
- display warnings or confidence indicators to users.

---

## 8. Relationships between entities

NGSI-LD relationships explicitly link entities.

### 8.1 Relationship examples

Common relationship patterns in a smart city context:

- `ParkingSpot` → `ParkingFacility`
  Relationship: `belongsToFacility` (spot belongs to facility).

- `PublicService` → `FloodZone`
  Relationship: `locatedWithin` (service lies inside a flood zone).

- `WeatherObserved` → `WeatherStation` (if stations are modelled as separate entities).

These relationships allow:

- querying all parking spots for a given facility,
- finding all public services currently within high-risk flood zones,
- linking observations to their physical stations.

### 8.2 Design guidelines

When deciding whether to use a relationship or just duplicate information:

- use relationships when:
  - multiple entities refer to the same object (e.g. many `ParkingSpot` to one `ParkingFacility`),
  - you need to keep the central object’s attributes in one place (e.g. facility name, address).

- use duplicated attributes when:
  - linking is not required,
  - or when simplicity is more important than normalisation.

For each relationship used, the docs should specify:

- the source type,
- the target type,
- the attribute name for the relationship,
- cardinality (one-to-one, one-to-many).

### 8.3 Implementation details

Technically, a relationship in NGSI-LD is different from a regular property. It must uses `"type": "Relationship"` and stores the target ID in `"object"` (not `"value"`).

Example of a Parking Spot linked to a Facility:

```json
"refParkingFacility": {
  "type": "Relationship",
  "object": "urn:ngsi-ld:ParkingFacility:ctu:parking:CTU_PARK_A"
}

---

## 9. Designing new entity types

When new requirements appear, additional entity types may be needed. A consistent process should be followed.

### 9.1 Step-by-step process

1. **Clarify the use case**

   Example:
   “We need to show temporary road closures due to construction.”

2. **Check existing models**

   - See if Smart Data Models already have an entity type for this (e.g. road segments, events).
   - If yes, adapt or extend it.

3. **Define basic properties**

   - Choose a type name, e.g. `RoadClosure`.
   - Decide if it is static (one entity per road segment) or event-based (one entity per closure event).
   - Decide which attributes are required:
     - `location` (line or polygon),
     - `reason`,
     - `startTime`, `endTime`,
     - `affectedTransportModes`.

4. **Choose an ID pattern**

   - Example: `urn:ngsi-ld:RoadClosure:ctu:RC_2025_0001`.

5. **Document the type**

   - Add it to the entity catalogue with domain “Mobility”,
   - Specify which update server will manage it,
   - Describe attribute semantics briefly.

6. **Implement and test**

   - Update server generates a small number of entities in a test environment,
   - Dashboard team checks that data appears correctly and the attributes are sufficient.

### 9.2 Example entity definition (summary style)

For documentation, a concise summary per entity type is often enough:

> **Entity: ParkingFacility**
> Domain: Mobility
> Model: FIWARE Smart Data Model (extended with `localCode`)
> ID pattern: `urn:ngsi-ld:ParkingFacility:<city>:<facilityCode>`
> Geometry: `location` (Point)
> Core attributes:
> - `name`
> - `totalCapacity`
> - `currentOccupancy`
> - `status` (open / closed)
> - `localCode` (internal identifier)

This level of detail is usually sufficient for developers and integrators.

---

## 10. Documentation responsibilities

Entity definitions are shared contracts between:

- integration teams (update servers),
- backend teams (proxy and APIs),
- frontend teams (dashboard and blocks).

To avoid divergence:

- keep the entity catalogue under version control alongside the code,
- treat changes to entity types as changes to a public contract,
- require that new or modified types are documented before they are used in production data.

Even if a full JSON schema is not maintained, the documentation should always include:

- type name and domain,
- ID pattern,
- geospatial and time attributes,
- core attributes,
- any important relationships.

---

## 11. Summary

- Entities are the fundamental units of city context in LegoCity; almost everything visible in the UI is backed by entities in the broker.
- Each deployment should maintain an entity catalogue that lists types, domains, sources, and core attributes, with small concrete examples.
- Smart Data Models should be used wherever possible; when custom models are needed, they must be described clearly.
- Identifier patterns, geospatial attributes, time attributes and relationships must follow shared conventions so that queries and visualisations behave predictably.
- When new entity types are introduced, they should follow a consistent design process, be documented, and be tested end-to-end before adoption.
````
