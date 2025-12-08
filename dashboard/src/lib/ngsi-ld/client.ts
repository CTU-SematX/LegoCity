import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

export const NGSI_LD_CORE_CONTEXT =
  'https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context-v1.8.jsonld'

export interface NgsiClientConfig {
  brokerUrl: string
  service?: string
  servicePath?: string
  authToken?: string
}

export interface NgsiResponse<T = unknown> {
  status: number
  statusText: string
  data: T
  headers: Record<string, string>
}

/**
 * Build Link header for NGSI-LD context
 * Format: <context-url>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"
 */
export function buildLinkHeader(contextUrl: string): string {
  return `<${contextUrl}>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"`
}

/**
 * Convert AxiosResponse to NgsiResponse
 */
function toNgsiResponse<T>(response: AxiosResponse<T>): NgsiResponse<T> {
  const headers: Record<string, string> = {}
  Object.entries(response.headers).forEach(([key, value]) => {
    if (typeof value === 'string') {
      headers[key] = value
    }
  })
  return {
    status: response.status,
    statusText: response.statusText,
    data: response.data,
    headers,
  }
}

/**
 * Create a base axios client with common headers for multi-tenancy.
 *
 * Multi-tenancy headers (Orion-LD supports both):
 * - Fiware-Service: NGSIv2 style (backward compatible)
 * - NGSILD-Tenant: NGSI-LD 1.6+ style
 *
 * This project uses Fiware-Service for consistency with existing code.
 *
 * Does NOT set Content-Type or Accept - those are set per-request based on operation.
 */
export function createNgsiClient(config: NgsiClientConfig): AxiosInstance {
  const { brokerUrl, service, servicePath, authToken } = config

  const headers: Record<string, string> = {}

  // Fiware-Service header for multi-tenancy (Orion-LD also accepts NGSILD-Tenant)
  if (service && service.trim()) {
    headers['Fiware-Service'] = service.trim()
  }

  // Fiware-ServicePath for hierarchical scopes (e.g., /city/sensors)
  if (servicePath && servicePath.trim()) {
    headers['Fiware-ServicePath'] = servicePath.trim()
  }

  if (authToken) {
    headers['X-Auth-Token'] = authToken
  }

  return axios.create({
    baseURL: brokerUrl,
    headers,
    timeout: 10000,
  })
}

/**
 * NGSI-LD Entity operations following the spec:
 * https://ngsi-ld-tutorials.readthedocs.io/en/latest/ngsi-ld-operations.html
 *
 * Two ways to pass @context:
 * 1. Link header + Content-Type: application/json (recommended for most operations)
 * 2. Embedded @context in body + Content-Type: application/ld+json (alternative)
 *
 * This class uses method 1 (Link header) for consistency and simplicity.
 */
export class NgsiLdOperations {
  private client: AxiosInstance
  private contextUrl: string

  constructor(config: NgsiClientConfig, contextUrl: string) {
    this.client = createNgsiClient(config)
    this.contextUrl = contextUrl
  }

  /**
   * CREATE entity - POST /ngsi-ld/v1/entities
   *
   * Uses Link header method:
   * - Content-Type: application/json
   * - Link: <contextUrl>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"
   */
  async createEntity(entity: {
    id: string
    type: string
    [key: string]: unknown
  }): Promise<NgsiResponse<void>> {
    const response = await this.client.post('/ngsi-ld/v1/entities', entity, {
      headers: {
        'Content-Type': 'application/json',
        Link: buildLinkHeader(this.contextUrl),
      },
    })
    return toNgsiResponse(response)
  }

  /**
   * READ entity - GET /ngsi-ld/v1/entities/{entityId}
   *
   * Two modes:
   * 1. Compacted (default): Accept: application/json + Link header
   *    - Response is pure JSON without @context
   * 2. Embedded: Accept: application/ld+json (NO Link header)
   *    - Response includes @context in body
   */
  async getEntity(
    entityId: string,
    options?: { embedContext?: boolean; attrs?: string; options?: string },
  ): Promise<NgsiResponse<Record<string, unknown>>> {
    const headers: Record<string, string> = {}
    const params: Record<string, string> = {}

    if (options?.embedContext) {
      // Get response with @context embedded in body
      headers['Accept'] = 'application/ld+json'
      // NO Link header allowed with application/ld+json
    } else {
      // Get compacted response using Link header
      headers['Accept'] = 'application/json'
      headers['Link'] = buildLinkHeader(this.contextUrl)
    }

    if (options?.attrs) {
      params.attrs = options.attrs
    }
    if (options?.options) {
      params.options = options.options
    }

    const response = await this.client.get(`/ngsi-ld/v1/entities/${encodeURIComponent(entityId)}`, {
      headers,
      params: Object.keys(params).length > 0 ? params : undefined,
    })
    return toNgsiResponse(response)
  }

