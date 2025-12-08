'use client'

import React, { useCallback, useState, useMemo } from 'react'
import { toast, useFormFields, useDocumentInfo, Button } from '@payloadcms/ui'
import type { FieldClientComponent } from 'payload'
import axios from 'axios'
import {
  RefreshCw,
  Download,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  FolderOpen,
} from 'lucide-react'

interface DiscoveredEntity {
  id: string
  type: string
  service: string
  servicePath: string
  alreadySynced: boolean
}

interface TenantInfo {
  service: string
  servicePath: string
  entityCount: number
  status: 'ok' | 'empty' | 'error'
  error?: string
}

interface DiscoverResponse {
  entities: DiscoveredEntity[]
  total: number
  alreadySynced: number
  tenants: TenantInfo[]
  emptyTenants: number
  errors?: string[]
}

// Group entities by tenant
interface TenantGroup {
  key: string
  service: string
  servicePath: string
  newEntities: DiscoveredEntity[]
  syncedEntities: DiscoveredEntity[]
  status: 'ok' | 'empty' | 'error'
}

export const SyncEntities: FieldClientComponent = () => {
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [entities, setEntities] = useState<DiscoveredEntity[]>([])
  const [tenants, setTenants] = useState<TenantInfo[]>([])
  const [selectedEntities, setSelectedEntities] = useState<Set<string>>(new Set())
  const [discovered, setDiscovered] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [expandedTenants, setExpandedTenants] = useState<Set<string>>(new Set())

  const { id: sourceId } = useDocumentInfo()
  const brokerUrl = useFormFields(([fields]) => fields.brokerUrl?.value as string)

  // Group entities by tenant
  const tenantGroups = useMemo(() => {
    const groups: Map<string, TenantGroup> = new Map()

    // Initialize groups from tenants info
    for (const tenant of tenants) {
      const key = `${tenant.service || '(default)'}${tenant.servicePath}`
      groups.set(key, {
        key,
        service: tenant.service,
        servicePath: tenant.servicePath,
        newEntities: [],
        syncedEntities: [],
        status: tenant.status,
      })
    }

    // Add entities to groups
    for (const entity of entities) {
      const key = `${entity.service || '(default)'}${entity.servicePath}`
      let group = groups.get(key)
      if (!group) {
        group = {
          key,
          service: entity.service,
          servicePath: entity.servicePath,
          newEntities: [],
          syncedEntities: [],
          status: 'ok',
        }
        groups.set(key, group)
      }
      if (entity.alreadySynced) {
        group.syncedEntities.push(entity)
      } else {
        group.newEntities.push(entity)
      }
    }

    return Array.from(groups.values())
  }, [entities, tenants])

  const handleDiscover = useCallback(async () => {
    if (!sourceId) {
      toast.error('Please save the source first')
      return
    }

    setLoading(true)
    setErrors([])

    try {
      const { data } = await axios.post<DiscoverResponse>('/api/ngsi-sources/discover-entities', {
        sourceId,
      })

      setEntities(data.entities)
      setTenants(data.tenants || [])
      setDiscovered(true)

      // Auto-expand tenants with new entities
      const tenantsWithNew = new Set<string>()
      for (const entity of data.entities) {
        if (!entity.alreadySynced) {
          tenantsWithNew.add(`${entity.service || '(default)'}${entity.servicePath}`)
        }
      }
      setExpandedTenants(tenantsWithNew)

      if (data.errors?.length) {
        setErrors(data.errors)
      }

      const newEntitiesCount = data.total - data.alreadySynced
      toast.success(
        `Found ${data.total} entities (${newEntitiesCount} new, ${data.alreadySynced} synced)`,
      )
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : 'Unknown error'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [sourceId])

  const handleToggleTenant = useCallback((tenantKey: string) => {
    setExpandedTenants((prev) => {
      const next = new Set(prev)
      if (next.has(tenantKey)) {
        next.delete(tenantKey)
      } else {
        next.add(tenantKey)
      }
      return next
    })
  }, [])

  const handleSelectAllInTenant = useCallback(
    (tenantKey: string) => {
      const group = tenantGroups.find((g) => g.key === tenantKey)
      if (!group) return

      const allSelected = group.newEntities.every((e) => selectedEntities.has(e.id))
      setSelectedEntities((prev) => {
        const next = new Set(prev)
        for (const entity of group.newEntities) {
          if (allSelected) {
            next.delete(entity.id)
          } else {
            next.add(entity.id)
          }
        }
        return next
      })
    },
    [tenantGroups, selectedEntities],
  )

  const handleToggleEntity = useCallback((entityId: string) => {
    setSelectedEntities((prev) => {
      const next = new Set(prev)
      if (next.has(entityId)) {
        next.delete(entityId)
      } else {
        next.add(entityId)
      }
      return next
    })
  }, [])

  const handleImport = useCallback(async () => {
    if (selectedEntities.size === 0) {
      toast.error('Please select entities to import')
      return
    }

    setImporting(true)

    try {
      const entitiesToImport = []

      for (const entityId of selectedEntities) {
        const entity = entities.find((e) => e.id === entityId)
        if (!entity) continue

        try {
          const { data } = await axios.post('/api/ngsi-sources/fetch-entity-details', {
            sourceId,
            entityId: entity.id,
            service: entity.service,
            servicePath: entity.servicePath,
          })

          entitiesToImport.push({
            entityId: entity.id,
            type: entity.type,
            service: entity.service,
            servicePath: entity.servicePath,
            attributes: data.attributes,
          })
        } catch (error) {
          console.error(`Failed to fetch details for ${entityId}:`, error)
        }
      }

      if (entitiesToImport.length === 0) {
        toast.error('Failed to fetch entity details')
        return
      }

      const { data } = await axios.post('/api/ngsi-sources/import-entities', {
        sourceId,
        entities: entitiesToImport,
      })

      toast.success(data.message)

      setEntities((prev) =>
        prev.map((e) => (data.success.includes(e.id) ? { ...e, alreadySynced: true } : e)),
      )
      setSelectedEntities(new Set())

      if (data.failed?.length > 0) {
        const failedMsg = data.failed
          .map((f: { id: string; error: string }) => `${f.id}: ${f.error}`)
          .join(', ')
        toast.error(`Some imports failed: ${failedMsg}`)
      }
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : 'Unknown error'
      toast.error(errorMessage)
    } finally {
      setImporting(false)
    }
  }, [sourceId, selectedEntities, entities])

  // Extract simple type from URL
  const getSimpleType = (type: string) => {
    if (type.includes('/')) {
      return type.split('/').pop() || type
    }
    return type
  }

  const newEntitiesCount = entities.filter((e) => !e.alreadySynced).length
  const emptyTenants = tenantGroups.filter((g) => g.status === 'empty')
  const activeTenants = tenantGroups.filter(
    (g) => g.status === 'ok' && (g.newEntities.length > 0 || g.syncedEntities.length > 0),
  )

  return (
    <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <Button
          onClick={handleDiscover}
          disabled={loading || !brokerUrl || !sourceId}
          buttonStyle="secondary"
        >
          <RefreshCw size={16} style={{ marginRight: '0.5rem' }} />
          {loading ? 'Discovering...' : 'Discover Entities'}
        </Button>

        {discovered && newEntitiesCount > 0 && (
          <Button
            onClick={handleImport}
            disabled={importing || selectedEntities.size === 0}
            buttonStyle="primary"
          >
            <Download size={16} style={{ marginRight: '0.5rem' }} />
            {importing ? 'Importing...' : `Import Selected (${selectedEntities.size})`}
          </Button>
        )}
      </div>

      {!sourceId && (
        <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
          Save the source first to discover entities from the broker.
        </p>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '4px',
            padding: '0.75rem',
            marginBottom: '1rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
            }}
          >
            <AlertCircle size={16} color="#dc2626" />
            <strong style={{ color: '#dc2626' }}>Connection Errors:</strong>
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem', color: '#7f1d1d' }}>
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Empty/New Tenants */}
      {discovered && emptyTenants.length > 0 && (
        <div
          style={{
            backgroundColor: '#fefce8',
            border: '1px solid #fef08a',
            borderRadius: '4px',
            padding: '0.75rem',
            marginBottom: '1rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
            }}
          >
            <FolderOpen size={16} color="#ca8a04" />
            <strong style={{ color: '#854d0e' }}>Empty/New Tenants:</strong>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#854d0e' }}>
            The following tenants have no entities yet:
            <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.5rem' }}>
              {emptyTenants.map((tenant) => (
                <li key={tenant.key}>
                  <strong>{tenant.service || '(default)'}</strong>
                  {tenant.servicePath}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Tenant Groups with Entities */}
      {discovered && activeTenants.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {activeTenants.map((group) => {
            const isExpanded = expandedTenants.has(group.key)
            const allNewSelected =
              group.newEntities.length > 0 &&
              group.newEntities.every((e) => selectedEntities.has(e.id))
            const totalEntities = group.newEntities.length + group.syncedEntities.length

            return (
              <div
                key={group.key}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                {/* Tenant Header */}
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#f9fafb',
                    borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleToggleTenant(group.key)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <span style={{ fontWeight: 600 }}>
                      {group.service || '(default tenant)'}
                      <span style={{ fontWeight: 400, color: '#666' }}>{group.servicePath}</span>
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.125rem 0.5rem',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '9999px',
                        color: '#374151',
                      }}
                    >
                      {totalEntities} entities
                    </span>
                    {group.newEntities.length > 0 && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.125rem 0.5rem',
                          backgroundColor: '#dbeafe',
                          borderRadius: '9999px',
                          color: '#1e40af',
                        }}
                      >
                        {group.newEntities.length} new
                      </span>
                    )}
                  </div>

                  {group.newEntities.length > 0 && (
                    <Button
                      buttonStyle="secondary"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectAllInTenant(group.key)
                      }}
                    >
                      {allNewSelected ? 'Deselect All' : 'Select All New'}
                    </Button>
                  )}
                </div>

                {/* Tenant Content */}
                {isExpanded && (
                  <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f9fafb' }}>
                          <th
                            style={{
                              padding: '0.5rem',
                              textAlign: 'left',
                              borderBottom: '1px solid #e5e7eb',
                              width: '40px',
                            }}
                          ></th>
                          <th
                            style={{
                              padding: '0.5rem',
                              textAlign: 'left',
                              borderBottom: '1px solid #e5e7eb',
                            }}
                          >
                            Entity ID
                          </th>
                          <th
                            style={{
                              padding: '0.5rem',
                              textAlign: 'left',
                              borderBottom: '1px solid #e5e7eb',
                            }}
                          >
                            Type
                          </th>
                          <th
                            style={{
                              padding: '0.5rem',
                              textAlign: 'left',
                              borderBottom: '1px solid #e5e7eb',
                              width: '80px',
                            }}
                          >
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* New entities first */}
                        {group.newEntities.map((entity) => (
                          <tr
                            key={entity.id}
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleToggleEntity(entity.id)}
                          >
                            <td
                              style={{
                                padding: '0.5rem',
                                borderBottom: '1px solid #e5e7eb',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedEntities.has(entity.id)}
                                onChange={() => handleToggleEntity(entity.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td
                              style={{
                                padding: '0.5rem',
                                borderBottom: '1px solid #e5e7eb',
                                fontSize: '0.875rem',
                              }}
                            >
                              {entity.id}
                            </td>
                            <td
                              style={{
                                padding: '0.5rem',
                                borderBottom: '1px solid #e5e7eb',
                                fontSize: '0.875rem',
                              }}
                            >
                              <span
                                style={{
                                  backgroundColor: '#dbeafe',
                                  color: '#1e40af',
                                  padding: '0.125rem 0.5rem',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                }}
                              >
                                {getSimpleType(entity.type)}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: '0.5rem',
                                borderBottom: '1px solid #e5e7eb',
                                fontSize: '0.75rem',
                                color: '#1e40af',
                                fontWeight: 500,
                              }}
                            >
                              New
                            </td>
                          </tr>
                        ))}

                        {/* Synced entities */}
                        {group.syncedEntities.map((entity) => (
                          <tr key={entity.id} style={{ opacity: 0.7 }}>
                            <td
                              style={{
                                padding: '0.5rem',
                                borderBottom: '1px solid #e5e7eb',
                              }}
                            >
                              <Check size={16} color="#16a34a" />
                            </td>
                            <td
                              style={{
                                padding: '0.5rem',
                                borderBottom: '1px solid #e5e7eb',
                                fontSize: '0.875rem',
                              }}
                            >
                              {entity.id}
                            </td>
                            <td
                              style={{
                                padding: '0.5rem',
                                borderBottom: '1px solid #e5e7eb',
                                fontSize: '0.875rem',
                              }}
                            >
                              <span
                                style={{
                                  backgroundColor: '#dcfce7',
                                  color: '#166534',
                                  padding: '0.125rem 0.5rem',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                }}
                              >
                                {getSimpleType(entity.type)}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: '0.5rem',
                                borderBottom: '1px solid #e5e7eb',
                                fontSize: '0.75rem',
                                color: '#16a34a',
                                fontWeight: 500,
                              }}
                            >
                              Synced
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* No results message */}
      {discovered && activeTenants.length === 0 && emptyTenants.length === 0 && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            textAlign: 'center',
            color: '#666',
          }}
        >
          No entities found. Make sure the broker has entities and the tenant configuration is
          correct.
        </div>
      )}
    </div>
  )
}
