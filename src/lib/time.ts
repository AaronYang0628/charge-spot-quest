export function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}

export function todayISO(d = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** Inclusive booking window: today + next 6 days = 7 days. */
export const BOOKING_WINDOW_DAYS = 7

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}

export function addDaysISO(iso: string, days: number): string {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + days)
  return todayISO(d)
}

export function maxBookingISO(today = todayISO()): string {
  return addDaysISO(today, BOOKING_WINDOW_DAYS - 1)
}

export function isBookableDate(iso: string, today = todayISO()): boolean {
  return iso >= today && iso <= maxBookingISO(today)
}

export function formatHugeDate(d: Date | string = new Date()): {
  weekday: string
  dateLine: string
  year: string
} {
  const date = typeof d === 'string' ? parseISODate(d) : d
  const week = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()]!
  return {
    weekday: week,
    dateLine: `${date.getMonth() + 1}月${date.getDate()}日`,
    year: `${date.getFullYear()}`,
  }
}

export function formatElapsed(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}`
  return `${pad2(m)}:${pad2(s)}`
}
