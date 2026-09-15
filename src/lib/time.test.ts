import { describe, expect, it } from 'vitest'
import { currentIdlePeriod } from './time'

function atHour(hour: number, minute = 0) {
  return new Date(2026, 8, 15, hour, minute, 0, 0)
}

describe('currentIdlePeriod', () => {
  it('highlights 今早 before 08 and through morning until 12', () => {
    expect(currentIdlePeriod(atHour(0))).toBe('morning')
    expect(currentIdlePeriod(atHour(7, 59))).toBe('morning')
    expect(currentIdlePeriod(atHour(8))).toBe('morning')
    expect(currentIdlePeriod(atHour(11, 59))).toBe('morning')
  })

  it('switches to 中午 at 12 and 今晚 at 18', () => {
    expect(currentIdlePeriod(atHour(12))).toBe('noon')
    expect(currentIdlePeriod(atHour(17, 59))).toBe('noon')
    expect(currentIdlePeriod(atHour(18))).toBe('evening')
    expect(currentIdlePeriod(atHour(23, 59))).toBe('evening')
  })
})
