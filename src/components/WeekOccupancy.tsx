import type { Booking } from '../types'
import { horizonDates } from '../lib/time'
import { DayOccupancyBar } from './DayOccupancyBar'

interface Props {
  bookings: Booking[]
  sessionId: string
  onTapFree: (date: string, preferStartMin?: number) => void
}

export function WeekOccupancy({ bookings, sessionId, onTapFree }: Props) {
  const dates = horizonDates()

  return (
    <section className="space-y-2.5">
      <div className="px-0.5">
        <h2 className="text-base font-black text-ink">近7天 · C号慢充</h2>
        <p className="text-xs font-medium text-muted">慢充约需 6–8 小时 · 点空闲段预约</p>
      </div>

      <div className="mb-1 flex flex-wrap gap-3 px-0.5 text-[10px] text-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded bg-teal-200" /> 空闲可约
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded bg-violet-400" /> 他人占用
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded bg-mint-deep" /> 我的预约
        </span>
      </div>

      {dates.map((d, i) => (
        <DayOccupancyBar
          key={d}
          date={d}
          index={i}
          bookings={bookings}
          sessionId={sessionId}
          onTapFree={onTapFree}
        />
      ))}
    </section>
  )
}
