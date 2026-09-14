import { useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { Mesh, MeshStandardMaterial, Object3D } from 'three'
import type { VehicleInfo } from '../types'
import { VEHICLE_PALETTE } from '../types'
import { asset } from '../lib/asset'

function useModel(name: string, color?: string) {
  const { scene } = useGLTF(asset(`/models/${name}.glb`))
  const model = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse(o => {
      if (!(o instanceof Mesh)) return
      o.castShadow = true
      o.receiveShadow = true
      o.material = (o.material as MeshStandardMaterial).clone()
      if (o.material.name === 'CarPaint' && color) {
        o.material.color.set(color)
        o.material.vertexColors = false
      }
    })
    return clone
  }, [scene, color])
  useEffect(() => () => {
    model.traverse(o => { if (o instanceof Mesh) (o.material as MeshStandardMaterial).dispose() })
  }, [model])
  return model
}

export function Vehicle({ vehicle, onModel }: { vehicle: VehicleInfo; onModel?: (model: Object3D) => void }) {
  const model = useModel(vehicle.type, VEHICLE_PALETTE[vehicle.color].body)
  useEffect(() => { onModel?.(model) }, [model, onModel])
  return <primitive object={model} />
}

export function Prop({ name, position, scale = 1, rotation = 0 }: {
  name: string; position: [number, number, number]; scale?: number; rotation?: number
}) {
  const model = useModel(name)
  return <group position={position} scale={scale} rotation-y={rotation}><primitive object={model} /></group>
}
