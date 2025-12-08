'use client'

import React from 'react'
import { useField, FieldLabel } from '@payloadcms/ui'
import type { TextareaFieldClientComponent } from 'payload'

/**
 * Simple textarea field for NGSI template content.
 * Use {{data.attributeName}} syntax for placeholders.
 */
export const ContentTemplateField: TextareaFieldClientComponent = ({ path, field }) => {
  const { value, setValue } = useField<string>({ path })

  const label = (field?.label as string) || 'Content Template'
  const description = field?.admin?.description
  const placeholder = field?.admin?.placeholder as string | undefined
  const rows = (field?.admin?.rows as number) || 6

  return (
    <div className="field-type textarea">
      <FieldLabel label={label} path={path} />
      <div className="mt-1">
        <textarea
          value={value || ''}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-mono
            focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
            dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          style={{ resize: 'vertical' }}
        />
      </div>
      {description && (
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {typeof description === 'string' ? description : null}
        </div>
      )}
    </div>
  )
}

export default ContentTemplateField
