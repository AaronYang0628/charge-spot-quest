import type { VehicleType } from '../types'
import { VEHICLE_TYPE_LABELS } from '../types'

export const VEHICLE_TYPES = Object.keys(VEHICLE_TYPE_LABELS) as VehicleType[]
export const VEHICLE_DETAILS: Record<VehicleType, { subtitle: string; livery: boolean }> = {
  ambulance: { subtitle: '守护每一次出发', livery: true },
  police: { subtitle: '街区守护者', livery: true },
  taxi: { subtitle: '下一站，邻里之间', livery: true },
  sedan: { subtitle: '经典四门 · 从容出行', livery: false },
  compact: { subtitle: '小巧灵活 · 自由穿行', livery: false },
  citycar: { subtitle: '日常通勤 · 轻松出发', livery: false },
  muscle: { subtitle: '美式线条 · 个性十足', livery: false },
  van: { subtitle: '装得下生活的更多可能', livery: false },
  convertible: { subtitle: '敞开车顶 · 迎风而行', livery: false },
  pickup: { subtitle: '载上装备 · 去往远方', livery: false },
}
