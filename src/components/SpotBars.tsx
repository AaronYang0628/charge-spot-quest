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
      className="space-y-1.5 rounded-xl px-2.5 py-2"
      style={{
        background: 'var(--ui-card)',
        border: '1px solid var(--ui-border)',
        opacity: spot.maintenance ? 0.72 : 1,
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] font-black tracking-wide"
          style={{ color: 'var(--ui-text)' }}
        >
          {spot.id} 号位
        </span>
        {spot.maintenance ? (
          <span
            className="rounded px-1.5 py-0.5 text-[9px] font-bold"
            style={{ background: 'var(--ui-maint-pill)', color: 'var(--ui-muted)' }}
          >
            维护中
          </span>
        ) : spot.occupied ? (
          <span
            className="rounded px-1.5 py-0.5 text-[9px] font-bold"
            style={{ background: 'var(--ui-warn)', color: '#ffffff' }}
          >
            占用中
          </span>
        ) : (
          <span
            className="rounded px-1.5 py-0.5 text-[9px] font-bold"
            style={{ background: 'var(--ui-accent)', color: '#ffffff' }}
          >
            可预约
          </span>
        )}
      </div>

      <Bar label="1小时内空闲" value={spot.idleIn1h} fill="var(--ui-success)" />
      <Bar label="今晚空闲" value={spot.idleTonight} fill="var(--ui-accent)" />

      {spot.occupied && (
        <div className="pt-0.5">
          <div
            className="mb-0.5 flex items-center justify-between text-[9px]"
            style={{ color: 'var(--ui-muted)' }}
          >
            <span>已占用时长</span>
            <span className="font-mono font-bold" style={{ color: 'var(--ui-warn)' }}>
              {formatElapsed(elapsed)}
            </span>
          </div>
          <div
            className="relative h-5 overflow-hidden rounded"
            style={{ background: 'var(--ui-track)' }}
          >
            <div
              className="absolute inset-0"
              style={{ background: 'var(--ui-warn)', opacity: 0.85 }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-[11px] font-black tabular-nums text-white">
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
  fill,
}: {
  label: string
  value: number
  fill: string
}) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100)
  return (
    <div>
      <div
        className="mb-0.5 flex items-center justify-between text-[9px]"
        style={{ color: 'var(--ui-muted)' }}
      >
        <span>{label}</span>
        <span className="font-bold" style={{ color: 'var(--ui-text)' }}>
          {pct}%
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded"
        style={{ background: 'var(--ui-track)', borderRadius: 4 }}
      >
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${pct}%`, background: fill, borderRadius: 4 }}
        />
      </div>
    </div>
  )
}
