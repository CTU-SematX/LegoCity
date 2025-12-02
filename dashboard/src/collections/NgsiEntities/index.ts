import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
// Import các hooks
import { syncToBrokerAfterChange } from './hooks/syncToBroker'
import { deleteFromBrokerAfterDelete } from './hooks/deleteFromBroker'
import { fetchEntityEndpoint, resyncEntityEndpoint } from './endpoints/entityActions'

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
                      const type = modelDoc?.model || data.type || 'Entity'
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
                  'JSON object containing properties and relationships (exclude id, type, @context)',
              },
            },
          ],
        },
        // TAB 2: Trạng thái & Logs (Sync Status)
        {
          label: 'Sync Status',
          fields: [
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
                    readOnly: true, // Chỉ hook mới được sửa
                    position: 'sidebar',
                  },
                },
                {
                  name: 'lastSyncTime',
                  type: 'date',
                  admin: {
                    readOnly: true,
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
                style: { color: 'red' },
              },
            },
          ],
        },
        // TAB 3: Tương tác & Code (Developer Tools)
        {
          label: 'Interact & Guide',
          fields: [
            {
              name: 'interactionUI',
              type: 'ui',
              admin: {
                components: {
                  // Custom Component cho các nút Test GET/PUT và Code Viewer
                  Field: '@/collections/NgsiEntities/ui/EntityInteraction#EntityInteraction',
                },
              },
            },
          ],
        },
      ],
    },
    // Field ẩn để lưu owner nếu cần phân quyền sau này
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
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
  ],
  hooks: {
    afterChange: [syncToBrokerAfterChange],
    afterDelete: [deleteFromBrokerAfterDelete],
  },
}
