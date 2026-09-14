import { AnimatePresence, motion } from 'framer-motion'
import type { Booking } from '../types'
import { formatDateCN, isBookingWindowActive, isPastEnd, minToTime } from '../lib/time'
import { myActiveBookings } from '../lib/booking'

interface Props {
  bookings: Booking[]
  sessionId: string
  onCancel: (id: string) => void
  onCheckIn: (id: string) => void
}

function statusOf(b: Booking, now = new Date()) {
  if (b.cancelled) return { label: '已取消', color: 'bg-slate-400' }
  if (b.checkedIn) return { label: '充电中', color: 'bg-emerald-500' }
  if (b.noShowRecorded) return { label: '爽约', color: 'bg-coral' }
  if (isPastEnd(b.date, b.endMin, now)) return { label: '已结束', color: 'bg-slate-500' }
  if (isBookingWindowActive(b.date, b.startMin, b.endMin, now))
    return { label: '进行中', color: 'bg-mint-deep' }
  return { label: '待开始', color: 'bg-violet-400' }
}

export function MyBookings({ bookings, sessionId, onCancel, onCheckIn }: Props) {
  const mine = myActiveBookings(bookings, sessionId)

  return (
    <section className="space-y-2.5">
      <div className="px-0.5">
        <h2 className="text-base font-black text-ink">我的预约</h2>
        <p className="text-xs font-medium text-muted">时段内签到，避免爽约扣心心</p>
      </div>

      {mine.length === 0 ? (
        <div className="rounded-2xl bg-white px-4 py-8 text-center shadow-sm ring-1 ring-slate-100">
          <div className="mb-2 text-2xl">🚗💤</div>
          <p className="text-sm text-muted">还没有预约，点上面空闲段开约吧</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {mine.map((b) => {
              const st = statusOf(b)
              const canCheckIn =
                !b.checkedIn &&
                !b.cancelled &&
                isBookingWindowActive(b.date, b.startMin, b.endMin)
              const canCancel =
                !b.checkedIn &&
                !b.cancelled &&
                !isPastEnd(b.date, b.endMin) &&
                !isBookingWindowActive(b.date, b.startMin, b.endMin)
              const hours = (b.endMin - b.startMin) / 60

              return (
                <motion.li
                  key={b.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-slate-100"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="text-sm font-black text-ink">
                      C号 · {formatDateCN(b.date).split(' ')[0]}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${st.color}`}>
                      {st.label}
                    </span>
                  </div>
                  <div className="mb-3 text-base font-black text-mint-deep">
                    {minToTime(b.startMin)} – {minToTime(b.endMin)}
                    <span className="ml-2 text-xs font-medium text-muted">{hours}h</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {canCheckIn && (
                      <motion.button
                        type="button"
                        onClick={() => onCheckIn(b.id)}
                        className="w-full rounded-xl bg-gradient-to-r from-amber-300 to-mint-deep py-3 text-sm font-black text-ink shadow"
                        whileTap={{ scale: 0.98 }}
                      >
                        ⚡ 我已到达
                      </motion.button>
                    )}
                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => onCancel(b.id)}
                        className="w-full rounded-xl bg-fog py-2.5 text-sm font-bold text-muted active:bg-rose-50 active:text-coral"
                      >
                        取消预约
                      </button>
                    )}
                  </div>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}
    </section>
  )
}
