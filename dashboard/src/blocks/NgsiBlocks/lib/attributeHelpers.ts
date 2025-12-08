import type { NgsiEntity } from '@/lib/ngsi-ld/browser-client'
import type { AttributeSelectionMode } from '../fields/ngsiDataSource'

/**
 * System attributes that are typically not displayed to users
 */
export const SYSTEM_ATTRIBUTES = ['id', 'type', '@context']

/**
 * Extract attribute value from NGSI-LD property format
 * NGSI-LD attributes can be:
 * - Property: { type: 'Property', value: X }
 * - Relationship: { type: 'Relationship', object: 'urn:...' }
 * - GeoProperty: { type: 'GeoProperty', value: { type: 'Point', coordinates: [...] } }
 */
export function extractAttributeValue(attr: unknown): unknown {
  if (attr === null || attr === undefined) {
    return null
  }

  if (typeof attr !== 'object') {
    return attr
  }

  const attrObj = attr as Record<string, unknown>

  // NGSI-LD Property
  if (attrObj.type === 'Property' && 'value' in attrObj) {
    return attrObj.value
  }

  // NGSI-LD Relationship
  if (attrObj.type === 'Relationship' && 'object' in attrObj) {
    return attrObj.object
  }

  // NGSI-LD GeoProperty
  if (attrObj.type === 'GeoProperty' && 'value' in attrObj) {
    return attrObj.value
  }

  // Simplified format (just value)
  if ('value' in attrObj) {
    return attrObj.value
  }

  return attr
}

/**
 * Get display-friendly attribute names from entity
 * Excludes system attributes (id, type, @context)
 */
export function getEntityAttributeNames(entity: NgsiEntity): string[] {
  return Object.keys(entity).filter((key) => !SYSTEM_ATTRIBUTES.includes(key))
}

/**
 * Filter entity attributes based on selection mode
 */
export function filterAttributes(
  entity: NgsiEntity,
  mode: AttributeSelectionMode,
  selectedAttributes: string[],
): Record<string, unknown> {
  const allKeys = getEntityAttributeNames(entity)

  let keysToInclude: string[]

  switch (mode) {
    case 'include':
      keysToInclude = allKeys.filter((key) => selectedAttributes.includes(key))
      break
    case 'exclude':
      keysToInclude = allKeys.filter((key) => !selectedAttributes.includes(key))
      break
    case 'all':
    default:
      keysToInclude = allKeys
  }

  const result: Record<string, unknown> = {}
  for (const key of keysToInclude) {
    result[key] = extractAttributeValue(entity[key])
  }

  return result
}

/**
 * Format attribute name for display (camelCase -> Title Case)
 */
export function formatAttributeName(name: string): string {
  // Insert space before uppercase letters and capitalize first letter
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

/**
 * Get attribute metadata (type, observedAt, etc.) if available
 */
export function getAttributeMetadata(attr: unknown): {
  type?: string
  observedAt?: string
  unitCode?: string
} | null {
  if (attr === null || attr === undefined || typeof attr !== 'object') {
    return null
  }

  const attrObj = attr as Record<string, unknown>

  return {
    type: attrObj.type as string | undefined,
    observedAt: attrObj.observedAt as string | undefined,
    unitCode: attrObj.unitCode as string | undefined,
  }
}

/**
 * Check if attribute is a GeoProperty (for map display)
 */
export function isGeoProperty(attr: unknown): boolean {
  if (attr === null || attr === undefined || typeof attr !== 'object') {
    return false
  }

  const attrObj = attr as Record<string, unknown>
  return attrObj.type === 'GeoProperty'
}

/**
 * Extract coordinates from GeoProperty
 * Returns [longitude, latitude] or null
 */
export function extractCoordinates(attr: unknown): [number, number] | null {
  if (!isGeoProperty(attr)) {
    return null
  }

  const attrObj = attr as Record<string, unknown>
  const value = attrObj.value as Record<string, unknown> | undefined

  if (value?.type === 'Point' && Array.isArray(value.coordinates)) {
    const coords = value.coordinates as number[]
    if (coords.length >= 2) {
      return [coords[0], coords[1]]
    }
  }

  return null
}
