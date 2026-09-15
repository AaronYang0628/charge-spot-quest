import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import type { Booking, BookResult, SpotBookingView, SpotStatus, TimePeriod, VehicleInfo } from '../types'
import { BOOKABLE_SPOT, SPOT_LABELS } from '../types'
import { clearAllData, loadState, saveState, saveVehicle } from '../lib/storage'
import { todayISO } from '../lib/time'

export type AnimPhase = 'closing' | 'parking' | 'charging' | null

export function useAppState() {
  const [state, setState] = useState(loadState)
  const [spots, setSpots] = useState<SpotStatus[]>([])
  const [todayBookings, setTodayBookings] = useState<SpotBookingView[]>([])
  const [todayLoading, setTodayLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [animPhase, setAnimPhase] = useState<AnimPhase>(null)
  const [pending, setPending] = useState<Booking | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [result, setResult] = useState<BookResult | null>(null)
  const busy = useRef(false)
  const generation = useRef(0)

  useEffect(() => () => { generation.current++ }, [])
  useEffect(() => { try { saveState(state) } catch { /* Session remains usable in memory. */ } }, [state])

  const refresh = useCallback(async () => {
    const request = generation.current
    const [list, bookings, today] = await Promise.all([
      api.getSpots(),
      api.getMyBookings(state.sessionId),
      api.getTodayBookings(),
    ])
    if (request !== generation.current) return
    setSpots(list)
    setTodayBookings(today)
    setTodayLoading(false)
    setState(s => ({ ...s, bookings }))
  }, [state.sessionId])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- Synchronize asynchronous API state.
    void refresh().catch(() => setResult({ ok: false, reason: '车位信息加载失败，请刷新重试' }))
    const sync = () => { if (!busy.current) void refresh().catch(() => {}) }
    window.addEventListener('storage', sync)
    window.addEventListener('focus', sync)
    return () => { window.removeEventListener('storage', sync); window.removeEventListener('focus', sync) }
  }, [refresh])

  const openDrawer = () => {
    if (busy.current) return
    const c = spots.find(s => s.id === BOOKABLE_SPOT)
    if (!c || c.maintenance) {
      setResult({ ok: false, reason: `${SPOT_LABELS.C} 号位暂不可约` })
      return
    }
    setDrawerOpen(true)
  }

  const confirm = async (period: TimePeriod, vehicle: VehicleInfo, date: string) => {
    if (busy.current) return
    busy.current = true
    setConfirming(true)
    const request = generation.current
    try {
      const res = await api.createBooking({ sessionId: state.sessionId, date, period, vehicle })
      if (request !== generation.current) return
      if (!res.ok || !res.booking) {
        setResult({ ok: false, reason: res.reason || '预约失败，请重试' })
        await refresh()
        busy.current = false
        return
      }
      const booking = res.booking
      try { saveVehicle(vehicle) } catch { /* Booking already succeeded. */ }
      setState(s => ({ ...s, vehicle, bookings: [...s.bookings, booking] }))
      setPending(booking)
      setAnimPhase('closing')
      setDrawerOpen(false)
      void refresh().catch(() => {})
    } catch {
      if (request === generation.current) {
        busy.current = false
        setResult({ ok: false, reason: '提交失败，请检查网络或浏览器存储后重试' })
      }
    } finally { if (request === generation.current) setConfirming(false) }
  }

  const finish = useCallback(() => {
    if (!pending) return
    setResult({ ok: true, booking: pending, reason: '预约成功，请按预约时段到场' })
    setAnimPhase(null)
    setPending(null)
    busy.current = false
  }, [pending])

  const resetAll = async () => {
    if (busy.current) return
    generation.current++
    try {
      await api.resetDemo()
      clearAllData()
      setState(loadState())
      setSpots(await api.getSpots())
      setTodayBookings(await api.getTodayBookings())
      setTodayLoading(false)
      setAnimPhase(null); setPending(null); setResult(null); setDrawerOpen(false)
    } catch { setResult({ ok: false, reason: '无法清除浏览器存储' }) }
  }

  const parked = [...state.bookings].reverse().find(b => !b.cancelled && b.date === todayISO())
  return {
    state, spots, todayBookings, todayLoading, drawerOpen, confirming, result, animPhase,
    animVehicle: pending?.vehicle ?? parked?.vehicle ?? null,
    openDrawer, closeDrawer: () => { if (!busy.current) setDrawerOpen(false) },
    confirm,
    onDrawerExited: () => { if (animPhase === 'closing') setAnimPhase('parking') },
    onParked: () => setAnimPhase(p => p === 'parking' ? 'charging' : p),
    onFinished: finish, dismissResult: () => setResult(null), resetAll,
  }
}
