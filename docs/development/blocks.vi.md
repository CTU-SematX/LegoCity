# Tạo Blocks mới

Trang này giải thích cách tạo các UI blocks mới trong LegoCity.

!!! abstract "Blocks là gì?"
Blocks là các đơn vị xây dựng của dashboard UI mô tả:

    - Những gì xuất hiện trong sidebar
    - Những gì được hiển thị trong detail panels
    - Cách các layers được toggle
    - Cách filters và controls được bố trí

Mục tiêu là cho phép những người không phải developer cấu hình views và blocks trong PayloadCMS, trong khi developers cung cấp các building blocks cơ bản trong code.

---

## Mô hình khái niệm

Một block trong LegoCity có hai mặt:

### Content Model (PayloadCMS)

- Cách block được biểu diễn như dữ liệu trong PayloadCMS
- Các trường nào có thể cấu hình (titles, descriptions, layer references, parameters)
- Cách nó được lưu trữ và versioned

### Render Logic (Dashboard React Component)

- Cách block trông như thế nào và hoạt động trong UI
- Cách nó tương tác với Mapbox và các blocks khác
- Cách nó đọc runtime data (từ proxy, broker, hoặc context)

!!! tip "Mapping Pattern" - **PayloadCMS:** Block type string (ví dụ `"layerToggle"`, `"kpiCard"`, `"chart"`) - **Dashboard:** React component đã đăng ký cho mỗi block type

---

## Block Lifecycle

Khi bạn tạo một block type mới, hãy làm theo lifecycle này:

### 1. Định nghĩa Block Type trong PayloadCMS

- Thêm một block definition mới vào collection thích hợp (ví dụ, "Layouts" hoặc "Blocks")
- Chỉ định các trường cần thiết để cấu hình block (title, references to layers, thresholds, v.v.)

### 2. Expose Block cho Dashboard

- Đảm bảo API endpoint được dashboard sử dụng bao gồm block configurations
- Đảm bảo block type names và shapes nhất quán

### 3. Implement Block Component

- Tạo một React component cho block type
- Đăng ký nó trong block registry hoặc mapping
- Xử lý props cẩn thận và tránh coupling với PayloadCMS internals

### 4. Wire to Map và Data Sources

- Sử dụng proxy/API để fetch data nếu cần
- Tương tác với map (toggle layers, zoom to features) nếu phù hợp

### 5. Test trong Real View

- Cấu hình một page hoặc layout trong PayloadCMS sử dụng block của bạn
- Reload dashboard và verify behaviour

---

## Defining Blocks trong PayloadCMS

Trong PayloadCMS, blocks thường được định nghĩa như một phần của field cho phép nhiều block types.

**Cấu trúc ví dụ:**

```
layout: array of blocks
  └─ mỗi block có `blockType` và type-specific fields
```

### Tạo Block Type mới

=== "Chọn Block Type"
Chọn một `blockType` hoặc slug duy nhất:

    - `layerToggle`
    - `kpiCard`
    - `mapLegend`
    - `chartWidget`

=== "Định nghĩa Fields"
Định nghĩa các trường mà users có thể edit:

    - `title` - Display name
    - `description` - Help text
    - `layerRefs` - Links to layer definitions
    - `thresholds` - Data ranges
    - Bất kỳ cấu hình nào khác cần cho UI

### Nguyên tắc thiết kế Field

!!! success "Best Practices" - ✅ Chỉ expose những gì cần thiết cho behaviour của block - ✅ Tránh hard-coding display strings hoặc IDs trong code - ✅ Ưu tiên references tới các collections khác (layers, views) - ✅ Giữ cấu hình đơn giản và trực quan

---

## Exposing Block Data cho Dashboard

Dashboard fetch configuration từ:

- PayloadCMS REST hoặc GraphQL endpoint
- Custom API layer transform Payload data

### Yêu cầu cấu trúc dữ liệu

!!! warning "Required Fields" - Data phải bao gồm trường `type` hoặc `blockType` cho mỗi block - Các trường còn lại (props) phải theo một shape có thể dự đoán

**Ví dụ JSON:**

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

- `type` → React component nào sẽ được sử dụng
- `props` → Configuration data cho component đó

---

## Implementing React Block Components

### Block Registry

Tạo một mapping từ block type tới React component:

```typescript title="dashboard/src/blocks/registry.ts"
const BLOCK_REGISTRY: Record<string, React.ComponentType<BlockProps>> = {
  layerToggle: LayerToggleBlock,
  kpiCard: KpiCardBlock,
  mapLegend: MapLegendBlock,
  // Thêm blocks mới của bạn vào đây
};
```

### Block Renderer

Tạo một component:

1. Nhận một array of block definitions từ PayloadCMS
2. Lặp qua chúng
3. Render component tương ứng từ registry

### Thêm Block mới

