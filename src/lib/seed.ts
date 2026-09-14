import type { Booking } from '../types'
import { BOOKABLE_SPOT } from '../types'
import { todayISO, addDaysISO } from './time'

/** Demo slow-charge bookings (6–8h) across the next 7 days */
export function seedDemoBookings(now = new Date()): Booking[] {
  const today = todayISO(now)
  const d = (n: number) => addDaysISO(today, n)

  const mk = (
    id: string,
    date: string,
    startH: number,
    hours: number,
    nickname: string,
    sessionId: string,
  ): Booking => ({
    id,
    spotId: BOOKABLE_SPOT,
    sessionId,
    nickname,
    date,
    startMin: startH * 60,
    endMin: (startH + hours) * 60,
    createdAt: new Date(now.getTime() - 86400000).toISOString(),
    checkedIn: false,
    cancelled: false,
    noShowRecorded: false,
  })

  return [
    // today — leave morning / evening gaps for booking
    mk('demo_1', d(0), 0, 7, '路过的企鹅', 'sess_demo_penguin'),
    mk('demo_2', d(0), 14, 8, '城市小狐', 'sess_demo_fox'),
    // tomorrow
    mk('demo_3', d(1), 8, 8, '早起鸟', 'sess_demo_bird'),
    mk('demo_4', d(1), 18, 6, '晚霞电车', 'sess_demo_dusk'),
    // day 2
    mk('demo_5', d(2), 6, 7, '晨光鹿', 'sess_demo_deer'),
    mk('demo_6', d(2), 16, 8, '云朵羊', 'sess_demo_sheep'),
    // day 3
    mk('demo_7', d(3), 9, 8, '周末骑士', 'sess_demo_knight'),
    // day 4
    mk('demo_8', d(4), 0, 8, '假日海豚', 'sess_demo_dolphin'),
    mk('demo_9', d(4), 12, 6, '午后电流', 'sess_demo_noon'),
    // day 5
    mk('demo_10', d(5), 10, 8, '夕阳猫', 'sess_demo_cat'),
    // day 6
    mk('demo_11', d(6), 7, 7, '绿电鹿', 'sess_demo_green'),
    mk('demo_12', d(6), 16, 8, '闪闪星', 'sess_demo_star'),
  ]
}
