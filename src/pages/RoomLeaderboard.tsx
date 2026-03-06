import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { getRoomById } from '@/hooks/useRoom'
import { LeaderboardTable } from '@/components/LeaderboardTable'
import { LevelBadge } from '@/components/LevelBadge'
import type { Room } from '@/types'
import { LEVEL_COLORS, LEVEL_TIME_LIMITS, LEVEL_LABELS } from '@/types'
import { formatCountdown, formatTime } from '@/lib/levelUtils'
import { ArrowLeft, Trophy, Clock } from 'lucide-react'

export function RoomLeaderboard() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [room, setRoom] = useState<Room | null>(null)

  const { entries, loading } = useLeaderboard(roomId ?? null)

  useEffect(() => {
    if (!roomId) return
    getRoomById(roomId).then(setRoom)
  }, [roomId])

  if (!room && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500" style={{ backgroundColor: '#0d1117' }}>
        Room not found.
      </div>
    )
  }

  const color = room ? LEVEL_COLORS[room.level] : '#22c55e'
  const isExpired = room ? (room.status === 'expired' || Date.now() > room.expiryDate) : false

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0d1117' }}>
      <nav className="flex items-center justify-between px-6 py-3 border-b border-gray-800">
        <button
          onClick={() => navigate(roomId ? `/room/${roomId}` : '/')}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Room
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Trophy size={28} style={{ color }} />
          <div>
            <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
            {room && (
              <div className="flex items-center gap-2 mt-1">
                <LevelBadge level={room.level} size="sm" />
                <span className="text-gray-500 text-sm">{room.roomName}</span>
                {isExpired && (
                  <span className="text-xs bg-red-900/30 text-red-400 border border-red-700/40 rounded-full px-2 py-0.5">
                    Final Results
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {room && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div
              className="rounded-lg border p-4"
              style={{ borderColor: `${color}30`, backgroundColor: `${color}08` }}
            >
              <div className="text-xs text-gray-500 mb-1">Room Status</div>
              <div className="flex items-center gap-2">
                <Clock size={14} style={{ color }} />
                <span className="text-sm text-gray-200">
                  {isExpired ? 'Expired' : formatCountdown(room.expiryDate)}
                </span>
              </div>
            </div>
            <div
              className="rounded-lg border p-4"
              style={{ borderColor: `${color}30`, backgroundColor: `${color}08` }}
            >
              <div className="text-xs text-gray-500 mb-1">Level-Up Target</div>
              <div className="text-sm text-gray-200">
                All 10 in{' '}
                <span style={{ color }} className="font-semibold">
                  {formatTime(LEVEL_TIME_LIMITS[room.level])}
                </span>{' '}
                → {LEVEL_LABELS[room.level]} → next level
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-gray-900/40 border border-gray-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <LeaderboardTable entries={entries} currentUid={user?.uid} />
        )}

        {entries.length > 0 && !isExpired && (
          <p className="text-xs text-gray-600 text-center mt-4">
            Ranked by points earned. Ties broken by total solve time (lower is better).
          </p>
        )}
      </div>
    </div>
  )
}
