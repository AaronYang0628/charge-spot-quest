export type SpotId = 'A' | 'B' | 'C'

export type TimePeriod = 'morning' | 'noon' | 'evening'

export type VehicleType = 'convertible' | 'pickup'
export type VehicleColor = 'black' | 'white' | 'gray' | 'red' | 'blue'

export interface VehicleInfo {
  plate: string
  color: VehicleColor
  type: VehicleType
}

export interface SpotStatus {
  id: SpotId
  bookable: boolean
  maintenance: boolean
  occupied: boolean
  /** idle probability in next 1 hour, 0–1 (kept for API; not shown on cards) */
  idleIn1h: number
  /** idle probability tonight, 0–1 */
  idleTonight: number
  /** if occupied: when occupancy started (ISO) */
  occupiedSince?: string
  /** parked vehicle for display */
  reservedPeriods?: TimePeriod[]
  vehicle?: VehicleInfo
}

export interface Booking {
  id: string
  spotId: SpotId
  sessionId: string
  date: string
  period: TimePeriod
  vehicle: VehicleInfo
  createdAt: string
  cancelled: boolean
}

/** Public per-bay booking row (no session id). */
export interface SpotBookingView {
  id: string
  spotId: SpotId
  date: string
  period: TimePeriod
  status: 'booked'
  plateMasked: string
  vehicleType: VehicleType
  vehicleColor: VehicleColor
}

export interface AppState {
  sessionId: string
  bookings: Booking[]
  vehicle: VehicleInfo | null
}

export interface BookResult {
  ok: boolean
  reason?: string
  booking?: Booking
}

export const BOOKABLE_SPOT: SpotId = 'C'
export const MAINTENANCE_SPOTS: SpotId[] = ['A', 'B']

export const PERIOD_LABELS: Record<TimePeriod, string> = {
  morning: '早',
  noon: '中',
  evening: '晚',
}

export const PERIOD_HINTS: Record<TimePeriod, string> = {
  morning: '上午时段',
  noon: '中午时段',
  evening: '晚间时段',
}

export const PERIOD_ORDER: TimePeriod[] = ['morning', 'noon', 'evening']

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  convertible: '敞篷车',
  pickup: '皮卡',
}

export const VEHICLE_COLOR_LABELS: Record<VehicleColor, string> = {
  black: '黑色',
  white: '白色',
  gray: '灰色',
  red: '红色',
  blue: '蓝色',
}

/** Locked palette — keep in sync with --car-* in theme/tokens.css */
export const VEHICLE_PALETTE: Record<
  VehicleColor,
  { body: string; light: string; dark: string }
> = {
  black: { body: '#2A2A2E', light: '#4A4A50', dark: '#111114' },
  white: { body: '#F0E0D8', light: '#F8F8F8', dark: '#C8B8A0' },
  gray: { body: '#8A8A90', light: '#B0B0B6', dark: '#5A5A60' },
  red: { body: '#E23B2F', light: '#F80000', dark: '#680000' },
  blue: { body: '#0088D0', light: '#5B9AD4', dark: '#002060' },
}

export const DEFAULT_VEHICLE: VehicleInfo = {
  plate: '',
  color: 'blue',
  type: 'convertible',
}

/** User-visible bay numbers (internal ids stay A/B/C). */
export const SPOT_LABELS: Record<SpotId, string> = {
  A: '647',
  B: '648',
  C: '649',
}

export const SPOT_IDS: SpotId[] = ['A', 'B', 'C']
