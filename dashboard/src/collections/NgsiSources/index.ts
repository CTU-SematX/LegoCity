import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { healthCheckEndpoint } from './endpoints/healthCheck'

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
  ],
  admin: {
    useAsTitle: 'name',
    description: 'Configure NGSI-LD Context Broker sources',
    group: 'Data Connections',
  },
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
      name: 'brokerUrl',
      type: 'text',
      required: true,
      defaultValue: 'http://localhost:1026',
      admin: {
        description: 'The base URL of the NGSI-LD Context Broker',
      },
    },
    {
      name: 'proxyUrl',
      type: 'text',
      admin: {
        description: 'Optional proxy URL if the broker requires a proxy',
      },
    },
    {
      name: 'serviceHeader',
      type: 'array',
      admin: {
        description: 'Fiware-Service header values for multi-tenancy (add one or more)',
      },
      fields: [
        {
          name: 'value',
          type: 'text',
        },
      ],
    },
    {
      name: 'servicePath',
      type: 'array',
      defaultValue: [
        {
          value: '/',
        },
      ],
      admin: {
        description:
          'Fiware-ServicePath header values (e.g., /city/sensors). Multiple entries allowed.',
      },
      fields: [
        {
          name: 'value',
          type: 'text',
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
}
