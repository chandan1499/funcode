import { useEffect, useState } from 'react'
import type { RoomProgress, SolveDetail } from '@/types'
import { db, doc, setDoc, updateDoc, arrayUnion, increment, onSnapshot } from '@/lib/firebase'

export function useProgress(roomId: string | null, uid: string | null) {
  const [progress, setProgress] = useState<RoomProgress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roomId || !uid) return

    setLoading(true)
    const ref = doc(db, 'rooms', roomId, 'progress', uid)

    const unsubscribe = onSnapshot(ref, (snap) => {
      setProgress(snap.exists() ? (snap.data() as RoomProgress) : null)
      setLoading(false)
    }, () => {
      setLoading(false)
    })

    return () => unsubscribe()
  }, [roomId, uid])

  return { progress, setProgress, loading }
}

export async function recordSolve(
  roomId: string,
  uid: string,
  displayName: string,
  photoURL: string,
  solveDetail: SolveDetail,
  existingProgress: RoomProgress | null,
): Promise<RoomProgress> {
  const ref = doc(db, 'rooms', roomId, 'progress', uid)

  if (!existingProgress) {
    const newProgress: RoomProgress = {
      uid,
      displayName,
      photoURL,
      solvedQuestionIds: [solveDetail.questionId],
      points: 10,
      solveDetails: [solveDetail],
      totalSolveTime: solveDetail.timeTaken,
    }
    await setDoc(ref, newProgress)
    return newProgress
  }

  await updateDoc(ref, {
    solvedQuestionIds: arrayUnion(solveDetail.questionId),
    points: increment(10),
    solveDetails: arrayUnion(solveDetail),
    totalSolveTime: increment(solveDetail.timeTaken),
  })

  return {
    ...existingProgress,
    solvedQuestionIds: [...existingProgress.solvedQuestionIds, solveDetail.questionId],
    points: existingProgress.points + 10,
    solveDetails: [...existingProgress.solveDetails, solveDetail],
    totalSolveTime: existingProgress.totalSolveTime + solveDetail.timeTaken,
  }
}

export async function updateUserLevel(uid: string, level: string, totalSolvedCount: number) {
  await updateDoc(doc(db, 'users', uid), {
    level,
    totalSolvedCount,
  })
}
