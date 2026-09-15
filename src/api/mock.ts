import type { Booking, SpotBookingView, SpotId, SpotStatus, TimePeriod, VehicleInfo } from '../types'
import { BOOKABLE_SPOT, PERIOD_ORDER, SPOT_IDS } from '../types'
import { uid } from '../lib/id'
import { maskPlate } from '../lib/plate'
import { addDaysISO, isBookableDate, todayISO } from '../lib/time'
import { normalizeBookings, normalizeVehicle } from '../lib/normalize'

/** Bump when seed/palette shape changes so empty→fresh demo loads. */
export const MOCK_KEY = 'charge-spot-quest-mock-v3'

function seedBookings(today = todayISO()): Booking[] {
  const demo = 'demo-seed'
  const mk = (
    spotId: SpotId,
    dayOffset: number,
    period: TimePeriod,
    plate: string,
    color: VehicleInfo['color'],
    type: VehicleInfo['type'],
    n: number,
  ): Booking => ({
    id: `seed-${spotId}-${dayOffset}-${period}-${n}`,
    spotId,
    sessionId: demo,
    date: addDaysISO(today, dayOffset),
    period,
    vehicle: { plate, color, type },
    createdAt: new Date().toISOString(),
    cancelled: false,
  })
  return [
    // Today — visible in 今日预约 list on first load (keep C free for demo booking)
    mk('A', 0, 'morning', '浙A12348', 'blue', 'convertible', 1),
    mk('B', 0, 'evening', '苏C66552', 'gray', 'convertible', 1),
    mk('C', 0, 'evening', '沪E77889', 'white', 'pickup', 1),
    // Future seeds
    mk('A', 2, 'noon', '沪B88881', 'red', 'pickup', 2),
    mk('B', 3, 'morning', '浙D90003', 'black', 'pickup', 2),
    mk('C', 2, 'morning', '浙A10248', 'red', 'convertible', 2),
    mk('C', 4, 'noon', '浙F33117', 'blue', 'convertible', 3),
  ]
}

function read(): Booking[] {
  try {
    const current = localStorage.getItem(MOCK_KEY)
    if (current !== null) {
      const parsed = normalizeBookings(JSON.parse(current))
      return parsed
    }
    const v2 = localStorage.getItem('charge-spot-quest-mock-v2')
    if (v2 !== null) {
      const migrated = normalizeBookings(JSON.parse(v2))
      const bookings = migrated.length ? migrated : seedBookings()
      write(bookings)
      return bookings
    }
    const v1 = localStorage.getItem('charge-spot-quest-mock-v1')
    if (v1 !== null) {
      const migrated = normalizeBookings(JSON.parse(v1))
      const bookings = migrated.length ? migrated : seedBookings()
      write(bookings)
      return bookings
    }
    const legacy = JSON.parse(localStorage.getItem('charge-spot-quest-v3') || '{}')
    const fromLegacy = normalizeBookings(legacy.bookings)
    const bookings = fromLegacy.length ? fromLegacy : seedBookings()
    write(bookings)
    return bookings
  } catch {
    const seeded = seedBookings()
    try { write(seeded) } catch { /* ignore */ }
    return seeded
  }
}

function write(bookings: Booking[]) {
  localStorage.setItem(MOCK_KEY, JSON.stringify(bookings))
}

export function mockGetReservedPeriods(date: string, spotId: SpotId = BOOKABLE_SPOT): TimePeriod[] {
  return read()
    .filter((b) => !b.cancelled && b.date === date && b.spotId === spotId)
    .map((b) => b.period)
}

function idleFromOccupancy(
  reserved: TimePeriod[],
  period: TimePeriod,
  freeIdle: number,
  bookedIdle = 0.08,
): number {
  return reserved.includes(period) ? bookedIdle : freeIdle
}

