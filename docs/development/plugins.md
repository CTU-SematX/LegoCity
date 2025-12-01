# Writing Payload plugins

This page explains how to **write PayloadCMS plugins for LegoCity**.

Plugins are how we package logic that:

- is reused across multiple collections or projects,
- integrates external tools (NGSI-LD helpers, AI, map config, etc.),
- we may want to publish later to the Payload plugin ecosystem.

The idea: **keep core LegoCity clean**, and move shared behaviours into small,
well-defined plugins.

---

## 1. When should you create a plugin?

Use a **plugin** instead of inline code when:

- The same fields / hooks are needed in _many_ collections.  
  → e.g. NGSI-LD metadata (`entityType`, `entityIdPattern`, `geoLocation`).

- You integrate an external service or tool.  
  → e.g. AI helpers, monitoring, audit logging, external registries.

- You want the feature to be **optional** or reusable in other projects.  
  → plugin is easier to enable/disable via `plugins: []`.

If the logic is **very specific** to a single collection, keep it in that
collection config. Otherwise, promote it to a plugin.

---

## 2. Prerequisites

You should be comfortable with:

- basic TypeScript or modern JavaScript,
- Payload configuration structure (`payload.config.ts`),
- how collections and fields are defined.

Official references (read later when needed):

- Payload docs: _Plugins_, _Collections_, _Fields_.

---

## 3. Recommended layout

In LegoCity we keep custom plugins in a dedicated folder so they can be reused
easily. A common pattern is:

````text
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
You can adapt the exact path to your repo, but the idea is:

one folder per plugin,

each folder exports a plugin factory function (e.g. ngsiLdPlugin()).

4. Minimal plugin example
A Payload plugin is just a function that receives the existing config and
returns a modified config.

4.1. Create the plugin file
Create `payload/plugins/payload-ngsi-ld/index.ts`:

```ts
// payload/plugins/payload-ngsi-ld/index.ts

import type { Config, Plugin } from 'payload';

// Optional options type for this plugin
export type NgsiLdPluginOptions = {
  /**
   * Optional prefix for entity IDs, e.g. "urn:ngsi-ld:LegoCity:"
   */
  entityIdPrefix?: string;
};

/**
 * Factory that returns a Payload plugin.
 * Usage in payload.config.ts: ngsiLdPlugin({ entityIdPrefix: 'urn:...' })
 */
export const ngsiLdPlugin =
  (options: NgsiLdPluginOptions = {}): Plugin<Config> =>
  (incomingConfig) => {
    const config = { ...incomingConfig };

    // Example: add a reusable "ngsiLdFields" field group to all collections
    // that opt in via `ngsiLdEnabled: true` in their custom config.
    config.collections = (config.collections || []).map((collection) => {
      if (!collection.admin?.meta?.ngsiLdEnabled) {
        return collection;
      }

      return {
        ...collection,
        fields: [
          // Group of NGSI-LD helper fields
          {
            name: 'ngsiLd',
            label: 'NGSI-LD metadata',
            type: 'group',
            fields: [
              {
                name: 'entityType',
                type: 'text',
                required: true,
              },
              {
                name: 'entityIdSuffix',
                type: 'text',
                admin: {
                  description:
                    'Suffix appended to the global entity ID prefix (configured in plugin options).',
                },
              },
              {
                name: 'geo',
                type: 'point',
                label: 'Location (WGS84)',
              },
            ],
          },

          // keep existing fields after our group
          ...(collection.fields || []),
        ],
      };
    });

    // You can store computed values in config for later use if needed
    config.custom = {
      ...(config.custom || {}),
      ngsiLdEntityIdPrefix: options.entityIdPrefix ?? 'urn:ngsi-ld:LegoCity:',
    };

    return config;
  };
````

Notes:

The plugin does not know about LegoCity UI directly. It only extends the
Payload config (fields, hooks, etc.). We use a small `NgsiLdPluginOptions`
type to make configuration explicit.

## 5. Registering the plugin

In your `payload.config.ts` (path may differ), import and register the plugin:

````ts
// payload/payload.config.ts

import { buildConfig } from 'payload/config';
import { ngsiLdPlugin } from './plugins/payload-ngsi-ld';

export default buildConfig({
  // ...existing config (collections, globals, etc.)

  collections: [
    {
      slug: 'layers',
      labels: { singular: 'Layer', plural: 'Layers' },
      // Custom flag: this collection wants NGSI-LD helper fields
      admin: {
        meta: {
          ngsiLdEnabled: true,
        },
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        // other layer-specific fields...
      ],
    },
    // other collections...
  ],

  plugins: [
    ngsiLdPlugin({
      entityIdPrefix: 'urn:ngsi-ld:LegoCity:',
    }),
    // other plugins (AI, map-config, etc.)
  ],
});


With this setup any collection where `admin.meta.ngsiLdEnabled === true`
receives the `ngsiLd` group auto-injected by the plugin. You can reuse the
same plugin in another project simply by installing and adding it to
`plugins`.

## 6. Adding hooks inside a plugin

Plugins can also add hooks (for example, to enforce rules or emit events).

In the same plugin file:

```ts
// Inside the ngsiLdPlugin factory, after computing `config`

config.collections = (config.collections || []).map((collection) => {
  if (!collection.admin?.meta?.ngsiLdEnabled) return collection;

  return {
    ...collection,
    // Keep existing hooks and add ours
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
````

This example:

- automatically computes a full `ngsiLd.entityId` before saving,
- uses a prefix from plugin options,
- keeps existing hooks intact.

Use hooks carefully; avoid heavy external calls in `beforeChange` if not
needed.

## 7. Configuration and options

Design plugin options so that LegoCity (or any other project) can configure
behaviour without editing plugin code. Good patterns:

- Booleans to toggle features (e.g. `enableHooks`)
- Lists of collection slugs to include/exclude (`includeCollections`)
- Strings for prefixes, base URLs, etc.

Example options type:

```ts
export type NgsiLdPluginOptions = {
  entityIdPrefix?: string;
  includeCollections?: string[]; // if set, only apply plugin to these slugs
};
```

In the plugin, check `options.includeCollections` when mapping collections
and skip collections that are not listed.

## 8. Local development & testing

When working on a plugin inside LegoCity:

1. Start the Payload dev server:

```bash
# inside the Payload project
pnpm dev
```

2. Open the Payload admin and navigate to a collection that uses the plugin.
3. Create/edit documents and verify:

- Plugin-injected fields appear as expected
- Hooks run correctly (IDs or metadata are filled in)
- No TypeScript or console errors

If you later extract the plugin into a separate package, create a small
test project that installs it and verify the plugin works outside LegoCity.

## 9. Packaging & publishing (optional)

If a plugin is generic, consider publishing it to npm or the Payload plugin
directory. High-level checklist:

- Add a `package.json` in the plugin folder with `name`, `version`, `main`/`exports`, and `peerDependencies` (include `payload`).
- Add a build step (compile TypeScript to `dist/` if using TS).
- Create a `README.md` documenting installation and options.
- Publish with `npm publish` (follow org policy), and optionally register in the Payload plugin directory.

For LegoCity itself, publishing is optional; keep plugins well scoped and
reusable.

## 10. Summary

- Plugins are functions that receive `incomingConfig` and return a modified `Config`.
- Use plugins for shared behaviours, integrations, and optional features.
- Keep options explicit, test locally, and preserve existing config/hook behaviour.

If you want, I can:

- extract the `ngsiLdPlugin` example into `payload/plugins/payload-ngsi-ld/index.ts`,
- add a test harness or simple unit tests, or
- add a `README.md` template for new plugins.
