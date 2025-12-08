/**
 * Browser-side NGSI-LD Client
 *
 * Lightweight client for fetching NGSI-LD entities directly from browser.
 * Uses native fetch API for minimal bundle size.
 *
 * Headers used:
 * - Fiware-Service: Multi-tenancy header (Orion-LD also accepts NGSILD-Tenant)
 * - Fiware-ServicePath: Optional hierarchical scope
 * - Link: @context reference for response expansion
 * - Accept: application/json for compacted responses
 */

import { NGSI_LD_CORE_CONTEXT, buildLinkHeader } from './client'

export interface NgsiBrowserClientConfig {
  brokerUrl: string
  tenant?: string
  servicePath?: string
  contextUrl?: string
}

export interface NgsiEntity {
  id: string
  type: string
  [key: string]: unknown
}

export interface QueryEntitiesOptions {
  type?: string
  q?: string // NGSI-LD query string
  attrs?: string[] // Attributes to return
  limit?: number
  offset?: number
}

export class NgsiError extends Error {
  status: number
  code?: string
  detail?: string

  constructor(message: string, status: number, code?: string, detail?: string) {
    super(message)
    this.name = 'NgsiError'
    this.status = status
    this.code = code
    this.detail = detail
  }
}

/**
 * Browser-side NGSI-LD client using native fetch.
 * Suitable for client components that need direct broker access.
 */
export class NgsiBrowserClient {
  private config: NgsiBrowserClientConfig

  constructor(config: NgsiBrowserClientConfig) {
    this.config = {
      ...config,
      contextUrl: config.contextUrl || NGSI_LD_CORE_CONTEXT,
    }
  }

  /**
   * Build common headers for all requests
   */
  private buildHeaders(): HeadersInit {
    const headers: HeadersInit = {
      Accept: 'application/json',
      Link: buildLinkHeader(this.config.contextUrl!),
    }

    if (this.config.tenant) {
      headers['Fiware-Service'] = this.config.tenant
    }

    if (this.config.servicePath) {
      headers['Fiware-ServicePath'] = this.config.servicePath
    }

    return headers
  }

  /**
   * Handle response and throw NgsiError if not ok
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData: { type?: string; title?: string; detail?: string } = {}
      try {
        errorData = await response.json()
      } catch {
        // Response might not be JSON
      }

      throw new NgsiError(
        errorData.title || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData.type,
        errorData.detail,
      )
    }

    return response.json()
  }

  /**
   * GET single entity by ID
   *
   * @param entityId - Full entity URN (e.g., "urn:ngsi-ld:WeatherObserved:006")
   * @param options - Optional: attrs to filter attributes
   */
  async getEntity(entityId: string, options?: { attrs?: string[] }): Promise<NgsiEntity> {
    const url = new URL(
      `/ngsi-ld/v1/entities/${encodeURIComponent(entityId)}`,
      this.config.brokerUrl,
    )

    if (options?.attrs?.length) {
      url.searchParams.set('attrs', options.attrs.join(','))
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.buildHeaders(),
    })

    return this.handleResponse<NgsiEntity>(response)
  }

  /**
   * Query multiple entities
   *
   * @param options - Query parameters
   */
  async queryEntities(options?: QueryEntitiesOptions): Promise<NgsiEntity[]> {
    const url = new URL('/ngsi-ld/v1/entities', this.config.brokerUrl)

    if (options?.type) {
      url.searchParams.set('type', options.type)
    }
    if (options?.q) {
      url.searchParams.set('q', options.q)
    }
    if (options?.attrs?.length) {
      url.searchParams.set('attrs', options.attrs.join(','))
    }
    if (options?.limit) {
      url.searchParams.set('limit', String(options.limit))
    }
    if (options?.offset) {
      url.searchParams.set('offset', String(options.offset))
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.buildHeaders(),
    })

    return this.handleResponse<NgsiEntity[]>(response)
  }
}

/**
 * Create a configured browser client instance
 */
export function createBrowserClient(config: NgsiBrowserClientConfig): NgsiBrowserClient {
  return new NgsiBrowserClient(config)
}
