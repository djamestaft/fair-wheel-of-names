import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'member',
  title: 'Member',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'avatar',
      type: 'image',
      description: 'Profile picture or avatar',
    }),
    defineField({
      name: 'lastWinDate',
      title: 'Last win date',
      type: 'datetime',
      description: 'Auto-updated when this member wins',
    }),
    defineField({
      name: 'totalWins',
      title: 'Total wins',
      type: 'number',
      initialValue: 0,
      description: 'Auto-updated when this member wins',
    }),
  ],
  preview: {
    select: {
      name: 'name',
      avatar: 'avatar',
      totalWins: 'totalWins',
    },
    prepare: ({ name, avatar, totalWins }) => ({
      title: name,
      media: avatar,
      subtitle: `${totalWins || 0} wins`,
    }),
  },
})
