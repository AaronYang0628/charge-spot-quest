import type { SpotBookingView, SpotId, SpotStatus, TimePeriod } from '../types'
import { maskPlate } from './plate'
import { currentIdlePeriod } from './time'

/** Owner / host vehicles — exact plates after trim + upper. */
export const HOST_PLATES = ['浙ACU6508', '浙AY75C1'] as const

export function normalizePlate(plate: string): string {
  return plate.trim().toUpperCase()
}

export function isHostPlate(plate: string | null | undefined): boolean {
  if (!plate) return false
  const n = normalizePlate(plate)
  return (HOST_PLATES as readonly string[]).includes(n)
}

/** Public lists only expose masked plates — match against host masks. */
export function isHostPlateMasked(plateMasked: string | null | undefined): boolean {
  if (!plateMasked) return false
  return HOST_PLATES.some((p) => maskPlate(p) === plateMasked)
}

/**
 * Super cut-in is allowed only when bay C (649) is held by a host plate
 * for the current Shanghai idle period, or the spot's displayed vehicle is host.
 */
export function isHostCutInAvailable(opts: {
  spot?: SpotStatus | null
  todayBookings?: SpotBookingView[]
  period?: TimePeriod
  spotId?: SpotId
}): boolean {
  const spotId = opts.spotId ?? 'C'
  const spot = opts.spot
  if (spot?.id === spotId && spot.vehicle && isHostPlate(spot.vehicle.plate)) {
    return true
  }
  const period = opts.period ?? currentIdlePeriod()
  const rows = opts.todayBookings ?? []
  return rows.some(
    (b) =>
      b.spotId === spotId &&
      b.period === period &&
      isHostPlateMasked(b.plateMasked),
  )
}

export const HOST_CUT_IN_STUB_MESSAGE =
  '超级插队功能开发中，5元通道仅可插车主（浙ACU6508 / 浙AY75C1）的队'
