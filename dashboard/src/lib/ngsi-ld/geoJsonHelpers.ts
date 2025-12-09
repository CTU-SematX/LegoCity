import type { NgsiEntity } from '@/lib/ngsi-ld/browser-client'
import {
  extractAttributeValue,
  isGeoProperty,
  getEntityAttributeNames,
} from '@/blocks/NgsiBlocks/lib/attributeHelpers'

/**
 * GeoJSON types supported by NGSI-LD
 */
export type GeoJsonType =
  | 'Point'
  | 'LineString'
  | 'Polygon'
  | 'MultiPoint'
  | 'MultiLineString'
  | 'MultiPolygon'

export interface GeoJsonGeometry {
  type: GeoJsonType
  coordinates: number[] | number[][] | number[][][] | number[][][][]
}

export interface GeoJsonFeature {
  type: 'Feature'
  geometry: GeoJsonGeometry
  properties: Record<string, unknown>
  id?: string
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJsonFeature[]
}

/**
 * Find all GeoProperty attributes in an entity
 * Returns array of attribute names that contain GeoProperty
 */
export function findGeoProperties(entity: NgsiEntity): string[] {
  const attributeNames = getEntityAttributeNames(entity)
  return attributeNames.filter((name) => isGeoProperty(entity[name]))
}

/**
 * Find the first GeoProperty attribute in an entity
 * Common names like 'location' are checked first
 */
export function findPrimaryGeoProperty(entity: NgsiEntity): string | null {
  const commonNames = ['location', 'position', 'coordinates', 'geometry', 'geo']

  // Check common names first
  for (const name of commonNames) {
    if (entity[name] && isGeoProperty(entity[name])) {
      return name
    }
  }

  // Fallback to first GeoProperty found
  const geoProps = findGeoProperties(entity)
  return geoProps.length > 0 ? geoProps[0] : null
}

/**
 * Extract GeoJSON geometry from an entity attribute
 */
export function extractGeometry(
  entity: NgsiEntity,
  attributeName?: string,
): GeoJsonGeometry | null {
  const attrName = attributeName || findPrimaryGeoProperty(entity)
  if (!attrName) return null

  const attr = entity[attrName]
  if (!isGeoProperty(attr)) return null

  const value = extractAttributeValue(attr) as GeoJsonGeometry | null
  if (!value || !value.type || !value.coordinates) return null

  return value
}

/**
 * Extract properties from entity for use in GeoJSON feature
 * Excludes system attributes and extracts values from NGSI-LD format
 */
export function extractFeatureProperties(
  entity: NgsiEntity,
  excludeGeoProperties = true,
): Record<string, unknown> {
  const properties: Record<string, unknown> = {
    id: entity.id,
    type: entity.type,
  }

  const attributeNames = getEntityAttributeNames(entity)

  for (const name of attributeNames) {
    // Skip GeoProperties if requested
    if (excludeGeoProperties && isGeoProperty(entity[name])) {
      continue
    }

    properties[name] = extractAttributeValue(entity[name])
  }

  return properties
}

/**
 * Convert a single NGSI-LD entity to a GeoJSON Feature
 */
export function entityToFeature(
  entity: NgsiEntity,
  locationAttribute?: string,
): GeoJsonFeature | null {
  const geometry = extractGeometry(entity, locationAttribute)
  if (!geometry) return null

  return {
    type: 'Feature',
    id: entity.id,
    geometry,
    properties: extractFeatureProperties(entity, true),
  }
}

/**
 * Convert multiple NGSI-LD entities to a GeoJSON FeatureCollection
 * Entities without valid geometry are filtered out
 */
export function entitiesToFeatureCollection(
  entities: NgsiEntity[],
  locationAttribute?: string,
): GeoJsonFeatureCollection {
  const features: GeoJsonFeature[] = []

  for (const entity of entities) {
    const feature = entityToFeature(entity, locationAttribute)
    if (feature) {
      features.push(feature)
    }
  }

  return {
    type: 'FeatureCollection',
    features,
  }
}

/**
 * Check if a geometry is a Point type
 */
export function isPointGeometry(geometry: GeoJsonGeometry): boolean {
  return geometry.type === 'Point'
}

/**
 * Check if a geometry is a line or polygon type
 */
export function isShapeGeometry(geometry: GeoJsonGeometry): boolean {
  return ['LineString', 'Polygon', 'MultiLineString', 'MultiPolygon'].includes(geometry.type)
}

/**
 * Get center coordinates from any GeoJSON geometry
 * For Point: returns the point coordinates
 * For other types: calculates approximate center (bounding box center)
 */
export function getGeometryCenter(geometry: GeoJsonGeometry): [number, number] | null {
  if (geometry.type === 'Point') {
    const coords = geometry.coordinates as number[]
    if (coords.length >= 2) {
      return [coords[0], coords[1]]
    }
    return null
  }

  // For other geometry types, calculate bounding box center
  const allCoords = flattenCoordinates(geometry.coordinates)
  if (allCoords.length === 0) return null

  let minLng = Infinity,
    maxLng = -Infinity
  let minLat = Infinity,
    maxLat = -Infinity

  for (const coord of allCoords) {
    minLng = Math.min(minLng, coord[0])
    maxLng = Math.max(maxLng, coord[0])
    minLat = Math.min(minLat, coord[1])
    maxLat = Math.max(maxLat, coord[1])
  }

  return [(minLng + maxLng) / 2, (minLat + maxLat) / 2]
}

/**
 * Flatten nested coordinate arrays to a simple array of [lng, lat] pairs
 */
function flattenCoordinates(
  coords: number[] | number[][] | number[][][] | number[][][][],
): number[][] {
  const result: number[][] = []

  function flatten(arr: number[] | number[][] | number[][][] | number[][][][]): void {
    if (!Array.isArray(arr)) return

    // Check if this is a coordinate pair [lng, lat]
    if (arr.length >= 2 && typeof arr[0] === 'number' && typeof arr[1] === 'number') {
      result.push(arr as number[])
      return
    }

    // Otherwise, recurse
    for (const item of arr) {
      flatten(item as number[] | number[][] | number[][][])
    }
  }

  flatten(coords)
  return result
}

/**
 * Calculate bounding box for a FeatureCollection
 * Returns [minLng, minLat, maxLng, maxLat] or null if no valid features
 */
export function getFeatureCollectionBounds(
  featureCollection: GeoJsonFeatureCollection,
): [number, number, number, number] | null {
  if (featureCollection.features.length === 0) return null

  let minLng = Infinity,
    maxLng = -Infinity
  let minLat = Infinity,
    maxLat = -Infinity

  for (const feature of featureCollection.features) {
    const allCoords = flattenCoordinates(feature.geometry.coordinates)
    for (const coord of allCoords) {
      minLng = Math.min(minLng, coord[0])
      maxLng = Math.max(maxLng, coord[0])
      minLat = Math.min(minLat, coord[1])
      maxLat = Math.max(maxLat, coord[1])
    }
  }

  if (!isFinite(minLng) || !isFinite(maxLng) || !isFinite(minLat) || !isFinite(maxLat)) {
    return null
  }

  return [minLng, minLat, maxLng, maxLat]
}
