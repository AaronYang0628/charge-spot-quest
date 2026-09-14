# Art slots (Game Art Director)

Temporary SVG low-poly placeholders ship in `components/LowPolyCar.tsx` and `ParkingLot.tsx`.

## Drop-in checklist

1. Export isometric vehicle sprites (transparent WebP/PNG) per `type × color`.
2. Put files in `public/art/vehicles/` (or import into this folder).
3. Register paths in `art-slots.ts` → `VEHICLE_SPRITES`.
4. Optional lot plate → `LOT_BACKGROUND_SPRITE`.
5. Tune palette / lot colors in `src/theme/tokens.css` (`--car-*`, `--lot-*`).

Until sprites are registered, the app uses CSS-variable-driven SVG placeholders.
