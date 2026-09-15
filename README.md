# 邻里互助 · 共享充电 · Charge Spot Quest

> **需求与问题清单（权威）：** [docs/REQUIREMENTS-AND-ISSUES.md](docs/REQUIREMENTS-AND-ISSUES.md)

Mobile-first slow-charge booking demo — host shares a charger on their parking spot with neighbors (Vite + React + TS + Tailwind + Framer Motion + React Three Fiber).

## UX

- Open screen: **large current date** + isometric low-poly lot (bays **647 / 648 / 649**) + per-spot **今晚空闲** bar and occupancy elapsed timer when occupied.
- **今日预约 / 登记** list under the three cards (today only, masked plates).
- Only **649** is bookable; 647/648 are dimmed **维护中**.
- Tap 649 → bottom drawer with **huge date**, slots **早 / 中 / 晚** only (no clock grid), vehicle fields **车牌号 / 颜色 / 类型** (localStorage). Colors: **黑 / 白 / 灰 / 红 / 蓝**.
- Confirm → car **drifts in** (rotatable preview / orbit) → **charging glow** → **预约结果** toast.
- No login / payment. Mock API in `src/api/`. Session id in localStorage (`charge-spot-quest-v3`).

## Demo

GitHub Pages: https://aaronyang0628.github.io/charge-spot-quest/

## Visual

v1 Codex build: real-time **Three.js / R3F** lot (`LotScene`) with GLB vehicles/props under `public/models/`, plus 2D webp fallback under `public/art/`.  
Art direction: `design-refs/art-direction/`. Tokens: `src/theme/tokens.css`.

## Dev

```bash
npm install
npm run dev    # http://localhost:5173
npm run build
```

Phone portrait (~390px) primary; desktop centers a ~420px column.
