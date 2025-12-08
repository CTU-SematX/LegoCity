import type { Field, GroupField } from 'payload'
import deepMerge from '@/utilities/deepMerge'

export type AttributeSelectionMode = 'all' | 'include' | 'exclude'

export interface NgsiDataSourceOptions {
  /**
   * Allow selecting multiple entities (query mode)
   */
  multipleEntities?: boolean
  /**
   * Show refresh interval field
   */
  showRefreshInterval?: boolean
  /**
   * Default refresh interval in seconds
   */
  defaultRefreshInterval?: number
  /**
   * Show attribute selection fields (for Table/Map blocks)
   * Template-based blocks (Card) don't need this
   */
  showAttributeSelection?: boolean
  /**
   * Additional fields to add after data source fields
   */
  additionalFields?: Field[]
  /**
   * Override group field properties
   */
  overrides?: Partial<GroupField>
}

/**
 * Simplified NGSI-LD data source configuration.
 * Only requires entity selection - broker/tenant info is read from the entity.
 *
 * @example
 * ```ts
 * // In block config.ts
 * import { ngsiDataSource } from '@/blocks/NgsiBlocks/fields/ngsiDataSource'
 *
 * export const NgsiCard: Block = {
 *   slug: 'ngsiCard',
 *   fields: [
 *     ngsiDataSource({ showRefreshInterval: true }),
 *     // other block-specific fields...
 *   ],
 * }
 * ```
 */
export const ngsiDataSource = (options: NgsiDataSourceOptions = {}): Field => {
  const {
    multipleEntities = false,
    showRefreshInterval = true,
    defaultRefreshInterval = 0,
    showAttributeSelection = false,
    additionalFields = [],
    overrides = {},
  } = options

  const baseFields: Field[] = []

  // Entity selection - single or multiple
  if (multipleEntities) {
    // For multiple entities, we need entity type and query
    baseFields.push(
      {
        name: 'source',
        type: 'relationship',
        relationTo: 'ngsi-sources',
        required: true,
        admin: {
          description: 'Select the NGSI-LD broker for querying multiple entities',
        },
      },
      {
        name: 'entityType',
        type: 'text',
        required: true,
        admin: {
          description: 'Entity type to query (e.g., WeatherObserved)',
          placeholder: 'WeatherObserved',
        },
      },
      {
        name: 'query',
        type: 'text',
        admin: {
          description: 'NGSI-LD query string (optional)',
          placeholder: 'e.g., temperature>20',
        },
      },
      {
        name: 'limit',
        type: 'number',
        defaultValue: 10,
        min: 1,
        max: 100,
        admin: {
          description: 'Maximum number of entities to fetch',
        },
      },
    )
  } else {
    // Single entity mode - just select entity (broker/tenant read from entity)
    baseFields.push({
      name: 'entity',
      type: 'relationship',
      relationTo: 'ngsi-entities',
      required: true,
      admin: {
        description:
          'Select the NGSI-LD entity to display. Broker and tenant info will be read from the entity.',
      },
    })
  }

  // Attribute selection (optional, for Table/Map blocks)
  if (showAttributeSelection) {
    baseFields.push(
      {
        name: 'attributeSelection',
        type: 'select',
        defaultValue: 'all',
        options: [
          { label: 'Show all attributes', value: 'all' },
          { label: 'Include only selected', value: 'include' },
          { label: 'Exclude selected', value: 'exclude' },
        ],
        admin: {
          description: 'How to filter entity attributes for display',
        },
      },
      {
        name: 'selectedAttributes',
        type: 'array',
        admin: {
          description: 'Attributes to include or exclude based on selection mode',
          condition: (_data, siblingData) => {
            return siblingData?.attributeSelection !== 'all'
          },
        },
        fields: [
          {
            name: 'attribute',
            type: 'text',
            required: true,
            admin: {
              placeholder: 'e.g., temperature, humidity',
            },
          },
        ],
      },
    )
  }

  // Refresh interval
  if (showRefreshInterval) {
    baseFields.push({
      name: 'refreshInterval',
      type: 'number',
      defaultValue: defaultRefreshInterval,
      min: 0,
      admin: {
        description: 'Auto-refresh interval in seconds. Set 0 to disable.',
      },
    })
  }

  // Merge with additional fields
  const allFields = [...baseFields, ...additionalFields]

  const groupField: GroupField = {
    name: 'dataSource',
    type: 'group',
    label: 'Data Source',
    admin: {
      description: 'Configure NGSI-LD entity data source',
    },
    fields: allFields,
  }

  return deepMerge(groupField, overrides) as Field
}
