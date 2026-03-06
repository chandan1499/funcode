import type { Difficulty, Room } from '@/types'
import { LEVEL_ORDER } from '@/types'
import { db, collection, query, where, getDocs, doc, setDoc, updateDoc, increment } from './firebase'

export function getRoomId(level: Difficulty): string {
  const now = new Date()
  const year = now.getFullYear()
  const week = getWeekNumber(now)
  return `${level}_${year}_w${week}`
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export async function getActiveRoom(level: Difficulty): Promise<Room | null> {
  const q = query(
    collection(db, 'rooms'),
    where('level', '==', level),
    where('status', '==', 'active'),
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  const docSnap = snap.docs[0]
  return { id: docSnap.id, ...docSnap.data() } as Room
}

export async function createRoom(
  level: Difficulty,
  questionIds: string[],
): Promise<Room> {
  const now = Date.now()
  const expiryDate = now + 7 * 24 * 60 * 60 * 1000
  const roomId = getRoomId(level)
  const week = getWeekNumber(new Date())
  const year = new Date().getFullYear()

  const room: Room = {
    id: roomId,
    roomName: `${level.charAt(0).toUpperCase() + level.slice(1)} Room — Week ${week}, ${year}`,
    level,
    questionIds,
    startDate: now,
    expiryDate,
    status: 'active',
    totalParticipants: 0,
  }

  await setDoc(doc(db, 'rooms', roomId), room)
  return room
}

export async function expireOldRooms(): Promise<void> {
  const now = Date.now()
  for (const level of LEVEL_ORDER) {
    const q = query(
      collection(db, 'rooms'),
      where('level', '==', level),
      where('status', '==', 'active'),
    )
    const snap = await getDocs(q)
    for (const docSnap of snap.docs) {
      const room = docSnap.data() as Room
      if (room.expiryDate < now) {
        await updateDoc(doc(db, 'rooms', docSnap.id), { status: 'expired' })
      }
    }
  }
}

export async function incrementParticipants(roomId: string): Promise<void> {
  await updateDoc(doc(db, 'rooms', roomId), {
    totalParticipants: increment(1),
  })
}

export async function getRandomQuestionIds(
  level: Difficulty,
  count: number,
): Promise<string[]> {
  const q = query(collection(db, 'questions'), where('difficulty', '==', level))
  const snap = await getDocs(q)
  const ids = snap.docs.map((d) => d.id)
  const shuffled = ids.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
