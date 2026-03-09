import type { Difficulty, Room } from '@/types'
import { LEVEL_ORDER } from '@/types'
import {
  db,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  increment,
} from './firebase'

export function getRoomId(level: Difficulty): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${level}_${yyyy}_${mm}_${dd}`
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

/** Fetches all currently active rooms across all levels, sorted by LEVEL_ORDER. */
export async function getAllActiveRooms(): Promise<Room[]> {
  const q = query(collection(db, 'rooms'), where('status', '==', 'active'))
  const snap = await getDocs(q)
  const rooms = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Room)
  return rooms.sort(
    (a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level),
  )
}

/** Returns the last 5 expired rooms for a given level, newest first. */
export async function getPastRooms(level: Difficulty): Promise<Room[]> {
  const q = query(
    collection(db, 'rooms'),
    where('level', '==', level),
    where('status', '==', 'expired'),
  )
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Room)
    .sort((a, b) => b.expiryDate - a.expiryDate)
    .slice(0, 5)
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

/** Deletes expired rooms that are older than 7 days, including their subcollections. */
export async function deleteExpiredRooms(): Promise<void> {
  const cutoff = Date.now() - SEVEN_DAYS_MS
  const q = query(collection(db, 'rooms'), where('status', '==', 'expired'))
  const snap = await getDocs(q)

  for (const roomDoc of snap.docs) {
    const room = roomDoc.data() as Room
    if (room.expiryDate > cutoff) continue

    for (const sub of ['progress', 'participants']) {
      const subSnap = await getDocs(collection(db, 'rooms', roomDoc.id, sub))
      for (const d of subSnap.docs) await deleteDoc(d.ref)
    }
    await deleteDoc(roomDoc.ref)
  }
}

export async function createRoom(
  level: Difficulty,
  questionIds: string[],
): Promise<Room> {
  const now = Date.now()
  const expiryDate = now + 24 * 60 * 60 * 1000 // 24 hours
  const roomId = getRoomId(level)
  const date = new Date()
  const week = Math.ceil(
    ((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7,
  )
  const year = date.getFullYear()

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
