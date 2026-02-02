import { createClient } from 'next-sanity'

// Only create client if we have the required environment variables
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || ''
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

export const client = projectId
  ? createClient({
      projectId,
      dataset,
      apiVersion: '2025-01-01',
      useCdn: true,
    })
  : null
