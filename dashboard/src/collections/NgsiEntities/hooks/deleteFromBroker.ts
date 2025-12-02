import type { CollectionAfterDeleteHook } from 'payload'
import { createNgsiClient } from '@/lib/ngsi-client'

export const deleteFromBrokerAfterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  try {
    // Resolve source relationship for broker URL
    const source =
      typeof doc.source === 'object'
        ? doc.source
        : await req.payload.findByID({
            collection: 'ngsi-sources',
            id: doc.source,
          })

    if (!source) {
      req.payload.logger.warn(`Source not found for entity ${doc.entityId}, skipping broker delete`)
      return doc
    }

    // Create NGSI-LD client
    const client = createNgsiClient({
      brokerUrl: source.brokerUrl,
      service: doc.service,
      servicePath: doc.servicePath,
      authToken: source.authToken,
    })

    // DELETE /ngsi-ld/v1/entities/{entityId}
    await client.delete(`/ngsi-ld/v1/entities/${encodeURIComponent(doc.entityId)}`)

    req.payload.logger.info(`Entity ${doc.entityId} deleted from broker successfully`)
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'response' in error
          ? JSON.stringify((error as any).response?.data || error)
          : 'Unknown error'

    // Log but don't throw - entity is already deleted from Payload
    req.payload.logger.error(`Failed to delete entity ${doc.entityId} from broker: ${errorMessage}`)
  }

  return doc
}
