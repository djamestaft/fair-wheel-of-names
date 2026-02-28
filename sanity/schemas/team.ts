import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'team',
  title: 'Team',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'text',
      description: 'Brief description of this team',
    }),
    defineField({
      name: 'members',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'member' }] }],
    }),
    defineField({
      name: 'minimumGapDays',
      title: 'Minimum gap between wins (days)',
      type: 'number',
      initialValue: 7,
      description: 'A person cannot win again for this many days after their last win',
    }),
    defineField({
      name: 'currentPrize',
      title: 'Current prize',
      type: 'string',
      description: 'What the winner gets (e.g., "Coffee voucher", "Extra break time")',
    }),
    defineField({
      name: 'musicEnabled',
      title: 'Play music during spin',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'musicTrack',
      title: 'Music track',
      type: 'string',
      description: 'URL to music file',
    }),
    defineField({
      name: 'backgroundType',
      title: 'Background type',
      type: 'string',
      options: {
        layout: 'radio',
        list: [
          { title: 'Color', value: 'color' },
          { title: 'Image', value: 'image' },
          { title: 'Video', value: 'video' },
        ],
      },
      initialValue: 'color',
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Background color',
      type: 'color',
      hidden: ({ parent }) => parent?.backgroundType !== 'color',
    }),
    defineField({
      name: 'backgroundImage',
      title: 'Background image',
      type: 'image',
      hidden: ({ parent }) => parent?.backgroundType !== 'image',
    }),
    defineField({
      name: 'backgroundVideo',
      title: 'Background video',
      type: 'file',
      hidden: ({ parent }) => parent?.backgroundType !== 'video',
    }),
    defineField({
      name: 'wheelCenterImage',
      title: 'Wheel center image',
      type: 'image',
      description: 'Image to display in the center of the spin wheel (optional)',
      options: {
        hotspot: true,
      },
    }),
  ],
  preview: {
    select: {
      title: 'name',
      memberCount: 'members',
    },
    prepare: ({ title, memberCount }) => ({
      title,
      subtitle: `${memberCount?.length || 0} members`,
    }),
  },
})
