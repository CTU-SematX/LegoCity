'use client'

import React, { useState, useCallback } from 'react'
import { useDocumentInfo, useFormFields, Button } from '@payloadcms/ui'
import type { FieldClientComponent } from 'payload'
import axios from 'axios'

export const EntityInteraction: FieldClientComponent = () => {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { id } = useDocumentInfo()
  const entityId = useFormFields(([fields]) => fields.entityId?.value as string)

  const handleFetchEntity = useCallback(async () => {
    if (!id) return

    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const { data } = await axios.get(`/api/ngsi-entities/${id}/fetch`)
      setResponse(JSON.stringify(data, null, 2))
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.error || err.message
        : 'Unknown error'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [id])

  const handleResync = useCallback(async () => {
    if (!id) return

    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const { data } = await axios.post(`/api/ngsi-entities/${id}/resync`)
      setResponse(data.message || 'Entity resynced successfully')
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.error || err.message
        : 'Unknown error'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [id])

  if (!id) {
    return (
      <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <p style={{ color: '#666' }}>Save the entity first to enable interaction tools.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button onClick={handleFetchEntity} disabled={loading} buttonStyle="secondary">
          {loading ? 'Loading...' : 'Fetch from Broker'}
        </Button>
        <Button onClick={handleResync} disabled={loading} buttonStyle="primary">
          {loading ? 'Loading...' : 'Force Resync'}
        </Button>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            color: '#c00',
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {response && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px',
            whiteSpace: 'pre-wrap',
            overflow: 'auto',
            maxHeight: '400px',
          }}
        >
          {response}
        </div>
      )}

      <div
        style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#e8f4fd',
          borderRadius: '4px',
        }}
      >
        <h4 style={{ margin: '0 0 0.5rem 0' }}>NGSI-LD API Reference</h4>
        <p style={{ margin: '0 0 0.5rem 0', fontSize: '14px' }}>
          <strong>Entity ID:</strong> <code>{entityId || 'Not set'}</code>
        </p>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '13px' }}>
          <li>
            <strong>GET</strong> /ngsi-ld/v1/entities/{'{entityId}'}
          </li>
          <li>
            <strong>PATCH</strong> /ngsi-ld/v1/entities/{'{entityId}'}/attrs
          </li>
          <li>
            <strong>DELETE</strong> /ngsi-ld/v1/entities/{'{entityId}'}
          </li>
        </ul>
      </div>
    </div>
  )
}
