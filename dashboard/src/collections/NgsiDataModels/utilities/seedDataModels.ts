import type { Payload } from 'payload'
import axios from 'axios'

interface DataModel {
  dataModels: string[]
  domains: string[]
  repoName: string
  repoLink: string
}

interface OfficialList {
  officialList: DataModel[]
}

export const seedDataModels = async (payload: Payload): Promise<number> => {
  payload.logger.info('Fetching Smart Data Models list...')

  try {
    // Fetch the official list from GitHub using axios
    const { data } = await axios.get<OfficialList>(
      'https://raw.githubusercontent.com/smart-data-models/data-models/master/specs/AllSubjects/official_list_data_models.json',
      {
        timeout: 30000, // 30 second timeout
      },
    )

    let modelCount = 0
    const domainCache = new Map<string, string>() // Cache domain name -> ID mapping

    payload.logger.info(`Found ${data.officialList.length} repositories`)

    // Iterate through each repository
    for (const repo of data.officialList) {
      const { dataModels, domains, repoName, repoLink } = repo

      // Create one document per model in the dataModels array
      for (const model of dataModels) {
        // Construct the context URL using the repoName
        const contextUrl = `https://smart-data-models.github.io/${repoName}/context.jsonld`

        // Find or create domain documents and get their IDs
        const domainIds: string[] = []

        for (const domainName of domains) {
          // Check cache first
          if (domainCache.has(domainName)) {
            domainIds.push(domainCache.get(domainName)!)
          } else {
            // Not in cache, check database
            const existingDomain = await payload.find({
              collection: 'ngsi-domains',
              where: {
                name: {
                  equals: domainName,
                },
              },
              limit: 1,
            })

            let domainId: string

            if (existingDomain.docs.length > 0) {
              domainId = existingDomain.docs[0].id
            } else {
              const newDomain = await payload.create({
                collection: 'ngsi-domains',
                data: {
                  name: domainName,
                },
              })
              domainId = newDomain.id
              payload.logger.info(`Created new domain: ${domainName}`)
            }

            // Add to cache
            domainCache.set(domainName, domainId)
            domainIds.push(domainId)
          }
        }

        // Check if model already exists
        const existing = await payload.find({
          collection: 'ngsi-data-models',
          where: {
            model: {
              equals: model,
            },
          },
          limit: 1,
        })

        if (existing.docs.length > 0) {
          // Update existing document
          await payload.update({
            collection: 'ngsi-data-models',
            id: existing.docs[0].id,
            data: {
              model,
              contextUrl,
              domains: domainIds,
              repoLink,
            },
          })
        } else {
          // Create new document
          await payload.create({
            collection: 'ngsi-data-models',
            data: {
              model,
              contextUrl,
              domains: domainIds,
              repoLink,
            },
          })
        }

        modelCount++

        // Log progress every 100 models
        if (modelCount % 100 === 0) {
          payload.logger.info(`Progress: ${modelCount} models processed...`)
        }
      }
    }

    payload.logger.info(`Successfully seeded ${modelCount} NGSI data models`)
    payload.logger.info(`Created/updated ${domainCache.size} unique domains`)
    return modelCount
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data || error.message
      payload.logger.error(`Network error: ${message}`)
      throw new Error(`Failed to fetch data models: ${message}`)
    }

    payload.logger.error('Error seeding data models:')
    payload.logger.error(error)
    throw error
  }
}
