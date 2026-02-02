# Fair Wheel of Names - Implementation Plan

## Phase 1: Setup & Core Structure (Priority: NOW)
- [ ] Initialize Next.js project with TypeScript ✅
- [ ] Configure Sanity CMS
- [ ] Define Sanity schemas (Team, Member)
- [ ] Set up Tailwind CSS ✅
- [ ] Create base layout

## Phase 2: Sanity Integration (Priority: HIGH)
- [ ] Build Team CRUD operations
- [ ] Build Member CRUD operations
- [ ] Connect Sanity to Next.js
- [ ] Test data fetching

## Phase 3: Fair Algorithm (Priority: HIGH)
- [ ] Implement weighted selection logic
- [ ] Add 7-day exclusion rule
- [ ] Write unit tests for algorithm
- [ ] Test edge cases (everyone won recently, etc.)

## Phase 4: UI - Team Dashboard (Priority: MEDIUM)
- [ ] Team selection page
- [ ] Team dashboard layout
- [ ] Spin button with animation
- [ ] Winner announcement modal

## Phase 5: Visuals & Audio (Priority: MEDIUM)
- [ ] Add background image/video support
- [ ] Add music playback
- [ ] Confetti/particle effects
- [ ] Visual wheel component (decorative)

## Phase 6: History & Admin (Priority: LOW)
- [ ] Win history view
- [ ] Member management UI
- [ ] Team settings page
- [ ] Reset history function

## File Structure
```
fair-wheel-of-names/
├── app/
│   ├── page.tsx                    # Team selection
│   ├── team/[id]/
│   │   └── page.tsx               # Team dashboard + spin
│   └── admin/
│       └── page.tsx                # Team management
├── components/
│   ├── SpinButton.tsx
│   ├── WinnerModal.tsx
│   ├── TeamCard.tsx
│   └── MemberList.tsx
├── lib/
│   ├── algorithm.ts                # Fair selection logic
│   ├── sanity.ts                   # Sanity client
│   └── utils.ts
├── sanity/
│   ├── schemas/
│   │   ├── team.ts
│   │   └── member.ts
│   └── config.ts
└── public/
    ├── music/
    └── backgrounds/
```

## Questions Before Starting
1. Should teams be public or require authentication?
2. Do you want to deploy anywhere specific (Vercel, Netlify)?
3. Any design preferences (dark/light mode, colors)?
