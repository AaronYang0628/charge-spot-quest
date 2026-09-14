/**
 * Art Director asset registry (STYLE-GUIDE §7).
 *
 * Convention: public/art/vehicles/{type}-{color}.webp
 * PLACEHOLDER: empty registry → LowPolyCar / ParkingLot SVG until files exist.
 */
import type { VehicleColor, VehicleType } from '../types'

export type VehicleSpriteKey = `${VehicleType}-${VehicleColor}`

const TYPES: VehicleType[] = ['sedan', 'suv', 'van', 'pickup']
const COLORS: VehicleColor[] = ['blue', 'yellow', 'orange', 'white', 'red', 'green']

/** Explicit overrides. Prefer filling this when sprites land. */
export const VEHICLE_SPRITES: Partial<Record<VehicleSpriteKey, string>> = {
  // 'sedan-blue': '/art/vehicles/sedan-blue.webp',
}

/** Auto path helper — used by resolveVehicleSprite */
export function conventionPath(type: VehicleType, color: VehicleColor): string {
  return `/art/vehicles/${type}-${color}.webp`
}

/** Optional painted lot plate. Null = procedural SVG. */
export const LOT_BACKGROUND_SPRITE: string | null = null
// '/art/lot/lot-plate.webp'

/**
 * Resolve sprite URL. Checks explicit registry first, then convention path
 * only if `VEHICLE_SPRITES` has that key (avoids 404 spam before art lands).
 */
export function vehicleSpriteUrl(
  type: VehicleType,
  color: VehicleColor,
): string | null {
  const key: VehicleSpriteKey = `${type}-${color}`
  return VEHICLE_SPRITES[key] ?? null
}

export function hasVehicleSprite(type: VehicleType, color: VehicleColor): boolean {
  return Boolean(vehicleSpriteUrl(type, color))
}

/** Checklist helper for Art Director / build scripts */
export function expectedSpriteKeys(): VehicleSpriteKey[] {
  const keys: VehicleSpriteKey[] = []
  for (const t of TYPES) for (const c of COLORS) keys.push(`${t}-${c}`)
  return keys
}
