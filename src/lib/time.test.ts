import { describe, expect, it } from 'vitest'
import { currentIdlePeriodFromHour, shanghaiHour, todayISO } from './time'

describe('currentIdlePeriodFromHour (Asia/Shanghai rules)', () => {
  it('highlights 今晚 before 08, 今早 08–12', () => {
    expect(currentIdlePeriodFromHour(0)).toBe('evening')
    expect(currentIdlePeriodFromHour(7)).toBe('evening')
    expect(currentIdlePeriodFromHour(8)).toBe('morning')
    expect(currentIdlePeriodFromHour(11)).toBe('morning')
  })

  it('switches to 中午 at 12 and 今晚 at 18', () => {
    expect(currentIdlePeriodFromHour(12)).toBe('noon')
    expect(currentIdlePeriodFromHour(13)).toBe('noon')
    expect(currentIdlePeriodFromHour(17)).toBe('noon')
    expect(currentIdlePeriodFromHour(18)).toBe('evening')
    expect(currentIdlePeriodFromHour(23)).toBe('evening')
  })
})

describe('shanghai wall clock', () => {
  it('maps a known UTC instant to Shanghai hour/date', () => {
    // 2026-09-16 05:50 UTC == 13:50 Asia/Shanghai
    const d = new Date('2026-09-16T05:50:00Z')
    expect(shanghaiHour(d)).toBe(13)
    expect(todayISO(d)).toBe('2026-09-16')
  })
})
