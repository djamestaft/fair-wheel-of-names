# Fair Wheel of Names - Technical Specification

## Algorithm: Fair Selection

### Rules
1. **Exclude anyone who won in the last 7 days**
2. **Weight remaining candidates by days since last win**
3. **Pick weighted random from eligible pool**

### Formula
```
For each person:
  IF (days_since_last_win < 7) → EXCLUDE
  ELSE weight = days_since_last_win

Pick one person using weighted random selection
```

## Data Model (Sanity)

### Team
```typescript
{
  _type: "team",
  name: string,
  description: string,
  members: [Member],
  settings: TeamSettings,
  theme: ThemeSettings
}
```

### Member
```typescript
{
  _type: "member",
  name: string,
  avatar: Image,
  lastWinDate: Date | null,
  totalWins: number
}
```

### TeamSettings
```typescript
{
  minimumGapDays: number (default: 7),
  musicEnabled: boolean (default: true),
  musicTrack: string (reference or URL),
  backgroundType: "image" | "video",
  backgroundAsset: Image | Video
}
```

## Features

### Core
- [ ] Create/edit/delete teams
- [ ] Add/edit/delete members per team
- [ ] Spin wheel animation
- [ ] Fair selection algorithm
- [ ] Winner announcement
- [ ] History tracking (who won when)

### Visuals
- [ ] Background images/videos (custom per team)
- [ ] Music playback (auto on spin)
- [ ] Confetti/particles on win
- [ ] Wheel with names (visual only, not used for selection)

### Admin
- [ ] Team dashboard
- [ ] Member management
- [ ] Win history view
- [ ] Reset win history option

## UI Structure

### Pages
```
/ → Team selection (list of teams)
/team/[id] → Team dashboard + spin
/team/[id]/history → Win history
/admin → Create/edit teams
```

### Team Dashboard
- Header: Team name, member count
- Main: Spin button / wheel visual
- Sidebar: Team members, last wins
- Footer: Settings link

## Tech Stack Confirmed
- Next.js 15+ (App Router)
- React 19+
- Sanity CMS
- TypeScript
- Tailwind CSS (for styling)
- Framer Motion (for animations)

## Default Assets

### Music Options
1. Upbeat celebration track
2. Drumroll suspense
3. Happy winner fanfare

### Background Options
1. Gradient abstract
2. Geometric pattern
3. Celebratory confetti
