import { useNavigate } from 'react-router-dom'
import type { RoomCache, RoomProgress } from '@/types'
import { CheckCircle, Circle, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProblemListProps {
  roomId: string
  cache: RoomCache
  progress: RoomProgress | null
}

export function ProblemList({ roomId, cache, progress }: ProblemListProps) {
  const navigate = useNavigate()
  const solvedIds = new Set(progress?.solvedQuestionIds ?? [])

  const orderedVariants = cache.problemOrder.map((idx) => cache.variants[idx]).filter(Boolean)

  return (
    <div className="space-y-2">
      {orderedVariants.map((variant, displayIdx) => {
        const isSolved = solvedIds.has(variant.questionId)
        return (
          <button
            key={variant.questionId}
            onClick={() => navigate(`/room/${roomId}/problem/${variant.questionId}`)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all',
              isSolved
                ? 'border-green-700/40 bg-green-900/10 hover:bg-green-900/20'
                : 'border-gray-700/40 bg-gray-900/20 hover:bg-gray-800/40',
            )}
          >
            <span className="text-xs text-gray-500 w-5 shrink-0">{displayIdx + 1}</span>
            <span className="shrink-0">
              {isSolved ? (
                <CheckCircle size={16} className="text-green-500" />
              ) : (
                <Circle size={16} className="text-gray-600" />
              )}
            </span>
            <span
              className={cn('flex-1 text-sm font-medium truncate', isSolved ? 'text-green-400' : 'text-gray-200')}
            >
              {variant.variantTitle}
            </span>
            {isSolved && (
              <span className="text-xs text-green-600 shrink-0">+10 pts</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

interface LockedProblemListProps {
  count: number
}

export function LockedProblemList({ count }: LockedProblemListProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-800 bg-gray-900/10"
        >
          <span className="text-xs text-gray-600 w-5">{i + 1}</span>
          <Lock size={14} className="text-gray-700 shrink-0" />
          <div className="h-4 bg-gray-800 rounded flex-1 animate-pulse" />
        </div>
      ))}
    </div>
  )
}
