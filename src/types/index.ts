export type SpotId = 'A' | 'B' | 'C'

export type TimePeriod = 'morning' | 'noon' | 'evening'

export type VehicleType = 'convertible' | 'pickup'
export type VehicleColor =
  | 'blue'
  | 'yellow'
  | 'orange'
  | 'white'
  | 'red'
  | 'green'

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
  /** idle probability in next 1 hour, 0–1 */
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

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  convertible: '敞篷车',
  pickup: '皮卡',
}

export const VEHICLE_COLOR_LABELS: Record<VehicleColor, string> = {
  blue: '蓝色',
  yellow: '黄色',
  orange: '橙色',
  white: '白色',
  red: '红色',
  green: '绿色',
}

/** Locked palette (STYLE-GUIDE v2 — bodies unchanged) — keep in sync with --car-* in theme/tokens.css */
export const VEHICLE_PALETTE: Record<
  VehicleColor,
  { body: string; light: string; dark: string }
> = {
  blue: { body: '#0088D0', light: '#5B9AD4', dark: '#002060' },
  yellow: { body: '#D89000', light: '#F0D000', dark: '#804800' },
  orange: { body: '#E89040', light: '#F0B000', dark: '#B85000' },
  white: { body: '#F0E0D8', light: '#F8F8F8', dark: '#C8B8A0' },
  red: { body: '#E23B2F', light: '#F80000', dark: '#680000' },
  green: { body: '#3DBE3A', light: '#98B850', dark: '#285000' },
}

export const DEFAULT_VEHICLE: VehicleInfo = {
  plate: '',
  color: 'blue',
  type: 'convertible',
}

export const SPOT_LABELS: Record<SpotId, string> = {
  A: 'A',
  B: 'B',
  C: 'C',
}
