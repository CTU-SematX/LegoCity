'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapboxLayerManager, type NgsiLayerConfig } from './MapboxLayerManager'
import { useNgsiData } from '@/blocks/NgsiBlocks/hooks/useNgsiData'
import {
  entitiesToFeatureCollection,
  getFeatureCollectionBounds,
} from '@/lib/ngsi-ld/geoJsonHelpers'
import type { NgsiEntity } from '@/lib/ngsi-ld/browser-client'

export interface MapLayerData {
  id: string
  name: string
  brokerUrl: string
  entityType: string
  entityIds?: string[]
  entityData?: NgsiEntity[] // Preloaded entity data from PayloadCMS
  tenant?: string
  servicePath?: string
  contextUrl?: string
  locationAttribute?: string
  markerStyle?: {
    color?: string | null
    size?: number | null
    icon?: string | null
  }
  popupTemplate?: string | null
  refreshInterval?: number
  enabled?: boolean
}

export interface MapSettings {
  centerLng?: number | null
  centerLat?: number | null
  zoom?: number | null
  mapStyle?: string | null
}

interface MapViewProps {
  title?: string
  className?: string
  layers?: MapLayerData[]
  mapSettings?: MapSettings
  onLayerDataLoaded?: (
    counts: Record<string, { name: string; count: number; color?: string }>,
  ) => void
}

/**
 * Single layer data fetcher component
 */
const NgsiLayerFetcher: React.FC<{
  layer: MapLayerData
  onDataLoaded: (layerId: string, data: NgsiEntity[]) => void
  onError: (layerId: string, error: string) => void
}> = ({ layer, onDataLoaded, onError }) => {
  // If entityData is provided (preloaded from PayloadCMS), use it directly
  useEffect(() => {
    if (layer.entityData && layer.entityData.length > 0) {
      onDataLoaded(layer.id, layer.entityData)
    }
  }, [layer.entityData, layer.id, onDataLoaded])

  // Only fetch from broker if no preloaded data
  const shouldFetch = !layer.entityData || layer.entityData.length === 0

  const { data, error } = useNgsiData<NgsiEntity[]>({
    brokerUrl: layer.brokerUrl,
    entityType: layer.entityType,
    tenant: layer.tenant,
    servicePath: layer.servicePath,
    contextUrl: layer.contextUrl,
    refreshInterval: layer.refreshInterval || 60,
    enabled: layer.enabled !== false && shouldFetch,
  })

  useEffect(() => {
    if (data && shouldFetch) {
      onDataLoaded(layer.id, data)
    }
  }, [data, layer.id, onDataLoaded, shouldFetch])

  useEffect(() => {
    if (error && shouldFetch) {
      onError(layer.id, error.message)
    }
  }, [error, layer.id, onError, shouldFetch])

  return null
}

