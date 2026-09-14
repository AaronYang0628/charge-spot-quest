import { motion } from 'framer-motion'
import type { Booking } from '../types'
import { DAY_END_MIN, DAY_START_MIN } from '../types'
import { activeBookingsForSpot, freeWindowsForDay, longestFreeMinutes } from '../lib/booking'
import { dayLabel, minToTime, pctOfDay } from '../lib/time'

interface Props {
  date: string
  index: number
  bookings: Booking[]
  sessionId: string
  onTapFree: (date: string, preferStartMin?: number) => void
}

export function DayOccupancyBar({
  date,
  index,
  bookings,
  sessionId,
  onTapFree,
}: Props) {
  const occupied = activeBookingsForSpot(bookings, 'C', date)
  const free = freeWindowsForDay(bookings, date)
  const longest = longestFreeMinutes(bookings, date)
  const canBook = longest >= 6 * 60
  const label = dayLabel(date, index)
  const span = DAY_END_MIN - DAY_START_MIN

  return (
    <motion.article
      className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 320, damping: 26 }}
    >
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="text-sm font-black text-ink">{label.title}</div>
          <div className="text-[11px] font-medium text-muted">{label.sub}</div>
        </div>
        <div
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            canBook
              ? 'bg-teal-50 text-teal-600'
              : 'bg-slate-100 text-slate-400'
          }`}
        >
          {canBook ? `最长空闲 ${Math.floor(longest / 60)}h` : '空闲不足'}
        </div>
      </div>

      {/* Hotel-style day bar */}
      <div className="relative h-11 overflow-hidden rounded-xl bg-slate-100">
        {/* free regions (clickable) */}
        {free.map((w) => {
          const left = pctOfDay(w.startMin)
          const width = ((w.endMin - w.startMin) / span) * 100
          const tallEnough = w.endMin - w.startMin >= 6 * 60
          return (
            <button
              key={`f-${w.startMin}`}
              type="button"
              disabled={!tallEnough}
              onClick={() => onTapFree(date, w.startMin)}
              className={`absolute top-0 bottom-0 z-10 transition ${
                tallEnough
                  ? 'bg-teal-100/70 hover:bg-teal-200/80 active:bg-teal-300/70'
                  : 'bg-slate-100 cursor-default'
              }`}
              style={{ left: `${left}%`, width: `${width}%` }}
              aria-label={`空闲 ${minToTime(w.startMin)}-${minToTime(w.endMin)}`}
            />
          )
        })}

        {/* occupied segments */}
        {occupied.map((b) => {
          const left = pctOfDay(b.startMin)
          const width = ((b.endMin - b.startMin) / span) * 100
          const mine = b.sessionId === sessionId
          return (
            <motion.div
              key={b.id}
              className={`pointer-events-none absolute top-1 bottom-1 z-20 flex items-center justify-center overflow-hidden rounded-lg px-1 text-[9px] font-bold text-white shadow-sm ${
                mine
                  ? 'bg-gradient-to-r from-mint-deep to-emerald-500'
                  : 'bg-gradient-to-r from-violet-400 to-fuchsia-400'
              }`}
              style={{ left: `${left}%`, width: `${Math.max(width, 3)}%` }}
              initial={{ scaleY: 0.6, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              title={`${b.nickname} ${minToTime(b.startMin)}-${minToTime(b.endMin)}`}
            >
              <span className="truncate">
                {mine ? '我' : b.nickname}
              </span>
            </motion.div>
          )
        })}
      </div>

      <div className="mt-1.5 flex justify-between text-[9px] font-medium text-slate-400">
        <span>00:00</span>
        <span>12:00</span>
        <span>24:00</span>
      </div>
    </motion.article>
  )
}
