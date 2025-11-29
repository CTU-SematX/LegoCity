# Creating New Blocks

This page explains how to create new UI blocks in LegoCity.

!!! abstract "What are Blocks?"
Blocks are the building units of the dashboard UI that describe:

    - What appears in the sidebar
    - What is shown in detail panels
    - How layers are toggled
    - How filters and controls are laid out

The goal is to let non-developers configure views and blocks in PayloadCMS, while developers provide the underlying building blocks in code.

---

## Conceptual Model

A block in LegoCity has two sides:

### Content Model (PayloadCMS)

- How the block is represented as data in PayloadCMS
- Which fields are configurable (titles, descriptions, layer references, parameters)
- How it is stored and versioned

### Render Logic (Dashboard React Component)

- How the block looks and behaves in the UI
- How it interacts with Mapbox and other blocks
- How it reads runtime data (from the proxy, broker, or context)

!!! tip "Mapping Pattern" - **PayloadCMS:** Block type string (e.g. `"layerToggle"`, `"kpiCard"`, `"chart"`) - **Dashboard:** React component registered for each block type

---

## Block Lifecycle

When you create a new block type, follow this lifecycle:

### 1. Define the Block Type in PayloadCMS

- Add a new block definition to the appropriate collection (e.g., "Layouts" or "Blocks")
- Specify fields required to configure the block (title, references to layers, thresholds, etc.)

### 2. Expose the Block to the Dashboard

- Ensure the API endpoint used by the dashboard includes block configurations
- Make sure block type names and shapes are consistent

### 3. Implement the Block Component

- Create a React component for the block type
- Register it in a block registry or mapping
- Handle props carefully and avoid coupling to PayloadCMS internals

### 4. Wire to Map and Data Sources

- Use the proxy/API to fetch data if needed
- Interact with the map (toggle layers, zoom to features) as appropriate

### 5. Test in a Real View

- Configure a page or layout in PayloadCMS that uses your block
- Reload the dashboard and verify behaviour

---

## Defining Blocks in PayloadCMS

In PayloadCMS, blocks are typically defined as part of a field that allows multiple block types.

**Example structure:**

```
layout: array of blocks
  └─ each block has a `blockType` and type-specific fields
```

### Creating a New Block Type

=== "Choose Block Type"
Pick a unique `blockType` or slug:

    - `layerToggle`
    - `kpiCard`
    - `mapLegend`
    - `chartWidget`

=== "Define Fields"
Define fields that users can edit:

    - `title` - Display name
    - `description` - Help text
    - `layerRefs` - Links to layer definitions
    - `thresholds` - Data ranges
    - Any other configuration needed by the UI

### Field Design Principles

!!! success "Best Practices" - ✅ Expose only what is necessary for the block's behaviour - ✅ Avoid hard-coding display strings or IDs in the code - ✅ Prefer references to other collections (layers, views) - ✅ Keep configuration simple and intuitive

---

## Exposing Block Data to Dashboard

The dashboard fetches configuration from:

- PayloadCMS REST or GraphQL endpoint
- Custom API layer that transforms Payload data

### Data Structure Requirements

!!! warning "Required Fields" - Data must include a `type` or `blockType` field for each block - Remaining fields (props) must follow a predictable shape

**Example JSON:**

```json title="Block Configuration"
{
  "blocks": [
    {
      "type": "layerToggle",
      "title": "Waterlogging risk",
      "layers": ["env:flood-risk", "env:rain-intensity"]
    },
    {
      "type": "kpiCard",
      "title": "Active parking spots",
      "metricKey": "mobility:parking:activeCount"
    }
  ]
}
```

**Pattern:**

- `type` → Which React component to use
- `props` → Configuration data for that component

---

## Implementing React Block Components

### Block Registry

Create a mapping from block type to React component:

```typescript title="dashboard/src/blocks/registry.ts"
const BLOCK_REGISTRY: Record<string, React.ComponentType<BlockProps>> = {
  layerToggle: LayerToggleBlock,
  kpiCard: KpiCardBlock,
  mapLegend: MapLegendBlock,
  // Add your new blocks here
};
```

### Block Renderer

Create a component that:

1. Receives an array of block definitions from PayloadCMS
2. Loops through them
3. Renders the corresponding component from the registry

### Adding a New Block

=== "1. Create Component"
**Example: LayerToggleBlock**

    ```typescript title="dashboard/src/blocks/LayerToggleBlock.tsx"
    interface LayerToggleProps {
      title: string;
      layers: string[];
      initialState?: boolean;
    }

    export const LayerToggleBlock: React.FC<LayerToggleProps> = ({
      title,
      layers,
      initialState = false
    }) => {
      const { showLayer, hideLayer } = useMapController();
      const [isVisible, setIsVisible] = useState(initialState);

      const handleToggle = () => {
        layers.forEach(layerId => {
          isVisible ? hideLayer(layerId) : showLayer(layerId);
        });
        setIsVisible(!isVisible);
      };

      return (
        <div className="layer-toggle-block">
          <h3>{title}</h3>
          <button onClick={handleToggle}>
            {isVisible ? 'Hide' : 'Show'} Layers
          </button>
        </div>
      );
    };
    ```

=== "2. Register Block"
Add to the registry:

    ```typescript
    const BLOCK_REGISTRY = {
      // ... existing blocks
      layerToggle: LayerToggleBlock,
    };
    ```

    Ensure the type string matches what PayloadCMS sends.

=== "3. Type Safety"
Define specific props types:

    ```typescript
    interface BlockProps {
      type: string;
      [key: string]: any;
    }

    interface LayerToggleProps extends BlockProps {
      type: 'layerToggle';
      title: string;
      layers: string[];
      initialState?: boolean;
    }
    ```

