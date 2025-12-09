import mapboxgl from 'mapbox-gl'
import type { GeoJsonFeatureCollection } from '@/lib/ngsi-ld/geoJsonHelpers'

export interface MarkerStyle {
  color?: string | null
  size?: number | null
  icon?: 'circle' | 'square' | 'triangle' | 'star' | 'pin' | null
}

export interface NgsiLayerConfig {
  id: string
  name: string
  data: GeoJsonFeatureCollection
  style: MarkerStyle
  popupTemplate?: string | null
}

// Icon SVG paths for custom markers
const ICON_SVGS: Record<string, string> = {
  pin: `<svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z" fill="{{color}}"/>
    <circle cx="12" cy="12" r="5" fill="white"/>
  </svg>`,
  square: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="20" height="20" rx="3" fill="{{color}}" stroke="white" stroke-width="2"/>
  </svg>`,
  triangle: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L22 20H2L12 2z" fill="{{color}}" stroke="white" stroke-width="2"/>
  </svg>`,
  star: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.8l-6.4 4.4 2.4-7.2-6-4.8h7.6L12 2z" fill="{{color}}" stroke="white" stroke-width="1"/>
  </svg>`,
}

/**
 * Manages NGSI-LD data layers on a Mapbox map
 */
export class MapboxLayerManager {
  private map: mapboxgl.Map
  private layers: Map<string, NgsiLayerConfig> = new Map()
  private popups: Map<string, mapboxgl.Popup> = new Map()
  private loadedIcons: Set<string> = new Set()

  constructor(map: mapboxgl.Map) {
    this.map = map
  }

  /**
   * Add or update an NGSI layer on the map
   */
  addOrUpdateLayer(config: NgsiLayerConfig): void {
    const sourceId = `ngsi-source-${config.id}`
    const layerId = `ngsi-layer-${config.id}`

    // Store config for later reference
    this.layers.set(config.id, config)

    // Check if source already exists
    const existingSource = this.map.getSource(sourceId) as mapboxgl.GeoJSONSource | undefined

    if (existingSource) {
      // Update existing source data
      existingSource.setData(config.data as GeoJSON.FeatureCollection)
    } else {
      // Add new source
      this.map.addSource(sourceId, {
        type: 'geojson',
        data: config.data as GeoJSON.FeatureCollection,
        cluster: config.data.features.length > 50,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      })

      const useIcon = config.style.icon && config.style.icon !== 'circle'

      if (useIcon) {
        // Add symbol layer for custom icons
        this.addIconLayer(sourceId, layerId, config)
      } else {
        // Add circle layer for points (default)
        this.map.addLayer({
          id: layerId,
          type: 'circle',
          source: sourceId,
          filter: ['!', ['has', 'point_count']], // Exclude clusters
          paint: {
            'circle-radius': config.style.size || 8,
            'circle-color': config.style.color || '#3b82f6',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        })
      }

      // Add cluster circle layer
      this.map.addLayer({
        id: `${layerId}-clusters`,
        type: 'circle',
        source: sourceId,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': config.style.color || '#3b82f6',
          'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 50, 40],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
        },
      })

      // Add cluster count labels
      this.map.addLayer({
        id: `${layerId}-cluster-count`,
        type: 'symbol',
        source: sourceId,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
        paint: {
          'text-color': '#ffffff',
        },
      })

      // Add polygon/line layer if applicable
      this.map.addLayer({
        id: `${layerId}-fill`,
        type: 'fill',
        source: sourceId,
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: {
          'fill-color': config.style.color || '#3b82f6',
          'fill-opacity': 0.3,
        },
      })

      this.map.addLayer({
        id: `${layerId}-line`,
        type: 'line',
        source: sourceId,
        filter: [
          'any',
          ['==', ['geometry-type'], 'LineString'],
          ['==', ['geometry-type'], 'Polygon'],
        ],
        paint: {
          'line-color': config.style.color || '#3b82f6',
          'line-width': 2,
        },
      })

      // Setup event handlers
      this.setupEventHandlers(layerId, config)
      this.setupClusterClickHandler(`${layerId}-clusters`, config)
    }
  }

  /**
   * Add icon-based symbol layer
   */
  private addIconLayer(sourceId: string, layerId: string, config: NgsiLayerConfig): void {
    const iconType = config.style.icon || 'pin'
    const color = config.style.color || '#3b82f6'
    const iconId = `ngsi-icon-${iconType}-${color.replace('#', '')}`

    // Load icon if not already loaded
    if (!this.loadedIcons.has(iconId)) {
      this.loadIcon(iconId, iconType, color)
    }

    // Add symbol layer
    this.map.addLayer({
      id: layerId,
      type: 'symbol',
      source: sourceId,
      filter: ['!', ['has', 'point_count']],
      layout: {
        'icon-image': iconId,
        'icon-size': (config.style.size || 8) / 16,
        'icon-allow-overlap': true,
        'icon-anchor': iconType === 'pin' ? 'bottom' : 'center',
      },
    })
  }

  /**
   * Load custom icon into map
   */
  private loadIcon(iconId: string, iconType: string, color: string): void {
    const svgTemplate = ICON_SVGS[iconType]
    if (!svgTemplate) return

    const svg = svgTemplate.replace(/\{\{color\}\}/g, color)
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)

    const img = new Image()
    img.onload = () => {
      if (!this.map.hasImage(iconId)) {
        this.map.addImage(iconId, img)
        this.loadedIcons.add(iconId)
      }
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  /**
   * Setup hover and click handlers for popups
   */
  private setupEventHandlers(layerId: string, config: NgsiLayerConfig): void {
    let hoverPopup: mapboxgl.Popup | null = null

    // Cursor change and hover popup on mouseenter
    this.map.on('mouseenter', layerId, (e) => {
      this.map.getCanvas().style.cursor = 'pointer'

      if (!e.features || e.features.length === 0) return

      const feature = e.features[0]
      const geometry = feature.geometry as GeoJSON.Point
      if (geometry.type !== 'Point') return

      const coordinates = geometry.coordinates.slice() as [number, number]

      // Ensure the popup appears at the correct location when map wraps
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360
      }

      // Create hover popup
      const content = this.renderHoverPopupContent(config, feature.properties)
      hoverPopup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'ngsi-hover-popup',
        offset: 15,
      })
        .setLngLat(coordinates)
        .setHTML(content)
        .addTo(this.map)
    })

    // Remove hover popup on mouseleave
    this.map.on('mouseleave', layerId, () => {
      this.map.getCanvas().style.cursor = ''
      if (hoverPopup) {
        hoverPopup.remove()
        hoverPopup = null
      }
    })

    // Click handler for detailed popup
    this.map.on('click', layerId, (e) => {
      if (!e.features || e.features.length === 0) return

      // Remove hover popup
      if (hoverPopup) {
        hoverPopup.remove()
        hoverPopup = null
      }

      const feature = e.features[0]
      const geometry = feature.geometry as GeoJSON.Point
      if (geometry.type !== 'Point') return

      const coordinates = geometry.coordinates.slice() as [number, number]

      // Ensure the popup appears at the correct location when map wraps
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360
      }

      // Show detailed popup
      this.showPopup(config, feature.properties, coordinates)
    })
  }

  /**
   * Setup click handler for cluster zoom
   */
  private setupClusterClickHandler(layerId: string, config: NgsiLayerConfig): void {
    this.map.on('mouseenter', layerId, () => {
      this.map.getCanvas().style.cursor = 'pointer'
    })

    this.map.on('mouseleave', layerId, () => {
      this.map.getCanvas().style.cursor = ''
    })

    this.map.on('click', layerId, (e) => {
      if (!e.features || e.features.length === 0) return

      const feature = e.features[0]
      const coordinates = (feature.geometry as GeoJSON.Point).coordinates.slice() as [
        number,
        number,
      ]

      // Zoom into cluster
      const clusterId = feature.properties?.cluster_id
      const source = this.map.getSource(`ngsi-source-${config.id}`) as mapboxgl.GeoJSONSource
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return
        this.map.easeTo({
          center: coordinates,
          zoom: zoom ?? 14,
        })
      })
    })
  }

  /**
   * Render hover popup content (simplified)
   */
  private renderHoverPopupContent(
    config: NgsiLayerConfig,
    properties: Record<string, unknown> | null,
  ): string {
    if (!properties) {
      return '<div class="p-2 text-sm">No data</div>'
    }

    const name = properties.name || properties.id || config.name
    const type = properties.type || ''
    const status = properties.status || properties.state || ''

    let html = `<div class="ngsi-hover-popup-content">`
    html += `<div class="font-semibold text-blue-600">${name}</div>`
    if (type) {
      html += `<div class="text-xs text-gray-500">${type}</div>`
    }
    if (status) {
      const statusColor = this.getStatusColor(String(status))
      html += `<div class="flex items-center gap-1 mt-1">`
      html += `<span class="w-2 h-2 rounded-full" style="background-color: ${statusColor}"></span>`
      html += `<span class="text-xs uppercase">${status}</span>`
      html += `</div>`
    }
    html += `<div class="text-xs text-gray-400 mt-1">Click for details</div>`
    html += `</div>`
    return html
  }

  /**
   * Get status color based on status value
   */
  private getStatusColor(status: string): string {
    const normalizedStatus = status.toLowerCase()
    const statusColors: Record<string, string> = {
      online: '#22c55e',
      active: '#22c55e',
      available: '#22c55e',
      ok: '#22c55e',
      dispatched: '#f97316',
      busy: '#f97316',
      warning: '#f97316',
      pending: '#f97316',
      offline: '#ef4444',
      error: '#ef4444',
      unavailable: '#ef4444',
      inactive: '#6b7280',
    }
    return statusColors[normalizedStatus] || '#6b7280'
  }

  /**
   * Show popup for a feature
   */
  private showPopup(
    config: NgsiLayerConfig,
    properties: Record<string, unknown> | null,
    coordinates: [number, number],
  ): void {
    // Close existing popup for this layer
    const existingPopup = this.popups.get(config.id)
    if (existingPopup) {
      existingPopup.remove()
    }

    const content = this.renderPopupContent(config, properties)

    const popup = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: '300px',
    })
      .setLngLat(coordinates)
      .setHTML(content)
      .addTo(this.map)

    this.popups.set(config.id, popup)
  }

  /**
   * Render popup content using template or default format
   */
  private renderPopupContent(
    config: NgsiLayerConfig,
    properties: Record<string, unknown> | null,
  ): string {
    if (!properties) {
      return '<p>No data available</p>'
    }

    // Use template if provided
    if (config.popupTemplate) {
      return this.parseTemplate(config.popupTemplate, properties)
    }

    // Default format - improved styling
    const name = properties.name || properties.id || 'Unknown'
    const type = properties.type || config.name
    const status = properties.status || properties.state || ''

    let html = `<div class="ngsi-popup" style="min-width: 200px;">`

    // Header with name and status
    html += `<div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 8px;">`
    html += `<div style="color: #2563eb; font-weight: 600; font-size: 14px;">${name}</div>`
    if (status) {
      const statusColor = this.getStatusColor(String(status))
      html += `<div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">`
      html += `<span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${statusColor};"></span>`
      html += `<span style="font-size: 12px; text-transform: uppercase; color: #6b7280;">${status}</span>`
      html += `</div>`
    }
    html += `</div>`

    // Type info
    html += `<div style="font-size: 11px; color: #9ca3af; margin-bottom: 8px;">${type}</div>`

    // Properties
    html += `<div style="font-size: 12px; display: flex; flex-direction: column; gap: 4px;">`

    for (const [key, value] of Object.entries(properties)) {
      if (key === 'id' || key === 'type' || key === 'name' || key === 'status' || key === 'state')
        continue

      const displayValue = this.formatValue(value)
      const displayKey = this.formatKey(key)
      html += `<div style="display: flex; justify-content: space-between;">`
      html += `<span style="color: #6b7280;">${displayKey}</span>`
      html += `<span style="font-weight: 500; color: #374151;">${displayValue}</span>`
      html += `</div>`
    }

    html += `</div></div>`
    return html
  }

  /**
   * Parse template string with {{path}} placeholders
   */
  private parseTemplate(template: string, properties: Record<string, unknown>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getNestedValue(properties, path.trim())
      return this.formatValue(value)
    })
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key) => {
      if (current && typeof current === 'object') {
        return (current as Record<string, unknown>)[key]
      }
      return undefined
    }, obj)
  }

  /**
   * Format value for display
   */
  private formatValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '-'
    }
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    if (typeof value === 'number') {
      return Number.isInteger(value) ? value.toString() : value.toFixed(2)
    }
    return String(value)
  }

  /**
   * Format key for display (camelCase to Title Case)
   */
  private formatKey(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
  }

  /**
   * Update layer style
   */
  updateLayerStyle(layerId: string, style: MarkerStyle): void {
    const fullLayerId = `ngsi-layer-${layerId}`

    if (this.map.getLayer(fullLayerId)) {
      if (style.color) {
        this.map.setPaintProperty(fullLayerId, 'circle-color', style.color)
      }
      if (style.size) {
        this.map.setPaintProperty(fullLayerId, 'circle-radius', style.size)
      }
    }

    // Update stored config
    const config = this.layers.get(layerId)
    if (config) {
      config.style = { ...config.style, ...style }
    }
  }

  /**
   * Remove a layer from the map
   */
  removeLayer(layerId: string): void {
    const sourceId = `ngsi-source-${layerId}`
    const layers = [
      `ngsi-layer-${layerId}`,
      `ngsi-layer-${layerId}-clusters`,
      `ngsi-layer-${layerId}-cluster-count`,
      `ngsi-layer-${layerId}-fill`,
      `ngsi-layer-${layerId}-line`,
      `ngsi-symbol-${layerId}`,
    ]

    // Remove layers
    for (const layer of layers) {
      if (this.map.getLayer(layer)) {
        this.map.removeLayer(layer)
      }
    }

    // Remove source
    if (this.map.getSource(sourceId)) {
      this.map.removeSource(sourceId)
    }

    // Close popup
    const popup = this.popups.get(layerId)
    if (popup) {
      popup.remove()
      this.popups.delete(layerId)
    }

    this.layers.delete(layerId)
  }

  /**
   * Remove all layers
   */
  removeAllLayers(): void {
    for (const layerId of this.layers.keys()) {
      this.removeLayer(layerId)
    }
  }

  /**
   * Get all current layer IDs
   */
  getLayerIds(): string[] {
    return Array.from(this.layers.keys())
  }

  /**
   * Fit map bounds to show all features
   */
  fitToBounds(bounds: [number, number, number, number], options?: mapboxgl.FitBoundsOptions): void {
    this.map.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15,
      ...options,
    })
  }
}
