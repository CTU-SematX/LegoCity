import type { CollectionConfig } from 'payload'

import { adminsOnly } from '../../access/adminsOnly'
import { seedModelsEndpoint } from './endpoints/seedModels'
import { authenticated } from '@/access/authenticated'

export const NgsiDataModels: CollectionConfig = {
  slug: 'ngsi-data-models',
  access: {
    create: adminsOnly,
    delete: adminsOnly,
    read: authenticated,
    update: adminsOnly,
  },
  endpoints: [
    {
      path: '/seed',
      method: 'get',
      handler: seedModelsEndpoint,
    },
  ],
  admin: {
    useAsTitle: 'model',
    description: 'NGSI-LD data models from Smart Data Models',
    group: 'Data Connections',
    defaultColumns: ['model', 'domains', 'contextUrl'],
    components: {
      afterListTable: ['@/collections/NgsiDataModels/ui/SyncButton#SyncButton'],
    },
  },
  fields: [
    {
      name: 'model',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'The entity type name (e.g., "Building", "Device")',
      },
    },
    {
      name: 'contextUrl',
      type: 'text',
      required: true,
      admin: {
        description: 'The direct URL to the context.jsonld file',
      },
    },
    {
      name: 'domains',
      type: 'relationship',
      relationTo: 'ngsi-domains',
      hasMany: true,
      admin: {
        description: 'The domains this data model belongs to',
      },
    },
    {
      name: 'repoLink',
      type: 'text',
      admin: {
        description: 'Link to the GitHub repository for this data model',
      },
    },
  ],
}
