'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import React, { useEffect, useMemo, useState, useCallback } from 'react'

import type { Map } from '@/payload-types'

import { MapView, type MapLayerData, type MapSettings } from '@/components/MapView'
import { DashboardLayout, type MapItem, type LayerCount } from '@/components/Dashboard'

interface MapPageClientProps {
  map: Map
  allMaps: MapItem[]
}

const PageClient: React.FC<MapPageClientProps> = ({ map, allMaps }) => {
  const { setHeaderTheme } = useHeaderTheme()
  const [layerCounts, setLayerCounts] = useState<LayerCount[]>([])

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])

  // Transform map layers to MapLayerData format
  const layers = useMemo((): MapLayerData[] => {
    if (!map.layers || !Array.isArray(map.layers)) return []

    return map.layers
      .filter((layer) => layer.enabled !== false)
      .map((layer) => {
        // Extract data model info - handle both populated object and unpopulated ID
        const dataModel = typeof layer.dataModel === 'object' ? layer.dataModel : null
        const source = typeof layer.source === 'object' ? layer.source : null

        // Log warning if relationships are not populated
        if (typeof layer.dataModel === 'string') {
          console.warn(
            `[MapLayer] dataModel not populated for layer "${layer.name}", ID: ${layer.dataModel}`,
          )
        }
        if (typeof layer.source === 'string') {
          console.warn(
            `[MapLayer] source not populated for layer "${layer.name}", ID: ${layer.source}`,
          )
        }

        // Extract entity IDs if specific entities are selected
        const entityIds = layer.entities
          ?.map((e) => (typeof e === 'object' ? e.entityId : null))
          .filter((id): id is string => id !== null)

        // Extract entity data if specific entities are selected
        const entityData = layer.entities
          ?.map((e) => {
            if (typeof e === 'object' && e.attributes) {
              // Convert PayloadCMS entity to NgsiEntity format
              const attrs = typeof e.attributes === 'object' ? e.attributes : {}
              return {
                id: e.entityId,
                type: e.type,
                ...attrs,
              }
            }
            return null
          })
          .filter((entity): entity is any => entity !== null)

        // Get broker URL (use direct broker URL)
        const brokerUrl = source?.brokerUrl || ''

        // DEBUG: Log broker URL
        console.log('[DEBUG] Layer:', layer.name, {
          sourceName: source?.name,
          brokerUrl: source?.brokerUrl,
          proxyUrl: source?.proxyUrl,
          usingBrokerUrl: brokerUrl,
        })

        // Get entity type from data model
        const entityType = dataModel?.model || ''

        // Get context URL from data model
        const contextUrl = dataModel?.contextUrl || undefined

        // Extract tenant from entities if specific entities are selected
        // Otherwise use first tenant from source
        let tenant: string | undefined = undefined
        let servicePath: string | undefined = undefined

        if (layer.entities && layer.entities.length > 0) {
          // Use tenant from first selected entity
          const firstEntity = layer.entities[0]
          if (typeof firstEntity === 'object') {
            tenant = firstEntity.service || undefined
            servicePath = firstEntity.servicePath || undefined
          }
        } else if (source) {
          // Use first tenant from source
          tenant = source.serviceHeader?.[0]?.value || undefined
          servicePath = source.servicePath?.[0]?.value || undefined
        }

        return {
          id: layer.id || `layer-${Math.random().toString(36).substr(2, 9)}`,
          name: layer.name,
          brokerUrl,
          entityType,
          entityIds: entityIds && entityIds.length > 0 ? entityIds : undefined,
          // Always fetch from broker, don't use preloaded entity data
          entityData: undefined,
          tenant,
          servicePath,
          contextUrl,
          locationAttribute: layer.locationAttribute || undefined,
          markerStyle: {
            color: layer.markerStyle?.color,
            size: layer.markerStyle?.size,
            icon: layer.markerStyle?.icon,
          },
          popupTemplate: layer.popupTemplate,
          refreshInterval: layer.refreshInterval || 60,
          enabled: layer.enabled !== false,
        }
      })
      .filter((layer) => layer.brokerUrl && layer.entityType)
  }, [map.layers])

  // Handle layer data loaded for entity counts
  const handleLayerDataLoaded = useCallback(
    (counts: Record<string, { name: string; count: number; color?: string }>) => {
      const layerCountsArray: LayerCount[] = Object.entries(counts).map(([id, data]) => ({
        id,
        name: data.name,
        count: data.count,
        color: data.color,
      }))
      setLayerCounts(layerCountsArray)
    },
    [],
  )

  // Extract map settings
  const mapSettings = useMemo((): MapSettings => {
    return {
      centerLng: map.mapSettings?.centerLng,
      centerLat: map.mapSettings?.centerLat,
      zoom: map.mapSettings?.zoom,
      mapStyle: map.mapSettings?.mapStyle,
    }
  }, [map.mapSettings])

  return (
    <div className="fixed inset-0 top-[64px]">
      <DashboardLayout maps={allMaps} layerCounts={layerCounts}>
        <MapView
          className="w-full h-full"
          layers={layers}
          mapSettings={mapSettings}
          onLayerDataLoaded={handleLayerDataLoaded}
        />
      </DashboardLayout>
    </div>
  )
}

export default PageClient
