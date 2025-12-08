import type { PayloadHandler } from 'payload'
import { createNgsiClient } from '@/lib/ngsi-client'
import axios from 'axios'

interface DiscoveredEntity {
  id: string
  type: string
  service: string
  servicePath: string
}

interface TenantInfo {
  service: string
  servicePath: string
  entityCount: number
  status: 'ok' | 'empty' | 'error'
  error?: string
}

interface ImportEntityRequest {
  entityId: string
  type: string
  service: string
  servicePath: string
  attributes: Record<string, unknown>
}

/**
 * Discover all entities from a broker across all configured tenants
 */
export const discoverEntitiesEndpoint: PayloadHandler = async (req) => {
  const { sourceId } = await req.json?.()

  if (!sourceId) {
    return Response.json({ error: 'Source ID is required' }, { status: 400 })
  }

  try {
    const source = await req.payload.findByID({
      collection: 'ngsi-sources',
      id: sourceId,
    })

    if (!source) {
      return Response.json({ error: 'Source not found' }, { status: 404 })
    }

    const services = source.serviceHeader?.map((s) => s.value || '') || ['']
    const servicePaths = source.servicePath?.map((s) => s.value || '/') || ['/']

    const discoveredEntities: DiscoveredEntity[] = []
    const tenants: TenantInfo[] = []

    // Iterate through all service/servicePath combinations
    for (const service of services) {
      for (const servicePath of servicePaths) {
        const tenantInfo: TenantInfo = {
          service: service || '',
          servicePath: servicePath || '/',
          entityCount: 0,
          status: 'ok',
        }

        try {
          const client = createNgsiClient({
            brokerUrl: source.brokerUrl,
            service: service || undefined,
            servicePath: servicePath || '/',
          })

          // Fetch all entities from broker
          // Use local=true to get all entities without requiring additional filters
          const response = await client.get('/ngsi-ld/v1/entities', {
            params: {
              limit: 1000,
              options: 'keyValues',
              local: true,
            },
          })

          const entities = response.data || []
          tenantInfo.entityCount = entities.length

          if (entities.length === 0) {
            // Empty tenant - exists in broker but has no entities
            tenantInfo.status = 'empty'
          }

          for (const entity of entities) {
            discoveredEntities.push({
              id: entity.id,
              type: entity.type,
              service: service || '',
              servicePath: servicePath || '/',
            })
          }
        } catch (error) {
          // Check if this is a "tenant not found" type error vs other errors
          const errorDetail = axios.isAxiosError(error)
            ? error.response?.data?.detail || error.response?.data?.title || error.message
            : 'Unknown error'

          // If the error indicates the tenant doesn't exist in broker, mark as empty (new tenant)
          // Common patterns: database not found, tenant not found, etc.
          const isNewTenant =
            errorDetail.toLowerCase().includes('not found') ||
            errorDetail.toLowerCase().includes('does not exist') ||
            (axios.isAxiosError(error) && error.response?.status === 404)

          if (isNewTenant) {
            tenantInfo.status = 'empty'
            tenantInfo.error = 'New tenant (not yet created in broker)'
          } else {
            tenantInfo.status = 'error'
            tenantInfo.error = errorDetail
          }
        }

        tenants.push(tenantInfo)
      }
    }

    // Get existing entities for this source to mark which ones are already synced
    const existingEntities = await req.payload.find({
      collection: 'ngsi-entities',
      where: {
        source: { equals: sourceId },
      },
      limit: 1000,
    })

    const existingEntityIds = new Set(existingEntities.docs.map((e) => e.entityId))

    const entitiesWithStatus = discoveredEntities.map((entity) => ({
      ...entity,
      alreadySynced: existingEntityIds.has(entity.id),
    }))

    // Separate tenants by status
    const errorTenants = tenants.filter((t) => t.status === 'error')
    const emptyTenants = tenants.filter((t) => t.status === 'empty')

    return Response.json({
      entities: entitiesWithStatus,
      total: discoveredEntities.length,
      alreadySynced: entitiesWithStatus.filter((e) => e.alreadySynced).length,
      tenants,
      emptyTenants: emptyTenants.length,
      errors:
        errorTenants.length > 0
          ? errorTenants.map((t) => `${t.service || '(default)'}${t.servicePath}: ${t.error}`)
          : undefined,
    })
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? `Failed to discover entities: ${error.message}`
      : 'Unknown error occurred'

    return Response.json({ error: message }, { status: 500 })
  }
}

/**
 * Import selected entities from broker to Payload
 */
