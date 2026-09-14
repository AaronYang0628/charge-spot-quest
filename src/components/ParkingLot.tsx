import { lazy, Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { useReducedMotion } from 'framer-motion'
import type { SpotStatus, VehicleInfo } from '../types'
import type { AnimPhase } from '../hooks/useAppState'
import { SceneBoundary } from './SceneBoundary'
import { usePageVisible } from '../hooks/usePageVisible'
const LotScene = lazy(() => import('./LotScene'))
interface Props {
  spots: SpotStatus[]; animVehicle: VehicleInfo | null; animPhase: AnimPhase
  paused: boolean; onSelectC: () => void; onParked: () => void; onFinished: () => void
}
export function ParkingLot({ spots, animVehicle, animPhase, paused, onSelectC, onParked, onFinished }: Props) {
  const [adjust, setAdjust] = useState(false)
  const [reset, setReset] = useState(0)
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
  const fallback = <div className="scene-fallback"><img src="/art/lot/parking-lot.webp" alt="三车位停车场，A、B维护中" /><p>场景暂不可用，仍可预约</p></div>
  return <section aria-label="三维停车场" className="scene-section">
    <div className="scene-toolbar"><span>THE LITTLE TOWN <b>／ 小镇慢充</b></span><span className="daylight">☀ 日光正好</span></div>
    <div className={`scene-canvas ${adjust ? 'adjusting' : ''}`}>
      {failed ? fallback : <SceneBoundary fallback={fallback} onError={() => setFailed(true)}>
        <Suspense fallback={<div className="scene-loading">正在布置小镇…</div>}>
          <Canvas orthographic shadows dpr={[1,1.5]} frameloop={visible && !paused ? 'demand' : 'never'}
            camera={{ position: [9,13,13], zoom: 24, near: .1, far: 100 }}
            onCreated={({gl}) => { gl.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); setFailed(true) }) }}>
            <Suspense fallback={null}><LotScene vehicle={animVehicle} phase={animPhase} paused={paused || !visible}
              reduced={reduced} adjust={adjust} reset={reset} reserved={reserved}
              onSelect={onSelectC} onParked={onParked} onFinished={onFinished} /></Suspense>
          </Canvas>
        </Suspense>
      </SceneBoundary>}
    </div>
    <div className="scene-controls"><span>{animPhase ? '预约效果演示 · 非设备实时状态' : reserved ? '车辆展示代表预约，非实际占用' : '把车停好，让生活慢一点。'}</span>
      <button type="button" aria-pressed={adjust} onClick={() => setAdjust(v => !v)}>{adjust ? '完成调整' : '调整视角'}</button>
      <button type="button" onClick={() => { setReset(v => v+1); setAdjust(false) }}>复位</button>
    </div>
    <button type="button" className="reserve-button" aria-label="预约车位 C" disabled={!!animPhase || paused} onClick={onSelectC}>
      {reserved ? '查看 C 车位可约时段' : '预约 C 车位'} <span>↗</span>
    </button>
  </section>
}
