import { useEffect, useState } from 'react'
import type { RoomParticipant, RoomProgress, LeaderboardEntry } from '@/types'
import { db, collection, onSnapshot } from '@/lib/firebase'

export function useLeaderboard(roomId: string | null) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roomId) return

    setLoading(true)

    let participants: RoomParticipant[] = []
    let progressMap: Record<string, RoomProgress> = {}
    let participantsReady = false
    let progressReady = false

    function merge() {
      if (!participantsReady || !progressReady) return

      const merged: LeaderboardEntry[] = participants.map((p) => {
        const prog = progressMap[p.uid]
        return {
          uid: p.uid,
          displayName: p.displayName,
          photoURL: p.photoURL,
          joinedAt: p.joinedAt,
          level: p.level ?? 'beginner',
          points: prog?.points ?? 0,
          solvedQuestionIds: prog?.solvedQuestionIds ?? [],
          totalSolveTime: prog?.totalSolveTime ?? 0,
        }
      })

      merged.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        if (a.totalSolveTime !== b.totalSolveTime) return a.totalSolveTime - b.totalSolveTime
        return a.joinedAt - b.joinedAt
      })

      setEntries(merged.slice(0, 10))
      setLoading(false)
    }

    const unsubParticipants = onSnapshot(
      collection(db, 'rooms', roomId, 'participants'),
      (snap) => {
        participants = snap.docs.map((d) => d.data() as RoomParticipant)
        participantsReady = true
        merge()
      },
      () => { participantsReady = true; merge() },
    )

    const unsubProgress = onSnapshot(
      collection(db, 'rooms', roomId, 'progress'),
      (snap) => {
        progressMap = {}
        snap.docs.forEach((d) => { progressMap[d.id] = d.data() as RoomProgress })
        progressReady = true
        merge()
      },
      () => { progressReady = true; merge() },
    )

    return () => {
      unsubParticipants()
      unsubProgress()
    }
  }, [roomId])

  return { entries, loading }
}
