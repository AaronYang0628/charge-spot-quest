import { useAppState } from './hooks/useAppState'
import { ParkingLot } from './components/ParkingLot'
import { SpotBars } from './components/SpotBars'
import { BookingDrawer } from './components/BookingDrawer'
import { BookingsSheet } from './components/BookingsSheet'
import { ResultToast } from './components/ResultToast'
import { SPOT_LABELS } from './types'
import { formatHugeDate } from './lib/time'

export default function App() {
  const {
    state,
    spots,
    drawerOpen,
    bookingsSpot,
    animVehicle,
    animPhase,
    confirming,
    result,
    openDrawer,
    closeDrawer,
    openSpotBookings,
    closeSpotBookings,
    confirm,
    dismissResult,
    resetAll, onDrawerExited, onParked, onFinished,
  } = useAppState()

  const huge = formatHugeDate()

  return (
    <div className="app-shell flex flex-col">
      {/* top: current date — large & clear */}
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
          充电车位 · 慢充预约
        </p>
      </header>

      <main className="flex-1 space-y-3 px-3.5 pb-8 pt-3">
        <div className="lot-card">
          <ParkingLot
            spots={spots}
            animVehicle={animVehicle}
            animPhase={animPhase}
            paused={drawerOpen || bookingsSpot !== null}
            onParked={onParked} onFinished={onFinished}
            onSelectC={openDrawer}
          />
        </div>

        {/* progress bars under each spot */}
        <div className="grid grid-cols-3 gap-2">
          {spots.map((s) => (
            <SpotBars
              key={s.id}
              spot={s}
              onOpenBookings={() => openSpotBookings(s.id)}
            />
          ))}
        </div>

        <p
          className="px-1 text-center text-[10px] leading-relaxed"
          style={{ color: 'var(--ui-muted)' }}
        >
          仅 {SPOT_LABELS.C} 可约 · {SPOT_LABELS.A}/{SPOT_LABELS.B} 维护中 · 无需登录与支付
          <span className="mt-1 block opacity-70">早 · 中 · 晚，把合适的时间留给你。</span>
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
      />

      <BookingsSheet spotId={bookingsSpot} onClose={closeSpotBookings} />

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
