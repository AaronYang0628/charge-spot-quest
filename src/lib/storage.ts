import type { AppState, Booking } from '../types'
import { NO_SHOW_LIMIT } from '../types'
import { makeSessionId } from './id'
import { randomNickname } from './nicknames'
import { seedDemoBookings } from './seed'
import { evaluateNoShows } from './noshow'

/** Bumped for slow-charge redesign seed */
const STORAGE_KEY = 'charge-spot-quest-v2'

function defaultState(): AppState {
  return {
    sessionId: makeSessionId(),
    nickname: randomNickname(),
    bookings: [],
    noShowCount: 0,
    blacklisted: false,
    seeded: false,
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const state = defaultState()
      state.bookings = seedDemoBookings()
      state.seeded = true
      const evaluated = evaluateNoShows(state)
      saveState(evaluated)
      return evaluated
    }
    const parsed = JSON.parse(raw) as AppState
    const state: AppState = {
      ...defaultState(),
      ...parsed,
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
    }
    if (!state.seeded) {
      const demo = seedDemoBookings()
      const existingIds = new Set(state.bookings.map((b) => b.id))
      state.bookings = [
        ...state.bookings,
        ...demo.filter((b) => !existingIds.has(b.id)),
      ]
      state.seeded = true
    }
    const evaluated = evaluateNoShows(state)
    saveState(evaluated)
    return evaluated
  } catch {
    const state = defaultState()
    state.bookings = seedDemoBookings()
    state.seeded = true
    saveState(state)
    return state
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function withBlacklistCheck(state: AppState): AppState {
  if (state.noShowCount >= NO_SHOW_LIMIT) {
    return { ...state, blacklisted: true }
  }
  return state
}

export type { Booking, AppState }
