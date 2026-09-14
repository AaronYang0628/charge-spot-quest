import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import type { Booking, DurationHours } from '../types'
import { DEFAULT_DURATION_HOURS, DURATION_OPTIONS } from '../types'
import { validStartsForDuration } from '../lib/booking'
import { dayLabel, formatDateCN, horizonDates, minToTime, todayISO } from '../lib/time'

interface Props {
  open: boolean
  onClose: () => void
  bookings: Booking[]
  sessionId: string
  initialDate?: string
  initialStartMin?: number
  onConfirm: (date: string, startMin: number, endMin: number) => boolean
}

function bestDuration(
  bookings: Booking[],
  date: string,
  prefer: DurationHours = DEFAULT_DURATION_HOURS,
): DurationHours {
  if (validStartsForDuration(bookings, date, prefer).length > 0) return prefer
  // Prefer largest that still fits
  for (const h of [...DURATION_OPTIONS].reverse()) {
    if (validStartsForDuration(bookings, date, h).length > 0) return h
  }
  return prefer
}

export function BookingModal({
  open,
  onClose,
  bookings,
  initialDate,
  initialStartMin,
  onConfirm,
}: Props) {
  const dates = horizonDates()
  const [date, setDate] = useState(initialDate ?? todayISO())
  const [duration, setDuration] = useState<DurationHours>(DEFAULT_DURATION_HOURS)
  const [startMin, setStartMin] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    const d = initialDate && dates.includes(initialDate) ? initialDate : todayISO()
    setDate(d)
    setDuration(bestDuration(bookings, d, DEFAULT_DURATION_HOURS))
  }, [open, initialDate, bookings])

  const starts = useMemo(
    () => validStartsForDuration(bookings, date, duration),
    [bookings, date, duration],
  )

  useEffect(() => {
    if (!open) return
    if (initialStartMin != null && starts.includes(initialStartMin)) {
      setStartMin(initialStartMin)
      return
    }
    // Snap toward preferred gap start if nearby
    if (initialStartMin != null) {
      const near = starts.find((s) => s >= initialStartMin) ?? starts[0]
      setStartMin(near ?? null)
      return
    }
    setStartMin(starts[0] ?? null)
  }, [open, date, duration, starts, initialStartMin])

  // When user switches date, re-pick a fitting duration if current has no starts
  useEffect(() => {
    if (!open) return
    if (starts.length === 0) {
      const next = bestDuration(bookings, date, duration)
      if (next !== duration) setDuration(next)
    }
  }, [open, date, starts.length, bookings, duration])

  const endMin = startMin != null ? startMin + duration * 60 : null
  const canConfirm = startMin != null && endMin != null

  const handleConfirm = () => {
    if (!canConfirm || startMin == null || endMin == null) return
    const ok = onConfirm(date, startMin, endMin)
    if (ok) onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/40 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="flex max-h-[92dvh] w-full max-w-[420px] flex-col rounded-t-3xl bg-white shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="h-1 w-10 rounded-full bg-slate-200" />
            </div>

            <div className="flex items-start justify-between gap-3 px-5 pb-3">
              <div>
                <h3 className="text-lg font-black text-ink">预约慢充</h3>
                <p className="text-xs text-muted">C号位 · 选时长与开始时间</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-fog px-3 py-1.5 text-xs font-bold text-muted"
              >
                关闭
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 pb-4">
              <div>
                <div className="mb-2 text-xs font-bold text-muted">日期</div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {dates.map((d, i) => {
                    const lab = dayLabel(d, i)
                    const active = d === date
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setDate(d)
                          setDuration(bestDuration(bookings, d, duration))
                        }}
                        className={`shrink-0 rounded-2xl px-3 py-2 text-left transition ${
                          active
                            ? 'bg-mint-deep text-white shadow-md'
                            : 'bg-fog text-ink'
                        }`}
                      >
                        <div className="text-xs font-black">{lab.title}</div>
                        <div className={`text-[10px] ${active ? 'text-white/80' : 'text-muted'}`}>
                          {lab.sub}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-bold text-muted">充电时长</div>
                <div className="grid grid-cols-3 gap-2">
                  {DURATION_OPTIONS.map((h) => {
                    const active = duration === h
                    const available = validStartsForDuration(bookings, date, h).length > 0
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setDuration(h)}
                        className={`rounded-2xl py-3.5 text-center transition ${
                          active
                            ? 'bg-gradient-to-br from-mint-deep to-teal-500 text-white shadow-lg'
                            : available
                              ? 'bg-fog text-ink'
                              : 'bg-fog/60 text-slate-400'
                        }`}
                      >
                        <div className="text-xl font-black">{h}</div>
                        <div className={`text-[10px] font-bold ${active ? 'text-white/85' : 'text-muted'}`}>
                          小时{h === 8 ? ' · 推荐' : ''}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-bold text-muted">开始时间（整点）</div>
                {starts.length === 0 ? (
                  <div className="rounded-2xl bg-rose-50 px-4 py-6 text-center text-sm text-coral">
                    这天没有足够的连续空闲（需 {duration} 小时）
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {starts.map((s) => {
                      const active = startMin === s
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStartMin(s)}
                          className={`rounded-xl py-3 text-sm font-black transition ${
                            active
                              ? 'bg-ink text-white shadow'
                              : 'bg-fog text-ink hover:bg-teal-50'
                          }`}
                        >
                          {minToTime(s)}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {canConfirm && (
                <div className="rounded-2xl bg-teal-50 px-4 py-3 text-sm font-bold text-teal-800">
                  {formatDateCN(date)}
                  <br />
                  <span className="text-base">
                    {minToTime(startMin!)} – {minToTime(endMin!)}
                  </span>
                  <span className="ml-2 text-xs font-medium text-teal-600">
                    （{duration} 小时）
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <motion.button
                type="button"
                disabled={!canConfirm}
                onClick={handleConfirm}
                className="w-full rounded-2xl bg-gradient-to-r from-mint-deep to-teal-500 py-4 text-base font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
                whileTap={canConfirm ? { scale: 0.98 } : undefined}
              >
                确认预约
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
