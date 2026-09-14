const NICKNAMES = [
  '闪电兔',
  '充电喵',
  '电电仔',
  '瓦特熊',
  '伏特狐',
  '安培鸭',
  '能量豆',
  '闪闪星',
  '电波鼠',
  '超充鹅',
  '霹雳猫',
  '绿电鹿',
]

export function randomNickname(): string {
  return NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)]!
}

export function shortSessionBadge(sessionId: string): string {
  return sessionId.slice(-4).toUpperCase()
}
