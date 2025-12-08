'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useField, useFormFields, FieldLabel, useTheme } from '@payloadcms/ui'
import type { JSONFieldClientComponent } from 'payload'
import { Download, Loader2, AlertCircle, Check, Copy, Maximize2, Minimize2 } from 'lucide-react'
import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import './attributes-field.css'

interface DataModelValue {
  id?: string
  model?: string
  repoName?: string
}

/**
 * Custom JSON field for Entity Attributes with CodeMirror editor.
 */
export const AttributesField: JSONFieldClientComponent = ({ path, field }) => {
  const { value, setValue } = useField<Record<string, unknown>>({ path })
  const { theme } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const dataModelValue = useFormFields(([fields]) => {
    return fields['dataModel']?.value as string | DataModelValue | undefined
  })

  const dataModelId = typeof dataModelValue === 'string' ? dataModelValue : dataModelValue?.id
  const hasDataModel = Boolean(dataModelId)

  const editorValue = useMemo(() => {
    if (!value || Object.keys(value).length === 0) return ''
    return JSON.stringify(value, null, 2)
  }, [value])

  const editorTheme = theme === 'dark' ? 'dark' : 'light'

  const fetchExample = useCallback(async () => {
    if (!dataModelId) {
      setError('Please select a Data Model first')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/ngsi-data-models/${dataModelId}`)
      if (!response.ok) throw new Error('Failed to fetch data model info')

      const dataModel = await response.json()
      const { model, repoName } = dataModel

      if (!model) throw new Error('Data model missing model name.')
      if (!repoName) throw new Error('Data model missing repoName. Please resync Data Models.')

      const exampleUrl = `https://smart-data-models.github.io/${repoName}/${model}/examples/example-normalized.jsonld`
      const exampleResponse = await fetch(exampleUrl)
      if (!exampleResponse.ok) throw new Error(`Example not found for ${model}`)

      const exampleData = await exampleResponse.json()
      const { id, type, '@context': context, ...attributes } = exampleData

      setValue(attributes)
      setError(null)
      setJsonError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch example')
    } finally {
      setIsLoading(false)
    }
  }, [dataModelId, setValue])

  const handleEditorChange = useCallback(
    (text: string) => {
      if (!text.trim()) {
        setValue({})
        setJsonError(null)
        return
      }

      try {
        const parsed = JSON.parse(text)
        setValue(parsed)
        setJsonError(null)
      } catch {
        setJsonError('Invalid JSON syntax')
      }
    },
    [setValue],
  )

  const handleCopy = useCallback(async () => {
    const text = value ? JSON.stringify(value, null, 2) : '{}'
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [value])

  const extensions = useMemo(() => [json()], [])
  const label = (field?.label as string) || 'Entity Attributes'

  return (
    <div className="attributes-field">
      <div className="attributes-field__header">
        <FieldLabel label={label} path={path} />

        <div className="attributes-field__actions">
          <button
            type="button"
            onClick={handleCopy}
            className="attributes-field__icon-btn"
            title="Copy JSON"
          >
            {copied ? (
              <Check className="attributes-field__icon attributes-field__icon--success" />
            ) : (
              <Copy className="attributes-field__icon" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="attributes-field__icon-btn"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? (
              <Minimize2 className="attributes-field__icon" />
            ) : (
              <Maximize2 className="attributes-field__icon" />
            )}
          </button>

          <button
            type="button"
            onClick={fetchExample}
            disabled={isLoading || !hasDataModel}
            className="attributes-field__primary-btn"
            title={
              hasDataModel ? 'Fetch example from Smart Data Models' : 'Select a Data Model first'
            }
          >
            {isLoading ? (
              <Loader2 className="attributes-field__icon attributes-field__icon--spin" />
            ) : (
              <Download className="attributes-field__icon" />
            )}
            Fetch Example
          </button>
        </div>
      </div>

      {error && (
        <div className="attributes-field__error">
          <AlertCircle className="attributes-field__icon" />
          {error}
        </div>
      )}

      {jsonError && (
        <div className="attributes-field__warning">
          <AlertCircle className="attributes-field__icon" />
          {jsonError}
        </div>
      )}

      <div className="attributes-field__editor">
        <CodeMirror
          value={editorValue}
          onChange={handleEditorChange}
          extensions={extensions}
          theme={editorTheme}
          height={expanded ? '500px' : '300px'}
          placeholder='{"propertyName": {"type": "Property", "value": "..."}}'
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: true,
            autocompletion: false,
          }}
        />
      </div>

      <p className="attributes-field__hint">
        JSON object with NGSI-LD properties and relationships. Exclude id, type, @context.
      </p>
    </div>
  )
}

export default AttributesField
