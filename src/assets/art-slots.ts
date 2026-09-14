/**
 * Art Director asset registry — STYLE-GUIDE v2/v3.
 * display: three-quarter sprites `{type}-{color}.webp`
 * park: reverse-in vertical sprites `{type}-{color}-park.webp`
 *   long axis vertical, rear/tail at top (charger), nose at bottom (aisle)
 */
import type { VehicleColor, VehicleType } from '../types'

export type VehicleSpriteKey = `${VehicleType}-${VehicleColor}`
export type VehiclePose = 'display' | 'park'

const TYPES: VehicleType[] = ['sedan', 'suv', 'van', 'pickup']
const COLORS: VehicleColor[] = ['blue', 'yellow', 'orange', 'white', 'red', 'green']

function build(suffix: '' | '-park'): Partial<Record<VehicleSpriteKey, string>> {
  const out: Partial<Record<VehicleSpriteKey, string>> = {}
  for (const t of TYPES) {
    for (const c of COLORS) {
      const key = `${t}-${c}` as VehicleSpriteKey
      out[key] = `/art/vehicles/${t}-${c}${suffix}.webp`
    }
  }
  return out
}

export const VEHICLE_SPRITES = build('')
export const VEHICLE_PARK_SPRITES = build('-park')

export const LOT_BACKGROUND_SPRITE: string | null = '/art/lot/parking-lot.webp'

export function vehicleSpriteUrl(
  type: VehicleType,
  color: VehicleColor,
  pose: VehiclePose = 'display',
): string | null {
  const key: VehicleSpriteKey = `${type}-${color}`
  const table = pose === 'park' ? VEHICLE_PARK_SPRITES : VEHICLE_SPRITES
  return table[key] ?? null
}

export function hasVehicleSprite(
  type: VehicleType,
  color: VehicleColor,
  pose: VehiclePose = 'display',
): boolean {
  return Boolean(vehicleSpriteUrl(type, color, pose))
}
