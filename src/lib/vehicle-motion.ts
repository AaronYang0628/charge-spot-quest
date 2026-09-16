import { Box3, Object3D, Quaternion, Vector3 } from 'three'

const spin = new Quaternion()
export function createWheelRig(model: Object3D) {
  model.updateWorldMatrix(true, true)
  const carAxis = new Vector3(1, 0, 0).applyQuaternion(model.getWorldQuaternion(new Quaternion()))
  const wheels: { object: Object3D; base: Quaternion; axis: Vector3; radius: number }[] = []
  model.traverse(object => {
    if (!/Wheel_(fl|fr|rl|rr)$/.test(object.name)) return
    const size = new Box3().setFromObject(object).getSize(new Vector3())
    const inverse = object.getWorldQuaternion(new Quaternion()).invert()
    wheels.push({ object, base: object.quaternion.clone(),
      axis: carAxis.clone().applyQuaternion(inverse).normalize(), radius: Math.max(.1, size.y / 2) })
  })
  return (distance: number) => {
    wheels.forEach(({ object, base, axis, radius }) => {
      spin.setFromAxisAngle(axis, distance / radius)
      object.quaternion.copy(base).multiply(spin)
    })
  }
}

export function entrancePosition(t: number) {
  const clamped = Math.max(0, Math.min(1, t))
  // Smooth arrival: enough time in motion to read the silhouette before stopping.
  // Avoid IEEE -0 at t>=1 so callers comparing with === 0 stay stable.
  const z = -7 * (1 - clamped) ** 2
  return z === 0 ? 0 : z
}
