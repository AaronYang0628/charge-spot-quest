export type SpotId = 'A' | 'B' | 'C'

export type TimePeriod = 'morning' | 'noon' | 'evening'

export type VehicleType = 'sedan' | 'suv' | 'van' | 'pickup'
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
  sedan: '轿车',
  suv: 'SUV',
  van: '面包车',
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

/** Placeholder palette — keep in sync with --car-* in theme/tokens.css until Art Director palette lands */
export const VEHICLE_PALETTE: Record<
  VehicleColor,
  { body: string; light: string; dark: string }
> = {
  blue: { body: '#2F6BFF', light: '#5B8CFF', dark: '#1A3FA8' },
  yellow: { body: '#F5C518', light: '#FFE066', dark: '#C49200' },
  orange: { body: '#F07A1A', light: '#FF9A45', dark: '#B84E00' },
  white: { body: '#F2F2F0', light: '#FFFFFF', dark: '#C8C8C4' },
  red: { body: '#E23B2F', light: '#FF6B5E', dark: '#A01F16' },
  green: { body: '#3DBE3A', light: '#6BE068', dark: '#248A22' },
}

export const DEFAULT_VEHICLE: VehicleInfo = {
  plate: '',
  color: 'blue',
  type: 'sedan',
}

export const SPOT_LABELS: Record<SpotId, string> = {
  A: 'A',
  B: 'B',
  C: 'C',
}
