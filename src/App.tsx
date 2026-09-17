import { useAppState } from './hooks/useAppState'
import { ParkingLot } from './components/ParkingLot'
import { SpotBars } from './components/SpotBars'
import { BookingDrawer } from './components/BookingDrawer'
import { TodayBookingsList } from './components/TodayBookingsList'
import { ResultToast } from './components/ResultToast'
import { SPOT_LABELS } from './types'
import { formatHugeDate } from './lib/time'

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
    cutIn,
    cancelCutIn,
    showToast,
    dismissResult,
    onDrawerExited, onParked, onFinished,
  } = useAppState()

  const huge = formatHugeDate()

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
            <SpotBars key={s.id} spot={s} />
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

      </main>

      <BookingDrawer
        open={drawerOpen}
        initialVehicle={state.vehicle}
        onClose={closeDrawer}
        onConfirm={(period, vehicle, date) => void confirm(period, vehicle, date)}
        onCutIn={(vehicle, period) => cutIn(vehicle, period)}
        onCancelCutIn={(bookingId) => cancelCutIn(bookingId)}
        confirming={confirming}
        onExited={onDrawerExited}
        todayBookings={todayBookings}
        onToast={(message, ok = false) => showToast(ok, message)}
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
    </div>
  )
}
