import { useAppState } from './hooks/useAppState'
import { ParkingLot } from './components/ParkingLot'
import { SpotBars } from './components/SpotBars'
import { BookingDrawer } from './components/BookingDrawer'
import { ResultToast } from './components/ResultToast'
import { formatHugeDate } from './lib/time'

export default function App() {
  const {
    state,
    spots,
    drawerOpen,
    animVehicle,
    animPhase,
    confirming,
    result,
    openDrawer,
    closeDrawer,
    confirm,
    dismissResult,
    resetAll,
  } = useAppState()

  const huge = formatHugeDate()

  return (
    <div className="app-shell flex flex-col">
      {/* top: current date — large & clear */}
      <header className="px-4 pb-1 pt-5 text-center">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-zinc-500">
          {huge.year} · {huge.weekday}
        </p>
        <h1 className="text-[2.35rem] font-black leading-none tracking-tight text-zinc-50">
          {huge.dateLine}
        </h1>
        <p className="mt-1.5 text-[11px] font-medium text-zinc-500">
          充电车位 · 慢充预约
        </p>
      </header>

      <main className="flex-1 space-y-3 px-3.5 pb-8 pt-3">
        <ParkingLot
          spots={spots}
          animVehicle={animVehicle}
          animPhase={animPhase}
          selected={drawerOpen ? 'C' : null}
          onSelectC={openDrawer}
        />

        {/* progress bars under each spot */}
        <div className="grid grid-cols-3 gap-2">
          {spots.map((s) => (
            <SpotBars key={s.id} spot={s} />
          ))}
        </div>

        <p className="px-1 text-center text-[10px] leading-relaxed text-zinc-500">
          仅 C 可约 · A/B 维护中 · 无登录无支付 · 车辆信息存本机
          {state.sessionId ? (
            <span className="mt-0.5 block truncate opacity-60">
              session · {state.sessionId.slice(0, 18)}…
            </span>
          ) : null}
        </p>

        <button
          type="button"
          onClick={() => void resetAll()}
          className="mx-auto block text-[10px] text-zinc-600 underline decoration-zinc-700 hover:text-zinc-400"
        >
          清除本地数据
        </button>
      </main>

      <BookingDrawer
        open={drawerOpen}
        initialVehicle={state.vehicle}
        onClose={closeDrawer}
        onConfirm={(period, vehicle) => void confirm(period, vehicle)}
        confirming={confirming}
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
