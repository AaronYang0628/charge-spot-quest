import { useEffect, useState } from 'react'
import type { SpotStatus, TimePeriod } from '../types'
import { SPOT_LABELS } from '../types'
import { currentIdlePeriod, formatElapsed } from '../lib/time'

interface Props {
  spot: SpotStatus
}

const PERIOD_BARS: { key: TimePeriod; label: string; valueKey: 'idleMorning' | 'idleNoon' | 'idleEvening' }[] = [
  { key: 'morning', label: '今早空闲', valueKey: 'idleMorning' },
  { key: 'noon', label: '中午空闲', valueKey: 'idleNoon' },
  { key: 'evening', label: '今晚空闲', valueKey: 'idleEvening' },
]

export function SpotBars({ spot }: Props) {
  const [now, setNow] = useState(() => Date.now())
  const label = SPOT_LABELS[spot.id]
  const current = currentIdlePeriod(new Date(now))

  useEffect(() => {
    // Tick every minute so period highlight flips at 08/12/18 without a refresh.
    const id = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

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
      <div className="flex items-center justify-between gap-1">
        <span
          className="text-[12px] font-black tracking-wide"
          style={{ color: 'var(--ui-text)' }}
        >
          {label}
        </span>
        {spot.maintenance ? (
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-bold"
            style={{ background: 'var(--ui-maint-pill)', color: 'var(--ui-muted)' }}
          >
            维护中
          </span>
        ) : spot.occupied ? (
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-bold"
            style={{ background: 'var(--ui-warn)', color: '#ffffff' }}
          >
            占用中
          </span>
        ) : (
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-bold"
            style={{ background: 'var(--ui-accent)', color: '#ffffff' }}
          >
            {spot.reservedPeriods?.length ? `已约 ${spot.reservedPeriods.length}/3` : '可预约'}
          </span>
        )}
      </div>

      <div className="space-y-1">
        {PERIOD_BARS.map(({ key, label: barLabel, valueKey }) => {
          const value = spot[valueKey]
          const active = key === current
          return (
            <Bar
              key={key}
              label={barLabel}
              value={value}
              active={active}
              fill={active ? 'var(--ui-accent)' : 'var(--ui-muted)'}
            />
          )
        })}
      </div>

      {spot.occupied && (
        <div className="pt-0.5">
          <div
            className="mb-0.5 flex items-center justify-between text-[10px]"
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
              <span className="font-mono text-[12px] font-black tabular-nums text-white">
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
  active,
}: {
  label: string
  value: number
  fill: string
  active: boolean
}) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100)
  return (
    <div
      className="rounded-md px-0.5 py-0.5"
      style={
        active
          ? {
              background: 'color-mix(in srgb, var(--ui-accent) 12%, transparent)',
              boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--ui-accent) 35%, transparent)',
            }
          : undefined
      }
      aria-current={active ? 'true' : undefined}
    >
      <div
        className="mb-0.5 flex items-center justify-between text-[10px]"
        style={{ color: active ? 'var(--ui-text)' : 'var(--ui-muted)' }}
      >
        <span className={active ? 'font-bold' : undefined}>
          {label}
          {active ? ' · 此刻' : ''}
        </span>
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
          style={{
            width: `${pct}%`,
            background: fill,
            borderRadius: 4,
            opacity: active ? 1 : 0.55,
          }}
        />
      </div>
    </div>
  )
}
