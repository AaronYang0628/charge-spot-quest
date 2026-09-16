import { DEFAULT_VEHICLE, SPOT_IDS, VEHICLE_COLOR_LABELS, VEHICLE_TYPE_LABELS } from '../types'
import type { Booking, SpotId, VehicleInfo } from '../types'

export function normalizeVehicle(value: unknown): VehicleInfo {
  const v = (value && typeof value === 'object' ? value : {}) as Partial<VehicleInfo>
  return {
    plate: typeof v.plate === 'string' ? v.plate.slice(0, 10) : '',
    type: v.type && Object.hasOwn(VEHICLE_TYPE_LABELS, v.type) ? v.type : DEFAULT_VEHICLE.type,
    color: v.color && Object.hasOwn(VEHICLE_COLOR_LABELS, v.color) ? v.color : DEFAULT_VEHICLE.color,
  }
}

export function normalizeBookings(value: unknown): Booking[] {
  if (!Array.isArray(value)) return []
  return value
    .filter(
      (b) =>
        b &&
        typeof b.id === 'string' &&
        typeof b.sessionId === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(b.date) &&
        ['morning', 'noon', 'evening'].includes(b.period) &&
        SPOT_IDS.includes(b.spotId as SpotId),
    )
    .map((b) => ({
      ...b,
      vehicle: normalizeVehicle(b.vehicle),
      cancelled: !!b.cancelled,
      supersededBy: typeof b.supersededBy === 'string' ? b.supersededBy : undefined,
      cancelReason: typeof b.cancelReason === 'string' ? b.cancelReason : undefined,
    }))
}