export const MapView: React.FC<MapViewProps> = ({
  title,
  className,
  layers,
  mapSettings,
  onLayerDataLoaded,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const layerManager = useRef<MapboxLayerManager | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [layerErrors, setLayerErrors] = useState<Record<string, string>>({})
  const layerDataRef = useRef<Record<string, { name: string; count: number; color?: string }>>({})

  // Initialize map
  useEffect(() => {
    if (map.current) return

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) {
      console.error('Mapbox token is not defined')
      return
    }

    mapboxgl.accessToken = token

    if (mapContainer.current) {
      const style = mapSettings?.mapStyle || 'streets-v12'
      const center: [number, number] = [
        mapSettings?.centerLng ?? 105.7718,
        mapSettings?.centerLat ?? 10.0299,
      ]
      const zoom = mapSettings?.zoom ?? 12

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: `mapbox://styles/mapbox/${style}`,
        center,
        zoom,
      })

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right')
      map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left')

      map.current.on('load', () => {
        layerManager.current = new MapboxLayerManager(map.current!)
        setMapLoaded(true)
      })
    }

    return () => {
      layerManager.current?.removeAllLayers()
      map.current?.remove()
      map.current = null
      layerManager.current = null
      setMapLoaded(false)
    }
  }, [mapSettings?.mapStyle, mapSettings?.centerLng, mapSettings?.centerLat, mapSettings?.zoom])

  // Handle layer data loaded
  const handleDataLoaded = useCallback(
    (layerId: string, entities: NgsiEntity[]) => {
      if (!layerManager.current || !mapLoaded) return

      const layer = layers?.find((l) => l.id === layerId)
      if (!layer) return

      // Handle empty string as undefined for auto-detection
      const locationAttr =
        layer.locationAttribute && layer.locationAttribute.trim() !== ''
          ? layer.locationAttribute
          : undefined

      const featureCollection = entitiesToFeatureCollection(entities, locationAttr)

      const config: NgsiLayerConfig = {
        id: layerId,
        name: layer.name,
        data: featureCollection,
        style: {
          color: layer.markerStyle?.color,
          size: layer.markerStyle?.size,
          icon: layer.markerStyle?.icon as NgsiLayerConfig['style']['icon'],
        },
        popupTemplate: layer.popupTemplate,
      }

      layerManager.current.addOrUpdateLayer(config)

      // Update layer counts and notify parent
      layerDataRef.current[layerId] = {
        name: layer.name,
        count: entities.length,
        color: layer.markerStyle?.color || undefined,
      }
      if (onLayerDataLoaded) {
        onLayerDataLoaded({ ...layerDataRef.current })
      }

      // Clear error for this layer
      setLayerErrors((prev) => {
        const next = { ...prev }
        delete next[layerId]
        return next
      })
    },
    [mapLoaded, layers, onLayerDataLoaded],
  )

  // Handle layer error
  const handleError = useCallback((layerId: string, error: string) => {
    setLayerErrors((prev) => ({ ...prev, [layerId]: error }))
  }, [])

  // Clean up removed layers
  useEffect(() => {
    if (!layerManager.current || !mapLoaded) return

    const currentLayerIds = layers?.map((l) => l.id) || []
    const existingLayerIds = layerManager.current.getLayerIds()

    for (const existingId of existingLayerIds) {
      if (!currentLayerIds.includes(existingId)) {
        layerManager.current.removeLayer(existingId)
      }
    }
  }, [layers, mapLoaded])

  const enabledLayers = layers?.filter((l) => l.enabled !== false) || []
  const hasErrors = Object.keys(layerErrors).length > 0

  return (
    <div className={`relative w-full h-full ${className || ''}`}>
      {/* Title overlay */}
      {title && (
        <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-gray-900/90 px-4 py-2 rounded-lg shadow-lg">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h1>
        </div>
      )}

      {/* Layer info overlay */}
      {enabledLayers.length > 0 && (
        <div className="absolute top-4 right-16 z-10 bg-white/90 dark:bg-gray-900/90 px-3 py-2 rounded-lg shadow-lg">
          <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
            {enabledLayers.map((layer) => (
              <div key={layer.id} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: layer.markerStyle?.color || '#3b82f6' }}
                />
                <span>{layer.name}</span>
                {layerErrors[layer.id] && (
                  <span className="text-red-500" title={layerErrors[layer.id]}>
                    ⚠
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error overlay */}
      {hasErrors && (
        <div className="absolute bottom-4 left-4 z-10 bg-red-100 dark:bg-red-900/90 px-3 py-2 rounded-lg shadow-lg max-w-xs">
          <p className="text-xs text-red-800 dark:text-red-200">
            Some layers failed to load. Check console for details.
          </p>
        </div>
      )}

      {/* Map container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Data fetchers (hidden, just for data loading) */}
      {mapLoaded &&
        enabledLayers.map((layer) => (
          <NgsiLayerFetcher
            key={layer.id}
            layer={layer}
            onDataLoaded={handleDataLoaded}
            onError={handleError}
          />
        ))}
    </div>
  )
}
