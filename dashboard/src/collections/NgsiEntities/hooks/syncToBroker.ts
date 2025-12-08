import type { CollectionAfterChangeHook } from 'payload'
import { NgsiLdOperations, NGSI_LD_CORE_CONTEXT } from '@/lib/ngsi-ld'

export const syncToBrokerAfterChange: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
  context,
}) => {
  // Prevent infinite loops when updating sync status
  if (context?.skipSync) {
    return doc
  }

  try {
    // Resolve source relationship for broker URL
    const source =
      typeof doc.source === 'object'
        ? doc.source
        : await req.payload.findByID({
            collection: 'ngsi-sources',
            id: doc.source,
          })

    // Resolve dataModel relationship for context URL and type
    const dataModel =
      typeof doc.dataModel === 'object'
        ? doc.dataModel
        : await req.payload.findByID({
            collection: 'ngsi-data-models',
            id: doc.dataModel,
          })

    if (!source || !dataModel) {
      throw new Error('Source or DataModel not found')
    }

    // Create NGSI-LD operations client
    const ngsi = new NgsiLdOperations(
      {
        brokerUrl: source.brokerUrl,
        service: doc.service,
        servicePath: doc.servicePath,
        authToken: source.authToken,
      },
      dataModel.contextUrl || NGSI_LD_CORE_CONTEXT,
    )

    // Extract short type name (without URL prefix) for proper NGSI-LD format
    let entityType = doc.type || dataModel.model
    if (entityType && entityType.includes('/')) {
      entityType = entityType.split('/').pop() || entityType
    }

    if (operation === 'create') {
      // POST /ngsi-ld/v1/entities - Create new entity
      const entityBody = {
        id: doc.entityId,
        type: entityType,
        ...doc.attributes,
      }

      await ngsi.createEntity(entityBody)
    } else if (operation === 'update') {
      // PATCH /ngsi-ld/v1/entities/{entityId}/attrs - Update attributes
      if (doc.attributes) {
        await ngsi.updateEntityAttrs(doc.entityId, doc.attributes)
      }
    }

    // Update sync status to success
    await req.payload.update({
      collection: 'ngsi-entities',
      id: doc.id,
      data: {
        syncStatus: 'synced',
        lastSyncTime: new Date().toISOString(),
        lastSyncError: null,
      },
      context: {
        skipSync: true,
      },
    })

    req.payload.logger.info(`Entity ${doc.entityId} synced successfully (${operation})`)
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'response' in error
          ? JSON.stringify((error as any).response?.data || error)
          : 'Unknown error'

    req.payload.logger.error(`Failed to sync entity ${doc.entityId}: ${errorMessage}`)

    // Update sync status to error
    await req.payload.update({
      collection: 'ngsi-entities',
      id: doc.id,
      data: {
        syncStatus: 'error',
        lastSyncTime: new Date().toISOString(),
        lastSyncError: errorMessage,
      },
      context: {
        skipSync: true,
      },
    })
  }

  return doc
}
