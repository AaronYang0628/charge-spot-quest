import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  mockCreateBooking,
  mockGetBookings,
  mockGetReservedPeriods,
  mockGetSpotBookings,
  mockGetSpots,
  mockGetTodayBookings,
  mockReset,
  MOCK_KEY,
} from './mock'
import { normalizeVehicle } from '../lib/normalize'
import { maskPlate } from '../lib/plate'
import { loadState } from '../lib/storage'
import { addDaysISO, todayISO } from '../lib/time'
import { DEFAULT_VEHICLE } from '../types'

beforeEach(() => {
  const data = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => data.set(k, v),
    removeItem: (k: string) => data.delete(k),
  })
})

const input = (over: Partial<{ sessionId: string; date: string; period: 'morning' | 'noon' | 'evening' }> = {}) => ({
  sessionId: 'test',
  date: todayISO(),
  period: 'morning' as const,
  vehicle: DEFAULT_VEHICLE,
  ...over,
})

describe('reservation mock', () => {
  it('seeds demo bookings and keeps A/B under maintenance', () => {
    expect(mockGetSpots().map(s => [s.id, s.maintenance, s.occupied])).toEqual([
      ['A', true, false],
      ['B', true, false],
      ['C', false, false],
    ])
    expect(mockGetSpotBookings('A').length).toBeGreaterThan(0)
    expect(mockGetSpotBookings('B').length).toBeGreaterThan(0)
    expect(mockGetSpotBookings('C').length).toBeGreaterThan(0)
    expect(mockGetSpotBookings('A')[0].plateMasked).toMatch(/···/)
    // Seed includes today's evening on C; morning/noon stay free
    expect(mockGetReservedPeriods(todayISO(), 'C')).toEqual(['evening'])
    const today = mockGetTodayBookings()
    expect(today.length).toBeGreaterThanOrEqual(1)
    expect(today.every((r) => r.date === todayISO())).toBe(true)
    expect(today.some((r) => r.plateMasked.includes('···'))).toBe(true)
  })

  it('reserves periods independently without setting physical occupancy', () => {
    expect(mockCreateBooking(input()).ok).toBe(true)
    expect(mockCreateBooking({ ...input(), sessionId: 'other' }).ok).toBe(false)
    expect(mockCreateBooking({ ...input(), period: 'noon' }).ok).toBe(true)
    expect(mockGetSpots()[2]).toMatchObject({
      occupied: false,
      bookable: false,
      reservedPeriods: expect.arrayContaining(['morning', 'noon', 'evening']),
    })
    expect(mockGetSpots()[2].occupiedSince).toBeUndefined()
    expect(mockCreateBooking({ ...input(), period: 'evening' }).ok).toBe(false)
  })

  it('allows booking within today+6 window and rejects outside', () => {
    const future = addDaysISO(todayISO(), 3)
    expect(mockCreateBooking(input({ date: future, period: 'noon' })).ok).toBe(true)
    expect(mockGetReservedPeriods(future, 'C')).toEqual(['noon'])
    expect(mockCreateBooking(input({ date: addDaysISO(todayISO(), 7) })).ok).toBe(false)
    expect(mockCreateBooking(input({ date: '2000-01-01' })).ok).toBe(false)
  })

  it('rehydrates from storage, filters by session and resets to seeds', () => {
    const res = mockCreateBooking(input())
    expect(JSON.parse(localStorage.getItem(MOCK_KEY)!).length).toBeGreaterThan(1)
    expect(mockGetBookings('test')[0].id).toBe(res.booking?.id)
    expect(mockGetBookings('other')).toEqual([])
    mockReset()
    expect(mockGetBookings('test')).toEqual([])
    expect(mockGetSpotBookings('C').length).toBeGreaterThan(0)
    expect(mockGetTodayBookings().length).toBeGreaterThanOrEqual(1)
    expect(mockGetSpots()[2].bookable).toBe(true)
  })

  it('migrates legacy vehicle/history while preserving identity', () => {
    const vehicle = { type: 'suv', color: 'red', plate: '沪A12345' }
    localStorage.setItem(
      'charge-spot-quest-v3',
      JSON.stringify({
        sessionId: 'legacy',
        vehicle,
        bookings: [{ ...input(), id: 'old', spotId: 'C', sessionId: 'legacy', vehicle, cancelled: false }],
      }),
    )
    expect(loadState()).toMatchObject({
      sessionId: 'legacy',
      vehicle: { type: 'convertible', color: 'red', plate: '沪A12345' },
    })
    expect(mockGetBookings('legacy')[0].vehicle.type).toBe('convertible')
    expect(normalizeVehicle({ type: 'pickup', color: 'green' }).type).toBe('pickup')
    expect(normalizeVehicle({ type: 'pickup', color: 'green' }).color).toBe('blue')
  })

  it('ignores malformed storage and masks plates', () => {
    localStorage.setItem(MOCK_KEY, '{bad')
    expect(mockGetBookings('test')).toEqual([])
    expect(maskPlate('浙A12348')).toBe('浙A···8')
    expect(normalizeVehicle({ color: 'invalid' })).toEqual(DEFAULT_VEHICLE)
    expect(normalizeVehicle({ color: 'black' }).color).toBe('black')
  })

  it('only exposes black/white/gray/red/blue as vehicle colors', () => {
    const allowed = new Set(['black', 'white', 'gray', 'red', 'blue'])
    for (const row of mockGetTodayBookings()) {
      expect(allowed.has(row.vehicleColor)).toBe(true)
    }
  })
})
