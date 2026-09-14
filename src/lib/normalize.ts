import { DEFAULT_VEHICLE, VEHICLE_COLOR_LABELS } from '../types'
import type { Booking, VehicleInfo } from '../types'
export function normalizeVehicle(value: unknown): VehicleInfo {
  const v = (value && typeof value === 'object' ? value : {}) as Partial<VehicleInfo>
  return { plate: typeof v.plate === 'string' ? v.plate.slice(0, 10) : '',
    type: v.type === 'pickup' ? 'pickup' : 'convertible',
    color: v.color && Object.hasOwn(VEHICLE_COLOR_LABELS, v.color) ? v.color : DEFAULT_VEHICLE.color }
}
export function normalizeBookings(value: unknown): Booking[] {
  if (!Array.isArray(value)) return []
  return value.filter((b) => b && typeof b.id === 'string' && typeof b.sessionId === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(b.date) && ['morning', 'noon', 'evening'].includes(b.period)
    && b.spotId === 'C').map((b) => ({ ...b, vehicle: normalizeVehicle(b.vehicle) }))
}