=== "1. Tạo Component"
**Ví dụ: LayerToggleBlock**

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
            {isVisible ? 'Ẩn' : 'Hiện'} Layers
          </button>
        </div>
      );
    };
    ```

=== "2. Đăng ký Block"
Thêm vào registry:

    ```typescript
    const BLOCK_REGISTRY = {
      // ... existing blocks
      layerToggle: LayerToggleBlock,
    };
    ```

    Đảm bảo type string khớp với những gì PayloadCMS gửi.

=== "3. Type Safety"
Định nghĩa các specific props types:

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

## Tương tác với Map và Blocks

Nhiều blocks cần:

- Toggle Mapbox layers
- Zoom to bounding boxes
- Show/hide overlays
- Coordinate với các components khác

### Map Controller Pattern

Tạo một map context hoặc controller:

```typescript title="Map Controller Interface"
interface MapController {
  showLayer: (id: string) => void;
  hideLayer: (id: string) => void;
  setLayerOpacity: (id: string, value: number) => void;
  flyTo: (bounds: LngLatBoundsLike) => void;
  setFilter: (layerId: string, filter: any) => void;
}
```

### Ví dụ sử dụng

```typescript
const LayerToggleBlock: React.FC<LayerToggleProps> = ({ layers }) => {
  const mapController = useMapController(); // Từ context

  const handleShow = () => {
    layers.forEach((id) => mapController.showLayer(id));
  };

  return <button onClick={handleShow}>Hiện Layers</button>;
};
```

### Nguyên tắc thiết kế

!!! tip "Giữ Blocks tập trung" - Một block toggles một nhóm layers cụ thể - Block khác visualizes một KPI dựa trên data - Block khác selects một filter hoặc time range

    Tránh coupling blocks trực tiếp với raw Mapbox internals—route interactions qua shared map controller.

---

## Data-Driven Blocks

Một số blocks cần runtime data, không chỉ configuration:

| Block Type  | Yêu cầu dữ liệu                    |
| ----------- | ---------------------------------- |
| KPI Cards   | Giá trị mới nhất cho một metric    |
| Charts      | Time series, distribution          |
| Table Views | Lists of entities matching filters |

### Configuration trong PayloadCMS

Chỉ định:

- Domain hoặc entity type nào để query
- Bất kỳ key filters (ví dụ, "environment", "mobility:parking")
- Time windows hoặc thresholds

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

### Cân nhắc thiết kế API

!!! success "Giữ UI đơn giản" - Trả về aggregated results khi có thể - Tránh buộc UI implement heavy transformation logic - Cung cấp loading và error states - Cache dữ liệu được truy cập thường xuyên

---

## Reusing và Extending Blocks

Trước khi tạo một block mới, kiểm tra xem một block hiện có có thể:

- ✅ Reused as-is
- ✅ Extended via configuration
- ✅ Composed với các blocks khác

### Generic vs Specific Blocks

**Good generic block:**

```typescript
// Generic metric card hỗ trợ nhiều domains bằng configuration
<MetricCard
  title="Active Parking Spots"
  metricKey="mobility:parking:activeCount"
  unit="spots"
/>
```

**Tránh over-specialization:**

```typescript
// Bad: Quá specific
<ParkingSpotCard />
<BusStopCard />
<BikeStationCard />

// Good: Một configurable block
<TransportMetricCard type="parking|bus|bike" />
```

### Extracting Shared Logic

Nếu một block mới ~80% giống với một block hiện có:

- Extract shared logic vào một hook hoặc shared component
- Document differences và tại sao cần một block type mới

---

## Documentation và Examples

Mỗi khi bạn thêm một block type mới:

### Update Documentation

- [ ] Thêm vào Entities and blocks section
- [ ] Thêm vào block reference page (nếu tồn tại)
- [ ] Update trang này với examples mới

### Bao gồm Details

Document:

| Thông tin         | Ví dụ                                    |
| ----------------- | ---------------------------------------- |
| Block type name   | `layerToggle`                            |
| Description       | Toggles visibility of map layers         |
| PayloadCMS fields | `title`, `layers[]`, `initialState`      |
| Data assumptions  | Expects layer IDs to exist in map config |

### Cung cấp Examples

=== "Screenshots"
Bao gồm screenshots của block đang sử dụng

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

!!! example "Tạo Block mới"
**PayloadCMS:**

    - [ ] Định nghĩa block type và unique slug
    - [ ] Thêm configurable fields
    - [ ] Test block creation trong admin panel
    - [ ] Document field purposes

    **Dashboard:**

    - [ ] Tạo React component
    - [ ] Thêm vào block registry
    - [ ] Implement prop types (TypeScript)
    - [ ] Handle loading/error states
    - [ ] Connect to map controller (nếu cần)
    - [ ] Connect to data API (nếu cần)

    **Testing:**

    - [ ] Tạo test view trong PayloadCMS
    - [ ] Verify block renders correctly
    - [ ] Test interactive features
    - [ ] Check mobile responsiveness

    **Documentation:**

    - [ ] Update block reference
    - [ ] Thêm usage examples
    - [ ] Bao gồm screenshots
    - [ ] Document known limitations

---

## Tóm tắt

!!! success "Key Takeaways"
**Blocks kết nối PayloadCMS configuration với React components**

    **Để tạo một block mới:**

    1. Định nghĩa block type và fields trong PayloadCMS
    2. Đảm bảo API exposes block data với `type` và `props`
    3. Implement React component và đăng ký trong block registry
    4. Wire to map controller hoặc data APIs nếu cần
    5. Test trong real views và document usage

    **Best practices:**

    - Giữ blocks nhỏ, focused, và data-driven
    - Enable non-developers compose complex dashboards từ simple pieces
    - Luôn update documentation cho các contributors khác

**Các trang liên quan:**

- [PayloadCMS Plugins](plugins.md)
- [Seed Data & Scenarios](seed-data.md)
- [Local Development Setup](../installation/local.md)
