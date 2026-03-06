import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Room, RoomProgress } from '@/types'
import { LEVEL_COLORS } from '@/types'
import { formatCountdown } from '@/lib/levelUtils'
import { LevelBadge } from './LevelBadge'
import { Clock, Users, Trophy } from 'lucide-react'

interface RoomCardProps {
  room: Room
  progress: RoomProgress | null
  generating: boolean
  hasJoined?: boolean
}

export function RoomCard({ room, progress, generating, hasJoined = false }: RoomCardProps) {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(formatCountdown(room.expiryDate))
  const color = LEVEL_COLORS[room.level]
  const solved = progress?.solvedQuestionIds.length ?? 0
  const isExpired = room.status === 'expired' || Date.now() > room.expiryDate

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(formatCountdown(room.expiryDate))
    }, 60000)
    return () => clearInterval(interval)
  }, [room.expiryDate])

  return (
    <div
      className="rounded-xl border p-6 cursor-pointer transition-all hover:scale-[1.01]"
      style={{ borderColor: `${color}40`, background: `linear-gradient(135deg, #161b22 0%, ${color}08 100%)` }}
      onClick={() => !generating && navigate(`/room/${room.id}`)}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">{room.roomName}</h2>
          <LevelBadge level={room.level} />
        </div>
        {isExpired && (
          <span className="text-xs bg-red-900/40 text-red-400 border border-red-700/40 rounded-full px-3 py-1">
            Expired
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Clock size={14} style={{ color }} />
          <span>{countdown}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Users size={14} style={{ color }} />
          <span>{room.totalParticipants} players</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Trophy size={14} style={{ color }} />
          <span>{progress?.points ?? 0} pts</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{solved} / 10 solved</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{ width: `${(solved / 10) * 100}%`, backgroundColor: color }}
          />
        </div>
      </div>

      {generating ? (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div
            className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: color, borderTopColor: 'transparent' }}
          />
          Generating your personalized questions with AI...
        </div>
      ) : (
        <button
          className="w-full py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}
          onClick={(e) => { e.stopPropagation(); navigate(`/room/${room.id}`) }}
        >
          {solved === 10 ? 'View Room' : (solved > 0 || hasJoined) ? 'Continue →' : 'Enter Room →'}
        </button>
      )}
    </div>
  )
}
