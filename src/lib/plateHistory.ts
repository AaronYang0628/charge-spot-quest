import type { VehicleColor, VehicleInfo, VehicleType } from '../types'
import { normalizeVehicle } from './normalize'
import { loadVehicle } from './storage'

export const PLATE_HISTORY_KEY = 'charge-spot-quest-plate-history-v1'
export const PLATE_HISTORY_MAX = 8

export interface PlateHistoryEntry {
  plate: string
  color: VehicleColor
  type: VehicleType
}

function normalizeEntry(raw: unknown): PlateHistoryEntry | null {
  if (!raw || typeof raw !== 'object') return null
  const v = normalizeVehicle(raw)
  const plate = v.plate.trim().toUpperCase()
  if (!plate) return null
  return { plate, color: v.color, type: v.type }
}

function readRaw(): PlateHistoryEntry[] {
  try {
    const raw = localStorage.getItem(PLATE_HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const out: PlateHistoryEntry[] = []
    const seen = new Set<string>()
    for (const item of parsed) {
      const entry = normalizeEntry(item)
      if (!entry || seen.has(entry.plate)) continue
      seen.add(entry.plate)
      out.push(entry)
      if (out.length >= PLATE_HISTORY_MAX) break
    }
    return out
  } catch {
    return []
  }
}

function write(entries: PlateHistoryEntry[]): void {
  localStorage.setItem(PLATE_HISTORY_KEY, JSON.stringify(entries.slice(0, PLATE_HISTORY_MAX)))
}

/** Newest-first unique plates; seeds from saved vehicle when empty. */
export function loadPlateHistory(): PlateHistoryEntry[] {
  const list = readRaw()
  if (list.length > 0) return list
  const saved = loadVehicle()
  const seeded = saved ? normalizeEntry(saved) : null
  if (!seeded) return []
  write([seeded])
  return [seeded]
}

/** Push vehicle to front; keep unique by plate; cap at PLATE_HISTORY_MAX. */
export function recordPlateHistory(vehicle: VehicleInfo): PlateHistoryEntry[] {
  const entry = normalizeEntry(vehicle)
  if (!entry) return loadPlateHistory()
  const rest = readRaw().filter((e) => e.plate !== entry.plate)
  const next = [entry, ...rest].slice(0, PLATE_HISTORY_MAX)
  write(next)
  return next
}

export function clearPlateHistory(): void {
  localStorage.removeItem(PLATE_HISTORY_KEY)
}
