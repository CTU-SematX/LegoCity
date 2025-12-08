import type { Block } from 'payload'
import { ngsiDataSource } from '../fields/ngsiDataSource'

export const NgsiCard: Block = {
  slug: 'ngsiCard',
  interfaceName: 'NgsiCardBlock',
  labels: {
    singular: 'NGSI Card',
    plural: 'NGSI Cards',
  },
  fields: [
    ngsiDataSource({
      showRefreshInterval: true,
      defaultRefreshInterval: 30,
      overrides: {
        admin: {
          description:
            'Select an entity to display. Broker and tenant info are read from the entity.',
        },
      },
    }),
    {
      name: 'cardContent',
      type: 'group',
      label: 'Card Content',
      admin: {
        description: 'Use {{data.attributeName}} syntax for placeholders.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Title Template',
          admin: {
            description: 'Leave empty to use entity type as title.',
            placeholder: 'e.g., {{data.name}} or Building Info',
          },
        },
        {
          name: 'content',
          type: 'textarea',
          label: 'Content Template',
          admin: {
            description: 'Use {{data.xxx}} for attribute values, {{entityId}} for URN.',
            placeholder:
              '📍 {{data.address.streetAddress}}\n{{data.address.addressLocality}}, {{data.address.addressCountry}}\n\nCategory: {{data.category}}',
            rows: 6,
            components: {
              Field: '@/blocks/NgsiBlocks/NgsiCard/ContentTemplateField#ContentTemplateField',
            },
          },
        },
        {
          name: 'showEntityId',
          type: 'checkbox',
          defaultValue: false,
          label: 'Show Entity ID',
          admin: {
            description: 'Display the full entity URN below the title.',
          },
        },
        {
          name: 'showLastUpdated',
          type: 'checkbox',
          defaultValue: true,
          label: 'Show Last Updated Time',
          admin: {
            description: 'Display when the data was last refreshed.',
          },
        },
      ],
    },
  ],
}
