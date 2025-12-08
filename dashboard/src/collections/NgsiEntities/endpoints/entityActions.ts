import type { PayloadHandler } from 'payload'
import { NgsiLdOperations, NGSI_LD_CORE_CONTEXT, buildLinkHeader } from '@/lib/ngsi-ld'
import axios from 'axios'

/**
 * Extract all attribute paths from NGSI-LD entity data for autocomplete.
 * Returns paths like: ["data.name", "data.address", "data.address.streetAddress", ...]
 */
function extractEntityAttributePaths(entityData: Record<string, unknown>): string[] {
  const paths: string[] = []
  const systemFields = ['id', 'type', '@context']

  function extractValue(attr: unknown): unknown {
    if (typeof attr !== 'object' || attr === null) return attr
    const obj = attr as Record<string, unknown>

    // Handle NGSI-LD Property/Relationship/GeoProperty
    if ('value' in obj) return obj.value
    if ('object' in obj) return obj.object
    if ('coordinates' in obj) return obj // GeoProperty - keep as object

    return attr
  }

  function traverse(obj: unknown, prefix: string) {
    if (typeof obj !== 'object' || obj === null) {
      paths.push(prefix)
      return
    }

    if (Array.isArray(obj)) {
      paths.push(prefix) // Array itself is a leaf
      return
    }

    const record = obj as Record<string, unknown>

    // Check if this is a simple object (not nested NGSI structure)
    const keys = Object.keys(record)
    const hasNestedObjects = keys.some((k) => {
      const val = record[k]
      return typeof val === 'object' && val !== null && !Array.isArray(val)
    })

    if (!hasNestedObjects || keys.length === 0) {
      paths.push(prefix)
      return
    }

    // Traverse nested objects
    for (const key of keys) {
      const childPath = prefix ? `${prefix}.${key}` : key
      traverse(record[key], childPath)
    }
  }

  // Process each attribute
  for (const [key, value] of Object.entries(entityData)) {
    if (systemFields.includes(key)) continue

    const extractedValue = extractValue(value)
    traverse(extractedValue, `data.${key}`)
  }

  return paths.sort()
}

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

    const contextUrl = dataModel?.contextUrl || NGSI_LD_CORE_CONTEXT

    // Create NGSI-LD operations client
    const ngsi = new NgsiLdOperations(
      {
        brokerUrl: source.brokerUrl,
        service: entity.service || undefined,
        servicePath: entity.servicePath,
        authToken: source.authToken,
      },
      contextUrl,
    )

    // GET entity with compacted response (using Link header)
    const data = await ngsi.getEntity(entity.entityId)

    return Response.json(data as object)
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

    const contextUrl = dataModel?.contextUrl || NGSI_LD_CORE_CONTEXT

    // Create NGSI-LD operations client
    const ngsi = new NgsiLdOperations(
      {
        brokerUrl: source.brokerUrl,
        service: entity.service || undefined,
        servicePath: entity.servicePath,
        authToken: source.authToken,
      },
      contextUrl,
    )

    // Extract short type name (without URL prefix) for proper NGSI-LD format
    let entityType = entity.type || dataModel?.model
    if (entityType && entityType.includes('/')) {
      entityType = entityType.split('/').pop() || entityType
    }

    // Build entity body
    const entityBody = {
      id: entity.entityId,
      type: entityType,
      ...(entity.attributes as object),
    }

    // Upsert - create if not exists, update if exists
    await ngsi.upsertEntity(entityBody)

    // Fetch the entity back from broker to get actual attribute structure
    let attributePaths: string[] = []
    try {
      const brokerEntity = await ngsi.getEntity(entity.entityId)
      attributePaths = extractEntityAttributePaths(
        brokerEntity as unknown as Record<string, unknown>,
      )
    } catch (fetchError) {
      // If we can't fetch, use the local attributes
      if (entity.attributes) {
        attributePaths = extractEntityAttributePaths(entity.attributes as Record<string, unknown>)
      }
    }

    // Update sync status and attribute paths
    await req.payload.update({
      collection: 'ngsi-entities',
      id,
      data: {
        syncStatus: 'synced',
        lastSyncTime: new Date().toISOString(),
        lastSyncError: null,
        attributePaths: attributePaths,
      } as Record<string, unknown>,
      context: {
        skipSync: true,
      },
    })

    return Response.json({ message: 'Entity resynced successfully', attributePaths })
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

