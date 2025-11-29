'use client'

import React, { useState } from 'react'
import { toast, Button } from '@payloadcms/ui'
import axios from 'axios'

export const SyncButton: React.FC = () => {
  const [loading, setLoading] = useState(false)

  const handleSync = async () => {
    setLoading(true)

    try {
      const { data } = await axios.get('/api/ngsi-data-models/seed')

      toast.success(data.message || `Successfully synced ${data.count} data models`)

      // Reload the page to show updated data
      window.location.reload()
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : 'Unknown error'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <Button
        onClick={handleSync}
        disabled={loading}
        buttonStyle="primary"
        tooltip="Fetch and sync all NGSI-LD data models from Smart Data Models repository"
      >
        {loading ? 'Syncing...' : 'Sync smartdatamodels.org'}
      </Button>
    </div>
  )
}
