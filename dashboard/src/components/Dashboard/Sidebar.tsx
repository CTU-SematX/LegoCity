'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Map as MapIcon, ChevronRight } from 'lucide-react'
import { cn } from '@/utilities/ui'

export interface MapItem {
  title: string
  slug: string
}

interface SidebarProps {
  maps: MapItem[]
  className?: string
}

export const Sidebar: React.FC<SidebarProps> = ({ maps, className }) => {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'w-24 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col',
        className,
      )}
    >
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1">
          {maps.map((map) => {
            const href = `/maps/${map.slug}`
            const isActive = pathname === href

            return (
              <Link
                key={map.slug}
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center px-2 py-4 text-xs transition-colors',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 border-l-4 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-600 dark:text-gray-400 border-l-4 border-transparent',
                )}
              >
                <MapIcon className="h-6 w-6 mb-1" />
                <span className="text-center leading-tight line-clamp-2">{map.title}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
