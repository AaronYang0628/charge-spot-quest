import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { TimePeriod, VehicleColor, VehicleInfo, VehicleType } from '../types'
import {
  DEFAULT_VEHICLE,
  PERIOD_HINTS,
  PERIOD_LABELS,
  VEHICLE_COLOR_LABELS,
  VEHICLE_PALETTE,
  VEHICLE_TYPE_LABELS,
} from '../types'
import { formatHugeDate, todayISO } from '../lib/time'
import { LowPolyCar } from './LowPolyCar'

interface Props {
  open: boolean
  initialVehicle: VehicleInfo | null
  onClose: () => void
  onConfirm: (period: TimePeriod, vehicle: VehicleInfo) => void
  confirming?: boolean
}

const PERIODS: TimePeriod[] = ['morning', 'noon', 'evening']
const COLORS = Object.keys(VEHICLE_COLOR_LABELS) as VehicleColor[]
const TYPES = Object.keys(VEHICLE_TYPE_LABELS) as VehicleType[]

export function BookingDrawer({
  open,
  initialVehicle,
  onClose,
  onConfirm,
  confirming,
}: Props) {
  const [period, setPeriod] = useState<TimePeriod>('noon')
  const [plate, setPlate] = useState('')
  const [color, setColor] = useState<VehicleColor>(DEFAULT_VEHICLE.color)
  const [type, setType] = useState<VehicleType>(DEFAULT_VEHICLE.type)
  const huge = formatHugeDate()

  useEffect(() => {
    if (!open) return
    const v = initialVehicle
    setPlate(v?.plate ?? '')
    setColor(v?.color ?? DEFAULT_VEHICLE.color)
    setType(v?.type ?? DEFAULT_VEHICLE.type)
    setPeriod('noon')
  }, [open, initialVehicle])

  const vehicle: VehicleInfo = {
    plate: plate.trim(),
    color,
    type,
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="关闭"
            className="fixed inset-0 z-40 bg-black/55"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[420px] rounded-t-3xl bg-zinc-900 shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            role="dialog"
            aria-modal
          >
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-zinc-600" />

            <div className="px-5 pb-6 pt-3">
              {/* huge date */}
              <div className="mb-4 text-center">
                <p className="text-[11px] font-semibold tracking-widest text-zinc-400">
                  {huge.year} · {huge.weekday}
                </p>
                <h2 className="text-4xl font-black leading-none tracking-tight text-white">
                  {huge.dateLine}
                </h2>
                <p className="mt-1 text-[11px] text-zinc-500">预约日 · {todayISO()}</p>
              </div>

              {/* preview car */}
              <div className="mb-4 flex justify-center rounded-2xl bg-zinc-800/80 py-2">
                <LowPolyCar type={type} color={color} size={100} />
              </div>

              {/* 早 / 中 / 晚 */}
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                时段
              </p>
              <div className="mb-4 grid grid-cols-3 gap-2">
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={`rounded-2xl py-3 text-center transition ${
                      period === p
                        ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    <div className="text-2xl font-black">{PERIOD_LABELS[p]}</div>
                    <div className="text-[10px] font-medium opacity-80">
                      {PERIOD_HINTS[p]}
                    </div>
                  </button>
                ))}
              </div>

              {/* vehicle fields */}
              <label className="mb-3 block">
                <span className="mb-1 block text-[11px] font-bold text-zinc-400">
                  车牌号
                </span>
                <input
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  placeholder="例如 沪A12345"
                  maxLength={10}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-sky-500"
                />
              </label>

              <p className="mb-1.5 text-[11px] font-bold text-zinc-400">车辆颜色</p>
              <div className="mb-3 flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold ${
                      color === c
                        ? 'ring-2 ring-sky-400 ring-offset-1 ring-offset-zinc-900'
                        : ''
                    }`}
                    style={{
                      background: VEHICLE_PALETTE[c].body,
                      color: c === 'white' || c === 'yellow' ? '#111' : '#fff',
                    }}
                  >
                    {VEHICLE_COLOR_LABELS[c]}
                  </button>
                ))}
              </div>

              <p className="mb-1.5 text-[11px] font-bold text-zinc-400">车辆类型</p>
              <div className="mb-5 grid grid-cols-4 gap-1.5">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`rounded-xl py-2 text-[11px] font-bold ${
                      type === t
                        ? 'bg-white text-zinc-900'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {VEHICLE_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={confirming}
                onClick={() => onConfirm(period, vehicle)}
                className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 py-3.5 text-[15px] font-black text-zinc-950 shadow-lg disabled:opacity-60"
              >
                {confirming ? '提交中…' : '确认预约'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
