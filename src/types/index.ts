export type SpotId = 'A' | 'B' | 'C'

export interface Booking {
  id: string
  spotId: SpotId
  sessionId: string
  nickname: string
  /** ISO date string YYYY-MM-DD */
  date: string
  /** minutes from midnight */
  startMin: number
  /** minutes from midnight */
  endMin: number
  createdAt: string
  checkedIn: boolean
  cancelled: boolean
  /** idempotent no-show marker */
  noShowRecorded: boolean
}

export interface AppState {
  sessionId: string
  nickname: string
  bookings: Booking[]
  noShowCount: number
  blacklisted: boolean
  seeded: boolean
}

export interface FreeWindow {
  startMin: number
  endMin: number
}

export const BOOKABLE_SPOT: SpotId = 'C'
export const MAINTENANCE_SPOTS: SpotId[] = ['A', 'B']

/** Full-day bar: always-on slow charger */
export const DAY_START_MIN = 0
export const DAY_END_MIN = 24 * 60

export const HORIZON_DAYS = 7
export const NO_SHOW_LIMIT = 3

/** Slow charge durations in hours */
export const DURATION_OPTIONS = [6, 7, 8] as const
export type DurationHours = (typeof DURATION_OPTIONS)[number]
export const DEFAULT_DURATION_HOURS: DurationHours = 8

export const SPOT_LABELS: Record<SpotId, string> = {
  A: 'A号',
  B: 'B号',
  C: 'C号',
}