---

## Interacting with Map and Blocks

Many blocks need to:

- Toggle Mapbox layers
- Zoom to bounding boxes
- Show/hide overlays
- Coordinate with other components

### Map Controller Pattern

Create a map context or controller:

```typescript title="Map Controller Interface"
interface MapController {
  showLayer: (id: string) => void;
  hideLayer: (id: string) => void;
  setLayerOpacity: (id: string, value: number) => void;
  flyTo: (bounds: LngLatBoundsLike) => void;
  setFilter: (layerId: string, filter: any) => void;
}
```

### Usage Example

```typescript
const LayerToggleBlock: React.FC<LayerToggleProps> = ({ layers }) => {
  const mapController = useMapController(); // From context

  const handleShow = () => {
    layers.forEach((id) => mapController.showLayer(id));
  };

  return <button onClick={handleShow}>Show Layers</button>;
};
```

### Design Principles

!!! tip "Keep Blocks Focused" - One block toggles a specific group of layers - Another block visualizes a KPI based on data - Another block selects a filter or time range

    Avoid coupling blocks directly to raw Mapbox internals—route interactions through the shared map controller.

---

## Data-Driven Blocks

Some blocks need runtime data, not just configuration:

| Block Type  | Data Requirement                   |
| ----------- | ---------------------------------- |
| KPI Cards   | Latest value for a metric          |
| Charts      | Time series, distribution          |
| Table Views | Lists of entities matching filters |

### Configuration in PayloadCMS

Specify:

- Which domain or entity type to query
- Any key filters (e.g., "environment", "mobility:parking")
- Time windows or thresholds

### React Component Implementation

```typescript title="KPI Card Example"
const KpiCardBlock: React.FC<KpiCardProps> = ({ title, metricKey }) => {
  const [value, loading, error] = useMetric(metricKey);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="kpi-card">
      <h3>{title}</h3>
      <div className="value">{value}</div>
    </div>
  );
};
```

### API Design Considerations

!!! success "Keep UI Simple" - Return aggregated results where possible - Avoid forcing the UI to implement heavy transformation logic - Provide loading and error states - Cache frequently accessed data

---

## Reusing and Extending Blocks

Before creating a new block, check if an existing block can be:

- ✅ Reused as-is
- ✅ Extended via configuration
- ✅ Composed with other blocks

### Generic vs Specific Blocks

**Good generic block:**

```typescript
// Generic metric card supports multiple domains by configuration
<MetricCard
  title="Active Parking Spots"
  metricKey="mobility:parking:activeCount"
  unit="spots"
/>
```

**Avoid over-specialization:**

```typescript
// Bad: Too specific
<ParkingSpotCard />
<BusStopCard />
<BikeStationCard />

// Good: One configurable block
<TransportMetricCard type="parking|bus|bike" />
```

### Extracting Shared Logic

If a new block is ~80% identical to an existing one:

- Extract shared logic into a hook or shared component
- Document the differences and why a new block type is necessary

---

## Documentation and Examples

Whenever you add a new block type:

### Update Documentation

- [ ] Add to the Entities and blocks section
- [ ] Add to block reference page (if exists)
- [ ] Update this page with new examples

### Include Details

Document:

| Information       | Example                                  |
| ----------------- | ---------------------------------------- |
| Block type name   | `layerToggle`                            |
| Description       | Toggles visibility of map layers         |
| PayloadCMS fields | `title`, `layers[]`, `initialState`      |
| Data assumptions  | Expects layer IDs to exist in map config |

### Provide Examples

=== "Screenshots"
Include screenshots of the block in use

=== "Configuration"
`json
    {
      "type": "layerToggle",
      "title": "Flood Risk Layers",
      "layers": [
        "env:flood-risk-high",
        "env:flood-risk-medium"
      ],
      "initialState": true
    }
    `

=== "Component Usage"
`typescript
    <LayerToggleBlock
      title="Flood Risk Layers"
      layers={["env:flood-risk-high", "env:flood-risk-medium"]}
      initialState={true}
    />
    `

---

## Block Development Checklist

!!! example "Creating a New Block"
**PayloadCMS:**

    - [ ] Define block type and unique slug
    - [ ] Add configurable fields
    - [ ] Test block creation in admin panel
    - [ ] Document field purposes

    **Dashboard:**

    - [ ] Create React component
    - [ ] Add to block registry
    - [ ] Implement prop types (TypeScript)
    - [ ] Handle loading/error states
    - [ ] Connect to map controller (if needed)
    - [ ] Connect to data API (if needed)

    **Testing:**

    - [ ] Create test view in PayloadCMS
    - [ ] Verify block renders correctly
    - [ ] Test interactive features
    - [ ] Check mobile responsiveness

    **Documentation:**

    - [ ] Update block reference
    - [ ] Add usage examples
    - [ ] Include screenshots
    - [ ] Document known limitations

---

## Summary

!!! success "Key Takeaways"
**Blocks connect PayloadCMS configuration with React components**

    **To create a new block:**

    1. Define block type and fields in PayloadCMS
    2. Ensure API exposes block data with `type` and `props`
    3. Implement React component and register in block registry
    4. Wire to map controller or data APIs if needed
    5. Test in real views and document usage

    **Best practices:**

    - Keep blocks small, focused, and data-driven
    - Enable non-developers to compose complex dashboards from simple pieces
    - Always update documentation for other contributors

**Related Pages:**

- [PayloadCMS Plugins](plugins.md)
- [Seed Data & Scenarios](seed-data.md)
- [Local Development Setup](../installation/local.md)
