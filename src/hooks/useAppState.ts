import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import type {
  AppState,
  BookResult,
  SpotStatus,
  TimePeriod,
  VehicleInfo,
} from '../types'
import { clearAllData, loadState, saveState, saveVehicle } from '../lib/storage'
import { todayISO } from '../lib/time'

/** STYLE-GUIDE §6 motion phases */
export type AnimPhase = 'drift' | 'charging' | null

const DRAWER_EXIT_MS = 250
const DRIFT_MS = 600
const RESULT_AFTER_CHARGE_MS = 180

export function useAppState() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [spots, setSpots] = useState<SpotStatus[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [animVehicle, setAnimVehicle] = useState<VehicleInfo | null>(null)
  const [animPhase, setAnimPhase] = useState<AnimPhase>(null)
  const [confirming, setConfirming] = useState(false)
  const [result, setResult] = useState<BookResult | null>(null)
  const timers = useRef<number[]>([])

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }

  useEffect(() => () => clearTimers(), [])

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
      setResult({
        ok: false,
        reason: c?.occupied ? '车位 C 当前被占用' : '车位暂不可约',
      })
      return
    }
    setDrawerOpen(true)
  }, [spots])

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
  }, [])

  const confirm = useCallback(
    async (period: TimePeriod, vehicle: VehicleInfo) => {
      setConfirming(true)
      saveVehicle(vehicle)
      setState((s) => ({ ...s, vehicle }))

      const res = await api.createBooking({
        sessionId: state.sessionId,
        date: todayISO(),
        period,
        vehicle,
      })

      setConfirming(false)
      clearTimers()

      if (!res.ok || !res.booking) {
        setDrawerOpen(false)
        setAnimPhase(null)
        setAnimVehicle(null)
        setResult({ ok: false, reason: res.reason || '预约失败' })
        return
      }

      setState((s) => ({
        ...s,
        bookings: [...s.bookings, res.booking!],
        vehicle,
      }))

      // 1) drawer slides down (250ms ease-out)
      setDrawerOpen(false)
      setAnimVehicle(vehicle)

      // 2) after drawer exit → rigid drift into bay C (600ms)
      timers.current.push(
        window.setTimeout(() => {
          setAnimPhase('drift')
        }, DRAWER_EXIT_MS),
      )

      // 3) after drift → charge pulse
      timers.current.push(
        window.setTimeout(() => {
          setAnimPhase('charging')
          void refreshSpots()
        }, DRAWER_EXIT_MS + DRIFT_MS),
      )

      // 4) result modal ~180ms after charge starts
      timers.current.push(
        window.setTimeout(() => {
          setResult({
            ok: true,
            reason: '预约成功，车位开始充电',
            booking: res.booking,
          })
        }, DRAWER_EXIT_MS + DRIFT_MS + RESULT_AFTER_CHARGE_MS),
      )
    },
    [refreshSpots, state.sessionId],
  )

  const dismissResult = useCallback(() => {
    setResult(null)
  }, [])

  const resetAll = useCallback(async () => {
    clearTimers()
    clearAllData()
    await api.resetDemo()
    setState(loadState())
    setAnimPhase(null)
    setAnimVehicle(null)
    setResult(null)
    setDrawerOpen(false)
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
