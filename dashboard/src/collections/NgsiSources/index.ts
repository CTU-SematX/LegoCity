import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { healthCheckEndpoint } from './endpoints/healthCheck'
import {
  discoverEntitiesEndpoint,
  importEntitiesEndpoint,
  fetchEntityDetailsEndpoint,
  discoverTenantsEndpoint,
} from './endpoints/syncEntities'

export const NgsiSources: CollectionConfig = {
  slug: 'ngsi-sources',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  endpoints: [
    {
      path: '/health-check',
      method: 'post',
      handler: healthCheckEndpoint,
    },
    {
      path: '/discover-entities',
      method: 'post',
      handler: discoverEntitiesEndpoint,
    },
    {
      path: '/import-entities',
      method: 'post',
      handler: importEntitiesEndpoint,
    },
    {
      path: '/fetch-entity-details',
      method: 'post',
      handler: fetchEntityDetailsEndpoint,
    },
    {
      path: '/discover-tenants',
      method: 'post',
      handler: discoverTenantsEndpoint,
    },
  ],
  admin: {
    useAsTitle: 'name',
    description: 'Configure NGSI-LD Context Broker sources',
    group: 'Data Connections',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Connection',
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
              admin: {
                description: 'A friendly name for this NGSI source',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'brokerUrl',
                  type: 'text',
                  required: true,
                  defaultValue: 'http://localhost:1026',
                  admin: {
                    description: 'Base URL of the NGSI-LD Context Broker',
                    width: '70%',
                  },
                },
                {
                  name: 'proxyUrl',
                  type: 'text',
                  admin: {
                    description: 'Optional proxy URL',
                    width: '30%',
                  },
                },
              ],
            },
            {
              name: 'healthCheck',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/collections/NgsiSources/ui/HealthCheck#HealthCheck',
                },
              },
            },
          ],
        },
        {
          label: 'Tenants',
          description: 'Configure multi-tenancy (Fiware-Service headers)',
          fields: [
            {
              name: 'serviceHeader',
              type: 'array',
              label: 'Services (Tenants)',
              labels: {
                singular: 'Service',
                plural: 'Services',
              },
              admin: {
                description: 'Fiware-Service header values for multi-tenancy',
                initCollapsed: true,
              },
              fields: [
                {
                  name: 'value',
                  type: 'text',
                  label: 'Service Name',
                  admin: {
                    placeholder: 'e.g., openiot, smartcity',
                  },
                },
              ],
            },
            {
              name: 'servicePath',
              type: 'array',
              label: 'Service Paths',
              labels: {
                singular: 'Path',
                plural: 'Paths',
              },
              defaultValue: [{ value: '/' }],
              admin: {
                description: 'Fiware-ServicePath header values (e.g., /city/sensors)',
                initCollapsed: true,
              },
              fields: [
                {
                  name: 'value',
                  type: 'text',
                  label: 'Path',
                  admin: {
                    placeholder: 'e.g., /, /sensors, /city',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Sync Entities',
          description: 'Discover and import entities from broker',
          fields: [
            {
              name: 'syncEntities',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/collections/NgsiSources/ui/SyncEntities#SyncEntities',
                },
              },
            },
          ],
        },
      ],
    },
  ],
}
