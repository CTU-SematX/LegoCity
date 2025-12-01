# Hướng dẫn Phát triển

Học cách mở rộng và tùy chỉnh LegoCity cho nhu cầu thành phố của bạn.

## Tổng quan

Hướng dẫn này bao gồm:

- 🧱 **[Creating Blocks](blocks.md)** - Xây dựng các UI components tùy chỉnh
- 🔌 **[Writing Plugins](plugins.md)** - Mở rộng chức năng PayloadCMS
- 🌱 **[Seed Data](seed-data.md)** - Populate sample data
- 🗺️ **Map Customization** - Add custom map layers (xem User Guide)
- 🧪 **Testing** - Write và run tests (coming soon)

## Development Philosophy

### Configuration Over Code

Ưu tiên configuring trong PayloadCMS admin panel hơn là writing code:

❌ **Don't**: Hard-code page layouts trong components  
✅ **Do**: Create configurable blocks trong PayloadCMS

❌ **Don't**: Hard-code API endpoints trong frontend  
✅ **Do**: Use server-side API proxies

### Extensibility

Build features như reusable blocks và plugins:

❌ **Don't**: Modify core components directly  
✅ **Do**: Create new blocks và extend existing ones

❌ **Don't**: Fork the repository cho customization  
✅ **Do**: Use plugin system và configuration

### Type Safety

Use TypeScript cho all custom code:

❌ **Don't**: Use `any` types  
✅ **Do**: Define proper interfaces và types

```typescript
// ❌ Bad
const processData = (data: any) => { ... }

// ✅ Good
interface CityData {
  id: string;
  name: string;
  sensors: Sensor[];
}

const processData = (data: CityData) => { ... }
```

## Project Structure

```
dashboard/src/
├── app/                    # Next.js App Router
│   ├── (frontend)/        # Public pages
│   │   ├── page.tsx       # Home page
│   │   └── [slug]/        # Dynamic pages
│   ├── (payload)/         # Admin routes
│   └── api/               # API routes
│
├── blocks/                 # PayloadCMS Blocks
│   ├── RenderBlocks.tsx   # Block renderer
│   ├── ArchiveBlock/      # List posts
│   ├── MediaBlock/        # Display media
│   └── CustomBlock/       # Your custom blocks
│
├── collections/            # PayloadCMS Collections
│   ├── Pages.ts           # Page content type
│   ├── Posts.ts           # Blog posts
│   ├── Media.ts           # File uploads
│   └── Users.ts           # Admin users
│
├── components/             # React Components
│   ├── Card/              # Reusable card
│   ├── Map/               # Map components
│   └── ui/                # Shadcn components
│
├── fields/                 # Custom Fields
│   ├── link.ts            # Link field
│   └── linkGroup.ts       # Link group
│
├── plugins/                # PayloadCMS Plugins
│   └── index.ts           # Plugin registration
│
├── providers/              # React Context
│   ├── Theme/             # Theme provider
│   └── HeaderTheme/       # Header theme
│
└── utilities/              # Helper Functions
    ├── generateMeta.ts    # SEO metadata
    └── getDocument.ts     # Fetch documents
```

## Development Workflow

### 1. Plan Your Feature

Trước khi coding:

- 📝 Define requirements
- 🎨 Design UI mockups
- 🏗️ Choose architecture (block, plugin, component)
- 📋 Break into tasks

### 2. Create Branch

```bash
git checkout -b feature/your-feature-name
```

### 3. Implement

Follow these steps:

1. **Create Types** (if needed)

   ```typescript
   // types/city-data.ts
   export interface CityEntity {
     id: string;
     type: string;
     location: GeoJSON.Point;
   }
   ```

2. **Build Component/Block**

   ```tsx
   // blocks/MyBlock/Component.tsx
   export const MyBlock: React.FC<Props> = ({ data }) => {
     return <div>{/* Implementation */}</div>;
   };
   ```

3. **Add Configuration**

   ```typescript
   // blocks/MyBlock/config.ts
   export const MyBlock: Block = {
     slug: "myBlock",
     fields: [
       /* ... */
     ],
   };
   ```

4. **Write Tests**

   ```typescript
   // blocks/MyBlock/MyBlock.test.tsx
   describe("MyBlock", () => {
     it("renders correctly", () => {
       // Test implementation
     });
   });
   ```

5. **Update Documentation**
   - Add tới relevant docs
   - Include usage examples

### 4. Test

```bash
# Run tests
pnpm test

# Check types
pnpm type-check

# Lint code
pnpm lint

# Build
pnpm build
```

### 5. Create Pull Request

```bash
git add .
git commit -m "feat: add custom block for city stats"
git push origin feature/your-feature-name
```

Create PR trên GitHub với:

- Clear description
- Screenshots (if UI changes)
- Test results
- Documentation updates

## Common Development Tasks

### Creating a Block

Xem [Creating Blocks Guide](blocks.md) cho detailed instructions.

**Quick example**:

```typescript
// blocks/CityStats/config.ts
import { Block } from "payload/types";

export const CityStats: Block = {
  slug: "cityStats",
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "metrics",
      type: "array",
      fields: [
        { name: "label", type: "text" },
        { name: "value", type: "number" },
      ],
    },
  ],
};
```

