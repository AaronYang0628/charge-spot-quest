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
  mockCutInBooking,
  mockGetBookings,
  mockGetReservedPeriods,
  mockGetSpotBookings,
  mockGetSpots,
  mockGetTodayBookings,
  mockReset,
} from './mock'

/**
 * VITE_API_BASE:
 * - unset → local mock (GitHub Pages demo)
 * - "/" or "same" → same-origin relative /api/...
 * - "http://host:port" → absolute API origin
 */
const rawApiBase = import.meta.env.VITE_API_BASE as string | undefined
const USE_API = typeof rawApiBase === 'string' && rawApiBase.length > 0
const API_BASE =
  !USE_API || rawApiBase === '/' || rawApiBase === 'same'
    ? ''
    : rawApiBase.replace(/\/$/, '')

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
 * API client — real backend when VITE_API_BASE is set; otherwise local mock.
 */
export const api = {
  async getSpots(): Promise<SpotStatus[]> {
    if (USE_API) return apiFetch<SpotStatus[]>('/api/spots')
    await delay(80)
    return mockGetSpots()
  },

  async getMyBookings(sessionId: string): Promise<Booking[]> {
    if (USE_API) {
      return apiFetch<Booking[]>(`/api/me/bookings?sessionId=${encodeURIComponent(sessionId)}`)
    }
    await delay(60)
    return mockGetBookings(sessionId)
  },

  async getSpotBookings(spotId: SpotId): Promise<SpotBookingView[]> {
    if (USE_API) return apiFetch<SpotBookingView[]>(`/api/spots/${spotId}/bookings`)
    await delay(60)
    return mockGetSpotBookings(spotId)
  },

  async getTodayBookings(): Promise<SpotBookingView[]> {
    if (USE_API) return apiFetch<SpotBookingView[]>('/api/bookings/today')
    await delay(60)
    return mockGetTodayBookings()
  },

  async getReservedPeriods(date: string, spotId: SpotId = 'C'): Promise<TimePeriod[]> {
    if (USE_API) {
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
    if (USE_API) {
      return apiFetch<BookResult>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    }
    await delay(220)
    return mockCreateBooking(input)
  },

  async cutInBooking(input: {
    sessionId: string
    vehicle: VehicleInfo
    period?: TimePeriod
  }): Promise<BookResult> {
    if (USE_API) {
      return apiFetch<BookResult>('/api/bookings/cut-in', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    }
    await delay(180)
    return mockCutInBooking(input)
  },

  async resetDemo(): Promise<void> {
    if (USE_API) {
      await apiFetch<{ ok: boolean }>('/api/demo/reset', { method: 'POST' })
      return
    }
    mockReset()
  },
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
