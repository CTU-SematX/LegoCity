import type { PayloadHandler } from 'payload'
import { seedDataModels } from '../utilities/seedDataModels'

export const seedModelsEndpoint: PayloadHandler = async (req) => {
  try {
    const count = await seedDataModels(req.payload)

    return Response.json({
      message: `Successfully seeded ${count} NGSI data models`,
      count,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred'

    return Response.json({ error: `Failed to seed data models: ${message}` }, { status: 500 })
  }
}