export function mockGetSpots(): SpotStatus[] {
  const today = todayISO()
  const reservedC = mockGetReservedPeriods(today, 'C')
  // Maintenance bays: static mock idle per period (no live occupancy feed).
  const aMorning = 0.18
  const aNoon = 0.28
  const aEvening = 0.35
  const bMorning = 0.1
  const bNoon = 0.16
  const bEvening = 0.22
  // Bookable bay: derive from today's reserved periods when booked → low idle.
  const cMorning = idleFromOccupancy(reservedC, 'morning', 0.82)
  const cNoon = idleFromOccupancy(reservedC, 'noon', 0.71)
  const cEvening = idleFromOccupancy(reservedC, 'evening', 0.64)
  return [
    {
      id: 'A',
      maintenance: true,
      bookable: false,
      occupied: false,
      idleIn1h: 0.12,
      idleTonight: aEvening,
      idleMorning: aMorning,
      idleNoon: aNoon,
      idleEvening: aEvening,
    },
    {
      id: 'B',
      maintenance: true,
      bookable: false,
      occupied: false,
      idleIn1h: 0.08,
      idleTonight: bEvening,
      idleMorning: bMorning,
      idleNoon: bNoon,
      idleEvening: bEvening,
    },
    {
      id: 'C',
      maintenance: false,
      bookable: reservedC.length < 3,
      occupied: false,
      idleIn1h: 0.78,
      idleTonight: cEvening,
      idleMorning: cMorning,
      idleNoon: cNoon,
      idleEvening: cEvening,
      reservedPeriods: reservedC,
    },
  ]
}

export function mockGetBookings(sessionId: string): Booking[] {
  return read().filter((b) => b.sessionId === sessionId && !b.cancelled)
}

export function mockGetSpotBookings(spotId: SpotId): SpotBookingView[] {
  return read()
    .filter((b) => b.spotId === spotId && !b.cancelled)
    .sort((a, b) => a.date.localeCompare(b.date) || a.period.localeCompare(b.period))
    .map(toView)
}

/** Today's bookings across all bays (privacy-masked). */
export function mockGetTodayBookings(date = todayISO()): SpotBookingView[] {
  const periodRank = (p: TimePeriod) => PERIOD_ORDER.indexOf(p)
  const spotRank = (id: SpotId) => SPOT_IDS.indexOf(id)
  return read()
    .filter((b) => !b.cancelled && b.date === date)
    .sort(
      (a, b) =>
        spotRank(a.spotId) - spotRank(b.spotId) ||
        periodRank(a.period) - periodRank(b.period),
    )
    .map(toView)
}

function toView(b: Booking): SpotBookingView {
  return {
    id: b.id,
    spotId: b.spotId,
    date: b.date,
    period: b.period,
    status: 'booked',
    plateMasked: maskPlate(b.vehicle.plate),
    vehicleType: b.vehicle.type,
    vehicleColor: b.vehicle.color,
  }
}

export function mockCreateBooking(input: {
  sessionId: string
  date: string
  period: TimePeriod
  vehicle: VehicleInfo
}) {
  const bookings = read()
  if (!isBookableDate(input.date) || !['morning', 'noon', 'evening'].includes(input.period)) {
    return { ok: false, reason: '请选择今日起 7 天内的有效时段' }
  }
  if (
    bookings.some(
      (b) =>
        !b.cancelled &&
        b.spotId === BOOKABLE_SPOT &&
        b.date === input.date &&
        b.period === input.period,
    )
  ) {
    return { ok: false, reason: '该时段已被预约，请选择其他时段' }
  }
  const booking: Booking = {
    ...input,
    vehicle: normalizeVehicle(input.vehicle),
    id: uid('bk'),
    spotId: BOOKABLE_SPOT,
    createdAt: new Date().toISOString(),
    cancelled: false,
  }
  // Single-tab mock only; real multi-client concurrency requires a server.
  write([...bookings, booking])
  return { ok: true, booking }
}

export function mockReset() {
  write(seedBookings())
}
