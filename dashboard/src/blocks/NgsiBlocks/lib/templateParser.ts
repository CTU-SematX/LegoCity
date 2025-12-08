/**
 * Template Parser for NGSI Card blocks
 *
 * Supports placeholders:
 * - {{entityId}} - Full entity ID (urn:ngsi-ld:Building:001)
 * - {{entityType}} - Entity type (Building)
 * - {{data.xxx}} - Attribute value, supports nested paths (data.address.street)
 */

export interface TemplateContext {
  entityId: string
  entityType: string
  data: Record<string, unknown>
}

/**
 * Get value from nested object path
 * @example getNestedValue({ a: { b: 1 } }, "a.b") => 1
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.')
  let current: unknown = obj

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined
    }
    if (typeof current !== 'object') {
      return undefined
    }
    current = (current as Record<string, unknown>)[key]
  }

  return current
}

/**
 * Format value for display
 * - Objects/Arrays: JSON stringify
 * - Numbers: locale format
 * - Others: string conversion
 */
function formatValueForDisplay(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (typeof value === 'number') {
    // Format with locale, max 2 decimal places
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }

  if (typeof value === 'object') {
    // For GeoProperty coordinates, format nicely
    if (isGeoPoint(value)) {
      const coords = (value as { coordinates: [number, number] }).coordinates
      return formatCoordinates(coords[1], coords[0]) // [lng, lat] -> lat, lng
    }

    // For address objects, try to format nicely
    if (isAddressObject(value)) {
      return formatAddress(value as Record<string, unknown>)
    }

    // Fallback: compact JSON
    return JSON.stringify(value)
  }

  return String(value)
}

/**
 * Check if value is a GeoJSON Point
 */
function isGeoPoint(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return obj.type === 'Point' && Array.isArray(obj.coordinates) && obj.coordinates.length === 2
}

/**
 * Format coordinates as readable string
 */
function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S'
  const lngDir = lng >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`
}

/**
 * Check if value looks like an address object
 */
function isAddressObject(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return 'streetAddress' in obj || 'addressLocality' in obj || 'addressCountry' in obj
}

/**
 * Format address object as readable string
 */
function formatAddress(address: Record<string, unknown>): string {
  const parts: string[] = []

  if (address.streetAddress) parts.push(String(address.streetAddress))
  if (address.addressLocality) parts.push(String(address.addressLocality))
  if (address.addressRegion) parts.push(String(address.addressRegion))
  if (address.addressCountry) parts.push(String(address.addressCountry))
  if (address.postalCode) parts.push(String(address.postalCode))

  return parts.join(', ') || JSON.stringify(address)
}

/**
 * Parse template string and replace {{placeholders}} with values
 *
 * @param template - Template string with {{placeholder}} syntax
 * @param context - Data context containing entityId, entityType, and data
 * @returns Parsed string with placeholders replaced
 *
 * @example
 * parseTemplate("Hello {{data.name}}", { entityId: "...", entityType: "...", data: { name: "World" } })
 * // => "Hello World"
 */
export function parseTemplate(template: string, context: TemplateContext): string {
  if (!template) return ''

  // Match {{...}} patterns
  const placeholderRegex = /\{\{([^}]+)\}\}/g

  return template.replace(placeholderRegex, (match, placeholder: string) => {
    const trimmed = placeholder.trim()

    // Handle special placeholders
    if (trimmed === 'entityId') {
      return context.entityId || ''
    }

    if (trimmed === 'entityType') {
      return context.entityType || ''
    }

    // Handle data.xxx placeholders
    if (trimmed.startsWith('data.')) {
      const path = trimmed.slice(5) // Remove 'data.' prefix
      const value = getNestedValue(context.data, path)
      return formatValueForDisplay(value)
    }

    // Unknown placeholder - return empty
    return ''
  })
}

/**
 * Extract all available attribute paths from entity data
 * Used for AttributeHints component in admin UI
 *
 * @param data - Processed entity data (values already extracted from NGSI format)
 * @param prefix - Internal use for recursion
 * @param maxDepth - Maximum nesting depth (default: 3)
 * @returns Array of paths like ["data.name", "data.address.street"]
 */
export function extractAttributePaths(
  data: Record<string, unknown>,
  prefix: string = 'data',
  maxDepth: number = 3,
): string[] {
  const paths: string[] = []

  if (maxDepth <= 0) return paths

  for (const [key, value] of Object.entries(data)) {
    const currentPath = `${prefix}.${key}`

    // Always add the current path
    paths.push(currentPath)

    // If value is a plain object (not array, not null), recurse
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const nestedPaths = extractAttributePaths(
        value as Record<string, unknown>,
        currentPath,
        maxDepth - 1,
      )
      paths.push(...nestedPaths)
    }
  }

  return paths
}

/**
 * Get placeholder suggestions for autocomplete
 * Returns common placeholders + data paths
 */
export function getPlaceholderSuggestions(data?: Record<string, unknown>): string[] {
  const suggestions = ['{{entityId}}', '{{entityType}}']

  if (data) {
    const dataPaths = extractAttributePaths(data)
    suggestions.push(...dataPaths.map((p) => `{{${p}}}`))
  }

  return suggestions
}
