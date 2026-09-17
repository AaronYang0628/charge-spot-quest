import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import type { BookResult, SpotBookingView, TimePeriod, VehicleColor, VehicleInfo, VehicleType } from '../types'
import {
  DEFAULT_VEHICLE,
  PERIOD_HINTS,
  PERIOD_LABELS,
  SPOT_LABELS,
} from '../types'
import { api } from '../api/client'
import { asset } from '../lib/asset'
import {
  addDaysISO,
  formatHugeDate,
  maxBookingISO,
  todayISO,
  currentIdlePeriod
} from '../lib/time'
import { loadPlateHistory, type PlateHistoryEntry } from '../lib/plateHistory'
import {
  CUT_IN_NEED_HOST_PERIOD,
  CUT_IN_NEED_PLATE,
  CUT_IN_QR_CAPTION,
  isHostCutInAvailable,
} from '../lib/hostPlates'

const VehicleChooser = lazy(() => import('./VehicleChooser'))

interface Props {
  open: boolean
  initialVehicle: VehicleInfo | null
  onClose: () => void
  onConfirm: (period: TimePeriod, vehicle: VehicleInfo, date: string) => void
  /** Optimistic cut-in for a host-held period (defaults server-side to current idle). */
  onCutIn: (vehicle: VehicleInfo, period: TimePeriod) => Promise<BookResult>
  /** Cancel this user's cut-in booking and restore host occupancy. */
  onCancelCutIn: (bookingId: string) => Promise<BookResult>
  confirming?: boolean
  onExited: () => void
  /** Today's public bookings (masked) — used for host cut-in visibility. */
  todayBookings?: SpotBookingView[]
  onToast?: (message: string, ok?: boolean) => void
}

const PERIODS: TimePeriod[] = ['morning', 'noon', 'evening']

/** STYLE-GUIDE §6: drawer down 220–280ms ease-out */
const DRAWER_MS = 0.25
const CLOSE_OFFSET = 120
const CLOSE_VELOCITY = 700

