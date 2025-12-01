# Viết Payload plugins

Trang này giải thích cách **viết PayloadCMS plugins cho LegoCity**.

Plugins là cách chúng ta đóng gói logic mà:

- được tái sử dụng trên nhiều collections hoặc projects,
- tích hợp external tools (NGSI-LD helpers, AI, map config, v.v.),
- chúng ta có thể muốn publish sau này tới Payload plugin ecosystem.

Ý tưởng: **giữ core LegoCity clean**, và move shared behaviours vào các
plugins nhỏ, well-defined.

---

## 1. Khi nào nên tạo plugin?

Use một **plugin** thay vì inline code khi:

- Same fields / hooks are needed trong _many_ collections.  
  → e.g. NGSI-LD metadata (`entityType`, `entityIdPattern`, `geoLocation`).

- Bạn integrate một external service hoặc tool.  
  → e.g. AI helpers, monitoring, audit logging, external registries.

- Bạn muốn feature là **optional** hoặc reusable trong other projects.  
  → plugin là easier để enable/disable via `plugins: []`.

Nếu logic là **very specific** cho một single collection, keep nó trong
collection config đó. Otherwise, promote nó thành plugin.

---

## 2. Prerequisites

Bạn nên comfortable với:

- basic TypeScript hoặc modern JavaScript,
- Payload configuration structure (`payload.config.ts`),
- how collections và fields are defined.

Official references (read later khi needed):

- Payload docs: _Plugins_, _Collections_, _Fields_.

---

## 3. Recommended layout

Trong LegoCity chúng ta keep custom plugins trong một dedicated folder để chúng có thể được reused
easily. Một common pattern là:

```text
LegoCity/
  payload/
    payload.config.ts
    plugins/
      payload-ngsi-ld/
        index.ts
      payload-map-config/
        index.ts
      payload-ai-helpers/
        index.ts
```

Bạn có thể adapt exact path cho repo của bạn, nhưng ý tưởng là:

- one folder per plugin,
- mỗi folder exports một plugin factory function (e.g. `ngsiLdPlugin()`).

---

## 4. Minimal plugin example

Một Payload plugin chỉ là một function nhận existing config và
returns một modified config.

### 4.1. Create the plugin file

Create `payload/plugins/payload-ngsi-ld/index.ts`:

```ts
// payload/plugins/payload-ngsi-ld/index.ts

import type { Config, Plugin } from "payload";

// Optional options type cho plugin này
export type NgsiLdPluginOptions = {
  /**
   * Optional prefix cho entity IDs, e.g. "urn:ngsi-ld:LegoCity:"
   */
  entityIdPrefix?: string;
};

/**
 * Factory returns một Payload plugin.
 * Usage trong payload.config.ts: ngsiLdPlugin({ entityIdPrefix: 'urn:...' })
 */
export const ngsiLdPlugin =
  (options: NgsiLdPluginOptions = {}): Plugin<Config> =>
  (incomingConfig) => {
    const config = { ...incomingConfig };

    // Example: add một reusable "ngsiLdFields" field group tới all collections
    // opt in via `ngsiLdEnabled: true` trong custom config của chúng.
    config.collections = (config.collections || []).map((collection) => {
      if (!collection.admin?.meta?.ngsiLdEnabled) {
        return collection;
      }

      return {
        ...collection,
        fields: [
          // Group of NGSI-LD helper fields
          {
            name: "ngsiLd",
            label: "NGSI-LD metadata",
            type: "group",
            fields: [
              {
                name: "entityType",
                type: "text",
                required: true,
              },
              {
                name: "entityIdSuffix",
                type: "text",
                admin: {
                  description:
                    "Suffix appended to the global entity ID prefix (configured in plugin options).",
                },
              },
              {
                name: "geo",
                type: "point",
                label: "Location (WGS84)",
              },
            ],
          },

          // keep existing fields after our group
          ...(collection.fields || []),
        ],
      };
    });

    // Bạn có thể store computed values trong config cho later use nếu needed
    config.custom = {
      ...(config.custom || {}),
      ngsiLdEntityIdPrefix: options.entityIdPrefix ?? "urn:ngsi-ld:LegoCity:",
    };

    return config;
  };
```

Notes:

- Plugin không know về LegoCity UI directly. Nó chỉ extends
  Payload config (fields, hooks, v.v.).
- Chúng ta use một small `NgsiLdPluginOptions` type để make configuration explicit.

---

## 5. Registering the plugin

Trong `payload.config.ts` của bạn (path có thể differ), import và register plugin:

```ts
// payload/payload.config.ts

import { buildConfig } from "payload/config";
import { ngsiLdPlugin } from "./plugins/payload-ngsi-ld";

export default buildConfig({
  // ...existing config (collections, globals, etc.)

  collections: [
    {
      slug: "layers",
      labels: { singular: "Layer", plural: "Layers" },
      // Custom flag: collection này wants NGSI-LD helper fields
      admin: {
        meta: {
          ngsiLdEnabled: true,
        },
      },
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
        },
        // other layer-specific fields...
      ],
    },
    // other collections...
  ],

  plugins: [
    ngsiLdPlugin({
      entityIdPrefix: "urn:ngsi-ld:LegoCity:",
    }),
    // other plugins (AI, map-config, etc.)
  ],
});
```

Với setup này, bất kỳ collection nào mà `admin.meta.ngsiLdEnabled === true`
receives `ngsiLd` group auto-injected bởi plugin. Bạn có thể reuse
cùng plugin trong another project simply bằng cách installing và adding nó tới
`plugins`.

---

## 6. Adding hooks inside a plugin

Plugins cũng có thể add hooks (for example, để enforce rules hoặc emit events).

Trong cùng plugin file:

```ts
// Inside ngsiLdPlugin factory, after computing `config`

config.collections = (config.collections || []).map((collection) => {
  if (!collection.admin?.meta?.ngsiLdEnabled) return collection;

  return {
    ...collection,
    // Keep existing hooks và add ours
    hooks: {
      ...(collection.hooks || {}),
      beforeChange: [
        // our hook
        async ({ data, originalDoc, req }) => {
          const prefix = config.custom?.ngsiLdEntityIdPrefix as string;

          if (!data.ngsiLd?.entityIdSuffix) {
            return data; // nothing to do
          }

          data.ngsiLd.entityId = `${prefix}${data.ngsiLd.entityIdSuffix}`;

          return data;
        },
        // keep any existing hooks
        ...(collection.hooks?.beforeChange || []),
      ],
    },
  };
});
```

Example này:

- automatically computes một full `ngsiLd.entityId` before saving,
- uses một prefix từ plugin options,
- keeps existing hooks intact.

Use hooks carefully; avoid heavy external calls trong `beforeChange` nếu không
needed.

---

## 7. Configuration and options

Design plugin options để LegoCity (hoặc any other project) có thể configure
behaviour without editing plugin code. Good patterns:

- Booleans để toggle features (e.g. `enableHooks`)
- Lists của collection slugs để include/exclude (`includeCollections`)
- Strings cho prefixes, base URLs, v.v.

Example options type:

```ts
export type NgsiLdPluginOptions = {
  entityIdPrefix?: string;
  includeCollections?: string[]; // nếu set, chỉ apply plugin tới these slugs
};
```

Trong plugin, check `options.includeCollections` khi mapping collections
và skip collections không listed.

---

## 8. Local development & testing

Khi working on một plugin inside LegoCity:

1. Start Payload dev server:

```bash
# inside the Payload project
pnpm dev
```

2. Open Payload admin và navigate tới một collection uses plugin.
3. Create/edit documents và verify:

- Plugin-injected fields appear như expected
- Hooks run correctly (IDs hoặc metadata are filled in)
- No TypeScript hoặc console errors

Nếu bạn later extract plugin vào một separate package, create một small
test project installs nó và verify plugin works outside LegoCity.

---

## 9. Packaging & publishing (optional)

Nếu một plugin là generic, consider publishing nó tới npm hoặc Payload plugin
directory. High-level checklist:

- Add một `package.json` trong plugin folder với `name`, `version`, `main`/`exports`, và `peerDependencies` (include `payload`).
- Add một build step (compile TypeScript tới `dist/` nếu using TS).
- Create một `README.md` documenting installation và options.
- Publish với `npm publish` (follow org policy), và optionally register trong Payload plugin directory.

Cho LegoCity itself, publishing là optional; keep plugins well scoped và
reusable.

---

## 10. Summary

- Plugins là functions nhận `incomingConfig` và return một modified `Config`.
- Use plugins cho shared behaviours, integrations, và optional features.
- Keep options explicit, test locally, và preserve existing config/hook behaviour.

Nếu bạn muốn, tôi có thể:

- extract `ngsiLdPlugin` example vào `payload/plugins/payload-ngsi-ld/index.ts`,
- add một test harness hoặc simple unit tests, hoặc
- add một `README.md` template cho new plugins.
