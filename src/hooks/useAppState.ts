import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import type {
  AppState,
  BookResult,
  SpotStatus,
  TimePeriod,
  VehicleInfo,
} from '../types'
import { DEFAULT_VEHICLE } from '../types'
import { clearAllData, loadState, saveState, saveVehicle } from '../lib/storage'
import { todayISO } from '../lib/time'

export type AnimPhase = 'idle' | 'drift' | 'charging' | null

export function useAppState() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [spots, setSpots] = useState<SpotStatus[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [animVehicle, setAnimVehicle] = useState<VehicleInfo | null>(null)
  const [animPhase, setAnimPhase] = useState<AnimPhase>(null)
  const [confirming, setConfirming] = useState(false)
  const [result, setResult] = useState<BookResult | null>(null)

  useEffect(() => {
    saveState(state)
  }, [state])

  const refreshSpots = useCallback(async () => {
    const list = await api.getSpots()
    setSpots(list)
  }, [])

  useEffect(() => {
    void refreshSpots()
  }, [refreshSpots])

  const openDrawer = useCallback(() => {
    const c = spots.find((s) => s.id === 'C')
    if (!c?.bookable || c.occupied) {
      setResult({ ok: false, reason: c?.occupied ? '车位 C 当前被占用' : '车位暂不可约' })
      return
    }
    // drift-in with saved vehicle or default
    const v = state.vehicle ?? DEFAULT_VEHICLE
    setAnimVehicle(v)
    setAnimPhase('drift')
    setDrawerOpen(true)
  }, [spots, state.vehicle])

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
    // if not confirming success, clear drift unless charging
    setAnimPhase((p) => (p === 'charging' ? p : null))
  }, [])

  const confirm = useCallback(
    async (period: TimePeriod, vehicle: VehicleInfo) => {
      setConfirming(true)
      setAnimVehicle(vehicle)
      saveVehicle(vehicle)
      setState((s) => ({ ...s, vehicle }))

      const res = await api.createBooking({
        sessionId: state.sessionId,
        date: todayISO(),
        period,
        vehicle,
      })

      setConfirming(false)
      setDrawerOpen(false)

      if (res.ok && res.booking) {
        setState((s) => ({
          ...s,
          bookings: [...s.bookings, res.booking!],
          vehicle,
        }))
        setAnimPhase('charging')
        setResult({ ok: true, reason: '预约成功，车位开始充电', booking: res.booking })
        await refreshSpots()
      } else {
        setAnimPhase(null)
        setAnimVehicle(null)
        setResult({ ok: false, reason: res.reason || '预约失败' })
      }
    },
    [refreshSpots, state.sessionId],
  )

  const dismissResult = useCallback(() => {
    setResult(null)
  }, [])

  const resetAll = useCallback(async () => {
    clearAllData()
    await api.resetDemo()
    setState(loadState())
    setAnimPhase(null)
    setAnimVehicle(null)
    setResult(null)
    await refreshSpots()
  }, [refreshSpots])

  return {
    state,
    spots,
    drawerOpen,
    animVehicle,
    animPhase,
    confirming,
    result,
    openDrawer,
    closeDrawer,
    confirm,
    dismissResult,
    resetAll,
  }
}
