import type { Booking, BookResult, SpotBookingView, SpotId, SpotStatus, TimePeriod, VehicleInfo } from '../types'
import { BOOKABLE_SPOT, PERIOD_ORDER, SPOT_IDS } from '../types'
import { uid } from '../lib/id'
import { maskPlate } from '../lib/plate'
import { isHostPlate } from '../lib/hostPlates'
import { addDaysISO, currentIdlePeriod, isBookableDate, todayISO } from '../lib/time'
import { normalizeBookings, normalizeVehicle } from '../lib/normalize'

/** Bump when seed/palette shape changes so empty→fresh demo loads. */
export const MOCK_KEY = 'charge-spot-quest-mock-v5'

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
    mk('A', 0, 'morning', '浙A12345', 'blue', 'convertible', 1),
    mk('B', 0, 'evening', '苏C66552', 'gray', 'convertible', 1),
    mk('C', 0, 'evening', '浙ACU6508', 'white', 'pickup', 1),
    // Future seeds
    mk('A', 2, 'noon', '沪B88881', 'red', 'pickup', 2),
    mk('B', 3, 'morning', '浙D90003', 'black', 'pickup', 2),
    mk('C', 2, 'morning', '浙A10247', 'red', 'convertible', 2),
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
    const v4 = localStorage.getItem('charge-spot-quest-mock-v4')
    if (v4 !== null) {
      const migrated = normalizeBookings(JSON.parse(v4))
      const bookings = migrated.length ? migrated : seedBookings()
      write(bookings)
      return bookings
    }
    const v3 = localStorage.getItem('charge-spot-quest-mock-v3')
    if (v3 !== null) {
      const migrated = normalizeBookings(JSON.parse(v3))
      const bookings = migrated.length ? migrated : seedBookings()
      write(bookings)
      return bookings
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

/** Booked period → 0% idle; free period → 100% idle. */
function idleForPeriod(reserved: TimePeriod[], period: TimePeriod): number {
  return reserved.includes(period) ? 0 : 1
}

export function mockGetSpots(): SpotStatus[] {
  const today = todayISO()
  const reservedA = mockGetReservedPeriods(today, 'A')
  const reservedB = mockGetReservedPeriods(today, 'B')
  const reservedC = mockGetReservedPeriods(today, 'C')
  const aMorning = idleForPeriod(reservedA, 'morning')
  const aNoon = idleForPeriod(reservedA, 'noon')
  const aEvening = idleForPeriod(reservedA, 'evening')
  const bMorning = idleForPeriod(reservedB, 'morning')
  const bNoon = idleForPeriod(reservedB, 'noon')
  const bEvening = idleForPeriod(reservedB, 'evening')
  const cMorning = idleForPeriod(reservedC, 'morning')
  const cNoon = idleForPeriod(reservedC, 'noon')
  const cEvening = idleForPeriod(reservedC, 'evening')
  return [
    {
      id: 'A',
      maintenance: true,
      bookable: false,
      occupied: false,
      idleIn1h: aMorning,
      idleTonight: aEvening,
      idleMorning: aMorning,
      idleNoon: aNoon,
      idleEvening: aEvening,
      reservedPeriods: reservedA,
    },
    {
      id: 'B',
      maintenance: true,
      bookable: false,
      occupied: false,
      idleIn1h: bMorning,
      idleTonight: bEvening,
      idleMorning: bMorning,
      idleNoon: bNoon,
      idleEvening: bEvening,
      reservedPeriods: reservedB,
    },
    {
      id: 'C',
      maintenance: false,
      bookable: reservedC.length < 3,
      occupied: false,
      idleIn1h: cMorning,
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
    .filter(
      (b) =>
        b.date === date &&
        (!b.cancelled || b.cancelReason === 'cut_in'),
    )
    .sort(
      (a, b) =>
        spotRank(a.spotId) - spotRank(b.spotId) ||
        periodRank(a.period) - periodRank(b.period) ||
        (a.cancelled && a.cancelReason === 'cut_in' ? 0 : 1) -
          (b.cancelled && b.cancelReason === 'cut_in' ? 0 : 1),
    )
    .map(toView)
}

function toView(b: Booking): SpotBookingView {
  const replaced = Boolean(b.cancelled && (b.cancelReason === 'cut_in' || b.supersededBy))
  return {
    id: b.id,
    spotId: b.spotId,
    date: b.date,
    period: b.period,
    status: replaced ? 'cut_in_replaced' : 'booked',
    plateMasked: maskPlate(b.vehicle.plate),
    isHost: isHostPlate(b.vehicle.plate),
    vehicleType: b.vehicle.type,
    vehicleColor: b.vehicle.color,
    supersededBy: b.supersededBy,
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


export function mockCutInBooking(input: {
  sessionId: string
  vehicle: VehicleInfo
  period?: TimePeriod
}) {
  const bookings = read()
  const vehicle = normalizeVehicle(input.vehicle)
  if (!vehicle.plate.trim()) {
    return { ok: false, reason: '请先填写车牌号' }
  }
  const today = todayISO()
  const period = input.period ?? currentIdlePeriod()
  const host = bookings.find(
    (b) =>
      !b.cancelled &&
      b.spotId === BOOKABLE_SPOT &&
      b.date === today &&
      b.period === period,
  )
  if (!host) {
    return { ok: false, reason: '当前时段无可插队的车主预约' }
  }
  if (!isHostPlate(host.vehicle.plate)) {
    return { ok: false, reason: '超级插队仅可插车主（浙ACU6508 / 浙AY75C1）的队' }
  }
  const booking: Booking = {
    id: uid('bk'),
    sessionId: input.sessionId,
    spotId: BOOKABLE_SPOT,
    date: today,
    period,
    vehicle,
    createdAt: new Date().toISOString(),
    cancelled: false,
  }
  const next = bookings.map((b) =>
    b.id === host.id
      ? { ...b, cancelled: true, cancelReason: 'cut_in', supersededBy: booking.id }
      : b,
  )
  write([...next, booking])
  return { ok: true, reason: '超级插队已登记', booking }
}

export function mockReset() {
  write(seedBookings())
}

export function mockCancelCutIn(input: {
  sessionId: string
  bookingId: string
}): BookResult {
  const bookings = read()
  const jumper = bookings.find((b) => b.id === input.bookingId)
  if (!jumper) {
    return { ok: false, reason: '找不到该插队预约' }
  }
  if (jumper.sessionId !== input.sessionId) {
    return { ok: false, reason: '只能取消自己的插队' }
  }
  if (jumper.cancelled) {
    return { ok: true, reason: '插队已取消，车主占用已恢复' }
  }
  const host = bookings.find(
    (b) => b.supersededBy === jumper.id && b.cancelReason === 'cut_in',
  )
  if (!host) {
    return { ok: false, reason: '找不到被插队的车主预约，无法恢复' }
  }
  const next = bookings.map((b) => {
    if (b.id === jumper.id) {
      return { ...b, cancelled: true, cancelReason: 'user_cancel' }
    }
    if (b.id === host.id) {
      return { ...b, cancelled: false, cancelReason: undefined, supersededBy: undefined }
    }
    return b
  })
  write(next)
  const cancelled = next.find((b) => b.id === jumper.id)!
  return { ok: true, reason: '已取消插队，车主占用已恢复', booking: cancelled }
}

