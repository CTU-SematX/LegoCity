# Sample update server

This page describes the **sample update server** that should be included with LegoCity.  
The sample is a small, self-contained service that shows how to:

- read configuration (broker URL, tokens, external API keys),
- fetch data from an external source,
- transform it into NGSI-LD entities,
- write entities to the context broker.

It is intended for:

- new users who want to verify their broker and data flow,
- developers who need a starting point for building real update servers.

---

## Purpose and scope

The sample update server is not a production component. Its goals are:

- **Demonstration**  
  Show an end-to-end path from an external data source to entities in the broker.

- **Template**  
  Provide a minimal structure that can be copied and extended for real integrations.

- **Verification**  
  Allow operators to quickly confirm that:
  - the broker is reachable,
  - authentication is configured correctly,
  - entities become visible in the dashboard.

The sample server should be:

- small enough to read in one sitting,
- focused on one domain (typically environment),
- safe to run in a development environment.

---

## Example domain and entity type

To keep the sample concrete, it is recommended to focus on a simple domain such as **weather observations**.

Typical choice:

- **Domain:** Environment  
- **Entity type:** `WeatherObserved`  
- **Data source:** public weather API or static test data

Expected behaviour:

- fetch current weather for one or a few locations,
- map the response to one or more `WeatherObserved` entities,
- write the entities into the broker,
- optionally repeat this on a timer (e.g. every 5–10 minutes).

The entity model should follow the same conventions described in the **Entities** section:

- stable IDs for each location,
- `location` attribute (Point),
- `observedAt` timestamp,
- core attributes such as `temperature` and `relativeHumidity`.

---

## Repository location

The LegoCity repository should contain the sample update server in a clearly named directory, for example:

- `services/sample-update-server/`
- or `examples/update-server-weather/`

The directory should include:

- the application code,
- a minimal README specific to the server,
- configuration examples (e.g. `.env.example`),
- any scripts or Dockerfiles used to run it.

This documentation page describes the intended behaviour; the repository holds the actual implementation details.

---

## Configuration

The sample update server must be configurable only through environment variables or configuration files, not by editing source code.

Typical configuration variables:

- broker connection:
  - `BROKER_URL`  
    Base URL of the NGSI-LD context broker.

  - `BROKER_WRITE_KEY` or `BROKER_WRITE_TOKEN`  
    Credential used to authenticate write operations.

- external data source:
  - `WEATHER_API_URL`  
    Base URL of the weather data API (or endpoint).

  - `WEATHER_API_KEY` (optional)  
    API key or token, if required by the external service.

- application behaviour:
  - `UPDATE_INTERVAL_SECONDS`  
    How often the server fetches data and updates entities.
  - `LOCATIONS`  
    List of locations or station identifiers to be monitored (format decided by the implementation).

Example `.env` for development:

    BROKER_URL=https://dev-broker.example.com/ngsi-ld/v1
    BROKER_WRITE_KEY=dev-broker-write-key
    WEATHER_API_URL=https://api.example.com/weather
    WEATHER_API_KEY=dev-weather-api-key
    UPDATE_INTERVAL_SECONDS=300
    LOCATIONS=CTU_CAMPUS,CTU_CITY_CENTER

The actual names and formats may differ, but they must be documented clearly in the sample server README.

---

## High-level workflow

The sample update server follows a simple loop:

1. **Load configuration**  
   - read broker settings,
   - read external API settings,
   - read list of locations or stations,
   - read update interval.

2. **Fetch external data**  
   - for each location in `LOCATIONS`, call the weather API,
   - handle basic errors (network issues, invalid response),
   - log failures without crashing immediately.

3. **Transform to entities**  
   - for each location and corresponding response:
     - choose an entity ID (e.g. `urn:ngsi-ld:WeatherObserved:ctu:station:CTU_CAMPUS`),
     - build an entity with:
       - `type = "WeatherObserved"`,
       - `location` as a geospatial attribute (Point),
       - `observedAt` time,
       - core attributes (e.g. `temperature`, `relativeHumidity`, `pressure`),
     - follow the project’s entity conventions.

4. **Write entities to the broker**  
   - send create or update requests to the broker’s entities endpoint,
   - handle HTTP errors and log them,
   - confirm success with basic logging (e.g. “updated 2 entities”).

