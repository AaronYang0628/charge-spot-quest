import { describe, expect, it } from 'vitest'
import {
  HOST_PLATES,
  isHostCutInAvailable,
  isHostPlate,
  isHostPlateMasked,
  normalizePlate,
} from './hostPlates'
import { maskPlate } from './plate'

describe('hostPlates', () => {
  it('normalizes and recognizes exact host plates', () => {
    expect(normalizePlate(' 浙acu6508 ')).toBe('浙ACU6508')
    expect(isHostPlate('浙ACU6508')).toBe(true)
    expect(isHostPlate(' 浙ay75c1 ')).toBe(true)
    expect(isHostPlate('沪A12345')).toBe(false)
    expect(isHostPlate('')).toBe(false)
    expect(HOST_PLATES).toHaveLength(2)
  })

  it('matches public masked host plates (legacy; mask collides)', () => {
    for (const p of HOST_PLATES) {
      expect(isHostPlateMasked(maskPlate(p))).toBe(true)
    }
    expect(isHostPlateMasked(maskPlate('沪E77889'))).toBe(false)
    // Collision: non-host 浙A12348 masks like 浙ACU6508
    expect(maskPlate('浙A12348')).toBe(maskPlate('浙ACU6508'))
    expect(isHostPlateMasked(maskPlate('浙A12348'))).toBe(true)
  })

  it('cut-in available when C vehicle is host or booking has isHost', () => {
    expect(
      isHostCutInAvailable({
        spot: {
          id: 'C',
          bookable: true,
          maintenance: false,
          occupied: true,
          idleIn1h: 0,
          idleTonight: 1,
          idleMorning: 0,
          idleNoon: 1,
          idleEvening: 1,
          vehicle: { plate: '浙ACU6508', color: 'blue', type: 'sedan' },
        },
      }),
    ).toBe(true)

    expect(
      isHostCutInAvailable({
        period: 'morning',
        todayBookings: [
          {
            id: '1',
            spotId: 'C',
            date: '2026-09-16',
            period: 'morning',
            status: 'booked',
            plateMasked: maskPlate('浙AY75C1'),
            isHost: true,
            vehicleType: 'sedan',
            vehicleColor: 'white',
          },
        ],
      }),
    ).toBe(true)

    expect(
      isHostCutInAvailable({
        period: 'morning',
        todayBookings: [
          {
            id: '1',
            spotId: 'C',
            date: '2026-09-16',
            period: 'evening',
            status: 'booked',
            plateMasked: maskPlate('浙ACU6508'),
            isHost: true,
            vehicleType: 'sedan',
            vehicleColor: 'white',
          },
        ],
      }),
    ).toBe(false)
  })

  it('ignores already cut-in-replaced host rows', () => {
    expect(
      isHostCutInAvailable({
        period: 'evening',
        todayBookings: [
          {
            id: '1',
            spotId: 'C',
            date: '2026-09-16',
            period: 'evening',
            status: 'cut_in_replaced',
            plateMasked: maskPlate('浙ACU6508'),
            isHost: true,
            vehicleType: 'sedan',
            vehicleColor: 'white',
          },
        ],
      }),
    ).toBe(false)
  })

  it('mask collision alone must NOT enable cut-in without isHost', () => {
    const collidingMasked = maskPlate('浙A12348')
    expect(collidingMasked).toBe('浙A···8')
    expect(collidingMasked).toBe(maskPlate('浙ACU6508'))
    expect(isHostPlateMasked(collidingMasked)).toBe(true)

    expect(
      isHostCutInAvailable({
        period: 'morning',
        todayBookings: [
          {
            id: 'non-host',
            spotId: 'C',
            date: '2026-09-16',
            period: 'morning',
            status: 'booked',
            plateMasked: collidingMasked,
            isHost: false,
            vehicleType: 'convertible',
            vehicleColor: 'blue',
          },
        ],
      }),
    ).toBe(false)

    expect(
      isHostCutInAvailable({
        period: 'morning',
        todayBookings: [
          {
            id: 'host',
            spotId: 'C',
            date: '2026-09-16',
            period: 'morning',
            status: 'booked',
            plateMasked: collidingMasked,
            isHost: true,
            vehicleType: 'pickup',
            vehicleColor: 'white',
          },
        ],
      }),
    ).toBe(true)
  })
})