/**
 * Update entity attributes directly on the broker
 * POST /api/ngsi-entities/:id/update-attrs
 */
export const updateAttrsEndpoint: PayloadHandler = async (req) => {
  const id = req.routeParams?.id as string

  if (!id) {
    return Response.json({ error: 'Entity ID is required' }, { status: 400 })
  }

  try {
    const body = await req.json?.()
    const attributes = body?.attributes

    if (!attributes || typeof attributes !== 'object') {
      return Response.json({ error: 'Attributes object is required' }, { status: 400 })
    }

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

    const contextUrl = dataModel?.contextUrl || NGSI_LD_CORE_CONTEXT

    // Create NGSI-LD operations client
    const ngsi = new NgsiLdOperations(
      {
        brokerUrl: source.brokerUrl,
        service: entity.service || undefined,
        servicePath: entity.servicePath,
        authToken: source.authToken,
      },
      contextUrl,
    )

    // Update attributes on the broker
    await ngsi.updateEntityAttrs(entity.entityId, attributes)

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

    return Response.json({ message: 'Attributes updated successfully' })
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'response' in error
          ? JSON.stringify((error as any).response?.data || error)
          : 'Unknown error'

    return Response.json({ error: errorMessage }, { status: 500 })
  }
}

/**
 * Direct broker API endpoint
 * POST /api/ngsi-entities/:id/broker
 * Allows executing any NGSI-LD operation directly on the broker
 */
export const brokerApiEndpoint: PayloadHandler = async (req) => {
  const id = req.routeParams?.id as string

  if (!id) {
    return Response.json({ error: 'Entity ID is required' }, { status: 400 })
  }

  try {
    const body = await req.json?.()
    const { method, path, requestBody, headers: customHeaders, queryParams } = body || {}

    if (!method || !path) {
      return Response.json({ error: 'Method and path are required' }, { status: 400 })
    }

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

    const contextUrl = dataModel?.contextUrl || NGSI_LD_CORE_CONTEXT

    // Create NGSI-LD operations client
    const ngsi = new NgsiLdOperations(
      {
        brokerUrl: source.brokerUrl,
        service: entity.service || undefined,
        servicePath: entity.servicePath,
        authToken: source.authToken,
      },
      contextUrl,
    )

    // Merge custom headers with Link header if needed
    const mergedHeaders = { ...customHeaders }

    // Add Link header for POST/PATCH operations
    if (['POST', 'PATCH'].includes(method.toUpperCase())) {
      if (!mergedHeaders['Link']) {
        mergedHeaders['Link'] = buildLinkHeader(contextUrl)
      }
      if (!mergedHeaders['Content-Type']) {
        mergedHeaders['Content-Type'] = 'application/json'
      }
    }

    // Add Link header for GET operations (for compacted response)
    if (method.toUpperCase() === 'GET') {
      if (!mergedHeaders['Accept']) {
        mergedHeaders['Accept'] = 'application/json'
      }
      if (!mergedHeaders['Link']) {
        mergedHeaders['Link'] = buildLinkHeader(contextUrl)
      }
    }

    const response = await ngsi.rawRequest(method.toUpperCase(), path, {
      body: requestBody,
      headers: mergedHeaders,
      params: queryParams,
    })

    return Response.json({
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers,
    })
  } catch (error) {
    let statusCode = 500
    let errorData: unknown = 'Unknown error'

    if (axios.isAxiosError(error)) {
      statusCode = error.response?.status || 500
      errorData = error.response?.data || { error: error.message }
    } else if (error instanceof Error) {
      errorData = { error: error.message }
    }

    return Response.json(
      {
        status: statusCode,
        statusText: statusCode >= 400 ? 'Error' : 'OK',
        data: errorData,
        headers: {},
      },
      { status: 200 }, // Return 200 so we can show the error response in UI
    )
  }
}

