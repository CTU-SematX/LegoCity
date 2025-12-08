'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useDocumentInfo, useFormFields, toast } from '@payloadcms/ui'
import type { UIFieldClientComponent } from 'payload'
import axios from 'axios'
import './api-client.css'

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'HEAD'
type TabView = 'try-it' | 'curl'

interface ApiEndpoint {
  id: string
  method: HttpMethod
  path: string
  summary: string
  description: string
  tag: string
  adminOnly?: boolean
  pathParams?: Array<{
    name: string
    description: string
    required: boolean
    placeholder?: string
  }>
  queryParams?: Array<{
    name: string
    description: string
    required: boolean
    type: string
    example?: string
  }>
  requestBody?: {
    description: string
    contentType: string
    example: Record<string, unknown>
  }
  responses: Array<{
    status: number
    description: string
  }>
}

interface Header {
  key: string
  value: string
  enabled: boolean
}

interface QueryParam {
  key: string
  value: string
  enabled: boolean
}

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: '#61affe',
  POST: '#49cc90',
  PATCH: '#fca130',
  DELETE: '#f93e3e',
  HEAD: '#9012fe',
}

export const EntityInteraction: UIFieldClientComponent = () => {
  const [activeEndpoint, setActiveEndpoint] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<{
    status: number
    statusText: string
    data: unknown
    headers?: Record<string, string>
  } | null>(null)
  const [requestBody, setRequestBody] = useState<string>('')
  const [headers, setHeaders] = useState<Header[]>([
    { key: 'Accept', value: 'application/json', enabled: true },
  ])
  const [queryParams, setQueryParams] = useState<QueryParam[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<TabView>('try-it')
  const [pathParamValues, setPathParamValues] = useState<Record<string, string>>({})

  const { id } = useDocumentInfo()
  const entityId = useFormFields(([fields]) => fields.entityId?.value as string)
  const entityType = useFormFields(([fields]) => fields.type?.value as string)

  // Build the NGSI-LD API endpoints following spec
  const endpoints: ApiEndpoint[] = useMemo(
    () => [
      {
        id: 'get-entity',
        method: 'GET',
        path: `/ngsi-ld/v1/entities/${entityId || '{entityId}'}`,
        summary: 'Retrieve Entity',
        description: 'Retrieve a specific Entity from the Context Broker by its identifier.',
        tag: 'Entities',
        queryParams: [
          {
            name: 'attrs',
            description: 'Comma-separated list of attribute names to retrieve',
            required: false,
            type: 'string',
            example: 'temperature,humidity',
          },
          {
            name: 'options',
            description: 'Retrieval options: keyValues, sysAttrs',
            required: false,
            type: 'string',
            example: 'keyValues',
          },
        ],
        responses: [
          { status: 200, description: 'Entity retrieved successfully' },
          { status: 404, description: 'Entity not found' },
        ],
      },
      {
        id: 'create-entity',
        method: 'POST',
        path: '/ngsi-ld/v1/entities',
        summary: 'Create Entity',
        description:
          'Create a new Entity in the Context Broker. This operation is managed by Payload admin.',
        tag: 'Entities',
        adminOnly: true,
        requestBody: {
          description: 'Entity to create in NGSI-LD format',
          contentType: 'application/json',
          example: {
            id: entityId || 'urn:ngsi-ld:EntityType:001',
            type: entityType || 'EntityType',
            name: { type: 'Property', value: 'Example Name' },
          },
        },
        responses: [
          { status: 201, description: 'Entity created successfully' },
          { status: 409, description: 'Entity already exists' },
        ],
      },
      {
        id: 'delete-entity',
        method: 'DELETE',
        path: `/ngsi-ld/v1/entities/${entityId || '{entityId}'}`,
        summary: 'Delete Entity',
        description:
          'Delete an Entity from the Context Broker. This operation is managed by Payload admin.',
        tag: 'Entities',
        adminOnly: true,
        responses: [
          { status: 204, description: 'Entity deleted successfully' },
          { status: 404, description: 'Entity not found' },
        ],
      },
      {
        id: 'head-entity',
        method: 'HEAD',
        path: `/ngsi-ld/v1/entities/${entityId || '{entityId}'}`,
        summary: 'Check Entity Exists',
        description: 'Check if an Entity exists without retrieving its content.',
        tag: 'Entities',
        responses: [
          { status: 200, description: 'Entity exists' },
          { status: 404, description: 'Entity not found' },
        ],
      },
      {
        id: 'update-attrs',
        method: 'PATCH',
        path: `/ngsi-ld/v1/entities/${entityId || '{entityId}'}/attrs`,
        summary: 'Update Entity Attributes',
        description:
          'Update existing attributes of an Entity. Only provided attributes are updated.',
        tag: 'Attributes',
        requestBody: {
          description: 'Attributes to update in NGSI-LD format',
          contentType: 'application/json',
          example: {
            name: { type: 'Property', value: 'Updated Name' },
          },
        },
        responses: [
          { status: 204, description: 'Attributes updated successfully' },
          { status: 404, description: 'Entity not found' },
          { status: 207, description: 'Partial success (multi-status)' },
        ],
      },
      {
        id: 'append-attrs',
        method: 'POST',
        path: `/ngsi-ld/v1/entities/${entityId || '{entityId}'}/attrs`,
        summary: 'Append Entity Attributes',
        description:
          'Append new attributes to an Entity. Use options=noOverwrite to prevent updating existing.',
        tag: 'Attributes',
        queryParams: [
          {
            name: 'options',
            description: 'Use "noOverwrite" to not overwrite existing attributes',
            required: false,
            type: 'string',
            example: 'noOverwrite',
          },
        ],
        requestBody: {
          description: 'Attributes to append in NGSI-LD format',
          contentType: 'application/json',
          example: {
            newAttribute: { type: 'Property', value: 'New Value' },
          },
        },
        responses: [
          { status: 204, description: 'Attributes appended successfully' },
          { status: 404, description: 'Entity not found' },
          { status: 207, description: 'Partial success (multi-status)' },
        ],
      },
      {
        id: 'delete-attr',
        method: 'DELETE',
        path: `/ngsi-ld/v1/entities/${entityId || '{entityId}'}/attrs/{attrName}`,
        summary: 'Delete Entity Attribute',
        description: 'Delete a specific attribute from an Entity.',
        tag: 'Attributes',
        pathParams: [
          {
            name: 'attrName',
            description: 'Name of the attribute to delete',
            required: true,
            placeholder: 'attributeName',
          },
        ],
        responses: [
          { status: 204, description: 'Attribute deleted successfully' },
          { status: 404, description: 'Entity or attribute not found' },
        ],
      },
      {
        id: 'query-entities',
        method: 'GET',
        path: '/ngsi-ld/v1/entities',
        summary: 'Query Entities',
        description: 'Query entities by type, attributes, or complex expressions.',
        tag: 'Query',
        queryParams: [
          {
            name: 'type',
            description: 'Entity type to filter',
            required: false,
            type: 'string',
            example: entityType || 'Building',
          },
          {
            name: 'q',
            description: 'Query expression (e.g., temperature>25)',
            required: false,
            type: 'string',
          },
          {
            name: 'attrs',
            description: 'Attributes to retrieve',
            required: false,
            type: 'string',
          },
          {
            name: 'limit',
            description: 'Maximum number of results',
            required: false,
            type: 'integer',
            example: '20',
          },
          {
            name: 'offset',
            description: 'Pagination offset',
            required: false,
            type: 'integer',
            example: '0',
          },
          {
            name: 'options',
            description: 'Response options: keyValues, count',
            required: false,
            type: 'string',
          },
        ],
        responses: [{ status: 200, description: 'Entities retrieved successfully' }],
      },
    ],
    [entityId, entityType],
  )

  const groupedEndpoints = useMemo(() => {
    const groups: Record<string, ApiEndpoint[]> = {}
    for (const endpoint of endpoints) {
      if (!groups[endpoint.tag]) {
        groups[endpoint.tag] = []
      }
      groups[endpoint.tag].push(endpoint)
    }
    return groups
  }, [endpoints])

  const currentEndpoint = useMemo(
    () => endpoints.find((ep) => ep.id === activeEndpoint),
    [endpoints, activeEndpoint],
  )

  const generateCurl = useCallback((): string => {
    if (!currentEndpoint) return ''

    const baseUrl = '{BROKER_URL}'
    let path = currentEndpoint.path

    if (currentEndpoint.pathParams) {
      for (const param of currentEndpoint.pathParams) {
        const value = pathParamValues[param.name] || `{${param.name}}`
        path = path.replace(`{${param.name}}`, value)
      }
    }

    const enabledParams = queryParams.filter((p) => p.enabled && p.value)
    const queryString = enabledParams.length
      ? '?' +
        enabledParams
          .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
          .join('&')
      : ''

    const url = `${baseUrl}${path}${queryString}`

    let curl = `curl -X ${currentEndpoint.method} \\\n`
    curl += `  '${url}' \\\n`
    curl += `  -H 'Content-Type: application/json' \\\n`
    curl += `  -H 'Accept: application/json' \\\n`
    curl += `  -H 'Link: <{CONTEXT_URL}>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"'`

    for (const header of headers.filter((h) => h.enabled && h.key && h.key !== 'Accept')) {
      curl += ` \\\n  -H '${header.key}: ${header.value}'`
    }

    if (currentEndpoint.requestBody && requestBody) {
      const compactBody = requestBody.replace(/\n\s*/g, ' ').trim()
      curl += ` \\\n  -d '${compactBody}'`
    }

    return curl
  }, [currentEndpoint, queryParams, headers, requestBody, pathParamValues])

  useEffect(() => {
    if (currentEndpoint?.requestBody) {
      setRequestBody(JSON.stringify(currentEndpoint.requestBody.example, null, 2))
    } else {
      setRequestBody('')
    }
    setResponse(null)

    if (currentEndpoint?.queryParams) {
      setQueryParams(
        currentEndpoint.queryParams.map((p) => ({
          key: p.name,
          value: p.example || '',
          enabled: false,
        })),
      )
    } else {
      setQueryParams([])
    }

    if (currentEndpoint?.pathParams) {
      const params: Record<string, string> = {}
      for (const p of currentEndpoint.pathParams) {
        params[p.name] = ''
      }
      setPathParamValues(params)
    } else {
      setPathParamValues({})
    }

    if (currentEndpoint?.adminOnly) {
      setActiveTab('curl')
    } else {
      setActiveTab('try-it')
    }
  }, [currentEndpoint])

  const handleAddHeader = useCallback(() => {
    setHeaders((prev) => [...prev, { key: '', value: '', enabled: true }])
  }, [])

  const handleRemoveHeader = useCallback((index: number) => {
    setHeaders((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleHeaderChange = useCallback(
    (index: number, field: 'key' | 'value' | 'enabled', newValue: string | boolean) => {
      setHeaders((prev) => prev.map((h, i) => (i === index ? { ...h, [field]: newValue } : h)))
    },
    [],
  )

  const handleQueryParamChange = useCallback(
    (index: number, field: 'key' | 'value' | 'enabled', newValue: string | boolean) => {
      setQueryParams((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: newValue } : p)))
    },
    [],
  )

  const handlePathParamChange = useCallback((name: string, value: string) => {
    setPathParamValues((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleExecute = useCallback(async () => {
    if (!currentEndpoint || !id) return

    setLoading(true)
    setResponse(null)

    try {
      let path = currentEndpoint.path
      if (currentEndpoint.pathParams) {
        for (const param of currentEndpoint.pathParams) {
          const value = pathParamValues[param.name]
          if (param.required && !value) {
            toast.error(`Missing required path parameter: ${param.name}`)
            setLoading(false)
            return
          }
          path = path.replace(`{${param.name}}`, value || '')
        }
      }

      const enabledQueryParams = queryParams.filter((p) => p.enabled && p.value)
      const queryString = enabledQueryParams.length
        ? '?' +
          enabledQueryParams
            .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
            .join('&')
        : ''

      const requestHeaders: Record<string, string> = {}
      for (const h of headers.filter((h) => h.enabled && h.key)) {
        requestHeaders[h.key] = h.value
      }

      const res = await axios.post(`/api/ngsi-entities/${id}/broker`, {
        method: currentEndpoint.method,
        path: path + queryString,
        headers: requestHeaders,
        requestBody: currentEndpoint.requestBody ? JSON.parse(requestBody || '{}') : undefined,
      })

      setResponse({
        status: res.data.status,
        statusText: res.data.statusText,
        data: res.data.data,
        headers: res.data.headers,
      })

      if (res.data.status >= 200 && res.data.status < 300) {
        toast.success(`${currentEndpoint.method} ${currentEndpoint.summary}: Success`)
      } else {
        toast.error(`${currentEndpoint.method} ${currentEndpoint.summary}: ${res.data.statusText}`)
      }
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } }; message?: string }
      const errorMessage = err.response?.data?.error || err.message || 'Request failed'
      setResponse({
        status: 500,
        statusText: 'Error',
        data: { error: errorMessage },
      })
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [currentEndpoint, id, queryParams, headers, requestBody, pathParamValues])

  const handleCopyCode = useCallback(() => {
    const curl = generateCurl()
    navigator.clipboard.writeText(curl)
    toast.success('Copied to clipboard')
  }, [generateCurl])

  if (!entityId) {
    return (
      <div className="api-client">
        <div className="api-client__empty">
          <InfoIcon />
          <p>Save the entity first to interact with the NGSI-LD API</p>
        </div>
      </div>
    )
  }

  return (
    <div className="api-client">
      <button
        type="button"
        className="api-client__mobile-toggle"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        aria-label={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
      >
        <MenuIcon />
        <span>API Endpoints</span>
      </button>

      <div
        className={`api-client__layout ${sidebarCollapsed ? 'api-client__layout--sidebar-collapsed' : ''}`}
      >
        <aside
          className={`api-client__sidebar ${sidebarCollapsed ? 'api-client__sidebar--collapsed' : ''}`}
        >
          <div className="api-client__sidebar-header">
            {!sidebarCollapsed && <h4>NGSI-LD API</h4>}
            <button
              type="button"
              className="api-client__collapse-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </button>
          </div>

          <nav className="api-client__nav">
            {sidebarCollapsed ? (
              <ul className="api-client__list api-client__list--collapsed">
                {endpoints.map((ep) => (
                  <li key={ep.id}>
                    <button
                      type="button"
                      className={`api-client__endpoint api-client__endpoint--collapsed ${activeEndpoint === ep.id ? 'api-client__endpoint--active' : ''}`}
                      onClick={() => setActiveEndpoint(ep.id)}
                      title={`${ep.method} ${ep.summary}`}
                    >
                      <span
                        className="api-client__method-text"
                        style={{ color: METHOD_COLORS[ep.method] }}
                      >
                        {ep.method}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              Object.entries(groupedEndpoints).map(([tag, eps]) => (
                <div key={tag} className="api-client__group">
                  <h5 className="api-client__group-title">{tag}</h5>
                  <ul className="api-client__list">
                    {eps.map((ep) => (
                      <li key={ep.id}>
                        <button
                          type="button"
                          className={`api-client__endpoint ${activeEndpoint === ep.id ? 'api-client__endpoint--active' : ''}`}
                          onClick={() => {
                            setActiveEndpoint(ep.id)
                            if (window.innerWidth < 768) {
                              setSidebarCollapsed(true)
                            }
                          }}
                        >
                          <span
                            className="api-client__method-text"
                            style={{ color: METHOD_COLORS[ep.method] }}
                          >
                            {ep.method}
                          </span>
                          <span className="api-client__endpoint-name">{ep.summary}</span>
                          {ep.adminOnly && <LockIcon />}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </nav>
        </aside>

        <div className="api-client__main">
          {!currentEndpoint ? (
            <div className="api-client__welcome">
              <h3>NGSI-LD API Explorer</h3>
              <p>Select an endpoint from the sidebar to get started.</p>
              <p className="api-client__info-text">
                This interactive client allows you to test NGSI-LD operations against the Context
                Broker.
              </p>
            </div>
          ) : (
            <>
              <div className="api-client__panel-header">
                <div className="api-client__endpoint-title">
                  <span
                    className="api-client__method-badge api-client__method-badge--large"
                    style={{ backgroundColor: METHOD_COLORS[currentEndpoint.method] }}
                  >
                    {currentEndpoint.method}
                  </span>
                  <code className="api-client__path">{currentEndpoint.path}</code>
                </div>
                {currentEndpoint.adminOnly && (
                  <span className="api-client__admin-badge">
                    <LockIcon /> Admin Only
                  </span>
                )}
              </div>

              <div className="api-client__description">
                <h4>{currentEndpoint.summary}</h4>
                <p>{currentEndpoint.description}</p>
                {currentEndpoint.adminOnly && (
                  <div className="api-client__admin-notice">
                    <InfoIcon />
                    <span>
                      This operation is managed by Payload admin. Use the cURL example to implement
                      in your code.
                    </span>
                  </div>
                )}
              </div>

              <div className="api-client__tabs">
                {!currentEndpoint.adminOnly && (
                  <button
                    type="button"
                    className={`api-client__tab ${activeTab === 'try-it' ? 'api-client__tab--active' : ''}`}
                    onClick={() => setActiveTab('try-it')}
                  >
                    <PlayIcon /> Try It
                  </button>
                )}
                <button
                  type="button"
                  className={`api-client__tab ${activeTab === 'curl' ? 'api-client__tab--active' : ''}`}
                  onClick={() => setActiveTab('curl')}
                >
                  <CodeIcon /> cURL
                </button>
              </div>

              <div className="api-client__content">
                {activeTab === 'curl' ? (
                  <div className="api-client__curl-panel">
                    <div className="api-client__curl-header">
                      <h5>cURL Command</h5>
                      <button
                        type="button"
                        className="api-client__copy-btn"
                        onClick={handleCopyCode}
                      >
                        <CopyIcon /> Copy
                      </button>
                    </div>
                    <pre className="api-client__code-block api-client__code-block--curl">
                      {generateCurl()}
                    </pre>
                    <p className="api-client__curl-note">
                      Replace <code>{'{BROKER_URL}'}</code> with your Context Broker URL and{' '}
                      <code>{'{CONTEXT_URL}'}</code> with your JSON-LD context URL.
                    </p>
                  </div>
                ) : (
                  <div className="api-client__panels">
                    <div className="api-client__panel api-client__panel--request">
                      <div className="api-client__panel-title">
                        <h5>Request</h5>
                        <button
                          type="button"
                          className="api-client__send-btn"
                          onClick={handleExecute}
                          disabled={loading}
                        >
                          {loading ? <LoadingIcon /> : <SendIcon />}
                          {loading ? 'Sending...' : 'Send'}
                        </button>
                      </div>

                      {currentEndpoint.pathParams && currentEndpoint.pathParams.length > 0 && (
                        <div className="api-client__section">
                          <h6 className="api-client__section-title">Path Parameters</h6>
                          <table className="api-client__table">
                            <thead>
                              <tr>
                                <th>Parameter</th>
                                <th>Value</th>
                                <th>Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {currentEndpoint.pathParams.map((param) => (
                                <tr key={param.name}>
                                  <td>
                                    <code className="api-client__param-name">{param.name}</code>
                                    {param.required && (
                                      <span className="api-client__required">*</span>
                                    )}
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      value={pathParamValues[param.name] || ''}
                                      onChange={(e) =>
                                        handlePathParamChange(param.name, e.target.value)
                                      }
                                      placeholder={param.placeholder || param.name}
                                    />
                                  </td>
                                  <td className="api-client__param-desc">{param.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <div className="api-client__section">
                        <div className="api-client__section-header">
                          <h6 className="api-client__section-title">Headers</h6>
                          <button
                            type="button"
                            className="api-client__add-btn"
                            onClick={handleAddHeader}
                          >
                            + Add Header
                          </button>
                        </div>
                        <table className="api-client__table">
                          <thead>
                            <tr>
                              <th style={{ width: '30px' }}></th>
                              <th>Name</th>
                              <th>Value</th>
                              <th style={{ width: '30px' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {headers.map((header, idx) => (
                              <tr
                                key={idx}
                                className={header.enabled ? '' : 'api-client__row--disabled'}
                              >
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={header.enabled}
                                    onChange={(e) =>
                                      handleHeaderChange(idx, 'enabled', e.target.checked)
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    value={header.key}
                                    onChange={(e) => handleHeaderChange(idx, 'key', e.target.value)}
                                    placeholder="Header name"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    value={header.value}
                                    onChange={(e) =>
                                      handleHeaderChange(idx, 'value', e.target.value)
                                    }
                                    placeholder="Value"
                                  />
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="api-client__remove-btn"
                                    onClick={() => handleRemoveHeader(idx)}
                                  >
                                    ×
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {currentEndpoint.queryParams && currentEndpoint.queryParams.length > 0 && (
                        <div className="api-client__section">
                          <h6 className="api-client__section-title">Query Parameters</h6>
                          <table className="api-client__table">
                            <thead>
                              <tr>
                                <th style={{ width: '30px' }}></th>
                                <th>Parameter</th>
                                <th>Value</th>
                                <th>Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {queryParams.map((param, idx) => (
                                <tr
                                  key={idx}
                                  className={param.enabled ? '' : 'api-client__row--disabled'}
                                >
                                  <td>
                                    <input
                                      type="checkbox"
                                      checked={param.enabled}
                                      onChange={(e) =>
                                        handleQueryParamChange(idx, 'enabled', e.target.checked)
                                      }
                                    />
                                  </td>
                                  <td>
                                    <code className="api-client__param-name">{param.key}</code>
                                    {currentEndpoint.queryParams?.[idx]?.required && (
                                      <span className="api-client__required">*</span>
                                    )}
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      value={param.value}
                                      onChange={(e) =>
                                        handleQueryParamChange(idx, 'value', e.target.value)
                                      }
                                      placeholder={
                                        currentEndpoint.queryParams?.[idx]?.example || 'Value'
                                      }
                                    />
                                  </td>
                                  <td className="api-client__param-desc">
                                    {currentEndpoint.queryParams?.[idx]?.description}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {currentEndpoint.requestBody && (
                        <div className="api-client__section">
                          <div className="api-client__section-header">
                            <h6 className="api-client__section-title">Request Body</h6>
                            <span className="api-client__content-type">
                              {currentEndpoint.requestBody.contentType}
                            </span>
                          </div>
                          <p className="api-client__section-desc">
                            {currentEndpoint.requestBody.description}
                          </p>
                          <textarea
                            className="api-client__textarea"
                            value={requestBody}
                            onChange={(e) => setRequestBody(e.target.value)}
                            rows={8}
                            spellCheck={false}
                          />
                        </div>
                      )}

                      <div className="api-client__section">
                        <h6 className="api-client__section-title">Expected Responses</h6>
                        <div className="api-client__responses-list">
                          {currentEndpoint.responses.map((res) => (
                            <div key={res.status} className="api-client__response-item">
                              <span
                                className={`api-client__status-badge ${res.status >= 200 && res.status < 300 ? 'api-client__status-badge--success' : 'api-client__status-badge--error'}`}
                              >
                                {res.status}
                              </span>
                              <span>{res.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="api-client__panel api-client__panel--response">
                      <div className="api-client__panel-title">
                        <h5>Response</h5>
                        {response && (
                          <span
                            className={`api-client__status-badge ${response.status >= 200 && response.status < 300 ? 'api-client__status-badge--success' : 'api-client__status-badge--error'}`}
                          >
                            {response.status} {response.statusText}
                          </span>
                        )}
                      </div>
                      <div className="api-client__response-content">
                        {!response ? (
                          <div className="api-client__response-empty">
                            <span>Click &quot;Send&quot; to execute the request</span>
                          </div>
                        ) : (
                          <>
                            {response.headers && Object.keys(response.headers).length > 0 && (
                              <div className="api-client__response-headers">
                                <h6>Response Headers</h6>
                                <div className="api-client__headers-list">
                                  {Object.entries(response.headers).map(([key, value]) => (
                                    <div key={key} className="api-client__header-item">
                                      <span className="api-client__header-key">{key}:</span>
                                      <span className="api-client__header-value">
                                        {String(value)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="api-client__response-body">
                              <h6>Response Body</h6>
                              <pre className="api-client__code-block">
                                {typeof response.data === 'string'
                                  ? response.data
                                  : JSON.stringify(response.data, null, 2)}
                              </pre>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
)

const LoadingIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="api-client__loading-icon"
  >
    <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeLinecap="round" />
  </svg>
)

const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
)

const CodeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
)

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)
