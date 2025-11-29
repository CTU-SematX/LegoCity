'use client'

import React, { useEffect, useState } from 'react'
import { useFormFields, SelectInput, useField } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'
import axios from 'axios'

export const ServicePathSelect: TextFieldClientComponent = ({ path }) => {
  const { value, setValue } = useField<string>({ path })
  const [options, setOptions] = useState<{ label: string; value: string }[]>([])
  const [loading, setLoading] = useState(false)

  const sourceId = useFormFields(([fields]) => fields.source?.value as string)

  useEffect(() => {
    if (!sourceId) {
      setOptions([{ label: '/', value: '/' }])
      return
    }

    const fetchSource = async () => {
      setLoading(true)
      try {
        const { data } = await axios.get(`/api/ngsi-sources/${sourceId}`)
        const paths = data.servicePath || [{ value: '/' }]
        const opts = paths.map((p: { value: string }) => ({
          label: p.value,
          value: p.value,
        }))
        setOptions(opts)

        // Auto-select first if no value
        if (!value && opts.length > 0) {
          setValue(opts[0].value)
        }
      } catch (error) {
        console.error('Failed to fetch source:', error)
        setOptions([{ label: '/', value: '/' }])
      } finally {
        setLoading(false)
      }
    }

    fetchSource()
  }, [sourceId])

  if (!sourceId) {
    return (
      <div style={{ opacity: 0.6 }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
          Fiware-ServicePath
        </label>
        <p style={{ color: '#666', fontSize: '0.875rem' }}>Select a broker connection first</p>
      </div>
    )
  }

  return (
    <div>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
        Fiware-ServicePath
      </label>
      <SelectInput
        path={path}
        name="servicePath"
        options={options}
        value={value}
        onChange={(option) => setValue(option?.value || '/')}
        required
      />
    </div>
  )
}
