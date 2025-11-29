'use client'

import React from 'react'
import { useFormFields } from '@payloadcms/ui'
import type { FieldClientComponent } from 'payload'

export const EntityIdPreview: FieldClientComponent = () => {
  const shortId = useFormFields(([fields]) => fields.shortId?.value as string)
  const type = useFormFields(([fields]) => fields.type?.value as string)

  const fullUrn = shortId && type ? `urn:ngsi-ld:${type}:${shortId}` : 'urn:ngsi-ld:<type>:<id>'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
      <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Full Entity URN</label>
      <div
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '14px',
          color: shortId && type ? '#333' : '#999',
          border: '1px solid #ddd',
        }}
      >
        {fullUrn}
      </div>
      <p style={{ fontSize: '0.75rem', color: '#666', margin: 0 }}>
        This is the full NGSI-LD Entity ID that will be used
      </p>
    </div>
  )
}