export function BookingDrawer({
  open,
  initialVehicle,
  onClose,
  onConfirm,
  onCutIn,
  onCancelCutIn,
  confirming,
  onExited,
  todayBookings = [],
  onToast,
}: Props) {
  const today = todayISO()
  const maxDate = maxBookingISO(today)
  const [date, setDate] = useState(today)
  const [period, setPeriod] = useState<TimePeriod | null>(null)
  const [reservedPeriods, setReservedPeriods] = useState<TimePeriod[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [plate, setPlate] = useState('')
  const [color, setColor] = useState<VehicleColor>(DEFAULT_VEHICLE.color)
  const [type, setType] = useState<VehicleType>(DEFAULT_VEHICLE.type)
  const [plateHistory, setPlateHistory] = useState<PlateHistoryEntry[]>([])
  const [cutInOpen, setCutInOpen] = useState(false)
  const [cutInTargetPeriod, setCutInTargetPeriod] = useState<TimePeriod | null>(null)
  const [cutInError, setCutInError] = useState<string | null>(null)
  const [cutInBusy, setCutInBusy] = useState(false)
  const [cutInSucceeded, setCutInSucceeded] = useState(false)
  const [cutInBookingId, setCutInBookingId] = useState<string | null>(null)
  const [cancelBusy, setCancelBusy] = useState(false)
  const sheet = useRef<HTMLDivElement>(null)
  const prevOpen = useRef(false)
  const plateInputRef = useRef<HTMLInputElement>(null)
  const dragControls = useDragControls()
  const openGen = useRef(0)
  const huge = formatHugeDate(date)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const timer = window.setTimeout(
      () => sheet.current?.querySelector<HTMLElement>('button:not(:disabled), input')?.focus(),
      100,
    )
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !confirming) {
        if (cutInOpen) {
          setCutInOpen(false)
          setCutInTargetPeriod(null)
          setCutInError(null)
          setCutInSucceeded(false)
          setCutInBookingId(null)
          setCancelBusy(false)
          return
        }
        onClose()
      }
      if (e.key !== 'Tab') return
      const items = [...(sheet.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input') ?? [])]
      const first = items[0], last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', key)
    return () => {
      clearTimeout(timer)
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', key)
      previous?.focus()
    }
  }, [open, confirming, onClose, cutInOpen])

  // Reset form only on drawer open rising edge (false→true).
  // Do NOT depend on initialVehicle mid-session — cut-in success updates
  // state.vehicle → would re-run and setCutInOpen(false), killing the QR.
  useEffect(() => {
    const rising = open && !prevOpen.current
    prevOpen.current = open
    if (!rising) return
    const v = initialVehicle
    // oxlint-disable-next-line react/set-state-in-effect -- Reset the form for a newly opened reservation.
    setDate(todayISO())
    setPlate(v?.plate ?? '')
    setColor(v?.color ?? DEFAULT_VEHICLE.color)
    setType(v?.type ?? DEFAULT_VEHICLE.type)
    setPeriod(null)
    setCutInOpen(false)
    setCutInTargetPeriod(null)
    setCutInError(null)
    setCutInBusy(false)
    setCutInSucceeded(false)
    setCutInBookingId(null)
    setCancelBusy(false)
    try {
      setPlateHistory(loadPlateHistory())
    } catch {
      setPlateHistory([])
    }
    openGen.current += 1
    // initialVehicle intentionally read only on rising edge (omit from deps).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rising-edge only
  }, [open])

  // Escape closes QR even if drawer already closed (QR is portaled to body).
  useEffect(() => {
    if (!cutInOpen) return
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setCutInOpen(false)
      setCutInTargetPeriod(null)
      setCutInError(null)
      setCutInSucceeded(false)
      setCutInBookingId(null)
      setCancelBusy(false)
    }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [cutInOpen])

  // Refresh 早/中/晚 availability when date changes (or on open).
  useEffect(() => {
    if (!open) return
    let cancelled = false
    const gen = openGen.current
    const day = date
    const bookings = todayBookings
    setLoadingSlots(true)
    void api.getReservedPeriods(date, 'C').then((reserved) => {
      if (cancelled || gen !== openGen.current) return
      setReservedPeriods(reserved)
      const todayStr = todayISO()
      const selectable = (p: TimePeriod) => {
        if (!reserved.includes(p)) return true
        return (
          day === todayStr &&
          isHostCutInAvailable({ period: p, todayBookings: bookings })
        )
      }
      setPeriod((current) => {
        if (current && selectable(current)) return current
        return PERIODS.find((p) => !reserved.includes(p)) ?? null
      })
      setLoadingSlots(false)
    }).catch(() => {
      if (cancelled || gen !== openGen.current) return
      setReservedPeriods([])
      setLoadingSlots(false)
    })
    return () => { cancelled = true }
  }, [open, date, todayBookings])

  const vehicle: VehicleInfo = {
    plate: plate.trim(),
    color,
    type,
  }

  const canPrev = date > today
  const canNext = date < maxDate
  const periodReady = period !== null && !reservedPeriods.includes(period)

  const applyHistory = (entry: PlateHistoryEntry) => {
    setPlate(entry.plate)
    setColor(entry.color)
    setType(entry.type)
  }

  const hostTakenPeriods =
    date === today
      ? reservedPeriods.filter((p) =>
          isHostCutInAvailable({ period: p, todayBookings }),
        )
      : []
  const clockPeriod = currentIdlePeriod()
  // Only show cut-in when the selected period is host-held, or (nothing selected)
  // the *current* Shanghai period is host-held. A free noon must not show the
  // button just because evening is host-seeded.
  const resolveCutInPeriod = (): TimePeriod | null => {
    if (period && hostTakenPeriods.includes(period)) return period
    if (!period && hostTakenPeriods.includes(clockPeriod)) return clockPeriod
    return null
  }
  const showCutIn = date === today && resolveCutInPeriod() !== null

  const closeCutInQr = () => {
    setCutInOpen(false)
    setCutInTargetPeriod(null)
    setCutInError(null)
    setCutInSucceeded(false)
    setCutInBookingId(null)
    setCancelBusy(false)
  }

  const onPaidSuccess = () => {
    // Close pay sheet + booking drawer so no overlay remains.
    closeCutInQr()
    onClose()
  }

  const onCancelCutInClick = () => {
    if (!cutInBookingId || cancelBusy || cutInBusy) return
    setCancelBusy(true)
    void onCancelCutIn(cutInBookingId)
      .then((res) => {
        if (!res.ok) {
          setCutInError(res.reason || '取消插队失败，请稍后重试')
          return
        }
        closeCutInQr()
        onClose()
        onToast?.('已取消插队，车主占用已恢复', true)
      })
      .finally(() => setCancelBusy(false))
  }

  const cutInQrOverlay = (
    <AnimatePresence>
      {cutInOpen && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 px-3 pb-6 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            role="dialog"
            aria-label="超级插队支付"
            aria-modal
            className="w-full max-w-sm rounded-3xl p-5 shadow-2xl"
            style={{
              background: 'var(--ui-shell-top, #ffffff)',
              border: '1px solid var(--ui-border)',
            }}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <h3 className="text-lg font-black" style={{ color: 'var(--ui-text)' }}>
              超级插队5元
            </h3>
            <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--ui-accent)' }}>
              {cutInSucceeded
                ? '已抢占时段，请扫码支付 ¥5'
                : CUT_IN_QR_CAPTION}
            </p>
            <p className="mt-1 text-[11px]" style={{ color: 'var(--ui-muted)' }}>
              车牌 {vehicle.plate} ·{' '}
              {cutInSucceeded ? '已抢占' : '正在抢占'}
              {cutInTargetPeriod ? PERIOD_LABELS[cutInTargetPeriod] : '当前'}
              时段 · 请用支付宝扫码支付
            </p>
            <div
              className="mt-4 overflow-hidden rounded-2xl"
              style={{ border: '1px solid var(--ui-border)', background: '#fff' }}
            >
              <img
                src={asset('/pay/alipay-cut-in-5.png')}
                alt="支付宝收款码 · 超级插队5元"
                className="mx-auto block w-full max-w-[260px]"
                draggable={false}
              />
            </div>
            {cutInError && (
              <div
                className="mt-3 rounded-2xl px-3 py-2.5"
                style={{
                  background: 'color-mix(in srgb, #ef4444 10%, transparent)',
                  border: '1px solid color-mix(in srgb, #ef4444 35%, transparent)',
                }}
              >
                <p className="text-[12px] font-bold leading-snug" style={{ color: '#b91c1c' }}>
                  {cutInError}
                </p>
                <button
                  type="button"
                  disabled={cutInBusy || confirming || !cutInTargetPeriod}
                  onClick={() => {
                    if (!cutInTargetPeriod) return
                    setCutInError(null)
                    setCutInSucceeded(false)
                    setCutInBusy(true)
                    void onCutIn(vehicle, cutInTargetPeriod)
                      .then((res) => {
                        if (!res.ok) {
                          setCutInSucceeded(false)
                          setCutInBookingId(null)
                          setCutInError(res.reason || '插队失败，请稍后重试')
                        } else {
                          setCutInError(null)
                          setCutInSucceeded(true)
                          setCutInBookingId(res.booking?.id ?? null)
                        }
                      })
                      .finally(() => setCutInBusy(false))
                  }}
                  className="mt-2 w-full rounded-xl py-2 text-[13px] font-black disabled:opacity-60"
                  style={{
                    background: 'color-mix(in srgb, #ef4444 18%, #fff)',
                    color: '#b91c1c',
                    border: '1px solid color-mix(in srgb, #ef4444 40%, transparent)',
                  }}
                >
                  {cutInBusy ? '重试中…' : '重新登记插队'}
                </button>
              </div>
            )}
            {!cutInError && cutInBusy && (
              <p className="mt-3 text-center text-[11px] font-semibold" style={{ color: 'var(--ui-muted)' }}>
                正在为你抢占时段…
              </p>
            )}
            {!cutInError && cutInSucceeded && !cutInBusy && (
              <p className="mt-3 text-center text-[12px] font-bold" style={{ color: 'var(--ui-accent)' }}>
                已抢占时段，请扫码支付 ¥5
              </p>
            )}
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                disabled={cancelBusy || cutInBusy || !!cutInError}
                onClick={onPaidSuccess}
                className="w-full rounded-2xl py-2.5 text-sm font-black disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  color: '#fff',
                  border: '1px solid color-mix(in srgb, #15803d 40%, transparent)',
                }}
              >
                已支付成功
              </button>
              <button
                type="button"
                disabled={cancelBusy || cutInBusy || !cutInBookingId}
                onClick={onCancelCutInClick}
                className="w-full rounded-2xl py-2.5 text-sm font-bold disabled:opacity-60"
                style={{
                  background: 'var(--ui-tile, #f4f4f5)',
                  color: 'var(--ui-text)',
                  border: '1px solid var(--ui-border)',
                }}
              >
                {cancelBusy ? '取消中…' : '取消插队'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      <AnimatePresence onExitComplete={onExited}>
        {open && (
          <>

          <motion.button
            type="button"
            aria-label="关闭遮罩"
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DRAWER_MS, ease: 'easeOut' }}
            onClick={() => { if (!confirming) onClose() }}
          />
          <motion.div
            ref={sheet}
            className="booking-sheet fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[460px] rounded-t-3xl shadow-2xl"
            style={{
              background: 'var(--ui-shell-top, #ffffff)',
              borderTop: '1px solid var(--ui-border)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: DRAWER_MS, ease: 'easeOut' }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.55 }}
            onDragEnd={(_, info) => {
              if (confirming) return
              if (info.offset.y > CLOSE_OFFSET || info.velocity.y > CLOSE_VELOCITY) onClose()
            }}
            role="dialog"
            aria-label={`预约车位 ${SPOT_LABELS.C}`}
            aria-modal
          >
            <div
              className="booking-handle touch-none flex cursor-grab flex-col items-center pt-2 active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div
                className="h-1 w-10 rounded-full"
                style={{ background: 'var(--ui-handle, #d4d4d8)' }}
              />
              <p className="mt-1 text-[10px]" style={{ color: 'var(--ui-muted)' }}>
                下滑关闭
              </p>
            </div>

            <div className="relative px-5 pb-6 pt-2">
              <button
                type="button"
                aria-label="关闭"
                disabled={confirming}
                onClick={onClose}
                className="absolute right-4 top-1 flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold"
                style={{
                  background: 'var(--ui-tile, #f4f4f5)',
                  color: 'var(--ui-muted)',
                  border: '1px solid var(--ui-border)',
                }}
              >
                ×
              </button>

              <div className="mb-4 flex items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  aria-label="前一天"
                  disabled={!canPrev || confirming}
                  onClick={() => setDate((d) => addDaysISO(d, -1))}
                  className="flex h-11 w-11 items-center justify-center p-2 disabled:opacity-35"
                  style={{ color: 'var(--ui-text)', background: 'transparent' }}
                >
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                    stroke="currentColor"
                    strokeWidth="2.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="15 6 9 12 15 18" />
                  </svg>
                </button>
                <div className="min-w-[9.5rem] text-center">
                  <p
                    className="text-[11px] font-semibold tracking-widest"
                    style={{ color: 'var(--ui-muted)' }}
                  >
                    {huge.year} · {huge.weekday}
                  </p>
                  <h2
                    className="text-4xl font-black leading-none tracking-tight"
                    style={{ color: 'var(--ui-text)' }}
                  >
                    {huge.dateLine}
                  </h2>
                  <p className="mt-1 text-[11px]" style={{ color: 'var(--ui-muted)' }}>
                    {SPOT_LABELS.C} · {date === today ? '今天' : date}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="后一天"
                  disabled={!canNext || confirming}
                  onClick={() => setDate((d) => addDaysISO(d, 1))}
                  className="flex h-11 w-11 items-center justify-center p-2 disabled:opacity-35"
                  style={{ color: 'var(--ui-text)', background: 'transparent' }}
                >
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                    stroke="currentColor"
                    strokeWidth="2.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 6 15 12 9 18" />
                  </svg>
                </button>
              </div>

              <Suspense fallback={<div className="vehicle-preview">正在加载车库…</div>}>
                <VehicleChooser vehicle={vehicle} onChange={v => { setType(v.type); setColor(v.color) }} />
              </Suspense>

              <p
                className="mb-2 text-[11px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--ui-muted)' }}
              >
                时段 {loadingSlots ? '· 刷新中' : ''}
              </p>
              <div className="mb-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label="选择时段">
                {PERIODS.map((p) => {
                  const taken = reservedPeriods.includes(p)
                  const on = period === p
                  const hostTaken = hostTakenPeriods.includes(p)
                  const blocked = taken && !hostTaken
                  return (
                    <button
                      key={`${date}-${p}`}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      aria-label={`${PERIOD_LABELS[p]} ${taken ? (hostTaken ? '车主占用' : '已预约') : PERIOD_HINTS[p]}`}
                      disabled={blocked || confirming || loadingSlots}
                      onPointerDown={(e) => {
                        // Prevent parent drag / scroll from swallowing the tap.
                        e.stopPropagation()
                      }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (blocked || confirming || loadingSlots) return
                        setPeriod(p)
                      }}
                      className="rounded-2xl py-3 text-center transition select-none"
                      style={
                        on
                          ? {
                              background: 'var(--ui-accent)',
                              color: '#ffffff',
                              boxShadow:
                                '0 8px 24px color-mix(in srgb, var(--ui-accent) 35%, transparent)',
                              ...(hostTaken
                                ? {
                                    outline: '2px solid #e8b84a',
                                    outlineOffset: '1px',
                                  }
                                : {}),
                            }
                          : {
                              background: hostTaken
                                ? 'color-mix(in srgb, #e8b84a 12%, var(--ui-tile, #f4f4f5))'
                                : 'var(--ui-tile, #f4f4f5)',
                              color: 'var(--ui-text)',
                              ...(hostTaken
                                ? {
                                    boxShadow:
                                      'inset 0 0 0 1.5px color-mix(in srgb, #e8b84a 75%, transparent), 0 0 0 1px color-mix(in srgb, #e8b84a 35%, transparent)',
                                  }
                                : {}),
                            }
                      }
                    >
                      <div className="text-2xl font-black">{PERIOD_LABELS[p]}</div>
                      <div className="text-[10px] font-medium opacity-80">
                        {taken ? (hostTaken ? '车主占用' : '已预约') : PERIOD_HINTS[p]}
                      </div>
                    </button>
                  )
                })}
              </div>

              {showCutIn && (
                <div
                  className="cutin-hero mb-4 rounded-2xl p-3.5"
                  style={{
                    background:
                      'linear-gradient(135deg, color-mix(in srgb, #e8b84a 16%, #fff8e8) 0%, color-mix(in srgb, var(--ui-warn) 10%, #fff) 100%)',
                    border: '1px solid color-mix(in srgb, #e8b84a 55%, transparent)',
                    boxShadow: '0 10px 28px -16px color-mix(in srgb, #c9892a 45%, transparent)',
                  }}
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h3
                      className="text-[17px] font-black leading-tight tracking-tight"
                      style={{ color: '#8a5a12' }}
                    >
                      ⚡ 超级插队 · ¥5
                    </h3>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black"
                      style={{
                        background: 'color-mix(in srgb, #e8b84a 28%, #fff)',
                        color: '#9a6410',
                        border: '1px solid color-mix(in srgb, #e8b84a 55%, transparent)',
                      }}
                    >
                      限时通道
                    </span>
                  </div>
                  <p className="text-[12px] font-bold leading-snug" style={{ color: '#a66b18' }}>
                    让车主改日再充，这个时段你先充电
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug" style={{ color: '#b07a2e' }}>
                    插队成功立即登记，扫码即付
                  </p>
                  <button
                    type="button"
                    disabled={confirming}
                    onClick={() => {
                      if (!vehicle.plate.trim()) {
                        onToast?.(CUT_IN_NEED_PLATE)
                        plateInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        plateInputRef.current?.focus()
                        return
                      }
                      const target = resolveCutInPeriod()
                      if (!target) {
                        onToast?.(CUT_IN_NEED_HOST_PERIOD)
                        return
                      }
                      setCutInTargetPeriod(target)
                      setCutInError(null)
                      setCutInSucceeded(false)
                      setCutInBookingId(null)
                      setCutInOpen(true) // show QR immediately; API runs in background
                      setCutInBusy(true)
                      void onCutIn(vehicle, target)
                        .then((res) => {
                          if (!res.ok) {
                            // Keep QR open; soft inline error + retry on sheet (no toast).
                            setCutInSucceeded(false)
                            setCutInBookingId(null)
                            setCutInError(res.reason || '插队失败，请稍后重试')
                          } else {
                            setCutInError(null)
                            setCutInSucceeded(true)
                            setCutInBookingId(res.booking?.id ?? null)
                          }
                        })
                        .finally(() => setCutInBusy(false))
                    }}
                    className="cutin-cta relative mt-3 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl py-3.5 text-[15px] font-black text-white"
                  >
                    <span className="relative z-[1]">⚡ 立即插队 · ¥5</span>
                    <span
                      className="relative z-[1] rounded-full px-1.5 py-0.5 text-[9px] font-black tracking-wide"
                      style={{
                        background: 'rgba(255,255,255,0.22)',
                        border: '1px solid rgba(255,255,255,0.35)',
                      }}
                    >
                      限时通道
                    </span>
                  </button>
                </div>
              )}

              <label className="mb-1 block">
                <span
                  className="mb-1 block text-[11px] font-bold"
                  style={{ color: 'var(--ui-muted)' }}
                >
                  车牌号
                </span>
                <input
                  ref={plateInputRef}
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  placeholder="例如 沪A12345"
                  maxLength={10}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm font-semibold outline-none"
                  style={{
                    borderColor: 'var(--ui-border)',
                    background: 'var(--ui-shell-top, #ffffff)',
                    color: 'var(--ui-text)',
                  }}
                />
              </label>

              <div className="mb-4 mt-2" aria-label="历史车牌">
                {plateHistory.length === 0 ? (
                  <p className="text-[11px]" style={{ color: 'var(--ui-muted)' }}>
                    暂无历史车牌
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {plateHistory.map((entry) => {
                      const active = plate.trim().toUpperCase() === entry.plate
                      return (
                        <button
                          key={entry.plate}
                          type="button"
                          disabled={confirming}
                          onClick={() => applyHistory(entry)}
                          className="rounded-full px-2.5 py-1 font-mono text-[11px] font-bold transition"
                          style={
                            active
                              ? {
                                  background: 'color-mix(in srgb, var(--ui-accent) 18%, transparent)',
                                  color: 'var(--ui-accent)',
                                  border: '1px solid color-mix(in srgb, var(--ui-accent) 45%, transparent)',
                                }
                              : {
                                  background: 'var(--ui-tile, #f4f4f5)',
                                  color: 'var(--ui-text)',
                                  border: '1px solid var(--ui-border)',
                                }
                          }
                        >
                          {entry.plate}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={confirming || !periodReady}
                onClick={() => {
                  if (!period || !periodReady) return
                  onConfirm(period, vehicle, date)
                }}
                className="w-full rounded-2xl py-3.5 text-[15px] font-black disabled:opacity-60"
                style={{
                  background: 'var(--ui-accent)',
                  color: '#ffffff',
                  boxShadow:
                    '0 10px 28px color-mix(in srgb, var(--ui-accent) 40%, transparent)',
                }}
              >
                {confirming ? '提交中…' : periodReady ? '确认预约' : '请选择可用时段'}
              </button>

            </div>
          </motion.div>

          </>
        )}
      </AnimatePresence>
      {typeof document !== 'undefined' ? createPortal(cutInQrOverlay, document.body) : null}
    </>
  )
}
