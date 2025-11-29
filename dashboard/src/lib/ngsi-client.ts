import axios, { AxiosInstance } from 'axios'

interface NgsiClientConfig {
  brokerUrl: string
  service?: string
  servicePath?: string
  authToken?: string
}

export const createNgsiClient = (config: NgsiClientConfig): AxiosInstance => {
  const { brokerUrl, service, servicePath, authToken } = config

  const headers: Record<string, string> = {
    'Content-Type': 'application/ld+json',
    Accept: 'application/ld+json',
  }

  // Only add Fiware-Service if it's a non-empty string
  if (service && service.trim()) {
    headers['Fiware-Service'] = service.trim()
  }

  // Only add Fiware-ServicePath if it's a non-empty string
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

export const NGSI_LD_CORE_CONTEXT = 'https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld'
