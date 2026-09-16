import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import type { SpotBookingView, TimePeriod, VehicleColor, VehicleInfo, VehicleType } from '../types'
import {
  DEFAULT_VEHICLE,
  PERIOD_HINTS,
  PERIOD_LABELS,
  SPOT_LABELS,
} from '../types'
import { api } from '../api/client'
import {
  addDaysISO,
  formatHugeDate,
  maxBookingISO,
  todayISO,
} from '../lib/time'
import { loadPlateHistory, type PlateHistoryEntry } from '../lib/plateHistory'
import {
  HOST_CUT_IN_STUB_MESSAGE,
  isHostPlateMasked,
} from '../lib/hostPlates'

const VehicleChooser = lazy(() => import('./VehicleChooser'))

interface Props {
  open: boolean
  initialVehicle: VehicleInfo | null
  onClose: () => void
  onConfirm: (period: TimePeriod, vehicle: VehicleInfo, date: string) => void
  confirming?: boolean
  onExited: () => void
  /** Today's public bookings (masked) — used for host cut-in stub visibility. */
  todayBookings?: SpotBookingView[]
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
  confirming,
  onExited,
  todayBookings = [],
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
  const sheet = useRef<HTMLDivElement>(null)
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

  // Reset form only when the drawer opens — not on every reservedPeriods refresh.
  useEffect(() => {
    if (!open) return
    const v = initialVehicle
    // oxlint-disable-next-line react/set-state-in-effect -- Reset the form for a newly opened reservation.
    setDate(todayISO())
    setPlate(v?.plate ?? '')
    setColor(v?.color ?? DEFAULT_VEHICLE.color)
    setType(v?.type ?? DEFAULT_VEHICLE.type)
    setPeriod(null)
    setCutInOpen(false)
    try {
      setPlateHistory(loadPlateHistory())
    } catch {
      setPlateHistory([])
    }
    openGen.current += 1
  }, [open, initialVehicle])

  // Refresh 早/中/晚 availability when date changes (or on open).
  useEffect(() => {
    if (!open) return
    let cancelled = false
    const gen = openGen.current
    setLoadingSlots(true)
    void api.getReservedPeriods(date, 'C').then((reserved) => {
      if (cancelled || gen !== openGen.current) return
      setReservedPeriods(reserved)
      setPeriod((current) => {
        if (current && !reserved.includes(current)) return current
        return PERIODS.find((p) => !reserved.includes(p)) ?? null
      })
      setLoadingSlots(false)
    }).catch(() => {
      if (cancelled || gen !== openGen.current) return
      setReservedPeriods([])
      setLoadingSlots(false)
    })
    return () => { cancelled = true }
  }, [open, date])

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
          todayBookings.some(
            (b) => b.spotId === 'C' && b.period === p && isHostPlateMasked(b.plateMasked),
          ),
        )
      : []
  const showCutIn = hostTakenPeriods.length > 0

  return (
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
                  return (
                    <button
                      key={`${date}-${p}`}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      aria-label={`${PERIOD_LABELS[p]} ${taken ? (hostTaken ? '车主占用' : '已预约') : PERIOD_HINTS[p]}`}
                      disabled={taken || confirming || loadingSlots}
                      onPointerDown={(e) => {
                        // Prevent parent drag / scroll from swallowing the tap.
                        e.stopPropagation()
                      }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (taken || confirming || loadingSlots) return
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
                            }
                          : {
                              background: 'var(--ui-tile, #f4f4f5)',
                              color: 'var(--ui-text)',
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

              <label className="mb-1 block">
                <span
                  className="mb-1 block text-[11px] font-bold"
                  style={{ color: 'var(--ui-muted)' }}
                >
                  车牌号
                </span>
                <input
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

              {showCutIn && (
                <button
                  type="button"
                  disabled={confirming}
                  onClick={() => setCutInOpen(true)}
                  className="mt-2 w-full rounded-2xl py-3 text-[14px] font-black"
                  style={{
                    background: 'color-mix(in srgb, var(--ui-warn) 14%, transparent)',
                    color: 'var(--ui-warn)',
                    border: '1px solid color-mix(in srgb, var(--ui-warn) 45%, transparent)',
                  }}
                >
                  超级插队5元
                </button>
              )}
            </div>
          </motion.div>

          <AnimatePresence>
            {cutInOpen && (
              <motion.div
                className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 px-3 pb-6 sm:items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={() => setCutInOpen(false)}
              >
                <motion.div
                  role="dialog"
                  aria-label="超级插队"
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
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-black" style={{ color: 'var(--ui-text)' }}>
                    超级插队5元
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--ui-muted)' }}>
                    {HOST_CUT_IN_STUB_MESSAGE}
                  </p>
                  <button
                    type="button"
                    onClick={() => setCutInOpen(false)}
                    className="mt-4 w-full rounded-2xl py-2.5 text-sm font-bold"
                    style={{
                      background: 'var(--ui-tile, #f4f4f5)',
                      color: 'var(--ui-text)',
                      border: '1px solid var(--ui-border)',
                    }}
                  >
                    知道了
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  )
}