5. **Wait and repeat**  
   - sleep for `UPDATE_INTERVAL_SECONDS`,
   - repeat the loop while the process is running.

In a development environment, a single iteration (no loop) may be sufficient to confirm configuration.

---

## Running the sample server

The exact commands depend on the stack used (for example Go, Node.js, or another language), but the general process is:

1. **Prepare the environment**

   - ensure that a context broker is running and reachable at the URL you plan to use,
   - ensure that a write key or token is configured and valid.

2. **Clone the repository**

   - clone the LegoCity repository,
   - change into the sample server directory:
     
     - e.g. `cd services/sample-update-server`  
       or `cd examples/update-server-weather`.

3. **Create configuration**

   - copy the example configuration file, for example:
     
     - copy `.env.example` to `.env`,
   - fill in:
     - `BROKER_URL`,
     - `BROKER_WRITE_KEY` or token,
     - `WEATHER_API_URL`,
     - `WEATHER_API_KEY` if needed,
     - `LOCATIONS` and `UPDATE_INTERVAL_SECONDS`.

4. **Install dependencies**

   - install dependencies according to the implementation (for example, `npm install`, or build a Go binary).

5. **Run the server**

   - start the application (for example, `npm run start` or `./sample-update-server`),
   - check logs to ensure that:
     - configuration was loaded,
     - requests to the external API succeeded,
     - entities were written to the broker.

6. **Verify in the broker and dashboard**

   - query the broker or use its management UI to confirm that:
     - `WeatherObserved` entities exist,
     - attributes and locations have reasonable values.
   - if the LegoCity dashboard is running:
     - open the corresponding map view,
     - confirm that weather markers appear in the expected locations.

---

## Expected behaviour and logs

The sample server should produce clear, minimal logs. Examples of log messages (conceptually):

- on startup:
  - “Loaded configuration: 2 locations, update interval 300 seconds.”

- on successful update:
  - “Fetched weather data for CTU_CAMPUS (temperature 30.1 °C).”
  - “Updated entity urn:ngsi-ld:WeatherObserved:ctu:station:CTU_CAMPUS.”
  - “Update cycle completed: 2 entities updated.”

- on error:
  - “Failed to fetch weather data for CTU_CITY_CENTER: HTTP 500 from API.”
  - “Failed to write entity urn:... to broker: HTTP 401 (unauthorized).”

The aim is to make it easy for operators to see:

- whether external data is available,
- whether authentication with the broker works,
- whether the data contract (entity structure) is being respected.

---

## Extending the sample server

Once the sample server works in development, teams can:

- **duplicate the project** and adapt it for other domains (e.g. flood or parking),
- or **extend the same server** to handle additional entity types.

Recommended practices when extending:

- keep configuration domain-specific:
  - new environment variables for new sources,
  - structured configuration for multiple domains if using a single process.

- keep transformation logic separate per entity type:
  - one function or module per type (`WeatherObserved`, `FloodZone`, etc.),
  - avoid mixing unrelated transformations into one large block.

- keep logging and error handling consistent:
  - similar log messages across servers,
  - clear error codes and descriptions.

---

## Relationship to other documentation

This page focuses on the conceptual behaviour and configuration of the sample update server.

Related documents:

- **Data and brokers**  
  Explains the overall data flow and the roles of brokers and update servers.

- **Entities**  
  Describes entity types, domains, and data contracts that the sample must follow.

- **API keys and access control**  
  Explains how write tokens and broker URLs are configured and managed.

The sample update server should implement the patterns described in these documents, so that it serves as a realistic example for future integrations.

---

## Summary

- The sample update server is a small, self-contained service that demonstrates how to fetch external data, transform it into NGSI-LD entities, and write those entities to the broker.
- It is designed to be easy to run in development to verify configuration and data flow.
- Configuration is handled through environment variables, including broker connection details, external API settings, locations, and update intervals.
- The sample focuses on one entity type (typically `WeatherObserved` in the Environment domain) but can be extended or duplicated for other domains.
- Logs should make it clear whether external data, broker access, and entity creation are working as expected.
- The implementation must align with the data contracts and security patterns defined in the rest of the LegoCity documentation.
