/**
 * Art Director asset registry.
 *
 * PLACEHOLDER MODE: all entries null → components render temporary SVG
 * low-poly geometry (see LowPolyCar / ParkingLot).
 *
 * When sprites arrive, set paths (public/ or imported URLs) and the
 * VehicleSprite / LotBackground helpers will prefer them automatically.
 *
 * Naming: `${type}-${color}` matching VehicleType × VehicleColor.
 */
import type { VehicleColor, VehicleType } from '../types'

export type VehicleSpriteKey = `${VehicleType}-${VehicleColor}`

/** Drop Art Director files under public/art/vehicles/ then fill paths here */
export const VEHICLE_SPRITES: Partial<Record<VehicleSpriteKey, string>> = {
  // 'sedan-blue': '/art/vehicles/sedan-blue.webp',
}

/** Optional painted lot plate (isometric). Null = procedural SVG lot. */
export const LOT_BACKGROUND_SPRITE: string | null = null
// '/art/lot/parking-lot.webp'

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
