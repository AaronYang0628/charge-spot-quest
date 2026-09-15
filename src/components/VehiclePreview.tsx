/* oxlint-disable react/immutability -- Imperative animation of Three.js objects. */
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Group, Object3D, OrthographicCamera } from 'three'
import { Vehicle } from './SceneModels'
import { SceneBoundary } from './SceneBoundary'
import { usePageVisible } from '../hooks/usePageVisible'
import { createWheelRig, entrancePosition } from '../lib/vehicle-motion'
import type { VehicleInfo } from '../types'
import { VEHICLE_TYPE_LABELS } from '../types'

type Phase = 'loading' | 'entering' | 'idle' | 'exiting'
function Stage({ vehicle, replay, visible, onPhase }: {vehicle: VehicleInfo; replay: number; visible: boolean; onPhase: (phase:Phase) => void}) {
  const [displayed, setDisplayed] = useState(vehicle)
  const [sequence, setSequence] = useState(0)
  const group = useRef<Group>(null)
  const request = useRef(vehicle)
  const current = useRef(vehicle)
  const phase = useRef<Phase>('loading')
  const elapsed = useRef(0)
  const spin = useRef<(distance:number) => void>(() => {})
  const lastReplay = useRef(replay)
  const { invalidate, camera, size, scene, gl } = useThree()
  const setPhase = useCallback((value: Phase) => {
    phase.current = value; elapsed.current = 0; onPhase(value); invalidate()
  },[invalidate,onPhase])
  useEffect(() => {
    if (import.meta.env.DEV) Object.assign(window, {__vehiclePreview: {scene, camera, gl}})
    const c = camera as OrthographicCamera
    c.position.set(6,4.5,7); c.lookAt(0,.8,0)
    c.zoom = Math.min(size.width/7.8,size.height/4.6); c.updateProjectionMatrix(); invalidate()
  },[camera,scene,gl,size.width,size.height,invalidate])
  useEffect(() => {
    request.current = vehicle
    if (current.current.type !== vehicle.type || lastReplay.current !== replay) {
      lastReplay.current = replay
      if (phase.current !== 'exiting') setPhase('exiting')
    } else {
      setDisplayed(prev => prev.color === vehicle.color ? prev : {...prev, color:vehicle.color})
    }
  },[vehicle, replay, setPhase])
  const ready = useCallback((model:Object3D) => {
    spin.current = createWheelRig(model)
    if (phase.current === 'loading') setPhase('entering')
    invalidate()
  },[invalidate,setPhase])
  useFrame((_,delta) => {
    if (!group.current || !visible) return
    const p = phase.current
    if (p === 'idle' || p === 'loading') return
    elapsed.current += Math.min(delta,.08)
    const t = Math.min(1, elapsed.current / (p === 'entering' ? 1.05 : .42))
    if (p === 'exiting') {
      group.current.position.z += (9 - group.current.position.z) * Math.min(1,delta*12)
      if (t === 1) {
        group.current.position.z = -7
        current.current = request.current
        setDisplayed({...request.current})
        setSequence(n => n + 1)
        setPhase('loading')
      }
    } else {
      group.current.position.z = entrancePosition(t)
      if (t === 1) setPhase(current.current.type === request.current.type ? 'idle' : 'exiting')
    }
    spin.current(group.current.position.z)
    group.current.userData.phase = phase.current
    invalidate()
  })
  return <group ref={group} name="vehicle-preview-motion" position={[0,0,-7]}>
    <Suspense fallback={null}><Vehicle key={sequence} vehicle={displayed} onModel={ready} /></Suspense>
  </group>
}

export default function VehiclePreview({ vehicle }: { vehicle: VehicleInfo }) {
  const [failed, setFailed] = useState(false)
  const [phase, setPhase] = useState<Phase>('loading')
  const [replay, setReplay] = useState(0)
  const visible = usePageVisible()
  const fallback = <span className="preview-fallback">{VEHICLE_TYPE_LABELS[vehicle.type]} · 模型暂不可用</span>
  return <div className="vehicle-preview" data-phase={phase} data-model={vehicle.type}
    aria-label={`${VEHICLE_TYPE_LABELS[vehicle.type]}三维预览，可拖动旋转`}>
    {failed ? fallback : <SceneBoundary fallback={fallback} onError={() => setFailed(true)}>
      <Canvas orthographic dpr={[1,1.5]} frameloop={visible ? 'demand' : 'never'} camera={{position:[6,4.5,7],zoom:35,near:.1,far:60}}
        onCreated={({gl}) => gl.domElement.addEventListener('webglcontextlost', () => setFailed(true))}>
        <hemisphereLight args={['#fff9ee','#b3bec5',2.1]} />
        <directionalLight position={[-3,6,4]} intensity={2.5} />
        <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.04,0]}><circleGeometry args={[3.35,64]}/><meshStandardMaterial color="#e7e3d8" roughness={1}/></mesh>
        <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.035,0]}><ringGeometry args={[3.32,3.35,64]}/><meshBasicMaterial color="#c9c9b8"/></mesh>
        <Stage vehicle={vehicle} replay={replay} visible={visible} onPhase={setPhase}/>
        <OrbitControls target={[0,.8,0]} enabled={phase === 'idle'} enablePan={false} enableZoom={false} enableDamping={false}
          minPolarAngle={Math.PI/4} maxPolarAngle={Math.PI/2.2}/>
      </Canvas>
    </SceneBoundary>}
    <span className="preview-status">{failed ? '预览不可用' : phase === 'idle' ? '拖动查看 · 真实 3D' : phase === 'loading' ? '正在准备车辆…' : phase === 'exiting' ? '驶离展台' : '车辆进场中'}</span>
    <button className="preview-replay" type="button" disabled={failed || phase !== 'idle'} onClick={() => setReplay(n=>n+1)}>↻ 重播进场</button>
  </div>
}
