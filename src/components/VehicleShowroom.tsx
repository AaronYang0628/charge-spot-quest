import { useState } from 'react'
import VehicleChooser from './VehicleChooser'
import type { VehicleInfo } from '../types'
import { asset } from '../lib/asset'

export default function VehicleShowroom() {
  const [vehicle, setVehicle] = useState<VehicleInfo>({ type:'ambulance', color:'white', plate:'' })
  return <main className="showroom-page">
    <header className="showroom-header">
      <a href={asset('')}>↖ 返回共享充电</a><span>10 款真实 3D 座驾</span>
      <p>邻里互助 ／ 共享充电</p>
      <h1>今天，换一种出场。</h1>
      <div>选一辆喜欢的车，看它驶入展台。</div>
    </header>
    <VehicleChooser vehicle={vehicle} onChange={setVehicle} gallery />
    <footer>此处仅体验车型与动画，不会创建预约。</footer>
  </main>
}
