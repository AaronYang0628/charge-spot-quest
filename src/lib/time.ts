import { DAY_END_MIN, DAY_START_MIN, HORIZON_DAYS } from '../types'

export function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}

export function minToTime(min: number): string {
  const clamped = Math.max(0, Math.min(min, 24 * 60))
  const h = Math.floor(clamped / 60) % 24
  const m = clamped % 60
  if (clamped === 24 * 60) return '24:00'
  return `${pad2(h)}:${pad2(m)}`
}

export function timeToMin(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function todayISO(d = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return todayISO(d)
}

export function formatDateCN(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  return `${d.getMonth() + 1}月${d.getDate()}日 周${week}`
}

export function dayLabel(iso: string, index: number): { title: string; sub: string } {
  const d = new Date(iso + 'T12:00:00')
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
  const md = `${d.getMonth() + 1}/${d.getDate()}`
  if (index === 0) return { title: '今天', sub: `${week} · ${md}` }
  if (index === 1) return { title: '明天', sub: `${week} · ${md}` }
  return { title: week!, sub: md }
}

export function horizonDates(from = new Date()): string[] {
  const base = todayISO(from)
  return Array.from({ length: HORIZON_DAYS }, (_, i) => addDaysISO(base, i))
}

/** Inclusive start, exclusive end overlap check */
export function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd
}

export function nowMinutes(d = new Date()): number {
  return d.getHours() * 60 + d.getMinutes()
}

export function snapToHour(min: number): number {
  return Math.floor(min / 60) * 60
}

export function bookingEndDate(date: string, endMin: number): Date {
  const d = new Date(date + 'T00:00:00')
  d.setMinutes(endMin)
  return d
}

export function isBookingWindowActive(
  date: string,
  startMin: number,
  endMin: number,
  now = new Date(),
): boolean {
  const start = new Date(date + 'T00:00:00')
  start.setMinutes(startMin)
  const end = new Date(date + 'T00:00:00')
  end.setMinutes(endMin)
  return now >= start && now < end
}

export function isPastEnd(date: string, endMin: number, now = new Date()): boolean {
  return now >= bookingEndDate(date, endMin)
}

export function daySpan(): number {
  return DAY_END_MIN - DAY_START_MIN
}

export function pctOfDay(min: number): number {
  return ((min - DAY_START_MIN) / daySpan()) * 100
}