export const importEntitiesEndpoint: PayloadHandler = async (req) => {
  const { sourceId, entities } = (await req.json?.()) as {
    sourceId: string
    entities: ImportEntityRequest[]
  }

  if (!sourceId || !entities?.length) {
    return Response.json({ error: 'Source ID and entities are required' }, { status: 400 })
  }

  try {
    const source = await req.payload.findByID({
      collection: 'ngsi-sources',
      id: sourceId,
    })

    if (!source) {
      return Response.json({ error: 'Source not found' }, { status: 404 })
    }

    const results: { success: string[]; failed: { id: string; error: string }[] } = {
      success: [],
      failed: [],
    }

    for (const entity of entities) {
      try {
        // Extract the simple type name from URL if needed
        // e.g., "https://smartdatamodels.org/dataModel.Weather/WeatherObserved" -> "WeatherObserved"
        let simpleType = entity.type
        if (entity.type.includes('/')) {
          simpleType = entity.type.split('/').pop() || entity.type
        }

        // Find or create matching data model
        let dataModel = await req.payload.find({
          collection: 'ngsi-data-models',
          where: {
            or: [{ model: { equals: entity.type } }, { model: { equals: simpleType } }],
          },
          limit: 1,
        })

        let dataModelId: string

        if (dataModel.docs.length === 0) {
          // Create a basic data model for this type using simple type name
          const newModel = await req.payload.create({
            collection: 'ngsi-data-models',
            data: {
              model: simpleType,
              contextUrl: 'https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld',
            },
          })
          dataModelId = newModel.id
        } else {
          dataModelId = dataModel.docs[0].id
        }

        // Extract short ID from URN (last part after the last colon)
        const shortId = entity.entityId.split(':').pop() || entity.entityId

        // Check if entity already exists
        const existing = await req.payload.find({
          collection: 'ngsi-entities',
          where: {
            entityId: { equals: entity.entityId },
          },
          limit: 1,
        })

        if (existing.docs.length > 0) {
          results.failed.push({ id: entity.entityId, error: 'Entity already exists' })
          continue
        }

        // Create the entity in Payload (skip sync since it already exists in broker)
        // The entityId hook will regenerate it from shortId and dataModel type
        await req.payload.create({
          collection: 'ngsi-entities',
          data: {
            dataModel: dataModelId,
            type: simpleType,
            shortId,
            entityId: entity.entityId, // Will be regenerated by hook
            source: sourceId,
            service: entity.service || '',
            servicePath: entity.servicePath || '/',
            attributes: entity.attributes || {},
            syncStatus: 'synced',
            lastSyncTime: new Date().toISOString(),
            owner: req.user?.id,
          },
          context: {
            skipSync: true, // Don't sync back to broker since it already exists there
          },
        })

        results.success.push(entity.entityId)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        results.failed.push({ id: entity.entityId, error: errorMsg })
      }
    }

    return Response.json({
      message: `Imported ${results.success.length} entities`,
      success: results.success,
      failed: results.failed,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    return Response.json({ error: message }, { status: 500 })
  }
}

/**
 * Fetch full entity details from broker for import
 */
export const fetchEntityDetailsEndpoint: PayloadHandler = async (req) => {
  const { sourceId, entityId, service, servicePath } = await req.json?.()

  if (!sourceId || !entityId) {
    return Response.json({ error: 'Source ID and Entity ID are required' }, { status: 400 })
  }

  try {
    const source = await req.payload.findByID({
      collection: 'ngsi-sources',
      id: sourceId,
    })

    if (!source) {
      return Response.json({ error: 'Source not found' }, { status: 404 })
    }

    const client = createNgsiClient({
      brokerUrl: source.brokerUrl,
      service: service || undefined,
      servicePath: servicePath || '/',
    })

    const response = await client.get(`/ngsi-ld/v1/entities/${encodeURIComponent(entityId)}`)

    // Extract attributes (remove id, type, @context)
    const { id, type, '@context': context, ...attributes } = response.data

    return Response.json({
      id,
      type,
      attributes,
    })
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? error.response?.data?.detail || error.message
      : 'Unknown error occurred'

    return Response.json({ error: message }, { status: 500 })
  }
}

/**
 * Discover available tenants from broker
 * This queries the broker's database to find all available tenants
 */
export const discoverTenantsEndpoint: PayloadHandler = async (req) => {
  const { brokerUrl } = await req.json?.()

  if (!brokerUrl) {
    return Response.json({ error: 'Broker URL is required' }, { status: 400 })
  }

  try {
    // Try to get tenant list from broker
    // Orion-LD provides tenant info via the /ngsi-ld/v1/jsonldContexts or we can try common patterns
    const discoveredTenants: { service: string; servicePath: string }[] = []

    // First, try to query the default tenant to verify connection
    const defaultClient = createNgsiClient({ brokerUrl })

    try {
      await defaultClient.get('/version')
      // Default tenant always exists
      discoveredTenants.push({ service: '', servicePath: '/' })
    } catch (error) {
      return Response.json({ error: 'Cannot connect to broker' }, { status: 500 })
    }

    // For Orion-LD, we can try to get the list of databases/tenants
    // This is broker-specific - Orion-LD uses MongoDB databases named "orion-<tenant>"
    // We'll try a few common approaches

    // Approach 1: Try to get tenant info from broker's admin endpoint (if available)
    try {
      const response = await defaultClient.get('/admin/tenants', { timeout: 3000 })
      if (Array.isArray(response.data)) {
        for (const tenant of response.data) {
          if (tenant.name || tenant.service) {
            discoveredTenants.push({
              service: tenant.name || tenant.service,
              servicePath: '/',
            })
          }
        }
      }
    } catch {
      // Admin endpoint not available, that's ok
    }

    // Approach 2: Check some common tenant names (basic discovery)
    const commonTenants = ['openiot', 'smartcity', 'test', 'production', 'development']
    for (const tenant of commonTenants) {
      try {
        const tenantClient = createNgsiClient({
          brokerUrl,
          service: tenant,
          servicePath: '/',
        })
        // Try to list entities - if it works, tenant exists
        await tenantClient.get('/ngsi-ld/v1/entities', {
          params: { limit: 1, local: true },
          timeout: 2000,
        })
        // If we get here, tenant exists
        if (!discoveredTenants.some((t) => t.service === tenant)) {
          discoveredTenants.push({ service: tenant, servicePath: '/' })
        }
      } catch {
        // Tenant doesn't exist or has issues, skip
      }
    }

    return Response.json({
      tenants: discoveredTenants,
      message: `Found ${discoveredTenants.length} tenant(s)`,
    })
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? error.response?.data?.detail || error.message
      : 'Unknown error occurred'

    return Response.json({ error: message }, { status: 500 })
  }
}
