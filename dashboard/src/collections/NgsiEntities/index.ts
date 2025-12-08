import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
// Import các hooks
import { syncToBrokerAfterChange } from './hooks/syncToBroker'
import { deleteFromBrokerAfterDelete } from './hooks/deleteFromBroker'
import {
  fetchEntityEndpoint,
  resyncEntityEndpoint,
  updateAttrsEndpoint,
  brokerApiEndpoint,
  appendAttrsEndpoint,
  deleteAttrEndpoint,
  queryEntitiesEndpoint,
} from './endpoints/entityActions'

export const NgsiEntities: CollectionConfig = {
  slug: 'ngsi-entities',
  admin: {
    useAsTitle: 'entityId',
    defaultColumns: ['entityId', 'type', 'syncStatus', 'updatedAt'],
    group: 'Data Connections',
    description: 'Manage specific NGSI-LD Entities synced with Context Broker',
  },
  access: {
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  endpoints: [
    {
      path: '/:id/fetch',
      method: 'get',
      handler: fetchEntityEndpoint,
    },
    {
      path: '/:id/resync',
      method: 'post',
      handler: resyncEntityEndpoint,
    },
    {
      path: '/:id/update-attrs',
      method: 'post',
      handler: updateAttrsEndpoint,
    },
    {
      path: '/:id/broker',
      method: 'post',
      handler: brokerApiEndpoint,
    },
    {
      path: '/:id/append-attrs',
      method: 'post',
      handler: appendAttrsEndpoint,
    },
    {
      path: '/:id/delete-attr',
      method: 'post',
      handler: deleteAttrEndpoint,
    },
    {
      path: '/:id/query',
      method: 'get',
      handler: queryEntitiesEndpoint,
    },
  ],
  fields: [
    {
      type: 'tabs',
      tabs: [
        // TAB 1: Cấu hình chính (General Information)
        {
          label: 'General',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'dataModel',
                  type: 'relationship',
                  relationTo: 'ngsi-data-models',
                  required: true,
                  admin: {
                    description: 'Select the Type & Context for this entity',
                    width: '50%',
                  },
                },
                {
                  name: 'type',
                  type: 'text',
                  admin: {
                    readOnly: true,
                    description: 'Auto-populated from Data Model',
                    width: '50%',
                  },
                  hooks: {
                    beforeChange: [
                      async ({ data, req }) => {
                        if (data?.dataModel) {
                          const modelDoc = await req.payload.findByID({
                            collection: 'ngsi-data-models',
                            id: data.dataModel,
                          })
                          return modelDoc?.model || data.type
                        }
                        return data?.type
                      },
                    ],
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'shortId',
                  type: 'text',
                  required: true,
                  label: 'Entity ID',
                  admin: {
                    placeholder: '001',
                    description: 'Short identifier (e.g., "001", "store001")',
                    width: '30%',
                  },
                },
                {
                  name: 'entityIdPreview',
                  type: 'ui',
                  admin: {
                    components: {
                      Field: '@/collections/NgsiEntities/ui/EntityIdPreview#EntityIdPreview',
                    },
                  },
                },
              ],
            },
            {
              name: 'entityId',
              type: 'text',
              required: true,
              unique: true,
              index: true,
              admin: {
                hidden: true,
              },
              hooks: {
                beforeChange: [
                  async ({ data, req }) => {
                    if (data?.shortId && data?.dataModel) {
                      const modelDoc = await req.payload.findByID({
                        collection: 'ngsi-data-models',
                        id: data.dataModel,
                      })
                      // Extract simple type name from URL if needed
                      let type = modelDoc?.model || data.type || 'Entity'
                      if (type.includes('/')) {
                        type = type.split('/').pop() || type
                      }
                      return `urn:ngsi-ld:${type}:${data.shortId}`
                    }
                    return data?.entityId
                  },
                ],
              },
            },
            {
              name: 'source',
              type: 'relationship',
              relationTo: 'ngsi-sources',
              required: true,
              label: 'Broker Connection',
            },
            // Service & ServicePath populated from Source
            {
              type: 'row',
              fields: [
                {
                  name: 'service',
                  type: 'text',
                  admin: {
                    description: 'Select Fiware-Service from source or leave empty',
                    components: {
                      Field: '@/collections/NgsiEntities/ui/ServiceSelect#ServiceSelect',
                    },
                  },
                },
                {
                  name: 'servicePath',
                  type: 'text',
                  required: true,
                  defaultValue: '/',
                  admin: {
                    description: 'Select Fiware-ServicePath from source',
                    components: {
                      Field: '@/collections/NgsiEntities/ui/ServicePathSelect#ServicePathSelect',
                    },
                  },
                },
              ],
            },
            {
              name: 'attributes',
              type: 'json',
              required: true,
              label: 'Entity Attributes',
              admin: {
                description:
                  'JSON object containing properties and relationships (exclude id, type, @context). Use "Fetch Example" to load sample data.',
                condition: (_, siblingData) => !siblingData?.id,
                components: {
                  Field: '@/collections/NgsiEntities/ui/AttributesField#AttributesField',
                },
              },
            },
          ],
        },
        // TAB 2: Interact & Guide (Developer Tools)
        {
          label: 'Interact & Guide',
          fields: [
            {
              name: 'interactionUI',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/collections/NgsiEntities/ui/EntityInteraction#EntityInteraction',
                },
              },
            },
          ],
        },
        // TAB 3: Sync & Ownership
        {
          label: 'Sync Status',
          fields: [
            {
              name: 'owner',
              type: 'relationship',
              relationTo: 'users',
              admin: {
                readOnly: true,
              },
              hooks: {
                beforeChange: [
                  ({ req, operation, value }) => {
                    if (operation === 'create' && req.user) {
                      return req.user.id
                    }
                    return value
                  },
                ],
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'syncStatus',
                  type: 'select',
                  options: [
                    { label: 'Synced', value: 'synced' },
                    { label: 'Error', value: 'error' },
                    { label: 'Pending', value: 'pending' },
                  ],
                  defaultValue: 'pending',
                  admin: {
                    readOnly: true,
                    width: '50%',
                  },
                },
                {
                  name: 'lastSyncTime',
                  type: 'date',
                  admin: {
                    readOnly: true,
                    width: '50%',
                    date: { pickerAppearance: 'dayAndTime' },
                  },
                },
              ],
            },
            {
              name: 'lastSyncError',
              type: 'textarea',
              admin: {
                readOnly: true,
                rows: 3,
              },
            },
            {
              name: 'attributePaths',
              type: 'json',
              admin: {
                readOnly: true,
                description:
                  'Pre-computed attribute paths for autocomplete (auto-populated on sync)',
              },
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [syncToBrokerAfterChange],
    afterDelete: [deleteFromBrokerAfterDelete],
  },
}
