import type { AppState } from '../types'
import { NO_SHOW_LIMIT } from '../types'
import { isPastEnd } from './time'

/**
 * Idempotent no-show evaluation:
 * MY bookings past endTime, not checkedIn, not cancelled → increment noShowCount once (noShowRecorded).
 */
export function evaluateNoShows(state: AppState, now = new Date()): AppState {
  let noShowCount = state.noShowCount
  const bookings = state.bookings.map((b) => {
    if (b.sessionId !== state.sessionId) return b
    if (b.cancelled || b.checkedIn || b.noShowRecorded) return b
    if (!isPastEnd(b.date, b.endMin, now)) return b
    noShowCount += 1
    return { ...b, noShowRecorded: true }
  })

  const blacklisted = noShowCount >= NO_SHOW_LIMIT || state.blacklisted

  return {
    ...state,
    bookings,
    noShowCount,
    blacklisted,
  }
}
