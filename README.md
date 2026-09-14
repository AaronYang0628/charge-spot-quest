# 充电车位小站 · Charge Spot Quest

> **需求与问题清单（权威）：** [docs/REQUIREMENTS-AND-ISSUES.md](docs/REQUIREMENTS-AND-ISSUES.md)

Mobile-first slow-charge booking demo — **low-poly** parking lot UX (Vite + React + TS + Tailwind + Framer Motion).

## UX

- Open screen: **large current date** + isometric **A / B / C** low-poly lot + per-spot **idle probability bars** (1h / tonight) and occupancy elapsed timer when occupied.
- Only **C** is bookable; A/B are dimmed **维护中**.
- Tap C → bottom drawer with **huge date**, slots **早 / 中 / 晚** only (no clock grid), vehicle fields **车牌号 / 颜色 / 类型** (localStorage).
- Confirm → car **drifts in** → **charging glow** → **预约结果** toast.
- No login / payment. Mock API in `src/api/`. Session id in localStorage (`charge-spot-quest-v3`).

## Visual

Synty-inspired low-poly (light theme). Lot plate + vehicle/barrier webps under `public/art/`.  
Art direction: `design-refs/art-direction/`. Tokens: `src/theme/tokens.css`.

**Known gap:** car↔lot perspective alignment — see requirements doc §4.1.

## Dev

```bash
npm install
npm run dev    # http://localhost:5173
npm run build
```

Phone portrait (~390px) primary; desktop centers a ~420px column.
