import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { colorInput } from '@sanity/color-input'
import { team, member } from './sanity/schemas'

export default defineConfig({
  name: 'fair-wheel',
  title: 'Fair Wheel of Names',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  basePath: '/studio',
  plugins: [structureTool(), colorInput()],
  schema: {
    types: [team, member],
  },
})
