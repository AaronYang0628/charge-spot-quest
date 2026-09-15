import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Vehicle } from './SceneModels'
import { SceneBoundary } from './SceneBoundary'
import { usePageVisible } from '../hooks/usePageVisible'
import type { VehicleInfo } from '../types'
import { VEHICLE_TYPE_LABELS } from '../types'

export default function VehiclePreview({ vehicle }: { vehicle: VehicleInfo }) {
  const [failed, setFailed] = useState(false)
  const visible = usePageVisible()
  const fallback = <span className="preview-fallback">{VEHICLE_TYPE_LABELS[vehicle.type]} · 预览暂不可用</span>
  return (
    <div
      className="vehicle-preview"
      aria-label={`${VEHICLE_TYPE_LABELS[vehicle.type]}三维预览，可拖动旋转`}
    >
      {failed ? fallback : (
        <SceneBoundary fallback={fallback} onError={() => setFailed(true)}>
          <Suspense fallback={<span className="preview-fallback">正在加载车辆…</span>}>
            <Canvas
              orthographic
              dpr={[1, 1.5]}
              frameloop={visible ? 'demand' : 'never'}
              camera={{ position: [6, 4.5, 7], zoom: 30 }}
              onCreated={({ camera, gl }) => {
                camera.lookAt(0, 0.7, 0)
                gl.domElement.addEventListener('webglcontextlost', () => setFailed(true))
              }}
            >
              <hemisphereLight intensity={2.5} />
              <directionalLight position={[-3, 6, 4]} intensity={2.5} />
              <Suspense fallback={null}>
                <Vehicle vehicle={vehicle} />
              </Suspense>
              <OrbitControls
                enablePan={false}
                enableZoom={false}
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={Math.PI / 2.2}
                makeDefault
              />
            </Canvas>
          </Suspense>
        </SceneBoundary>
      )}
    </div>
  )
}
