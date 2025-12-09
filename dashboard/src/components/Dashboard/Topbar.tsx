'use client'

import React from 'react'
import { Layers, Database } from 'lucide-react'
import { cn } from '@/utilities/ui'

export interface LayerCount {
  id: string
  name: string
  count: number
  color?: string
}

interface TopbarProps {
  layerCounts: LayerCount[]
  className?: string
}

export const Topbar: React.FC<TopbarProps> = ({ layerCounts, className }) => {
  const totalEntities = layerCounts.reduce((sum, layer) => sum + layer.count, 0)

  return (
    <header
      className={cn(
        'h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800',
        'flex items-center justify-center gap-8 px-6',
        className,
      )}
    >
      {layerCounts.length === 0 ? (
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Database className="h-5 w-5" />
          <span className="text-sm">No layers loaded</span>
        </div>
      ) : (
        <>
          {layerCounts.map((layer) => (
            <div key={layer.id} className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: layer.color || '#3b82f6' }}
                />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {layer.count}
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {layer.name}
              </span>
            </div>
          ))}

          {/* Divider and total */}
          {layerCounts.length > 1 && (
            <>
              <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalEntities}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Total
                </span>
              </div>
            </>
          )}
        </>
      )}
    </header>
  )
}
