export function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}

export function todayISO(d = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function formatHugeDate(d = new Date()): { weekday: string; dateLine: string; year: string } {
  const week = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][d.getDay()]!
  return {
    weekday: week,
    dateLine: `${d.getMonth() + 1}月${d.getDate()}日`,
    year: `${d.getFullYear()}`,
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
