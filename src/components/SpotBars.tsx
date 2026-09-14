import { useEffect, useState } from 'react'
import type { SpotStatus } from '../types'
import { formatElapsed } from '../lib/time'

interface Props {
  spot: SpotStatus
}

export function SpotBars({ spot }: Props) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!spot.occupied || !spot.occupiedSince) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [spot.occupied, spot.occupiedSince])

  const elapsed =
    spot.occupied && spot.occupiedSince
      ? now - new Date(spot.occupiedSince).getTime()
      : 0

  return (
    <div
      className={`space-y-1.5 rounded-xl px-2.5 py-2 ${
        spot.maintenance ? 'bg-zinc-800/60 opacity-70' : 'bg-zinc-800/90'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black tracking-wide text-zinc-100">
          {spot.id} 号位
        </span>
        {spot.maintenance ? (
          <span className="rounded bg-zinc-600 px-1.5 py-0.5 text-[9px] font-bold text-zinc-200">
            维护中
          </span>
        ) : spot.occupied ? (
          <span className="rounded bg-amber-500/90 px-1.5 py-0.5 text-[9px] font-bold text-zinc-950">
            占用中
          </span>
        ) : (
          <span className="rounded bg-sky-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
            可预约
          </span>
        )}
      </div>

      <Bar
        label="1小时内空闲"
        value={spot.idleIn1h}
        color="bg-emerald-400"
      />
      <Bar
        label="今晚空闲"
        value={spot.idleTonight}
        color="bg-sky-400"
      />

      {spot.occupied && (
        <div className="pt-0.5">
          <div className="mb-0.5 flex items-center justify-between text-[9px] text-zinc-400">
            <span>已占用时长</span>
            <span className="font-mono font-bold text-amber-300">
              {formatElapsed(elapsed)}
            </span>
          </div>
          <div className="relative h-5 overflow-hidden rounded-md bg-zinc-950/80">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-600/80 to-orange-500/80" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-[11px] font-black tabular-nums text-white drop-shadow">
                {formatElapsed(elapsed)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Bar({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100)
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between text-[9px] text-zinc-400">
        <span>{label}</span>
        <span className="font-bold text-zinc-200">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-950/70">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
