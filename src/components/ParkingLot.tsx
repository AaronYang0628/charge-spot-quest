import { lazy, Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { useReducedMotion } from 'framer-motion'
import type { SpotStatus, VehicleInfo } from '../types'
import { SPOT_LABELS } from '../types'
import type { AnimPhase } from '../hooks/useAppState'
import { SceneBoundary } from './SceneBoundary'
import { usePageVisible } from '../hooks/usePageVisible'
import { asset } from '../lib/asset'
const LotScene = lazy(() => import('./LotScene'))
interface Props {
  spots: SpotStatus[]; animVehicle: VehicleInfo | null; animPhase: AnimPhase
  paused: boolean; onSelectC: () => void; onParked: () => void; onFinished: () => void
}
export function ParkingLot({ spots, animVehicle, animPhase, paused, onSelectC, onParked, onFinished }: Props) {
  const [failed, setFailed] = useState(false)
  const visible = usePageVisible()
  const reduced = !!useReducedMotion()
  const reserved = !!spots.find(s => s.id === 'C')?.reservedPeriods?.length
  useEffect(() => {
    if (failed && animPhase && animPhase !== 'closing') onFinished()
  }, [failed, animPhase, onFinished])
  // A stalled model must never trap a successfully saved reservation.
  useEffect(() => {
    if (!animPhase || animPhase === 'closing' || !visible) return
    const timeout = window.setTimeout(onFinished, 12000)
    return () => clearTimeout(timeout)
  }, [animPhase, onFinished, visible])
  const fallback = (
    <div className="scene-fallback">
      <img
        src={asset('/art/lot/parking-lot.webp')}
        alt={`三车位停车场，${SPOT_LABELS.A}、${SPOT_LABELS.B}维护中`}
      />
      <p>场景暂不可用，仍可预约</p>
    </div>
  )
  return <section aria-label="三维停车场" className="scene-section">
    <div className="scene-toolbar">
      <span>邻里互助 <b>／ 共享充电</b></span>
      <span className="daylight">⚡ 慢充共享</span>
    </div>
    <div className="scene-canvas">
      {failed ? fallback : <SceneBoundary fallback={fallback} onError={() => setFailed(true)}>
        <Suspense fallback={<div className="scene-loading">正在加载车位…</div>}>
          <Canvas orthographic shadows dpr={[1,1.5]} frameloop={visible && !paused ? 'demand' : 'never'}
            camera={{ position: [9,13,13], zoom: 24, near: .1, far: 100 }}
            onCreated={({gl}) => { gl.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); setFailed(true) }) }}>
            <Suspense fallback={null}><LotScene vehicle={animVehicle} phase={animPhase} paused={paused || !visible}
              reduced={reduced} reserved={reserved}
              onSelect={onSelectC} onParked={onParked} onFinished={onFinished} /></Suspense>
          </Canvas>
        </Suspense>
      </SceneBoundary>}
    </div>
    <div className="scene-controls">
      <span>{animPhase ? '预约效果演示 · 非设备实时状态' : reserved ? '车辆展示代表预约，非实际占用' : '邻居共享充电位。拖动可旋转视角。'}</span>
    </div>
    <button
      type="button"
      className="reserve-button"
      aria-label="预约649车位充电"
      disabled={!!animPhase || paused}
      onClick={onSelectC}
    >
      🔋预约649车位充电
    </button>
  </section>
}
