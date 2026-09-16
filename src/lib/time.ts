/** Business calendar/clock for 邻里充电 — always Asia/Shanghai. */
export const BUSINESS_TZ = 'Asia/Shanghai'

export function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}

/** Wall-clock hour 0–23 in Asia/Shanghai. */
export function shanghaiHour(d = new Date()): number {
  const hour = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TZ,
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(d).find((p) => p.type === 'hour')?.value
  return Number(hour ?? '0')
}

/** YYYY-MM-DD in Asia/Shanghai. */
export function todayISO(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
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
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
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
  if (typeof d === 'string') {
    const date = parseISODate(d)
    const week = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()]!
    return {
      weekday: week,
      dateLine: `${date.getMonth() + 1}月${date.getDate()}日`,
      year: `${date.getFullYear()}`,
    }
  }
  const weekday = new Intl.DateTimeFormat('zh-CN', {
    timeZone: BUSINESS_TZ,
    weekday: 'long',
  }).format(d)
  const month = new Intl.DateTimeFormat('zh-CN', {
    timeZone: BUSINESS_TZ,
    month: 'numeric',
  }).format(d)
  const day = new Intl.DateTimeFormat('zh-CN', {
    timeZone: BUSINESS_TZ,
    day: 'numeric',
  }).format(d)
  const year = new Intl.DateTimeFormat('zh-CN', {
    timeZone: BUSINESS_TZ,
    year: 'numeric',
  }).format(d)
  return {
    weekday,
    dateLine: `${month.replace(/\D/g, '')}月${day.replace(/\D/g, '')}日`,
    year: year.replace(/\D/g, ''),
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

/** Clock-driven idle-bar focus in Asia/Shanghai: 08→今早, 12→中午, 18→今晚. */
export type IdlePeriodFocus = 'morning' | 'noon' | 'evening'

export function currentIdlePeriodFromHour(hour: number): IdlePeriodFocus {
  if (hour >= 18 || hour < 8) return 'evening'
  if (hour >= 12) return 'noon'
  return 'morning'
}

export function currentIdlePeriod(d = new Date()): IdlePeriodFocus {
  return currentIdlePeriodFromHour(shanghaiHour(d))
}
