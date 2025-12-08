import type { CollectionAfterDeleteHook } from 'payload'
import { NgsiLdOperations, NGSI_LD_CORE_CONTEXT } from '@/lib/ngsi-ld'

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

    // Resolve dataModel for context URL
    const dataModel =
      typeof doc.dataModel === 'object'
        ? doc.dataModel
        : await req.payload.findByID({
            collection: 'ngsi-data-models',
            id: doc.dataModel,
          })

    const contextUrl = dataModel?.contextUrl || NGSI_LD_CORE_CONTEXT

    // Create NGSI-LD operations client
    const ngsi = new NgsiLdOperations(
      {
        brokerUrl: source.brokerUrl,
        service: doc.service,
        servicePath: doc.servicePath,
        authToken: source.authToken,
      },
      contextUrl,
    )

    // DELETE /ngsi-ld/v1/entities/{entityId}
    await ngsi.deleteEntity(doc.entityId)

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
