import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Room, RoomProgress } from '@/types'
import { LEVEL_COLORS, LEVEL_LABELS } from '@/types'
import { formatCountdown } from '@/lib/levelUtils'
import { LevelBadge } from './LevelBadge'
import { Clock, Users, Trophy, Lock } from 'lucide-react'

interface RoomCardProps {
  room: Room
  progress: RoomProgress | null
  generating: boolean
  hasJoined?: boolean
  locked?: boolean
}

export function RoomCard({
  room,
  progress,
  generating,
  hasJoined = false,
  locked = false,
}: RoomCardProps) {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(formatCountdown(room.expiryDate))
  const [now, setNow] = useState(() => Date.now())
  const color = locked ? '#4b5563' : LEVEL_COLORS[room.level]
  const solved = progress?.solvedQuestionIds.length ?? 0
  const isExpired = room.status === 'expired' || now > room.expiryDate

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now())
      setCountdown(formatCountdown(room.expiryDate))
    }, 60000)
    return () => clearInterval(interval)
  }, [room.expiryDate])

  const handleClick = () => {
    if (!locked && !generating) navigate(`/room/${room.id}`)
  }

  return (
    <div
      className={`rounded-xl border p-6 transition-all ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.01]'}`}
      style={{
        borderColor: `${color}40`,
        background: locked
          ? 'linear-gradient(135deg, #161b22 0%, #1f293720 100%)'
          : `linear-gradient(135deg, #161b22 0%, ${color}08 100%)`,
      }}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">{room.roomName}</h2>
          <LevelBadge level={room.level} />
        </div>
        <div className="flex items-center gap-2">
          {locked && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-800/60 border border-gray-700/40 rounded-full px-3 py-1">
              <Lock size={11} />
              Reach {LEVEL_LABELS[room.level]} to unlock
            </div>
          )}
          {!locked && isExpired && (
            <span className="text-xs bg-red-900/40 text-red-400 border border-red-700/40 rounded-full px-3 py-1">
              Expired
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Clock size={14} style={{ color }} />
          <span>{locked ? '—' : countdown}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Users size={14} style={{ color }} />
          <span>{locked ? '—' : `${room.totalParticipants} players`}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Trophy size={14} style={{ color }} />
          <span>{locked ? '—' : `${progress?.points ?? 0} pts`}</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{locked ? '—' : `${solved} / 10 solved`}</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          {!locked && (
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${(solved / 10) * 100}%`, backgroundColor: color }}
            />
          )}
        </div>
      </div>

      {locked ? (
        <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-600">
          <Lock size={14} />
          Locked
        </div>
      ) : generating ? (
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
