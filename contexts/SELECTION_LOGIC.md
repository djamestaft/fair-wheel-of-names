# Fair Wheel Selection Logic

This document explains how the wheel selects and displays winners.

## Overview

The selection system has two main components:
1. **Fair Winner Selection** - Weighted random selection based on time since last win
2. **Wheel Rotation** - Visual animation that lands on the selected winner

---

## 1. Fair Winner Selection

### Eligibility Filter

Members are filtered based on a "cooling off" period:

```
Eligible if: daysSinceLastWin >= minimumGapDays
```

- `daysSinceLastWin = 999` for members who have never won (highest priority)
- Default `minimumGapDays = 7`

### Weighted Random Selection

Eligible members are assigned weights based on how long since their last win:

```
weight = daysSinceLastWin
```

**Example with 3 eligible members:**
| Member | Days Since Win | Weight |
|--------|---------------|--------|
| Alice  | 30 days       | 30     |
| Bob    | 14 days       | 14     |
| Carol  | 7 days        | 7      |

Total weight = 51

**Selection probability:**
- Alice: 30/51 = 58.8%
- Bob: 14/51 = 27.5%
- Carol: 7/51 = 13.7%

**Algorithm:**
```typescript
const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0)
let random = Math.random() * totalWeight

for (const candidate of candidates) {
  random -= candidate.weight
  if (random < 0) {
    return candidate.member // Selected winner
  }
}
```

---

## 2. Wheel Rotation Logic

### Segment Layout

The wheel is divided into equal segments, one per team member:

```
segmentAngle = 360 / numberOfMembers
```

Segments are laid out clockwise starting from the top (12 o'clock position):
- Segment 0: 0° to segmentAngle°
- Segment 1: segmentAngle° to 2×segmentAngle°
- etc.

Each segment's **center** is at:
```
centerAngle = memberIndex × segmentAngle + (segmentAngle / 2)
```

### Rotation Calculation

To display the selected winner, we calculate a rotation that brings their segment center to the top:

```
targetAngle = (360 - winnerSegmentCenter) % 360
```

This is derived from:
- After rotating by R degrees clockwise, what was at angle θ is now at (θ + R) mod 360
- We want: (winnerSegmentCenter + R) mod 360 = 0
- Therefore: R = (360 - winnerSegmentCenter) mod 360

### Animation

The wheel spins with:
- **5-7 full rotations** (randomized for visual effect)
- **Eased deceleration** using ease-out curve: `1 - (1 - progress)^4`
- **4 second duration**

**Total rotation formula:**
```typescript
const currentAngle = rotation % 360
let deltaToTarget = targetAngle - currentAngle
if (deltaToTarget <= 0) {
  deltaToTarget += 360 // Always rotate forward
}
const totalRotation = rotation + spins * 360 + deltaToTarget
```

---

## 3. Visual Verification

The pointer is positioned at the top of the wheel. When the animation completes:
1. The winner's segment center is at 0° (top)
2. The pointer indicates the winner
3. The winner is announced in the UI

### Example with 4 Members

```
segmentAngle = 90°

Member 0: center at 45°  → targetAngle = 315°
Member 1: center at 135° → targetAngle = 225°
Member 2: center at 225° → targetAngle = 135°
Member 3: center at 315° → targetAngle = 45°
```

After rotating by targetAngle, each member's segment center aligns with the top pointer.

---

## 4. Data Flow

```
User clicks "Spin"
       ↓
selectFairWinner() runs
       ↓
┌─────────────────────────┐
│ Filter eligible members │
│ Calculate weights       │
│ Weighted random select  │
└─────────────────────────┘
       ↓
Selected winner returned
       ↓
Calculate rotation to land on winner
       ↓
Animate wheel (4 seconds)
       ↓
Animation completes
       ↓
┌─────────────────────────┐
│ Update UI with winner   │
│ Update member stats     │
│ Persist to Sanity CMS   │
└─────────────────────────┘
```

---

## 5. Key Files

| File | Purpose |
|------|---------|
| `app/team/[id]/page.tsx` | Main wheel component with selection and animation logic |
| `lib/fair-selection.ts` | Server-side selection functions (currently unused in favor of client-side) |

---

## 6. Configuration

Teams can configure:
- **minimumGapDays**: Days before a winner can be selected again (default: 7)

This is set per-team in Sanity CMS.
