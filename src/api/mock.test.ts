import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockCreateBooking, mockGetBookings, mockGetSpots, mockReset, MOCK_KEY } from './mock'
import { normalizeVehicle } from '../lib/normalize'
import { loadState } from '../lib/storage'
import { todayISO } from '../lib/time'
import { DEFAULT_VEHICLE } from '../types'

beforeEach(() => {
  const data = new Map<string,string>()
  vi.stubGlobal('localStorage', { getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string,v: string) => data.set(k,v), removeItem: (k: string) => data.delete(k) })
})
const input = () => ({ sessionId: 'test', date: todayISO(), period: 'morning' as const, vehicle: DEFAULT_VEHICLE })
describe('reservation mock', () => {
  it('starts empty with maintenance on A/B', () => {
    expect(mockGetSpots().map(s => [s.maintenance,s.occupied])).toEqual([[true,false],[true,false],[false,false]])
  })
  it('reserves periods independently without setting physical occupancy', () => {
    expect(mockCreateBooking(input()).ok).toBe(true)
    expect(mockCreateBooking({ ...input(), sessionId: 'other' }).ok).toBe(false)
    expect(mockCreateBooking({ ...input(), period:'evening' }).ok).toBe(true)
    expect(mockGetSpots()[2]).toMatchObject({occupied:false,bookable:true,reservedPeriods:['morning','evening']})
    expect(mockGetSpots()[2].occupiedSince).toBeUndefined()
    expect(mockCreateBooking({ ...input(), period:'noon' }).ok).toBe(true)
    expect(mockGetSpots()[2].bookable).toBe(false)
  })
  it('rehydrates from storage, filters by session and resets', () => {
    const res = mockCreateBooking(input())
    expect(JSON.parse(localStorage.getItem(MOCK_KEY)!)).toHaveLength(1)
    expect(mockGetBookings('test')[0].id).toBe(res.booking?.id)
    expect(mockGetBookings('other')).toEqual([])
    mockReset()
    expect(mockGetBookings('test')).toEqual([])
    expect(mockGetSpots()[2].bookable).toBe(true)
  })
  it('migrates legacy vehicle/history while preserving identity', () => {
    const vehicle = { type:'suv', color:'red', plate:'沪A12345' }
    localStorage.setItem('charge-spot-quest-v3', JSON.stringify({sessionId:'legacy',vehicle,
      bookings:[{...input(),id:'old',spotId:'C',sessionId:'legacy',vehicle,cancelled:false}]}))
    expect(loadState()).toMatchObject({sessionId:'legacy',vehicle:{type:'convertible',color:'red',plate:'沪A12345'}})
    expect(mockGetBookings('legacy')[0].vehicle.type).toBe('convertible')
    expect(normalizeVehicle({type:'pickup',color:'green'}).type).toBe('pickup')
  })
  it('ignores malformed storage and rejects invalid dates', () => {
    localStorage.setItem(MOCK_KEY, '{bad')
    expect(mockGetBookings('test')).toEqual([])
    expect(mockCreateBooking({...input(),date:'2000-01-01'}).ok).toBe(false)
    expect(normalizeVehicle({color:'invalid'})).toEqual(DEFAULT_VEHICLE)
  })
})
