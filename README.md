# 充电车位小站 · Charge Spot Quest

Mobile-first slow-charge booking demo — **low-poly** parking lot UX (Vite + React + TS + Tailwind + Framer Motion).

## UX

- Open screen: **large current date** + isometric **A / B / C** low-poly lot + per-spot **idle probability bars** (1h / tonight) and occupancy elapsed timer when occupied.
- Only **C** is bookable; A/B are dimmed **维护中**.
- Tap C → bottom drawer with **huge date**, slots **早 / 中 / 晚** only (no clock grid), vehicle fields **车牌号 / 颜色 / 类型** (localStorage).
- Confirm → car **drifts in** → **charging glow** → **预约结果** toast.
- No login / payment. Mock API in `src/api/`. Session id in localStorage (`charge-spot-quest-v3`).

## Visual

Temporary SVG low-poly placeholders (not final art). Art Director drop-in:
`src/theme/tokens.css`, `src/assets/art-slots.ts`, `src/assets/README.md`.

SVG hard-edged low-poly cars (flat shaded faces, saturated colors, crisp shadows) on a dark-grey lot — see `design-refs/`.

## Dev

```bash
npm install
npm run dev    # http://localhost:5173
npm run build
```

Phone portrait (~390px) primary; desktop centers a ~420px column.
