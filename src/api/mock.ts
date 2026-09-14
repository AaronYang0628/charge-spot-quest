import type { Booking, SpotStatus, TimePeriod, VehicleInfo } from '../types'
import { uid } from '../lib/id'
import { todayISO } from '../lib/time'
import { normalizeBookings, normalizeVehicle } from '../lib/normalize'

export const MOCK_KEY = 'charge-spot-quest-mock-v1'
function read(): Booking[] {
  try {
    const current = localStorage.getItem(MOCK_KEY)
    if (current !== null) return normalizeBookings(JSON.parse(current))
    const legacy = JSON.parse(localStorage.getItem('charge-spot-quest-v3') || '{}')
    const bookings = normalizeBookings(legacy.bookings)
    localStorage.setItem(MOCK_KEY, JSON.stringify(bookings))
    return bookings
  } catch { return [] }
}
export function mockGetSpots(): SpotStatus[] {
  const reservedPeriods = read().filter(b => !b.cancelled && b.date === todayISO()).map(b => b.period)
  return [
    { id: 'A', maintenance: true, bookable: false, occupied: false, idleIn1h: .12, idleTonight: .35 },
    { id: 'B', maintenance: true, bookable: false, occupied: false, idleIn1h: .08, idleTonight: .22 },
    { id: 'C', maintenance: false, bookable: reservedPeriods.length < 3, occupied: false,
      idleIn1h: .78, idleTonight: .64, reservedPeriods },
  ]
}
export function mockGetBookings(sessionId: string): Booking[] {
  return read().filter(b => b.sessionId === sessionId && !b.cancelled)
}
export function mockCreateBooking(input: {
  sessionId: string; date: string; period: TimePeriod; vehicle: VehicleInfo
}) {
  const bookings = read()
  if (input.date !== todayISO() || !['morning', 'noon', 'evening'].includes(input.period)) {
    return { ok: false, reason: '请选择今天的有效时段' }
  }
  if (bookings.some(b => !b.cancelled && b.date === input.date && b.period === input.period)) {
    return { ok: false, reason: '该时段已被预约，请选择其他时段' }
  }
  const booking: Booking = { ...input, vehicle: normalizeVehicle(input.vehicle),
    id: uid('bk'), spotId: 'C', createdAt: new Date().toISOString(), cancelled: false }
  // Single-tab mock only; real multi-client concurrency requires a server.
  localStorage.setItem(MOCK_KEY, JSON.stringify([...bookings, booking]))
  return { ok: true, booking }
}
export function mockReset() { localStorage.setItem(MOCK_KEY, '[]') }
