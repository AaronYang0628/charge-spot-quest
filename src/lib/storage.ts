import type { AppState, VehicleInfo } from '../types'
import { normalizeVehicle, normalizeBookings } from './normalize'
import { makeSessionId } from './id'

const STORAGE_KEY = 'charge-spot-quest-v3'
const VEHICLE_KEY = 'charge-spot-quest-vehicle'

function defaultState(): AppState {
  return {
    sessionId: makeSessionId(),
    bookings: [],
    vehicle: loadVehicle(),
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const state = defaultState()
      saveState(state)
      return state
    }
    const parsed = JSON.parse(raw) as Partial<AppState>
    return {
      ...defaultState(),
      ...parsed,
      bookings: normalizeBookings(parsed.bookings),
      vehicle: parsed.vehicle ? normalizeVehicle(parsed.vehicle) : loadVehicle(),
      sessionId: parsed.sessionId || makeSessionId(),
    }
  } catch {
    const state = defaultState()
    saveState(state)
    return state
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  if (state.vehicle) saveVehicle(state.vehicle)
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(VEHICLE_KEY)
  localStorage.removeItem('charge-spot-quest-mock-v1')
  localStorage.removeItem('charge-spot-quest-mock-v2')
}

export function loadVehicle(): VehicleInfo | null {
  try {
    const raw = localStorage.getItem(VEHICLE_KEY)
    if (!raw) return null
    return normalizeVehicle(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveVehicle(v: VehicleInfo): void {
  localStorage.setItem(VEHICLE_KEY, JSON.stringify(v))
}
