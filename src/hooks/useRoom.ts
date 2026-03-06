import { useEffect, useState } from 'react'
import type { Room, Difficulty } from '@/types'
import { getActiveRoom, createRoom, expireOldRooms, getRandomQuestionIds, incrementParticipants } from '@/lib/roomUtils'
import { db, doc, onSnapshot } from '@/lib/firebase'

export function useRoom(level: Difficulty | null) {
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!level) return

    let unsubscribeRoom: (() => void) | null = null
    let cancelled = false

    async function loadRoom() {
      if (!level) return
      try {
        setLoading(true)
        await expireOldRooms()
        let activeRoom = await getActiveRoom(level)

        if (!activeRoom) {
          const questionIds = await getRandomQuestionIds(level, 10)
          activeRoom = await createRoom(level, questionIds)
        }

        if (cancelled) return

        // Subscribe to real-time updates on the room doc (catches participant count changes etc.)
        unsubscribeRoom = onSnapshot(doc(db, 'rooms', activeRoom.id), (snap) => {
          if (snap.exists()) {
            setRoom({ id: snap.id, ...snap.data() } as Room)
          }
          setLoading(false)
        }, () => {
          setLoading(false)
        })
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load room')
          setLoading(false)
        }
      }
    }

    loadRoom()
    return () => {
      cancelled = true
      unsubscribeRoom?.()
    }
  }, [level])

  return { room, loading, error }
}

export async function joinRoom(roomId: string, _uid: string, alreadyJoined: boolean): Promise<void> {
  if (!alreadyJoined) {
    await incrementParticipants(roomId)
  }
}

export async function getRoomById(roomId: string): Promise<Room | null> {
  return new Promise((resolve) => {
    const unsubscribe = onSnapshot(doc(db, 'rooms', roomId), (snap) => {
      unsubscribe()
      if (!snap.exists()) { resolve(null); return }
      resolve({ id: snap.id, ...snap.data() } as Room)
    }, () => resolve(null))
  })
}