/**
 * Append entity attributes
 * POST /api/ngsi-entities/:id/append-attrs
 */
export const appendAttrsEndpoint: PayloadHandler = async (req) => {
  const id = req.routeParams?.id as string

  if (!id) {
    return Response.json({ error: 'Entity ID is required' }, { status: 400 })
  }

  try {
    const body = await req.json?.()
    const { attributes, overwrite = true } = body || {}

    if (!attributes || typeof attributes !== 'object') {
      return Response.json({ error: 'Attributes object is required' }, { status: 400 })
    }

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

    const contextUrl = dataModel?.contextUrl || NGSI_LD_CORE_CONTEXT

    const ngsi = new NgsiLdOperations(
      {
        brokerUrl: source.brokerUrl,
        service: entity.service || undefined,
        servicePath: entity.servicePath,
        authToken: source.authToken,
      },
      contextUrl,
    )

    await ngsi.appendEntityAttrs(entity.entityId, attributes, { overwrite })

    return Response.json({ message: 'Attributes appended successfully' })
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'response' in error
          ? JSON.stringify((error as any).response?.data || error)
          : 'Unknown error'

    return Response.json({ error: errorMessage }, { status: 500 })
  }
}

/**
 * Delete entity attribute
 * DELETE /api/ngsi-entities/:id/attrs/:attrName
 */
export const deleteAttrEndpoint: PayloadHandler = async (req) => {
  const id = req.routeParams?.id as string

  if (!id) {
    return Response.json({ error: 'Entity ID is required' }, { status: 400 })
  }

  try {
    const body = await req.json?.()
    const { attrName } = body || {}

    if (!attrName) {
      return Response.json({ error: 'Attribute name is required' }, { status: 400 })
    }

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

    const contextUrl = dataModel?.contextUrl || NGSI_LD_CORE_CONTEXT

    const ngsi = new NgsiLdOperations(
      {
        brokerUrl: source.brokerUrl,
        service: entity.service || undefined,
        servicePath: entity.servicePath,
        authToken: source.authToken,
      },
      contextUrl,
    )

    await ngsi.deleteEntityAttr(entity.entityId, attrName)

    return Response.json({ message: `Attribute "${attrName}" deleted successfully` })
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'response' in error
          ? JSON.stringify((error as any).response?.data || error)
          : 'Unknown error'

    return Response.json({ error: errorMessage }, { status: 500 })
  }
}

/**
 * Query entities of the same type
 * GET /api/ngsi-entities/:id/query
 */
export const queryEntitiesEndpoint: PayloadHandler = async (req) => {
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

    const contextUrl = dataModel?.contextUrl || NGSI_LD_CORE_CONTEXT

    const ngsi = new NgsiLdOperations(
      {
        brokerUrl: source.brokerUrl,
        service: entity.service || undefined,
        servicePath: entity.servicePath,
        authToken: source.authToken,
      },
      contextUrl,
    )

    // Get query params from URL
    const url = new URL(req.url || '', 'http://localhost')
    const type = url.searchParams.get('type') || entity.type || undefined
    const q = url.searchParams.get('q') || undefined
    const attrs = url.searchParams.get('attrs') || undefined
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 20
    const offset = url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : 0
    const options = url.searchParams.get('options') || undefined

    const response = await ngsi.queryEntities({
      type,
      q,
      attrs,
      limit,
      offset,
      options,
    })

    return Response.json(response)
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'response' in error
          ? JSON.stringify((error as any).response?.data || error)
          : 'Unknown error'

    return Response.json({ error: errorMessage }, { status: 500 })
  }
}
