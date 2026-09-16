import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppState } from './hooks/useAppState'
import { ParkingLot } from './components/ParkingLot'
import { SpotBars } from './components/SpotBars'
import { BookingDrawer } from './components/BookingDrawer'
import { TodayBookingsList } from './components/TodayBookingsList'
import { ResultToast } from './components/ResultToast'
import { BOOKABLE_SPOT, SPOT_LABELS } from './types'
import { formatHugeDate } from './lib/time'
import { HOST_CUT_IN_STUB_MESSAGE, isHostCutInAvailable } from './lib/hostPlates'

export default function App() {
  const {
    state,
    spots,
    todayBookings,
    todayLoading,
    drawerOpen,
    animVehicle,
    animPhase,
    confirming,
    result,
    openDrawer,
    closeDrawer,
    confirm,
    dismissResult,
    resetAll, onDrawerExited, onParked, onFinished,
  } = useAppState()

  const [cutInOpen, setCutInOpen] = useState(false)
  const huge = formatHugeDate()
  const spotC = useMemo(() => spots.find((s) => s.id === BOOKABLE_SPOT), [spots])
  const hostCutIn = isHostCutInAvailable({
    spot: spotC,
    todayBookings,
  })

  return (
    <div className="app-shell flex flex-col">
      <header className="px-4 pb-1 pt-5 text-center">
        <p
          className="text-[11px] font-semibold tracking-[0.2em]"
          style={{ color: 'var(--ui-muted)' }}
        >
          {huge.year} · {huge.weekday}
        </p>
        <h1
          className="text-[2.35rem] font-black leading-none tracking-tight"
          style={{ color: 'var(--ui-text)' }}
        >
          {huge.dateLine}
        </h1>
        <p
          className="mt-1.5 text-[11px] font-medium"
          style={{ color: 'var(--ui-muted)' }}
        >
          邻里互助 · 共享充电
        </p>
      </header>

      <main className="flex-1 space-y-3 px-3.5 pb-8 pt-3">
        <div className="lot-card">
          <ParkingLot
            spots={spots}
            animVehicle={animVehicle}
            animPhase={animPhase}
            paused={drawerOpen}
            onParked={onParked} onFinished={onFinished}
            onSelectC={openDrawer}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {spots.map((s) => (
            <SpotBars
              key={s.id}
              spot={s}
              showCutIn={s.id === BOOKABLE_SPOT && hostCutIn}
              onCutIn={() => setCutInOpen(true)}
            />
          ))}
        </div>

        <TodayBookingsList rows={todayBookings} loading={todayLoading} />

        <p
          className="px-1 text-center text-[10px] leading-relaxed"
          style={{ color: 'var(--ui-muted)' }}
        >
          仅 {SPOT_LABELS.C} 可约 · {SPOT_LABELS.A}/{SPOT_LABELS.B} 维护中 · 无需登录与支付
          <span className="mt-1 block opacity-70">早 · 中 · 晚，把合适的时间留给邻居。</span>
        </p>

        <button
          type="button"
          onClick={() => void resetAll()}
          className="mx-auto block text-[10px] underline"
          style={{ color: 'var(--ui-muted)', textDecorationColor: 'var(--ui-border)' }}
        >
          清除本地数据
        </button>
      </main>

      <BookingDrawer
        open={drawerOpen}
        initialVehicle={state.vehicle}
        onClose={closeDrawer}
        onConfirm={(period, vehicle, date) => void confirm(period, vehicle, date)}
        confirming={confirming}
        onExited={onDrawerExited}
        todayBookings={todayBookings}
      />

      <ResultToast
        open={!!result}
        ok={!!result?.ok}
        message={
          result?.ok
            ? result.reason || '预约成功'
            : result?.reason || '预约失败'
        }
        onClose={dismissResult}
      />

      <AnimatePresence>
        {cutInOpen && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 px-3 pb-6 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setCutInOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-label="超级插队"
              aria-modal
              className="w-full max-w-sm rounded-3xl p-5 shadow-2xl"
              style={{
                background: 'var(--ui-shell-top, #ffffff)',
                border: '1px solid var(--ui-border)',
              }}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-black" style={{ color: 'var(--ui-text)' }}>
                超级插队5元
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--ui-muted)' }}>
                {HOST_CUT_IN_STUB_MESSAGE}
              </p>
              <button
                type="button"
                onClick={() => setCutInOpen(false)}
                className="mt-4 w-full rounded-2xl py-2.5 text-sm font-bold"
                style={{
                  background: 'var(--ui-tile, #f4f4f5)',
                  color: 'var(--ui-text)',
                  border: '1px solid var(--ui-border)',
                }}
              >
                知道了
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
