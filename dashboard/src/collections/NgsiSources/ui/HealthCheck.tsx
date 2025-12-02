'use client'

import React, { useCallback, useState } from 'react'
import { toast, useFormFields, Button } from '@payloadcms/ui'
import type { FieldClientComponent } from 'payload'
import axios from 'axios'

export const HealthCheck: FieldClientComponent = () => {
  const [loading, setLoading] = useState(false)

  // Get current form values using useFormFields
  const brokerUrl = useFormFields(([fields]) => fields.brokerUrl?.value as string)

  const handleHealthCheck = useCallback(async () => {
    if (!brokerUrl) {
      toast.error('Broker URL is required')
      return
    }

    setLoading(true)

    try {
      const { data } = await axios.post('/api/ngsi-sources/health-check', { brokerUrl })

      toast.success(data.message || 'Successfully connected to NGSI broker')
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : 'Unknown error'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [brokerUrl])

  return (
    <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
      <Button onClick={handleHealthCheck} disabled={loading || !brokerUrl} buttonStyle="secondary">
        {loading ? 'Checking...' : 'Test Connection'}
      </Button>
      <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
        Test the connection to the NGSI-LD Context Broker
      </p>
    </div>
  )
}
