# Art slots (Game Art Director)

Binding guide: `design-refs/art-direction/STYLE-GUIDE.md`

Temporary SVG low-poly placeholders: `components/LowPolyCar.tsx`, `ParkingLot.tsx`.

## Drop-in

1. Export isometric sprites `{type}-{color}.webp` (256×192, transparent).
2. Place in `public/art/vehicles/`.
3. Register in `art-slots.ts` → `VEHICLE_SPRITES` (e.g. `'sedan-blue': '/art/vehicles/sedan-blue.webp'`).
4. Optional lot plate → `LOT_BACKGROUND_SPRITE` / `public/art/lot/lot-plate.webp`.
5. Palette / chrome: `src/theme/tokens.css` (must match STYLE-GUIDE locked hex).

Until registered, SVG placeholders use `--car-*` / `--lot-*` CSS vars.
