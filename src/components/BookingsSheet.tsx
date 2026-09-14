import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import { api } from '../api/client'
import type { SpotBookingView, SpotId } from '../types'
import {
  PERIOD_LABELS,
  SPOT_LABELS,
  VEHICLE_COLOR_LABELS,
  VEHICLE_TYPE_LABELS,
} from '../types'
import { formatHugeDate } from '../lib/time'

interface Props {
  spotId: SpotId | null
  onClose: () => void
}

const DRAWER_MS = 0.25
const CLOSE_OFFSET = 120
const CLOSE_VELOCITY = 700

export function BookingsSheet({ spotId, onClose }: Props) {
  const open = spotId !== null
  const [rows, setRows] = useState<SpotBookingView[]>([])
  const [loading, setLoading] = useState(false)
  const sheet = useRef<HTMLDivElement>(null)
  const dragControls = useDragControls()
  const label = spotId ? SPOT_LABELS[spotId] : ''

  useEffect(() => {
    if (!spotId) return
    let cancelled = false
    setLoading(true)
    void api.getSpotBookings(spotId).then((list) => {
      if (cancelled) return
      setRows(list)
      setLoading(false)
    }).catch(() => {
      if (cancelled) return
      setRows([])
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [spotId])

  useEffect(() => {
    if (!open) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', key)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', key)
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && spotId && (
        <>
          <motion.button
            type="button"
            aria-label="关闭遮罩"
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DRAWER_MS, ease: 'easeOut' }}
            onClick={onClose}
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
              if (info.offset.y > CLOSE_OFFSET || info.velocity.y > CLOSE_VELOCITY) onClose()
            }}
            role="dialog"
            aria-label={`${label} 预约列表`}
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
            </div>

            <div className="relative px-5 pb-6 pt-2">
              <button
                type="button"
                aria-label="关闭"
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

              <h2
                className="mb-1 text-center text-xl font-black"
                style={{ color: 'var(--ui-text)' }}
              >
                {label} 预约情况
              </h2>
              <p
                className="mb-4 text-center text-[11px]"
                style={{ color: 'var(--ui-muted)' }}
              >
                车牌已脱敏 · 不含会话信息
              </p>

              {loading ? (
                <p className="py-8 text-center text-sm" style={{ color: 'var(--ui-muted)' }}>
                  加载中…
                </p>
              ) : rows.length === 0 ? (
                <div
                  className="rounded-2xl px-4 py-10 text-center"
                  style={{
                    background: 'var(--ui-tile, #f4f4f5)',
                    border: '1px solid var(--ui-border)',
                  }}
                >
                  <p className="text-sm font-bold" style={{ color: 'var(--ui-text)' }}>
                    暂无预约
                  </p>
                  <p className="mt-1 text-[11px]" style={{ color: 'var(--ui-muted)' }}>
                    该车位还没有已登记的时段
                  </p>
                </div>
              ) : (
                <ul className="max-h-[55dvh] space-y-2 overflow-y-auto">
                  {rows.map((row) => {
                    const huge = formatHugeDate(row.date)
                    return (
                      <li
                        key={row.id}
                        className="rounded-2xl px-3.5 py-3"
                        style={{
                          background: 'var(--ui-tile, #f4f4f5)',
                          border: '1px solid var(--ui-border)',
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-black" style={{ color: 'var(--ui-text)' }}>
                              {huge.dateLine}
                              <span className="ml-1.5 text-[11px] font-semibold opacity-70">
                                {huge.weekday}
                              </span>
                            </p>
                            <p className="mt-0.5 text-[12px]" style={{ color: 'var(--ui-muted)' }}>
                              {PERIOD_LABELS[row.period]} · {VEHICLE_COLOR_LABELS[row.vehicleColor]}
                              {VEHICLE_TYPE_LABELS[row.vehicleType]}
                            </p>
                          </div>
                          <div className="text-right">
                            <span
                              className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold"
                              style={{ background: 'var(--ui-accent)', color: '#fff' }}
                            >
                              已预约
                            </span>
                            <p
                              className="mt-1 font-mono text-[12px] font-bold tracking-wide"
                              style={{ color: 'var(--ui-text)' }}
                            >
                              {row.plateMasked}
                            </p>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
