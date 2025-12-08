'use client'

import { useNgsiData, NgsiEntity as NgsiEntityData } from '../hooks/useNgsiData'
import { extractAttributeValue, getEntityAttributeNames } from '../lib/attributeHelpers'
import { parseTemplate, type TemplateContext } from '../lib/templateParser'
import type { NgsiCardBlock as NgsiCardBlockType } from '@/payload-types'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { cn } from '@/utilities/ui'
import { RefreshCw, AlertCircle, Clock, ExternalLink } from 'lucide-react'

export interface NgsiCardBlockProps extends NgsiCardBlockType {
  className?: string
}

/**
 * NgsiCard Block Component
 *
 * Displays a single NGSI-LD entity using template-based content.
 * Broker and tenant info are read from the entity's source relationship.
 */
export function NgsiCardBlock({ dataSource, cardContent, className }: NgsiCardBlockProps) {
  // Extract entity (populated relationship)
  const entity = typeof dataSource.entity === 'object' ? dataSource.entity : null

  // Get broker source from entity (entity.source is the broker connection)
  const source = entity && typeof entity.source === 'object' ? entity.source : null
  const dataModel = entity && typeof entity.dataModel === 'object' ? entity.dataModel : null

  // Build configuration from entity - broker/tenant comes from entity
  const brokerUrl = source?.proxyUrl || source?.brokerUrl || ''
  const entityId = entity?.entityId || ''
  const contextUrl = dataModel?.contextUrl
  const tenant = entity?.service || undefined
  const servicePath = entity?.servicePath || undefined

  // Fetch entity data from broker
  const { data, isLoading, error, refetch, lastUpdated } = useNgsiData<NgsiEntityData>({
    brokerUrl,
    entityId,
    tenant,
    servicePath,
    contextUrl,
    refreshInterval: dataSource.refreshInterval || 0,
    enabled: Boolean(brokerUrl && entityId),
  })

  // Build template context from entity data
  const buildTemplateContext = (): TemplateContext | null => {
    if (!data) return null

    // Extract values from NGSI format
    const processedData: Record<string, unknown> = {}
    const attrNames = getEntityAttributeNames(data)

    for (const name of attrNames) {
      processedData[name] = extractAttributeValue(data[name])
    }

    return {
      entityId: data.id,
      entityType: data.type,
      data: processedData,
    }
  }

  const templateContext = buildTemplateContext()

  // Parse templates
  const parsedTitle = templateContext
    ? parseTemplate(cardContent?.title || '', templateContext)
    : ''
  const parsedContent = templateContext
    ? parseTemplate(cardContent?.content || '', templateContext)
    : ''

  // Fallback title if template is empty
  const displayTitle = parsedTitle || data?.type || 'NGSI Entity'

  // Card classes
  const cardClasses = cn('transition-shadow hover:shadow-md', className)

  // Error state
  if (error) {
    return (
      <Card className={cn(cardClasses, 'border-destructive')}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Error Loading Entity
          </CardTitle>
          <CardDescription>{entityId}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </CardContent>
        <CardFooter>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </CardFooter>
      </Card>
    )
  }

  // Loading state
  if (isLoading && !data) {
    return (
      <Card className={cardClasses}>
        <CardHeader>
          <div className="h-6 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-32 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // No data state
  if (!data) {
    return (
      <Card className={cardClasses}>
        <CardHeader>
          <CardTitle>No Data</CardTitle>
          <CardDescription>{entityId || 'Entity not configured'}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={cardClasses}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{displayTitle}</span>
          {isLoading && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
        </CardTitle>
        {cardContent?.showEntityId && (
          <CardDescription className="flex items-center gap-1 font-mono text-xs">
            <ExternalLink className="h-3 w-3" />
            {data.id}
          </CardDescription>
        )}
      </CardHeader>

      {parsedContent && (
        <CardContent>
          <div className="whitespace-pre-line text-sm leading-relaxed">{parsedContent}</div>
        </CardContent>
      )}

      {cardContent?.showLastUpdated && lastUpdated && (
        <CardFooter className="text-xs text-muted-foreground">
          <Clock className="mr-1 h-3 w-3" />
          Last updated: {lastUpdated.toLocaleTimeString()}
        </CardFooter>
      )}
    </Card>
  )
}

export default NgsiCardBlock