```tsx
// blocks/CityStats/Component.tsx
export const CityStatsBlock = ({ title, metrics }) => (
  <div>
    <h2>{title}</h2>
    {metrics.map((m) => (
      <div key={m.label}>
        <span>{m.label}</span>: {m.value}
      </div>
    ))}
  </div>
);
```

### Creating a Plugin

Xem [Writing Plugins Guide](plugins.md) cho details.

**Example**:

```typescript
// plugins/customPlugin.ts
import { Plugin } from "payload/config";

export const customPlugin = (): Plugin => ({
  name: "custom-plugin",

  init: (payload) => {
    // Initialize plugin
  },

  hooks: {
    beforeChange: [
      (args) => {
        // Hook logic
      },
    ],
  },
});
```

### Creating a Collection

```typescript
// collections/CityServices.ts
import { CollectionConfig } from "payload/types";

export const CityServices: CollectionConfig = {
  slug: "city-services",
  admin: {
    useAsTitle: "name",
    group: "Content",
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "description",
      type: "textarea",
    },
    {
      name: "location",
      type: "point",
    },
  ],
};
```

Register trong `payload.config.ts`:

```typescript
import { CityServices } from "./collections/CityServices";

export default buildConfig({
  collections: [
    // ... existing
    CityServices,
  ],
});
```

### Adding API Route

```typescript
// app/api/city-data/route.ts
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city");

  // Fetch data
  const data = await fetchCityData(city);

  return Response.json(data);
}
```

### Custom Map Layer

```typescript
// lib/mapLayers/trafficLayer.ts
export const trafficLayer: LayerDefinition = {
  id: "traffic",
  type: "line",
  source: {
    type: "geojson",
    data: "/api/traffic-data",
  },
  paint: {
    "line-color": [
      "interpolate",
      ["linear"],
      ["get", "congestion"],
      0,
      "#00ff00",
      50,
      "#ffff00",
      100,
      "#ff0000",
    ],
    "line-width": 3,
  },
};
```

## Best Practices

### Code Organization

✅ One component per file  
✅ Colocate related files (component + styles + tests)  
✅ Use index files cho exports  
✅ Group by feature, not by type

### Performance

✅ Use React Server Components khi có thể  
✅ Lazy load heavy components  
✅ Optimize images với `next/image`  
✅ Implement data caching  
✅ Monitor bundle size

### Security

✅ Validate all inputs  
✅ Use server-side API keys  
✅ Implement CSRF protection  
✅ Sanitize user content  
✅ Set proper CORS headers

### Accessibility

✅ Use semantic HTML  
✅ Add ARIA labels  
✅ Support keyboard navigation  
✅ Test với screen readers  
✅ Maintain color contrast

## Development Tools

### Recommended VS Code Extensions

- **ESLint** - Linting
- **Prettier** - Code formatting
- **TypeScript and JavaScript Language Features** - IntelliSense
- **Tailwind CSS IntelliSense** - CSS autocomplete
- **MongoDB for VS Code** - Database management
- **GitLens** - Git integration

### Browser DevTools

- **React DevTools** - Component inspection
- **Network Tab** - API debugging
- **Console** - Error logging
- **Performance Tab** - Profiling

### CLI Tools

```bash
# Generate Payload types
pnpm payload generate:types

# Check for outdated dependencies
pnpm outdated

# Analyze bundle size
pnpm build --analyze

# Run security audit
pnpm audit
```

## Debugging

### Server-Side Debugging

```typescript
// Enable detailed logging
if (process.env.NODE_ENV === "development") {
  console.log("Debug:", data);
}
```

### Client-Side Debugging

```typescript
// Use React DevTools
useEffect(() => {
  console.log("Component mounted", props);
}, []);
```

### Database Debugging

```bash
# MongoDB shell
mongosh legocity

# Enable profiling
db.setProfilingLevel(2)
```

## Testing

**Quick test**:

```typescript
import { render, screen } from "@testing-library/react";
import { MyComponent } from "./Component";

describe("MyComponent", () => {
  it("renders title", () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText("Test")).toBeInTheDocument();
  });
});
```

## Documentation

Khi adding features:

1. **Code Comments** - Explain complex logic
2. **JSDoc** - Document functions và types
3. **README** - Update relevant READMEs
4. **Docs Site** - Add tới MkDocs documentation

Example JSDoc:

```typescript
/**
 * Fetches city data from NGSI-LD broker
 * @param cityId - Unique city identifier
 * @param options - Query options
 * @returns Promise resolving to city data
 * @throws Error if city not found
 */
export async function fetchCityData(
  cityId: string,
  options?: QueryOptions
): Promise<CityData> {
  // Implementation
}
```

## Contributing

Xem [CONTRIBUTING.md](https://github.com/CTU-SematX/LegoCity/blob/main/CONTRIBUTING.md) cho:

- Code of Conduct
- Git workflow
- PR guidelines
- Review process

## Resources

- 📖 [Next.js Documentation](https://nextjs.org/docs)
- 📖 [PayloadCMS Documentation](https://payloadcms.com/docs)
- 📖 [React Documentation](https://react.dev)
- 📖 [TypeScript Handbook](https://www.typescriptlang.org/docs)
- 📖 [Tailwind CSS](https://tailwindcss.com/docs)
- 📖 [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js)

---

**Start developing**: Choose your topic:

- [Creating Blocks](blocks.md) - Build UI components
- [Writing Plugins](plugins.md) - Extend functionality
- [Seed Data](seed-data.md) - Populate test data
