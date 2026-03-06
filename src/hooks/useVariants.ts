import { useState, useEffect } from 'react'
import type { Room, Question, Variant, RoomCache } from '@/types'
import { getCachedRoom, setCachedRoom, shuffleArray } from '@/lib/variantCache'
import { generateAllVariants } from '@/lib/groq'
import { db, collection, getDocs, query, where } from '@/lib/firebase'

interface UseVariantsResult {
  cache: RoomCache | null
  loading: boolean
  error: string | null
  generating: boolean
}

export function useVariants(room: Room | null, uid: string | null): UseVariantsResult {
  const [cache, setCache] = useState<RoomCache | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!room || !uid) return

    let cancelled = false

    async function loadVariants() {
      if (!room || !uid) return
      setLoading(true)

      const cached = getCachedRoom(room.id, uid)
      if (cached) {
        if (!cancelled) {
          setCache(cached)
          setLoading(false)
        }
        return
      }

      try {
        setGenerating(true)

        const q = query(
          collection(db, 'questions'),
          where('__name__', 'in', room.questionIds),
        )
        const snap = await getDocs(q)
        const questions = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Question[]

        const orderedQuestions = room.questionIds
          .map((id) => questions.find((q) => q.id === id))
          .filter(Boolean) as Question[]

        const variants: Variant[] = await generateAllVariants(orderedQuestions)
        const problemOrder = shuffleArray(Array.from({ length: room.questionIds.length }, (_, i) => i))

        setCachedRoom(room.id, uid, room.expiryDate, problemOrder, variants)

        if (!cancelled) {
          setCache({ roomId: room.id, expiryDate: room.expiryDate, problemOrder, variants })
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to generate variants')
          const fallbackVariants: Variant[] = room.questionIds.map((qid) => ({
            questionId: qid,
            variantTitle: qid,
            variantDescription: 'Failed to load variant. Please refresh.',
            variantExamples: [],
          }))
          const problemOrder = Array.from({ length: room.questionIds.length }, (_, i) => i)
          setCachedRoom(room.id, uid, room.expiryDate, problemOrder, fallbackVariants)
          if (!cancelled) {
            setCache({ roomId: room.id, expiryDate: room.expiryDate, problemOrder, variants: fallbackVariants })
          }
        }
      } finally {
        if (!cancelled) {
          setGenerating(false)
          setLoading(false)
        }
      }
    }

    loadVariants()
    return () => { cancelled = true }
  }, [room?.id, uid])

  return { cache, loading, error, generating }
}
