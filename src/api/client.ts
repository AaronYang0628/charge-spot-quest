import type { Booking, BookResult, SpotStatus, TimePeriod, VehicleInfo } from '../types'
import {
  mockCreateBooking,
  mockGetBookings,
  mockGetSpots,
  mockReset,
} from './mock'

/**
 * API client stubs — swap implementations when a real backend exists.
 * All methods are async to mirror network calls.
 */
export const api = {
  async getSpots(): Promise<SpotStatus[]> {
    await delay(80)
    return mockGetSpots()
  },

  async getMyBookings(sessionId: string): Promise<Booking[]> {
    await delay(60)
    return mockGetBookings(sessionId)
  },

  async createBooking(input: {
    sessionId: string
    date: string
    period: TimePeriod
    vehicle: VehicleInfo
  }): Promise<BookResult> {
    await delay(220)
    return mockCreateBooking(input)
  },

  async resetDemo(): Promise<void> {
    mockReset()
  },
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
