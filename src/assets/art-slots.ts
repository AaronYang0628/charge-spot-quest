import { asset } from '../lib/asset'
/**
 * Art Director asset registry — STYLE-GUIDE v2/v3.
 * display: three-quarter sprites `{type}-{color}.webp`
 * park: reverse-in vertical sprites `{type}-{color}-park.webp`
 *   long axis vertical, rear/tail at top (charger), nose at bottom (aisle)
 * black/gray sprites fall back to white/blue files when dedicated art is missing.
 */
import type { VehicleColor, VehicleType } from '../types'

export type VehicleSpriteKey = `${VehicleType}-${VehicleColor}`
export type VehiclePose = 'display' | 'park'

const TYPES: VehicleType[] = ['convertible', 'pickup']
const COLORS: VehicleColor[] = ['black', 'white', 'gray', 'red', 'blue']

/** Map logical colors to on-disk sprite color names. */
const SPRITE_COLOR_FILE: Record<VehicleColor, string> = {
  black: 'white',
  white: 'white',
  gray: 'white',
  red: 'red',
  blue: 'blue',
}

function build(suffix: '' | '-park'): Partial<Record<VehicleSpriteKey, string>> {
  const out: Partial<Record<VehicleSpriteKey, string>> = {}
  for (const t of TYPES) {
    for (const c of COLORS) {
      const key = `${t}-${c}` as VehicleSpriteKey
      const fileColor = SPRITE_COLOR_FILE[c]
      out[key] = asset(`/art/vehicles/${t === 'convertible' ? 'sedan' : t}-${fileColor}${suffix}.webp`)
    }
  }
  return out
}

export const VEHICLE_SPRITES = build('')
export const VEHICLE_PARK_SPRITES = build('-park')

export const LOT_BACKGROUND_SPRITE: string | null = asset('/art/lot/parking-lot.webp')

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
