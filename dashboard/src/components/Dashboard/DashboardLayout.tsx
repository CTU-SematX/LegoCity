'use client'

import React from 'react'
import { Sidebar, type MapItem } from './Sidebar'
import { Topbar, type LayerCount } from './Topbar'
import { cn } from '@/utilities/ui'

interface DashboardLayoutProps {
  maps: MapItem[]
  layerCounts: LayerCount[]
  children: React.ReactNode
  className?: string
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  maps,
  layerCounts,
  children,
  className,
}) => {
  return (
    <div className={cn('flex h-full w-full', className)}>
      {/* Left Sidebar */}
      <Sidebar maps={maps} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <Topbar layerCounts={layerCounts} />

        {/* Map Content */}
        <main className="flex-1 relative">{children}</main>
      </div>
    </div>
  )
}
