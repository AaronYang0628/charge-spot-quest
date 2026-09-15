import { describe, expect, it } from 'vitest'
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Quaternion, Vector3 } from 'three'
import { createWheelRig, entrancePosition } from './vehicle-motion'

describe('vehicle movement', () => {
  it('arrives continuously from outside the stage and stops at the center', () => {
    const positions = [0,.25,.5,.75,1].map(entrancePosition)
    expect(positions[0]).toBe(-7)
    expect(positions.at(-1)).toBe(0)
    expect(positions.every((p,i) => i === 0 || p > positions[i-1])).toBe(true)
    expect(entrancePosition(2)).toBe(0)
  })
  it('preserves authored wheel axes and ignores the steering wheel', () => {
    const car = new Group()
    const wheel = new Mesh(new BoxGeometry(.2,.7,.7),new MeshBasicMaterial())
    wheel.name = 'Example_Wheel_fl'
    wheel.rotation.x = Math.PI/2
    car.add(wheel)
    const steering = new Group(); steering.name = 'Steering_Wheel_01'; car.add(steering)
    const original = wheel.quaternion.clone()
    const spin = createWheelRig(car)
    spin(.4)
    expect(wheel.quaternion.equals(original)).toBe(false)
    expect(steering.quaternion.equals(new Quaternion())).toBe(true)
    // Rotation about the axle cannot tilt the axle itself.
    expect(new Vector3(1,0,0).applyQuaternion(wheel.quaternion).distanceTo(new Vector3(1,0,0))).toBeLessThan(.0001)
    spin(0)
    expect(wheel.quaternion.equals(original)).toBe(true)
    wheel.geometry.dispose(); wheel.material.dispose()
  })
})
