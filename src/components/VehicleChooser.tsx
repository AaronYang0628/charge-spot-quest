import type { VehicleInfo, VehicleType } from '../types'
import { VEHICLE_COLOR_LABELS, VEHICLE_PALETTE, VEHICLE_TYPE_LABELS } from '../types'
import { VEHICLE_DETAILS, VEHICLE_TYPES } from '../lib/vehicles'
import VehiclePreview from './VehiclePreview'

function Silhouette({ type }: { type: VehicleType }) {
  const van = type === 'ambulance' || type === 'van'
  return <svg viewBox="0 0 80 36" aria-hidden="true" className="vehicle-choice-icon">
    <path d={van ? 'M9 23V8h42l12 10h8v10H9Z' : type === 'pickup'
      ? 'M7 23v-8h27V9h17l11 12h9v8H7Z' : 'M7 23l10-3 10-11h26l13 12 7 2v6H7Z'} fill="currentColor" opacity=".7" />
    <path d={van ? 'M51 12v8h10Z' : 'M29 12l-7 8h34l-7-8Z'} fill="var(--vehicle-icon-glass, #faf9f1)" />
    <circle cx="21" cy="28" r="6" fill="currentColor" /><circle cx="60" cy="28" r="6" fill="currentColor" />
    <circle cx="21" cy="28" r="2.5" fill="#f6f3e8" /><circle cx="60" cy="28" r="2.5" fill="#f6f3e8" />
    {['ambulance','police','taxi'].includes(type) && <path d="M35 4h12v4H35Z" fill="currentColor" />}
    {type === 'ambulance' && <path d="M26 12v11m-5-5.5h10" stroke="#faf8ed" strokeWidth="3" />}
  </svg>
}

export default function VehicleChooser({ vehicle, onChange, gallery = false }: {
  vehicle: VehicleInfo; onChange: (vehicle: VehicleInfo) => void; gallery?: boolean
}) {
  const index = VEHICLE_TYPES.indexOf(vehicle.type)
  const change = (type: VehicleType) => onChange({ ...vehicle, type })
  const details = VEHICLE_DETAILS[vehicle.type]
  return <div className={`vehicle-chooser ${gallery ? 'gallery' : ''}`}>
    <div className="vehicle-chooser-heading"><span>选择你的出场座驾</span><span>{String(index + 1).padStart(2,'0')} <b>/ 10</b></span></div>
    <VehiclePreview vehicle={vehicle} />
    <div className="vehicle-name-row">
      <button type="button" aria-label="上一辆车" onClick={() => change(VEHICLE_TYPES[(index+9)%10])}>‹</button>
      <div aria-live="polite"><h3>{VEHICLE_TYPE_LABELS[vehicle.type]}</h3><p>{details.subtitle}</p></div>
      <button type="button" aria-label="下一辆车" onClick={() => change(VEHICLE_TYPES[(index+1)%10])}>›</button>
    </div>
    <div className="vehicle-choices" role="group" aria-label="车辆类型">
      {VEHICLE_TYPES.map(type => <button type="button" key={type} data-vehicle={type}
        aria-label={VEHICLE_TYPE_LABELS[type]} aria-pressed={vehicle.type === type}
        onClick={e => { change(type); e.currentTarget.scrollIntoView({block:'nearest',inline:'nearest',behavior:'smooth'}) }}>
        <Silhouette type={type} /><span>{VEHICLE_TYPE_LABELS[type]}</span>
      </button>)}
    </div>
    <div className="vehicle-colors-row">
      <span>{details.livery ? '专属涂装 · 保留车辆标识' : '车身颜色'}</span>
      {!details.livery && <div role="group" aria-label="车辆颜色">{(Object.keys(VEHICLE_COLOR_LABELS) as (keyof typeof VEHICLE_COLOR_LABELS)[]).map(color =>
        <button type="button" key={color} aria-label={VEHICLE_COLOR_LABELS[color]}
          aria-pressed={vehicle.color === color} style={{background:VEHICLE_PALETTE[color].body}}
          onClick={() => onChange({...vehicle,color})} />)}</div>}
    </div>
  </div>
}
