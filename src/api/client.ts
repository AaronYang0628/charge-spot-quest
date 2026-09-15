import type {
  Booking,
  BookResult,
  SpotBookingView,
  SpotId,
  SpotStatus,
  TimePeriod,
  VehicleInfo,
} from '../types'
import {
  mockCreateBooking,
  mockGetBookings,
  mockGetReservedPeriods,
  mockGetSpotBookings,
  mockGetSpots,
  mockGetTodayBookings,
  mockReset,
} from './mock'

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') || ''

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${text || res.statusText}`)
  }
  return res.json() as Promise<T>
}

/**
 * API client — uses real backend when VITE_API_BASE is set; otherwise local mock.
 */
export const api = {
  async getSpots(): Promise<SpotStatus[]> {
    if (API_BASE) return apiFetch<SpotStatus[]>('/api/spots')
    await delay(80)
    return mockGetSpots()
  },

  async getMyBookings(sessionId: string): Promise<Booking[]> {
    if (API_BASE) {
      return apiFetch<Booking[]>(`/api/me/bookings?sessionId=${encodeURIComponent(sessionId)}`)
    }
    await delay(60)
    return mockGetBookings(sessionId)
  },

  async getSpotBookings(spotId: SpotId): Promise<SpotBookingView[]> {
    if (API_BASE) return apiFetch<SpotBookingView[]>(`/api/spots/${spotId}/bookings`)
    await delay(60)
    return mockGetSpotBookings(spotId)
  },

  async getTodayBookings(): Promise<SpotBookingView[]> {
    if (API_BASE) return apiFetch<SpotBookingView[]>('/api/bookings/today')
    await delay(60)
    return mockGetTodayBookings()
  },

  async getReservedPeriods(date: string, spotId: SpotId = 'C'): Promise<TimePeriod[]> {
    if (API_BASE) {
      return apiFetch<TimePeriod[]>(
        `/api/spots/${spotId}/reserved?date=${encodeURIComponent(date)}`,
      )
    }
    await delay(40)
    return mockGetReservedPeriods(date, spotId)
  },

  async createBooking(input: {
    sessionId: string
    date: string
    period: TimePeriod
    vehicle: VehicleInfo
  }): Promise<BookResult> {
    if (API_BASE) {
      return apiFetch<BookResult>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    }
    await delay(220)
    return mockCreateBooking(input)
  },

  async resetDemo(): Promise<void> {
    if (API_BASE) {
      await apiFetch<{ ok: boolean }>('/api/demo/reset', { method: 'POST' })
      return
    }
    mockReset()
  },
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
