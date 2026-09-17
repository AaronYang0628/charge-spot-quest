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

/**
 * @deprecated Masked strings collide (浙A12348 and 浙ACU6508 both → 浙A···8).
 * Prefer SpotBookingView.isHost from the full plate. Kept for display-only checks.
 */
export function isHostPlateMasked(plateMasked: string | null | undefined): boolean {
  if (!plateMasked) return false
  return HOST_PLATES.some((p) => maskPlate(p) === plateMasked)
}

/**
 * Super cut-in is allowed only when bay C (649) is held by a host plate
 * for the given / current Shanghai idle period (active booked row, not already replaced).
 * Uses b.isHost from the server/mock — never plateMasked alone.
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
      b.status === 'booked' &&
      b.isHost === true,
  )
}

export const CUT_IN_QR_CAPTION = '¥5 · 超级插队 · 今晚你先充电'
export const CUT_IN_NEED_PLATE = '请先填写车牌号'
export const CUT_IN_NEED_HOST_PERIOD = '请先点选车主占用的时段'
