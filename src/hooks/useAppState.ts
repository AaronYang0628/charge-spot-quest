import { useCallback, useEffect, useState } from 'react'
import type { AppState } from '../types'
import { NO_SHOW_LIMIT } from '../types'
import {
  clearAllData,
  loadState,
  saveState,
  withBlacklistCheck,
} from '../lib/storage'
import { createBooking, hasConflict } from '../lib/booking'
import { evaluateNoShows } from '../lib/noshow'
import { isBookingWindowActive } from '../lib/time'

export function useAppState() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [toast, setToast] = useState<string | null>(null)
  const [sparkle, setSparkle] = useState(false)
  const [confetti, setConfetti] = useState(false)

  useEffect(() => {
    saveState(state)
  }, [state])

  // Periodic no-show check (every 30s)
  useEffect(() => {
    const tick = () => {
      setState((s) => withBlacklistCheck(evaluateNoShows(s)))
    }
    const id = window.setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2800)
  }, [])

  const book = useCallback(
    (date: string, startMin: number, endMin: number): boolean => {
      if (state.blacklisted) {
        showToast('你已被拉入「爽约黑名单」啦…')
        return false
      }
      if (endMin <= startMin) {
        showToast('结束时间要晚于开始时间哦')
        return false
      }
      const conflict = hasConflict(state.bookings, 'C', date, startMin, endMin)
      if (conflict) {
        showToast(`冲突啦！该时段已被「${conflict.nickname}」占用 🚗`)
        return false
      }
      const booking = createBooking({
        sessionId: state.sessionId,
        nickname: state.nickname,
        date,
        startMin,
        endMin,
      })
      setState((s) => ({ ...s, bookings: [...s.bookings, booking] }))
      setSparkle(true)
      window.setTimeout(() => setSparkle(false), 1600)
      showToast('预约成功！能量充满预备中 ⚡')
      return true
    },
    [state.blacklisted, state.bookings, state.nickname, state.sessionId, showToast],
  )

  const cancel = useCallback(
    (id: string) => {
      setState((s) => ({
        ...s,
        bookings: s.bookings.map((b) =>
          b.id === id && b.sessionId === s.sessionId && !b.checkedIn
            ? { ...b, cancelled: true }
            : b,
        ),
      }))
      showToast('已取消预约，下次见～')
    },
    [showToast],
  )

  const checkIn = useCallback(
    (id: string) => {
      const current = state.bookings.find((x) => x.id === id)
      if (
        !current ||
        current.sessionId !== state.sessionId ||
        current.cancelled ||
        current.checkedIn
      ) {
        return
      }
      if (!isBookingWindowActive(current.date, current.startMin, current.endMin)) {
        showToast('请在预约时段内签到哦')
        return
      }
      setState((s) => ({
        ...s,
        bookings: s.bookings.map((x) =>
          x.id === id ? { ...x, checkedIn: true } : x,
        ),
      }))
      setConfetti(true)
      window.setTimeout(() => setConfetti(false), 2000)
      showToast('签到成功！开始充电咯 ⚡🔋')
    },
    [showToast, state.bookings, state.sessionId],
  )

  const resetAll = useCallback(() => {
    clearAllData()
    setState(loadState())
    showToast('数据已清空，欢迎重新开始冒险！')
  }, [showToast])

  const setNickname = useCallback((nickname: string) => {
    const trimmed = nickname.trim().slice(0, 12)
    if (!trimmed) return
    setState((s) => ({ ...s, nickname: trimmed }))
  }, [])

  return {
    state,
    toast,
    sparkle,
    confetti,
    book,
    cancel,
    checkIn,
    resetAll,
    setNickname,
    showToast,
    noShowLimit: NO_SHOW_LIMIT,
  }
}
