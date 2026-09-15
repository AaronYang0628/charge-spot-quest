/* oxlint-disable react/immutability -- R3F owns mutable Three.js cameras and animation objects. */
import { Suspense, useCallback, useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import { Group, Mesh, MeshStandardMaterial, Object3D, OrthographicCamera, Vector3 } from 'three'
import type { OrbitControls as Controls } from 'three-stdlib'
import type { VehicleInfo } from '../types'
import { SPOT_LABELS } from '../types'
import type { AnimPhase } from '../hooks/useAppState'
import { Vehicle } from './SceneModels'
import TownBackdrop from './TownBackdrop'

export interface LotSceneProps {
  vehicle: VehicleInfo | null; phase: AnimPhase; paused: boolean; reduced: boolean
  reserved: boolean
  onSelect: () => void; onParked: () => void; onFinished: () => void
}
const TARGET = new Vector3(0, 0, -2.1)
const CAMERA = new Vector3(9, 18, 14)
const AZIMUTH = Math.atan2(9, 16.1)
const BAY_LABELS = [SPOT_LABELS.A, SPOT_LABELS.B, SPOT_LABELS.C] as const

function Box({ position, size, color, ...props }: {
  position: [number, number, number]; size: [number, number, number]; color: string
  rotation?: [number, number, number]
}) {
  return <mesh position={position} castShadow receiveShadow {...props}>
    <boxGeometry args={size} /><meshStandardMaterial color={color} roughness={.9} />
  </mesh>
}
function Cone({ x, z }: { x: number; z: number }) {
  return <group position={[x, 0, z]}>
    <Box position={[0,.05,0]} size={[.65,.1,.65]} color="#e88132" />
    <mesh position={[0,.47,0]} castShadow><coneGeometry args={[.26,.8,6]} /><meshStandardMaterial color="#ec8437" /></mesh>
    <mesh position={[0,.46,0]}><cylinderGeometry args={[.1,.16,.18,6]} /><meshStandardMaterial color="#fff7dd" /></mesh>
  </group>
}
function Barrier({ x }: { x: number }) {
  return <group position={[x, 0, -.8]}>
    {[-.85,.85].map(v => <Box key={v} position={[v,.5,0]} size={[.15,1,.55]} color="#db7029" />)}
    <Box position={[0,.85,0]} size={[2.25,.4,.2]} color="#fcf6df" />
    {[-.9,-.3,.3,.9].map(v => <Box key={v} position={[v,.85,.11]} size={[.26,.4,.015]} color="#e88333" rotation={[0,0,-.3]} />)}
    <Cone x={-.85} z={1.5} />
  </group>
}
function Charger() {
  return <group position={[3.2,0,-3.25]}>
    <Box position={[0,.1,0]} size={[1.1,.2,.85]} color="#4967a3" />
    <Box position={[0,1.05,0]} size={[.8,1.9,.6]} color="#5870c0" />
    <Box position={[0,1.48,.31]} size={[.56,.5,.035]} color="#202f42" />
    <Box position={[0,1.49,.34]} size={[.08,.29,.03]} color="#f4d34d" rotation={[0,0,-.4]} />
    <mesh position={[.5,.95,0]} rotation={[0,0,0]} castShadow><torusGeometry args={[.38,.045,6,16,Math.PI*1.7]} /><meshStandardMaterial color="#273342" /></mesh>
  </group>
}
function CameraRig({ paused }: Pick<LotSceneProps, 'paused'>) {
  const control = useRef<Controls>(null)
  const { camera, size, invalidate, scene, gl } = useThree()
  useEffect(() => {
    if (import.meta.env.DEV) Object.assign(window, { __lot: { camera, scene, gl } })
  }, [camera, scene, gl])
  const base = Math.min(size.width / 22, size.height / 19)
  useEffect(() => {
    // oxlint-disable-next-line react/immutability -- Three cameras are intentionally imperative.
    const c = camera as OrthographicCamera
    c.position.copy(CAMERA); c.zoom = base; c.lookAt(TARGET); c.updateProjectionMatrix()
    control.current?.target.copy(TARGET); control.current?.update(); invalidate()
  }, [camera, base, invalidate])
  return <OrbitControls ref={control} target={TARGET} enabled={!paused}
    enablePan={false} enableDamping={false} minAzimuthAngle={AZIMUTH - Math.PI*25/180}
    maxAzimuthAngle={AZIMUTH + Math.PI*25/180} minPolarAngle={Math.PI/6}
    maxPolarAngle={Math.PI*55/180} minZoom={base*.85} maxZoom={base*1.25} />
}
function AnimatedCar({ vehicle, phase, paused, onParked, onFinished }: LotSceneProps & { vehicle: VehicleInfo }) {
  const group = useRef<Group>(null)
  const wheels = useRef<Object3D[]>([])
  const progress = useRef(0)
  const sent = useRef(false)
  const { invalidate } = useThree()
  const setModel = useCallback((model: Object3D) => {
    wheels.current = []
    model.traverse(o => { if (o.name.includes('Wheel_')) wheels.current.push(o) })
  }, [])
  useEffect(() => { progress.current = 0; sent.current = false; invalidate() }, [phase, invalidate])
  useFrame((_, delta) => {
    if (!group.current || paused) return
    if (phase === 'parking' || phase === 'charging') {
      progress.current += Math.min(delta, .05)
      // The reservation preview is the product's primary feedback; keep the 3D
      // vehicle motion visible even when the OS requests reduced UI motion.
      const t = Math.min(1, progress.current / (phase === 'parking' ? 1.4 : .8))
      const z = phase === 'parking' ? 5.8 * (1-t)**3 : 0
      group.current.position.z = z
      // Gentle yaw so the entry model is visibly rotatable / not a fixed sprite.
      group.current.rotation.y = phase === 'parking' ? (1 - t) * 0.45 : 0
      wheels.current.forEach(w => { w.rotation.x = -z/.36 })
      if (t === 1 && !sent.current) { sent.current = true; (phase === 'parking' ? onParked : onFinished)() }
      invalidate()
    } else group.current.position.z = 0
  })
  return <group ref={group} position={[3.2,0,phase === 'parking' ? 5.8 : 0]}>
    <Vehicle vehicle={vehicle} onModel={setModel} />
  </group>
}
function ChargeEffect({ paused, reduced }: {paused: boolean; reduced: boolean}) {
  const ring = useRef<Mesh>(null)
  const elapsed = useRef(0)
  useFrame((_,delta) => {
    if (!ring.current || paused) return
    elapsed.current += delta
    const material = ring.current.material as MeshStandardMaterial
    material.opacity = reduced ? .7 : .5 + Math.sin(elapsed.current*9)*.25
    material.emissiveIntensity = reduced ? .5 : .6 + Math.sin(elapsed.current*9)*.3
  })
  return <group position={[3.2,.06,0]}>
    <mesh ref={ring} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[1.5,1.62,32]} />
      <meshStandardMaterial color="#80e4ac" emissive="#55d88e" transparent opacity={.7} depthWrite={false} />
    </mesh>
    <Html position={[0,2.5,0]} center><span className="charge-tag">ϟ 充电效果演示</span></Html>
  </group>
}
export default function LotScene(props: LotSceneProps) {
  const down = useRef<[number,number]>([0,0])
  return <>
    <color attach="background" args={['#eee7d9']} />
    <hemisphereLight args={['#fff7e5','#a1b4aa',1.8]} />
    <directionalLight position={[-8,14,8]} intensity={3.2} castShadow
      shadow-mapSize={[1024,1024]} shadow-camera-left={-13} shadow-camera-right={13}
      shadow-camera-top={13} shadow-camera-bottom={-13} shadow-normalBias={.03} shadow-bias={-.0001} />
    <CameraRig paused={props.paused} />
    <TownBackdrop />
    <Box position={[0,-.045,1]} size={[10.5,.08,9.5]} color="#7f9592" />
    <Box position={[0,0,-3.9]} size={[11,.18,1.2]} color="#efe0be" />
    {[-4.8,-1.6,1.6,4.8].map(x => <Box key={x} position={[x,.013,0]} size={[.075,.025,5.6]} color="#fff9e8" />)}
    <Box position={[0,.013,-2.8]} size={[9.65,.025,.075]} color="#fff9e8" />
    {[-3.2,0,3.2].map((x,i) => <group key={x}>
      <Html position={[x,.1,2.7]} center style={{pointerEvents:'none'}}>
        <span className="bay-letter">{BAY_LABELS[i]}</span>
      </Html>
      {i < 2 ? <><Barrier x={x} /><Html position={[x,1.8,-1.2]} center><span className="scene-tag muted">维护中</span></Html></> : null}
    </group>)}
    <mesh position={[3.2,.031,0]} rotation={[-Math.PI/2,0,0]}
      onPointerDown={e => { down.current = [e.clientX,e.clientY] }}
      onClick={e => { if (Math.hypot(e.clientX-down.current[0],e.clientY-down.current[1]) < 7 && !props.paused) { e.stopPropagation(); props.onSelect() } }}>
      <planeGeometry args={[3.05,5.5]} /><meshStandardMaterial color="#b4d4b1" transparent opacity={props.phase === 'charging' ? .55 : .18} />
    </mesh>
    <Charger />
    {props.vehicle && props.phase !== 'closing' && <Suspense fallback={null}><AnimatedCar {...props} vehicle={props.vehicle} /></Suspense>}
    {props.phase === 'charging' && <ChargeEffect paused={props.paused} reduced={props.reduced} />}
    <Html position={[3.2,.3,3.1]} center>
      <button className="scene-tag action" disabled={props.paused || !!props.phase} onClick={props.onSelect}>
        {props.phase ? '预约效果演示' : props.reserved ? `已预约 · 查看时段` : `${SPOT_LABELS.C} 可约 · 点我`}
      </button>
    </Html>
  </>
}
