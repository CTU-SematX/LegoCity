import type { PayloadHandler } from 'payload'
import { createNgsiClient, NGSI_LD_CORE_CONTEXT } from '@/lib/ngsi-client'
import axios from 'axios'

export const fetchEntityEndpoint: PayloadHandler = async (req) => {
  const id = req.routeParams?.id as string

  if (!id) {
    return Response.json({ error: 'Entity ID is required' }, { status: 400 })
  }

  try {
    const entity = await req.payload.findByID({
      collection: 'ngsi-entities',
      id,
      depth: 2,
    })

    if (!entity) {
      return Response.json({ error: 'Entity not found in Payload' }, { status: 404 })
    }

    const source = entity.source as any
    const dataModel = entity.dataModel as any

    if (!source?.brokerUrl) {
      return Response.json({ error: 'Source broker URL not configured' }, { status: 400 })
    }

    if (!entity.entityId) {
      return Response.json({ error: 'Entity ID (URN) not set' }, { status: 400 })
    }

    const client = createNgsiClient({
      brokerUrl: source.brokerUrl,
      service: entity.service || undefined,
      servicePath: entity.servicePath,
      authToken: source.authToken,
    })

    const contextUrl = dataModel?.contextUrl || NGSI_LD_CORE_CONTEXT

    // NGSI-LD GET entity - use application/ld+json to get context embedded
    const response = await client.get(
      `/ngsi-ld/v1/entities/${encodeURIComponent(entity.entityId)}`,
      {
        headers: {
          Accept: 'application/ld+json',
        },
      },
    )

    return Response.json(response.data)
  } catch (error) {
    let errorMessage = 'Unknown error'
    let statusCode = 500

    if (axios.isAxiosError(error)) {
      statusCode = error.response?.status || 500
      errorMessage = error.response?.data?.detail || error.response?.data?.title || error.message

      // If entity not found in broker
      if (statusCode === 404) {
        errorMessage = 'Entity not found in Context Broker. Try "Force Resync" to create it.'
      }
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    return Response.json({ error: errorMessage }, { status: statusCode })
  }
}

export const resyncEntityEndpoint: PayloadHandler = async (req) => {
  const id = req.routeParams?.id as string

  if (!id) {
    return Response.json({ error: 'Entity ID is required' }, { status: 400 })
  }

  try {
    const entity = await req.payload.findByID({
      collection: 'ngsi-entities',
      id,
      depth: 2,
    })

    if (!entity) {
      return Response.json({ error: 'Entity not found' }, { status: 404 })
    }

    const source = entity.source as any
    const dataModel = entity.dataModel as any

    if (!source?.brokerUrl) {
      return Response.json({ error: 'Source broker URL not configured' }, { status: 400 })
    }

    const client = createNgsiClient({
      brokerUrl: source.brokerUrl,
      service: entity.service,
      servicePath: entity.servicePath,
      authToken: source.authToken,
    })

    const contextArray = [dataModel?.contextUrl || NGSI_LD_CORE_CONTEXT, NGSI_LD_CORE_CONTEXT]

    // Try to check if entity exists first
    try {
      await client.get(`/ngsi-ld/v1/entities/${encodeURIComponent(entity.entityId)}`)

      // Entity exists, do PATCH
      const attrsBody = {
        '@context': contextArray,
        ...entity.attributes,
      }

      await client.patch(
        `/ngsi-ld/v1/entities/${encodeURIComponent(entity.entityId)}/attrs`,
        attrsBody,
      )
    } catch (getError: any) {
      if (getError.response?.status === 404) {
        // Entity doesn't exist, do POST
        const entityBody = {
          id: entity.entityId,
          type: entity.type || dataModel?.model,
          '@context': contextArray,
          ...entity.attributes,
        }

        await client.post('/ngsi-ld/v1/entities', entityBody)
      } else {
        throw getError
      }
    }

    // Update sync status
    await req.payload.update({
      collection: 'ngsi-entities',
      id,
      data: {
        syncStatus: 'synced',
        lastSyncTime: new Date().toISOString(),
        lastSyncError: null,
      },
      context: {
        skipSync: true,
      },
    })

    return Response.json({ message: 'Entity resynced successfully' })
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'response' in error
          ? JSON.stringify((error as any).response?.data || error)
          : 'Unknown error'

    // Update sync status to error
    await req.payload.update({
      collection: 'ngsi-entities',
      id,
      data: {
        syncStatus: 'error',
        lastSyncTime: new Date().toISOString(),
        lastSyncError: errorMessage,
      },
      context: {
        skipSync: true,
      },
    })

    return Response.json({ error: errorMessage }, { status: 500 })
  }
}
