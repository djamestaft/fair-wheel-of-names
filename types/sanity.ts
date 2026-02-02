export interface Member {
  _id: string
  _type: 'member'
  name: string
  avatar?: {
    asset: {
      _ref: string
    }
  }
  lastWinDate: string | null
  totalWins: number
}

export interface Team {
  _id: string
  _type: 'team'
  name: string
  description?: string
  minimumGapDays: number
  musicEnabled: boolean
  musicTrack?: string
  backgroundType: 'color' | 'image' | 'video'
  backgroundColor?: string
  backgroundImage?: {
    asset: {
      _ref: string
    }
  }
  backgroundVideo?: {
    asset: {
      _ref: string
    }
  }
  members: Member[]
}