  /**
   * UPDATE entity attributes - PATCH /ngsi-ld/v1/entities/{entityId}/attrs
   * Uses Content-Type: application/json + Link header
   */
  async updateEntityAttrs(
    entityId: string,
    attrs: Record<string, unknown>,
  ): Promise<NgsiResponse<void>> {
    const response = await this.client.patch(
      `/ngsi-ld/v1/entities/${encodeURIComponent(entityId)}/attrs`,
      attrs,
      {
        headers: {
          'Content-Type': 'application/json',
          Link: buildLinkHeader(this.contextUrl),
        },
      },
    )
    return toNgsiResponse(response)
  }

  /**
   * APPEND entity attributes - POST /ngsi-ld/v1/entities/{entityId}/attrs
   * Uses Content-Type: application/json + Link header
   * Appends new attributes, doesn't overwrite existing ones by default
   */
  async appendEntityAttrs(
    entityId: string,
    attrs: Record<string, unknown>,
    options?: { overwrite?: boolean },
  ): Promise<NgsiResponse<void>> {
    const params: Record<string, string> = {}
    if (options?.overwrite === false) {
      params.options = 'noOverwrite'
    }

    const response = await this.client.post(
      `/ngsi-ld/v1/entities/${encodeURIComponent(entityId)}/attrs`,
      attrs,
      {
        headers: {
          'Content-Type': 'application/json',
          Link: buildLinkHeader(this.contextUrl),
        },
        params: Object.keys(params).length > 0 ? params : undefined,
      },
    )
    return toNgsiResponse(response)
  }

  /**
   * DELETE entity - DELETE /ngsi-ld/v1/entities/{entityId}
   */
  async deleteEntity(entityId: string): Promise<NgsiResponse<void>> {
    const response = await this.client.delete(
      `/ngsi-ld/v1/entities/${encodeURIComponent(entityId)}`,
    )
    return toNgsiResponse(response)
  }

  /**
   * DELETE entity attribute - DELETE /ngsi-ld/v1/entities/{entityId}/attrs/{attrName}
   */
  async deleteEntityAttr(entityId: string, attrName: string): Promise<NgsiResponse<void>> {
    const response = await this.client.delete(
      `/ngsi-ld/v1/entities/${encodeURIComponent(entityId)}/attrs/${encodeURIComponent(attrName)}`,
    )
    return toNgsiResponse(response)
  }

  /**
   * HEAD entity - Check if entity exists
   */
  async headEntity(entityId: string): Promise<NgsiResponse<void>> {
    const response = await this.client.head(`/ngsi-ld/v1/entities/${encodeURIComponent(entityId)}`)
    return toNgsiResponse(response)
  }

  /**
   * Check if entity exists
   */
  async entityExists(entityId: string): Promise<boolean> {
    try {
      await this.client.head(`/ngsi-ld/v1/entities/${encodeURIComponent(entityId)}`)
      return true
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return false
      }
      throw error
    }
  }

  /**
   * Query entities - GET /ngsi-ld/v1/entities
   */
  async queryEntities(options?: {
    type?: string
    attrs?: string
    q?: string
    limit?: number
    offset?: number
    options?: string
  }): Promise<NgsiResponse<Record<string, unknown>[]>> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      Link: buildLinkHeader(this.contextUrl),
    }
    const params: Record<string, string | number> = {}

    if (options?.type) params.type = options.type
    if (options?.attrs) params.attrs = options.attrs
    if (options?.q) params.q = options.q
    if (options?.limit) params.limit = options.limit
    if (options?.offset) params.offset = options.offset
    if (options?.options) params.options = options.options

    const response = await this.client.get('/ngsi-ld/v1/entities', {
      headers,
      params: Object.keys(params).length > 0 ? params : undefined,
    })
    return toNgsiResponse(response)
  }

  /**
   * UPSERT - Create if not exists, update if exists
   */
  async upsertEntity(entity: {
    id: string
    type: string
    [key: string]: unknown
  }): Promise<'created' | 'updated'> {
    const exists = await this.entityExists(entity.id)

    if (exists) {
      // Extract only attributes (exclude id, type)
      const { id: _id, type: _type, ...attrs } = entity
      await this.updateEntityAttrs(entity.id, attrs)
      return 'updated'
    } else {
      await this.createEntity(entity)
      return 'created'
    }
  }

  /**
   * Execute a raw request (for API client testing)
   */
  async rawRequest(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'HEAD',
    path: string,
    options?: {
      body?: unknown
      headers?: Record<string, string>
      params?: Record<string, string>
    },
  ): Promise<NgsiResponse<unknown>> {
    const config: AxiosRequestConfig = {
      method: method.toLowerCase(),
      url: path,
      headers: options?.headers,
      params: options?.params,
    }

    if (options?.body && ['POST', 'PATCH'].includes(method)) {
      config.data = options.body
    }

    const response = await this.client.request(config)
    return toNgsiResponse(response)
  }
}
