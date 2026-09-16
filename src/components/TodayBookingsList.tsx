import type { SpotBookingView } from '../types'
import {
  PERIOD_LABELS,
  SPOT_LABELS,
  VEHICLE_COLOR_LABELS,
  VEHICLE_TYPE_LABELS,
} from '../types'

interface Props {
  rows: SpotBookingView[]
  loading?: boolean
}

export function TodayBookingsList({ rows, loading }: Props) {
  return (
    <section
      className="rounded-xl px-3 py-3"
      style={{
        background: 'var(--ui-card)',
        border: '1px solid var(--ui-border)',
      }}
      aria-label="今日预约列表"
    >
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2
          className="text-[13px] font-black tracking-wide"
          style={{ color: 'var(--ui-text)' }}
        >
          今日预约 / 登记
        </h2>
        <span className="text-[10px]" style={{ color: 'var(--ui-muted)' }}>
          仅今天 · 车牌已脱敏
        </span>
      </div>

      {loading ? (
        <p className="py-6 text-center text-[12px]" style={{ color: 'var(--ui-muted)' }}>
          加载中…
        </p>
      ) : rows.length === 0 ? (
        <div
          className="rounded-xl px-3 py-8 text-center"
          style={{
            background: 'var(--ui-tile, #f4f4f5)',
            border: '1px solid var(--ui-border)',
          }}
        >
          <p className="text-[13px] font-bold" style={{ color: 'var(--ui-text)' }}>
            今日暂无预约
          </p>
          <p className="mt-1 text-[11px]" style={{ color: 'var(--ui-muted)' }}>
            邻里车辆今天还没有登记充电时段
          </p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((row) => {
            const replaced = row.status === 'cut_in_replaced'
            return (
              <li
                key={row.id}
                className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5"
                style={{
                  background: 'var(--ui-tile, #f4f4f5)',
                  border: '1px solid var(--ui-border)',
                  opacity: replaced ? 0.72 : 1,
                }}
              >
                <div className="min-w-0">
                  <p
                    className={`text-[13px] font-black ${replaced ? 'line-through' : ''}`}
                    style={{ color: replaced ? 'var(--ui-muted)' : 'var(--ui-text)' }}
                  >
                    {SPOT_LABELS[row.spotId]}
                    <span
                      className="ml-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold"
                      style={{
                        background: replaced ? 'var(--ui-muted)' : 'var(--ui-accent)',
                        color: '#fff',
                        textDecoration: 'none',
                      }}
                    >
                      {PERIOD_LABELS[row.period]}
                    </span>
                  </p>
                  <p
                    className={`mt-0.5 truncate text-[11px] ${replaced ? 'line-through' : ''}`}
                    style={{ color: 'var(--ui-muted)' }}
                  >
                    {VEHICLE_COLOR_LABELS[row.vehicleColor]}
                    {VEHICLE_TYPE_LABELS[row.vehicleType]}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {replaced ? (
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        background: 'color-mix(in srgb, var(--ui-warn) 18%, transparent)',
                        color: 'var(--ui-warn)',
                        border: '1px solid color-mix(in srgb, var(--ui-warn) 40%, transparent)',
                      }}
                    >
                      已被插队
                    </span>
                  ) : (
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: 'var(--ui-success)', color: '#fff' }}
                    >
                      已登记
                    </span>
                  )}
                  <p
                    className={`mt-1 font-mono text-[12px] font-bold tracking-wide ${replaced ? 'line-through' : ''}`}
                    style={{ color: replaced ? 'var(--ui-muted)' : 'var(--ui-text)' }}
                  >
                    {row.plateMasked}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
