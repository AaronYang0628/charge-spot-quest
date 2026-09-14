/**
 * Art Director asset registry — STYLE-GUIDE v2 sprites.
 * Files live in public/art/vehicles/{type}-{color}.webp
 */
import type { VehicleColor, VehicleType } from '../types'

export type VehicleSpriteKey = `${VehicleType}-${VehicleColor}`

export const VEHICLE_SPRITES: Partial<Record<VehicleSpriteKey, string>> = {
  'sedan-blue': '/art/vehicles/sedan-blue.webp',
  'sedan-yellow': '/art/vehicles/sedan-yellow.webp',
  'sedan-orange': '/art/vehicles/sedan-orange.webp',
  'sedan-white': '/art/vehicles/sedan-white.webp',
  'sedan-red': '/art/vehicles/sedan-red.webp',
  'sedan-green': '/art/vehicles/sedan-green.webp',
  'suv-blue': '/art/vehicles/suv-blue.webp',
  'suv-yellow': '/art/vehicles/suv-yellow.webp',
  'suv-orange': '/art/vehicles/suv-orange.webp',
  'suv-white': '/art/vehicles/suv-white.webp',
  'suv-red': '/art/vehicles/suv-red.webp',
  'suv-green': '/art/vehicles/suv-green.webp',
  'van-blue': '/art/vehicles/van-blue.webp',
  'van-yellow': '/art/vehicles/van-yellow.webp',
  'van-orange': '/art/vehicles/van-orange.webp',
  'van-white': '/art/vehicles/van-white.webp',
  'van-red': '/art/vehicles/van-red.webp',
  'van-green': '/art/vehicles/van-green.webp',
  'pickup-blue': '/art/vehicles/pickup-blue.webp',
  'pickup-yellow': '/art/vehicles/pickup-yellow.webp',
  'pickup-orange': '/art/vehicles/pickup-orange.webp',
  'pickup-white': '/art/vehicles/pickup-white.webp',
  'pickup-red': '/art/vehicles/pickup-red.webp',
  'pickup-green': '/art/vehicles/pickup-green.webp',
}

export const LOT_BACKGROUND_SPRITE: string | null = '/art/lot/parking-lot.webp'

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
