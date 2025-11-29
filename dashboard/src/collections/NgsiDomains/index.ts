import type { CollectionConfig } from 'payload'

import { adminsOnly } from '../../access/adminsOnly'
import { anyone } from '../../access/anyone'

export const NgsiDomains: CollectionConfig = {
  slug: 'ngsi-domains',
  access: {
    create: adminsOnly,
    delete: adminsOnly,
    read: anyone,
    update: adminsOnly,
  },
  admin: {
    useAsTitle: 'name',
    description: 'NGSI-LD data model domains',
    group: 'Data Connections',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Domain name (e.g., "SmartCities", "SmartAgrifood")',
      },
    },
  ],
}
