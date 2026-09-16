import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PLATE_HISTORY_KEY,
  PLATE_HISTORY_MAX,
  clearPlateHistory,
  loadPlateHistory,
  recordPlateHistory,
} from './plateHistory'

beforeEach(() => {
  const data = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => { data.set(k, v) },
    removeItem: (k: string) => { data.delete(k) },
    clear: () => { data.clear() },
  })
})

describe('plateHistory', () => {
  it('records unique plates newest-first and caps length', () => {
    expect(loadPlateHistory()).toEqual([])
    recordPlateHistory({ plate: '浙A11111', color: 'blue', type: 'sedan' })
    recordPlateHistory({ plate: '沪B22222', color: 'red', type: 'pickup' })
    recordPlateHistory({ plate: '浙A11111', color: 'white', type: 'van' })
    const list = loadPlateHistory()
    expect(list[0]).toEqual({ plate: '浙A11111', color: 'white', type: 'van' })
    expect(list[1]?.plate).toBe('沪B22222')
    expect(list).toHaveLength(2)

    for (let i = 0; i < PLATE_HISTORY_MAX + 3; i++) {
      recordPlateHistory({
        plate: `测X${i}`,
        color: 'gray',
        type: 'compact',
      })
    }
    expect(loadPlateHistory().length).toBe(PLATE_HISTORY_MAX)
    expect(localStorage.getItem(PLATE_HISTORY_KEY)).toBeTruthy()
  })

  it('seeds from saved vehicle when history empty', () => {
    localStorage.setItem(
      'charge-spot-quest-vehicle',
      JSON.stringify({ plate: '浙ACU6508', color: 'black', type: 'sedan' }),
    )
    const list = loadPlateHistory()
    expect(list).toEqual([{ plate: '浙ACU6508', color: 'black', type: 'sedan' }])
  })

  it('clears history', () => {
    recordPlateHistory({ plate: '浙A1', color: 'blue', type: 'sedan' })
    clearPlateHistory()
    expect(loadPlateHistory()).toEqual([])
  })
})
