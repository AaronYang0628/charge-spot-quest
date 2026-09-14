import type { AppState, VehicleInfo } from '../types'
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
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
      vehicle: parsed.vehicle ?? loadVehicle(),
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
}

export function loadVehicle(): VehicleInfo | null {
  try {
    const raw = localStorage.getItem(VEHICLE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as VehicleInfo
  } catch {
    return null
  }
}

export function saveVehicle(v: VehicleInfo): void {
  localStorage.setItem(VEHICLE_KEY, JSON.stringify(v))
}
