# 充电车位小站 · Charge Spot Quest

Mobile-first slow-charge booking demo (Vite + React + TS + Tailwind + Framer Motion).

## Model

- Only **spot C** is bookable (A/B maintenance).
- Slow charge: book **6 / 7 / 8 hours** (default 8).
- Occupancy: stacked **7-day hotel-style bars** (today → +6). Tap a free gap → booking sheet.
- No accounts / payment. State in `localStorage` (`charge-spot-quest-v2`).
- 3 no-shows → blacklist (idempotent `noShowRecorded`).

## Dev

```bash
npm install
npm run dev
npm run build
```

Open http://localhost:5173 — phone portrait primary; desktop is a centered ~420px column.
