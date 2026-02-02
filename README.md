# Fair Wheel of Names

A fair wheel-of-names picker for stand-ups that prevents the same person from winning repeatedly.

## Problem
Current wheel-of-names tools are purely random - people can win multiple times in a row while others never get picked.

## Solution
A weighted selection system that prioritizes people who haven't won recently.

## Features
- ✅ Fair selection algorithm (weighted by time since last win)
- ✅ 7-day exclusion rule (configurable per team)
- ✅ Multiple teams support
- ✅ Team management via Sanity CMS
- ✅ Visual spinning wheel with animations
- 🚧 Music playback (coming soon)
- 🚧 Background images/videos (coming soon)
- 🚧 Win history tracking (coming soon)

## Tech Stack
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Sanity CMS

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Sanity project credentials:
```
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_READ_TOKEN=your-read-token
SANITY_API_WRITE_TOKEN=your-write-token
```

### 3. Run Development Server
```bash
npm run dev
```

Open http://localhost:3000

### 4. Create Content
1. Go to http://localhost:3000/admin
2. Create Members (name, avatar)
3. Create a Team and add members
4. Customize settings (theme, gap days, music)

## Usage

### For Teams
1. Select your team from the homepage
2. Click "Spin the Wheel"
3. The fair algorithm selects a winner
4. Winner is automatically recorded

### Fair Algorithm
- Excludes anyone who won in the last X days (default: 7)
- Weights remaining candidates by days since last win
- Picks weighted random from eligible pool

### Admin
- Go to `/admin` to open Sanity Studio
- Create and manage teams
- Add and remove members
- Customize team themes
- Configure minimum gap days

## Project Structure
```
fair-wheel-of-names/
├── app/                    # Next.js app directory
│   ├── page.tsx             # Team list (homepage)
│   ├── team/[id]/           # Team dashboard + spin
│   └── admin/               # Admin entry point
├── components/              # Reusable components
├── lib/
│   ├── fair-selection.ts     # Fair algorithm + Sanity queries
│   └── sanity.ts           # Sanity client
├── sanity/
│   ├── schemas/             # Sanity schema definitions
│   └── config.ts           # Sanity configuration
└── types/                  # TypeScript types
```

## Deployment

### Vercel (Recommended)
```bash
npm run build
vercel
```

Or connect GitHub repo to Vercel for auto-deploys.

## Roadmap
- [ ] Add music playback during spin
- [ ] Add background image/video support
- [ ] Build visual wheel with member names
- [ ] Win history page
- [ ] Confetti animation on winner
- [ ] Member management UI (without Sanity Studio)
- [ ] Export/import teams
- [ ] Dark mode toggle

## License
MIT
