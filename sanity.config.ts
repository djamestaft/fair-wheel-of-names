'use client'

import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { team, member } from './sanity/schemas'

export default defineConfig({
  name: 'fair-wheel',
  title: 'Fair Wheel of Names',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  basePath: '/admin',
  plugins: [structureTool()],
  schema: {
    types: [team, member],
  },
})
