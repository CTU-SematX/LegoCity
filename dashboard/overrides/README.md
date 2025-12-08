# LegoCity Dashboard Overrides

This folder contains LegoCity-specific customizations that are preserved during dashboard syncs with Lego-Dashboard.

## Structure

```
overrides/
├── blocks/           # Custom blocks for LegoCity
├── components/       # Modified or new components
├── collections/      # Additional collections
└── config/           # Custom configurations
```

## How It Works

When running `make sync-dashboard VERSION=vX.X.X`, the sync process:

1. **Backs up** this `overrides/` folder
2. **Syncs** source files from Lego-Dashboard
3. **Restores** this `overrides/` folder

This ensures your customizations are never lost during updates.

## Adding Customizations

### Custom Block

```typescript
// overrides/blocks/CityMap/index.ts
import type { Block } from 'payload'

export const CityMapBlock: Block = {
  slug: 'cityMap',
  // ... your block definition
}
```

Then register it in your payload.config.ts or create a plugin.

### Custom Component

```typescript
// overrides/components/CityHeader/index.tsx
import React from 'react'

export const CityHeader: React.FC = () => {
  return <header>LegoCity Custom Header</header>
}
```

## Best Practices

1. **Document your customizations** - Add comments explaining why you modified something
2. **Check compatibility** - After syncing, verify your overrides still work
3. **Keep it minimal** - Only override what's necessary
4. **Consider contributing** - If your customization is useful for others, consider contributing it upstream to Lego-Dashboard

## Related

- [Downstream Projects Guide](https://ctu-sematx.github.io/Lego-Doc/development/downstream-projects.html)
- [Lego-Dashboard CHANGELOG](https://github.com/CTU-SematX/Lego-Dashboard/blob/main/CHANGELOG.md)
