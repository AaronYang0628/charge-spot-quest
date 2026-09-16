import { lazy, Suspense, useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Canvas } from '@react-three/fiber'
import { useReducedMotion } from 'framer-motion'
import type { SpotStatus, VehicleInfo } from '../types'
import { SPOT_LABELS } from '../types'
import type { AnimPhase } from '../hooks/useAppState'
import { SceneBoundary } from './SceneBoundary'
import { usePageVisible } from '../hooks/usePageVisible'
import { asset } from '../lib/asset'
const LotScene = lazy(() => import('./LotScene'))

const ORBIT_UNLOCK_MS = 10_000

interface Props {
  spots: SpotStatus[]; animVehicle: VehicleInfo | null; animPhase: AnimPhase
  paused: boolean; onSelectC: () => void; onParked: () => void; onFinished: () => void
}

export function ParkingLot({ spots, animVehicle, animPhase, paused, onSelectC, onParked, onFinished }: Props) {
  const [failed, setFailed] = useState(false)
  const [orbitEnabled, setOrbitEnabled] = useState(false)
  const orbitTimer = useRef<number | null>(null)
  const lastTap = useRef(0)
  const visible = usePageVisible()
  const reduced = !!useReducedMotion()
  const reserved = !!spots.find(s => s.id === 'C')?.reservedPeriods?.length

  const unlockOrbit = useCallback(() => {
    setOrbitEnabled(true)
    if (orbitTimer.current != null) window.clearTimeout(orbitTimer.current)
    orbitTimer.current = window.setTimeout(() => {
      setOrbitEnabled(false)
      orbitTimer.current = null
    }, ORBIT_UNLOCK_MS)
  }, [])

  useEffect(() => () => {
    if (orbitTimer.current != null) window.clearTimeout(orbitTimer.current)
  }, [])

  useEffect(() => {
    if (failed && animPhase && animPhase !== 'closing') onFinished()
  }, [failed, animPhase, onFinished])
  // A stalled model must never trap a successfully saved reservation.
  useEffect(() => {
    if (!animPhase || animPhase === 'closing' || !visible) return
    const timeout = window.setTimeout(onFinished, 12000)
    return () => clearTimeout(timeout)
  }, [animPhase, onFinished, visible])

  const onCanvasPointerUp = useCallback((e: ReactPointerEvent) => {
    // Double-tap (touch / pen) or rely on onDoubleClick for mouse.
    if (e.pointerType === 'mouse') return
    const now = Date.now()
    if (now - lastTap.current < 320) {
      unlockOrbit()
      lastTap.current = 0
    } else {
      lastTap.current = now
    }
  }, [unlockOrbit])

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
    <div
      className={`scene-canvas${orbitEnabled ? ' orbit-unlocked' : ' orbit-locked'}`}
      onDoubleClick={unlockOrbit}
      onPointerUp={onCanvasPointerUp}
    >
      {failed ? fallback : <SceneBoundary fallback={fallback} onError={() => setFailed(true)}>
        <Suspense fallback={<div className="scene-loading">正在加载车位…</div>}>
          <Canvas orthographic shadows dpr={[1,1.5]} frameloop={visible && !paused ? 'demand' : 'never'}
            camera={{ position: [9,13,13], zoom: 24, near: .1, far: 100 }}
            onCreated={({gl}) => { gl.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); setFailed(true) }) }}>
            <Suspense fallback={null}><LotScene vehicle={animVehicle} phase={animPhase} paused={paused || !visible}
              reduced={reduced} reserved={reserved} orbitEnabled={orbitEnabled}
              onSelect={onSelectC} onParked={onParked} onFinished={onFinished} /></Suspense>
          </Canvas>
        </Suspense>
      </SceneBoundary>}
    </div>
    <div className="scene-controls">
      <span>
        {animPhase
          ? '预约效果演示 · 非设备实时状态'
          : orbitEnabled
            ? '可拖动旋转'
            : '双击场景可旋转 · 10秒后自动关闭'}
      </span>
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
