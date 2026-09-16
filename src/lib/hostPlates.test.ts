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

  it('matches public masked host plates', () => {
    for (const p of HOST_PLATES) {
      expect(isHostPlateMasked(maskPlate(p))).toBe(true)
    }
    expect(isHostPlateMasked(maskPlate('沪E77889'))).toBe(false)
  })

  it('cut-in available when C vehicle is host or current period booking matches', () => {
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
            vehicleType: 'sedan',
            vehicleColor: 'white',
          },
        ],
      }),
    ).toBe(false)
  })
})
