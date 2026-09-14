import type { Booking, SpotStatus, TimePeriod, VehicleInfo } from '../types'
import { uid } from '../lib/id'
import { todayISO } from '../lib/time'

/** In-memory mock “backend” for today’s occupancy + bookings */
const store: {
  bookings: Booking[]
  spots: SpotStatus[]
} = {
  bookings: [],
  spots: [
    {
      id: 'A',
      bookable: false,
      maintenance: true,
      occupied: false,
      idleIn1h: 0.12,
      idleTonight: 0.35,
    },
    {
      id: 'B',
      bookable: false,
      maintenance: true,
      occupied: false,
      idleIn1h: 0.08,
      idleTonight: 0.22,
    },
    {
      id: 'C',
      bookable: true,
      maintenance: false,
      occupied: false,
      idleIn1h: 0.78,
      idleTonight: 0.64,
    },
  ],
}

export function mockGetSpots(): SpotStatus[] {
  return store.spots.map((s) => ({ ...s }))
}

export function mockGetBookings(sessionId: string): Booking[] {
  return store.bookings.filter((b) => b.sessionId === sessionId && !b.cancelled)
}

export function mockCreateBooking(input: {
  sessionId: string
  date: string
  period: TimePeriod
  vehicle: VehicleInfo
}): { ok: boolean; reason?: string; booking?: Booking } {
  const spot = store.spots.find((s) => s.id === 'C')!
  if (spot.maintenance || !spot.bookable) {
    return { ok: false, reason: '车位 C 暂不可约' }
  }
  if (spot.occupied) {
    return { ok: false, reason: '车位 C 当前被占用' }
  }
  const clash = store.bookings.find(
    (b) =>
      !b.cancelled &&
      b.spotId === 'C' &&
      b.date === input.date &&
      b.period === input.period,
  )
  if (clash) {
    return { ok: false, reason: `该「${periodLabel(input.period)}」时段已被预约` }
  }

  const booking: Booking = {
    id: uid('bk'),
    spotId: 'C',
    sessionId: input.sessionId,
    date: input.date,
    period: input.period,
    vehicle: input.vehicle,
    createdAt: new Date().toISOString(),
    cancelled: false,
  }
  store.bookings.push(booking)

  // If booking is for today, mark C occupied for the scene
  if (input.date === todayISO()) {
    spot.occupied = true
    spot.occupiedSince = new Date().toISOString()
    spot.vehicle = input.vehicle
    spot.idleIn1h = 0.05
    spot.idleTonight = Math.max(0.15, spot.idleTonight - 0.3)
  }

  return { ok: true, booking }
}

function periodLabel(p: TimePeriod): string {
  return ({ morning: '早', noon: '中', evening: '晚' } as const)[p]
}

export function mockReset() {
  store.bookings = []
  store.spots = [
    {
      id: 'A',
      bookable: false,
      maintenance: true,
      occupied: false,
      idleIn1h: 0.12,
      idleTonight: 0.35,
    },
    {
      id: 'B',
      bookable: false,
      maintenance: true,
      occupied: false,
      idleIn1h: 0.08,
      idleTonight: 0.22,
    },
    {
      id: 'C',
      bookable: true,
      maintenance: false,
      occupied: false,
      idleIn1h: 0.78,
      idleTonight: 0.64,
    },
  ]
}
