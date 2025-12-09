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
    defaultColumns: ['model', 'repoName', 'domains', 'contextUrl'],
    components: {
      afterListTable: ['@/collections/NgsiDataModels/ui/SyncButton#SyncButton'],
    },
    listSearchableFields: ['model', 'repoName'],
  },
  // Compound index for model + repoName uniqueness
  indexes: [
    {
      fields: ['model', 'repoName'],
      unique: true,
    },
  ],
  fields: [
    {
      name: 'model',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'The entity type name (e.g., "Building", "Device")',
      },
      validate: (value) => {
        if (!value || typeof value !== 'string' || value.trim() === '') {
          return 'Model name is required'
        }
        return true
      },
    },
    {
      name: 'repoName',
      type: 'text',
      index: true,
      admin: {
        description: 'Repository name from Smart Data Models (e.g., "dataModel.Building")',
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
