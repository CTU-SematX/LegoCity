import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { revalidateDelete, revalidateMap } from './hooks/revalidateMap'

import { slugField } from 'payload'

export const Maps: CollectionConfig<'maps'> = {
  slug: 'maps',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  defaultPopulate: {
    title: true,
    slug: true,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'maps',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'maps',
        req,
      }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Map Layers',
          fields: [
            {
              name: 'layers',
              type: 'array',
              label: 'NGSI-LD Data Layers',
              admin: {
                description:
                  'Add layers to display NGSI-LD entities on the map. Each layer can show entities from a specific data model.',
              },
              fields: [
                {
                  name: 'name',
                  type: 'text',
                  required: true,
                  admin: {
                    description: 'Layer name for identification',
                  },
                },
                {
                  name: 'dataModel',
                  type: 'relationship',
                  relationTo: 'ngsi-data-models',
                  required: true,
                  admin: {
                    description: 'Select the NGSI-LD data model type to display',
                  },
                },
                {
                  name: 'source',
                  type: 'relationship',
                  relationTo: 'ngsi-sources',
                  required: true,
                  admin: {
                    description: 'Select the context broker source',
                  },
                },
                {
                  name: 'entities',
                  type: 'relationship',
                  relationTo: 'ngsi-entities',
                  hasMany: true,
                  admin: {
                    description:
                      'Select specific entities to display. Leave empty to query all entities of the selected model type.',
                  },
                  filterOptions: ({ siblingData }) => {
                    const data = siblingData as { dataModel?: { id?: string } | string }
                    const dataModelId =
                      typeof data?.dataModel === 'object' ? data?.dataModel?.id : data?.dataModel
                    if (!dataModelId) {
                      return false
                    }
                    return {
                      dataModel: { equals: dataModelId },
                    }
                  },
                },
                {
                  name: 'locationAttribute',
                  type: 'text',
                  admin: {
                    description:
                      'Attribute name containing GeoProperty (e.g., "location"). Leave empty to auto-detect.',
                    placeholder: 'location',
                  },
                },
                {
                  name: 'markerStyle',
                  type: 'group',
                  label: 'Marker Style',
                  fields: [
                    {
                      name: 'color',
                      type: 'text',
                      defaultValue: '#3b82f6',
                      admin: {
                        description: 'Marker color in hex format',
                      },
                    },
                    {
                      name: 'size',
                      type: 'number',
                      defaultValue: 12,
                      min: 4,
                      max: 48,
                      admin: {
                        description: 'Marker size in pixels',
                      },
                    },
                    {
                      name: 'icon',
                      type: 'select',
                      defaultValue: 'circle',
                      options: [
                        { label: 'Circle', value: 'circle' },
                        { label: 'Square', value: 'square' },
                        { label: 'Triangle', value: 'triangle' },
                        { label: 'Star', value: 'star' },
                        { label: 'Pin', value: 'pin' },
                      ],
                      admin: {
                        description: 'Marker icon shape',
                      },
                    },
                  ],
                },
                {
                  name: 'popupTemplate',
                  type: 'textarea',
                  admin: {
                    description:
                      'Template for marker popups. Use {{attribute.path}} syntax. Example: <h3>{{name}}</h3><p>Temperature: {{temperature.value}}</p>',
                  },
                },
                {
                  name: 'refreshInterval',
                  type: 'number',
                  defaultValue: 60,
                  min: 0,
                  admin: {
                    description:
                      'Data refresh interval in seconds. Set to 0 to disable auto-refresh.',
                  },
                },
                {
                  name: 'enabled',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: {
                    description: 'Enable or disable this layer',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Map Settings',
          fields: [
            {
              name: 'mapSettings',
              type: 'group',
              fields: [
                {
                  name: 'centerLng',
                  type: 'number',
                  defaultValue: 105.7718,
                  admin: {
                    description: 'Default center longitude',
                  },
                },
                {
                  name: 'centerLat',
                  type: 'number',
                  defaultValue: 10.0299,
                  admin: {
                    description: 'Default center latitude',
                  },
                },
                {
                  name: 'zoom',
                  type: 'number',
                  defaultValue: 12,
                  min: 1,
                  max: 20,
                  admin: {
                    description: 'Default zoom level (1-20)',
                  },
                },
                {
                  name: 'mapStyle',
                  type: 'select',
                  defaultValue: 'streets-v12',
                  options: [
                    { label: 'Streets', value: 'streets-v12' },
                    { label: 'Satellite', value: 'satellite-v9' },
                    { label: 'Satellite Streets', value: 'satellite-streets-v12' },
                    { label: 'Outdoors', value: 'outdoors-v12' },
                    { label: 'Light', value: 'light-v11' },
                    { label: 'Dark', value: 'dark-v11' },
                  ],
                  admin: {
                    description: 'Mapbox map style',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    slugField(),
  ],
  hooks: {
    afterChange: [revalidateMap],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100, // For optimal live preview
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
