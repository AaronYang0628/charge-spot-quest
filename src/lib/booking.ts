import type { Booking, FreeWindow, SpotId } from '../types'
import { BOOKABLE_SPOT, DAY_END_MIN, DAY_START_MIN } from '../types'
import { rangesOverlap, snapToHour, todayISO, nowMinutes } from './time'
import { uid } from './id'

export function activeBookingsForSpot(
  bookings: Booking[],
  spotId: SpotId,
  date: string,
): Booking[] {
  return bookings
    .filter((b) => b.spotId === spotId && b.date === date && !b.cancelled)
    .sort((a, b) => a.startMin - b.startMin)
}

export function hasConflict(
  bookings: Booking[],
  spotId: SpotId,
  date: string,
  startMin: number,
  endMin: number,
  excludeId?: string,
): Booking | null {
  const list = activeBookingsForSpot(bookings, spotId, date)
  for (const b of list) {
    if (excludeId && b.id === excludeId) continue
    if (rangesOverlap(startMin, endMin, b.startMin, b.endMin)) return b
  }
  return null
}

export function createBooking(input: {
  sessionId: string
  nickname: string
  date: string
  startMin: number
  endMin: number
}): Booking {
  return {
    id: uid('bk'),
    spotId: BOOKABLE_SPOT,
    sessionId: input.sessionId,
    nickname: input.nickname,
    date: input.date,
    startMin: input.startMin,
    endMin: input.endMin,
    createdAt: new Date().toISOString(),
    checkedIn: false,
    cancelled: false,
    noShowRecorded: false,
  }
}

export function myActiveBookings(
  bookings: Booking[],
  sessionId: string,
): Booking[] {
  return bookings
    .filter((b) => b.sessionId === sessionId && !b.cancelled)
    .sort((a, b) =>
      a.date === b.date ? a.startMin - b.startMin : a.date.localeCompare(b.date),
    )
}

/** Free gaps for a day; today clips past hours to the next full hour */
export function freeWindowsForDay(
  bookings: Booking[],
  date: string,
  now = new Date(),
): FreeWindow[] {
  const occupied = activeBookingsForSpot(bookings, BOOKABLE_SPOT, date)
  const isToday = date === todayISO(now)
  let cursor = DAY_START_MIN
  if (isToday) {
    const nextHour = snapToHour(nowMinutes(now))
    const ceil =
      nowMinutes(now) % 60 === 0 ? nextHour : nextHour + 60
    cursor = Math.max(cursor, ceil)
  }
  if (cursor >= DAY_END_MIN) return []

  const windows: FreeWindow[] = []
  for (const b of occupied) {
    if (b.endMin <= cursor) continue
    if (b.startMin > cursor) {
      windows.push({ startMin: cursor, endMin: Math.min(b.startMin, DAY_END_MIN) })
    }
    cursor = Math.max(cursor, b.endMin)
    if (cursor >= DAY_END_MIN) break
  }
  if (cursor < DAY_END_MIN) {
    windows.push({ startMin: cursor, endMin: DAY_END_MIN })
  }
  return windows.filter((w) => w.endMin - w.startMin >= 60)
}

/** Hour-aligned starts that fit durationHours inside free windows */
export function validStartsForDuration(
  bookings: Booking[],
  date: string,
  durationHours: number,
  now = new Date(),
): number[] {
  const need = durationHours * 60
  const windows = freeWindowsForDay(bookings, date, now)
  const starts: number[] = []
  for (const w of windows) {
    const first =
      w.startMin % 60 === 0 ? w.startMin : snapToHour(w.startMin) + 60
    for (let s = first; s + need <= w.endMin; s += 60) {
      starts.push(s)
    }
  }
  return starts
}

export function longestFreeMinutes(
  bookings: Booking[],
  date: string,
  now = new Date(),
): number {
  const wins = freeWindowsForDay(bookings, date, now)
  if (wins.length === 0) return 0
  return Math.max(...wins.map((w) => w.endMin - w.startMin))
}
