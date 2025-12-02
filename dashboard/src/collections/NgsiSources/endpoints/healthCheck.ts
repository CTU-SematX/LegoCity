import type { PayloadHandler } from 'payload'
import axios from 'axios'

export const healthCheckEndpoint: PayloadHandler = async (req) => {
  const { brokerUrl } = await req.json?.()

  if (!brokerUrl) {
    return Response.json(
      { error: 'Broker URL is required' },
      { status: 400 }
    )
  }

  try {
    const { data } = await axios.get(`${brokerUrl}/version`, { timeout: 5000 })

    return Response.json({
      message: 'Successfully connected to NGSI broker',
      version: data,
    })
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? `Failed to connect: ${error.message}`
      : 'Unknown error occurred'
    
    return Response.json({ error: message }, { status: 500 })
  }
}
