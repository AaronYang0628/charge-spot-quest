import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppState } from './hooks/useAppState'
import { SpotScene } from './components/SpotScene'
import { WeekOccupancy } from './components/WeekOccupancy'
import { BookingModal } from './components/BookingModal'
import { MyBookings } from './components/MyBookings'
import { SessionBadge } from './components/SessionBadge'
import { BlacklistScreen } from './components/BlacklistScreen'
import { NicknameModal } from './components/NicknameModal'
import { ChargeConfetti, SparkleBurst, Toast } from './components/Sparkles'
import { NO_SHOW_LIMIT } from './types'

export default function App() {
  const {
    state,
    toast,
    sparkle,
    confetti,
    book,
    cancel,
    checkIn,
    resetAll,
    setNickname,
  } = useAppState()

  const [bookingOpen, setBookingOpen] = useState(false)
  const [bookDate, setBookDate] = useState<string | undefined>()
  const [bookStart, setBookStart] = useState<number | undefined>()
  const [nickOpen, setNickOpen] = useState(false)

  const openBooking = (date?: string, preferStartMin?: number) => {
    if (state.blacklisted) return
    setBookDate(date)
    setBookStart(preferStartMin)
    setBookingOpen(true)
  }

  return (
    <div className="app-shell flex flex-col">
      {/* sticky header */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-2 border-b border-slate-100/80 bg-white/90 px-3.5 py-2.5 backdrop-blur-md">
        <motion.div
          className="flex items-center gap-1.5 min-w-0"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <span className="text-lg">⚡</span>
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-black tracking-tight text-ink">
              充电车位小站
            </h1>
            <p className="text-[9px] font-semibold text-mint-deep">
              慢充 · 无支付演示
            </p>
          </div>
        </motion.div>

        <SessionBadge
          nickname={state.nickname}
          sessionId={state.sessionId}
          noShowCount={state.noShowCount}
          onEditNickname={() => setNickOpen(true)}
        />
      </header>

      <main className="flex-1 space-y-4 px-3.5 py-3 pb-10">
        <SpotScene
          selectedSpot={bookingOpen ? 'C' : null}
          onSelectBookable={() => openBooking()}
        />

        <WeekOccupancy
          bookings={state.bookings}
          sessionId={state.sessionId}
          onTapFree={openBooking}
        />

        <MyBookings
          bookings={state.bookings}
          sessionId={state.sessionId}
          onCancel={cancel}
          onCheckIn={checkIn}
        />

        <footer className="pt-2 text-center text-[10px] text-slate-400">
          <p>爽约满 {NO_SHOW_LIMIT} 次进黑名单 · 数据存本机</p>
          <button
            type="button"
            onClick={resetAll}
            className="mt-1.5 underline decoration-slate-300 hover:text-coral"
          >
            清除本地数据并重新开局
          </button>
        </footer>
      </main>

      <BookingModal
        open={bookingOpen && !state.blacklisted}
        onClose={() => setBookingOpen(false)}
        bookings={state.bookings}
        sessionId={state.sessionId}
        initialDate={bookDate}
        initialStartMin={bookStart}
        onConfirm={book}
      />

      <NicknameModal
        open={nickOpen}
        nickname={state.nickname}
        onClose={() => setNickOpen(false)}
        onSave={setNickname}
      />

      {state.blacklisted && (
        <BlacklistScreen
          nickname={state.nickname}
          noShowCount={state.noShowCount}
          onReset={resetAll}
        />
      )}

      <SparkleBurst show={sparkle} />
      <ChargeConfetti show={confetti} />
      <Toast message={toast} />
    </div>
  )
}
