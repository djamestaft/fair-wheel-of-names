# Fair Wheel of Names

A fair wheel-of-names picker for stand-ups that prevents the same person from winning repeatedly.

## Problem
Current wheel-of-names tools are purely random - people can win multiple times in a row while others never get picked.

## Solution
A weighted selection system that prioritizes people who haven't won recently.

## Features
- [ ] Preload names/teams
- [ ] Fair selection algorithm (weighted by time since last win)
- [ ] Music playback during spin
- [ ] Background images/videos
- [ ] Visual spinning animation
- [ ] History tracking (who won, when)

## Tech Stack
- Next.js + React
- Sanity CMS (for managing names/teams, settings)
- Web platform

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000
