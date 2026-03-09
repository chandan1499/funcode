import type { LeaderboardEntry } from '@/types'
import { formatTime } from '@/lib/levelUtils'
import { LevelBadge } from './LevelBadge'
import { Trophy, Medal } from 'lucide-react'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  currentUid?: string
}

const RANK_ICONS: Record<number, React.ReactNode> = {
  0: <Trophy size={16} className="text-yellow-400" />,
  1: <Medal size={16} className="text-gray-400" />,
  2: <Medal size={16} className="text-amber-600" />,
}

export function LeaderboardTable({ entries, currentUid }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No one has joined this room yet.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900/60">
            <th className="text-left px-4 py-3 text-gray-400 font-medium w-12">Rank</th>
            <th className="text-left px-4 py-3 text-gray-400 font-medium">Player</th>
            <th className="text-right px-4 py-3 text-gray-400 font-medium">Solved</th>
            <th className="text-right px-4 py-3 text-gray-400 font-medium">Points</th>
            <th className="text-right px-4 py-3 text-gray-400 font-medium">Total Time</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => {
            const isMe = entry.uid === currentUid
            const hasSolved = entry.solvedQuestionIds.length > 0
            return (
              <tr
                key={entry.uid}
                className={`border-b border-gray-800/50 transition-colors ${isMe ? 'bg-blue-900/10' : 'hover:bg-gray-900/40'}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center">
                    {hasSolved
                      ? (RANK_ICONS[idx] ?? <span className="text-gray-500 font-mono">{idx + 1}</span>)
                      : <span className="text-gray-600 font-mono text-xs">—</span>
                    }
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {entry.photoURL ? (
                      <img
                        src={entry.photoURL}
                        alt={entry.displayName}
                        className="w-7 h-7 rounded-full"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-300">
                        {entry.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className={isMe ? 'text-blue-300 font-semibold' : 'text-gray-200'}>
                        {entry.displayName}
                        {isMe && <span className="text-xs text-blue-400 ml-1">(you)</span>}
                      </span>
                      {entry.level && <LevelBadge level={entry.level} size="sm" />}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-gray-300">
                  {entry.solvedQuestionIds.length} / 10
                </td>
                <td className="px-4 py-3 text-right">
                  {hasSolved
                    ? <span className="text-green-400 font-semibold">{entry.points}</span>
                    : <span className="text-gray-600">0</span>
                  }
                </td>
                <td className="px-4 py-3 text-right text-gray-400 font-mono text-xs">
                  {hasSolved ? formatTime(entry.totalSolveTime) : <span className="text-gray-600">—</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
