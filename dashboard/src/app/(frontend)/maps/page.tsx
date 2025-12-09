import type { Metadata } from 'next/types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import Link from 'next/link'
import PageClient from './page.client'

export const dynamic = 'force-static'
export const revalidate = 600

export default async function Page() {
  const payload = await getPayload({ config: configPromise })

  const maps = await payload.find({
    collection: 'maps',
    depth: 1,
    limit: 12,
    overrideAccess: false,
    select: {
      title: true,
      slug: true,
    },
  })

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <h1>Maps</h1>
        </div>
      </div>

      <div className="container">
        {maps.docs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {maps.docs.map((map) => (
              <Link
                key={map.id}
                href={`/maps/${map.slug}`}
                className="group block p-6 bg-card border border-border rounded-lg hover:shadow-lg transition-shadow"
              >
                <h2 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                  {map.title}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">Click to view map</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No maps found.</p>
        )}
      </div>
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: `Maps | Lego Dashboard`,
  }
}
