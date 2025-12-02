import type { RequiredDataFromCollectionSlug } from 'payload'

export const ngsiSource: RequiredDataFromCollectionSlug<'ngsi-sources'> = {
  name: 'Local Orion',
  brokerUrl: 'http://localhost:1026',
  servicePath: [
    {
      value: '/',
    },
  ],
}
