import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useVariants } from '@/hooks/useVariants'
import { useProgress } from '@/hooks/useProgress'
import { getRoomById } from '@/hooks/useRoom'
import { pruneExpiredCaches, hasJoinedRoom, markRoomJoined } from '@/lib/variantCache'
import { db, doc, runTransaction, increment } from '@/lib/firebase'
import type { Room } from '@/types'
import { LevelBadge } from '@/components/LevelBadge'
import { ProblemList, LockedProblemList } from '@/components/ProblemList'
import { formatCountdown } from '@/lib/levelUtils'
import { ArrowLeft, Trophy, Users, Clock, Zap } from 'lucide-react'
import { LEVEL_COLORS } from '@/types'

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState('')
  const [now, setNow] = useState(() => Date.now())

  const { cache, generating } = useVariants(room, user?.uid ?? null)
  const { progress } = useProgress(roomId ?? null, user?.uid ?? null)

  useEffect(() => {
    pruneExpiredCaches()
    if (!roomId || !user) return

    async function load() {
      if (!roomId || !user) return
      setLoading(true)
      const r = await getRoomById(roomId)
      setRoom(r)

      if (r) {
        if (!hasJoinedRoom(r.id, user.uid)) {
          const participantRef = doc(db, 'rooms', r.id, 'participants', user.uid)
          const roomRef = doc(db, 'rooms', r.id)

          // Atomic transaction: only one concurrent call can write + increment
          await runTransaction(db, async (tx) => {
            const participantSnap = await tx.get(participantRef)
            if (!participantSnap.exists()) {
              tx.set(participantRef, {
                uid: user.uid,
                displayName: user.displayName ?? 'Anonymous',
                photoURL: user.photoURL ?? '',
                joinedAt: Date.now(),
              })
              tx.update(roomRef, { totalParticipants: increment(1) })
            }
          })

          markRoomJoined(r.id, user.uid)
        }
        setCountdown(formatCountdown(r.expiryDate))
      }
      setLoading(false)
    }

    load()
  }, [roomId, user])

  useEffect(() => {
    if (!room) return
    const interval = setInterval(() => {
      setNow(Date.now())
      setCountdown(formatCountdown(room.expiryDate))
    }, 60000)
    return () => clearInterval(interval)
  }, [room])

  const color = room ? LEVEL_COLORS[room.level] : '#22c55e'
  const solved = progress?.solvedQuestionIds.length ?? 0
  const isExpired = room ? (room.status === 'expired' || now > room.expiryDate) : false

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0d1117' }}>
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500" style={{ backgroundColor: '#0d1117' }}>
        Room not found.
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0d1117' }}>
      <nav className="flex items-center justify-between px-6 py-3 border-b border-gray-800">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          Dashboard
        </button>
        <Link
          to={`/room/${room.id}/leaderboard`}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <Trophy size={14} />
          Leaderboard
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div
          className="rounded-xl border p-6 mb-8"
          style={{ borderColor: `${color}40`, background: `linear-gradient(135deg, #161b22 0%, ${color}08 100%)` }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{room.roomName}</h1>
              <div className="flex items-center gap-2">
                <LevelBadge level={room.level} />
                {isExpired && (
                  <span className="text-xs bg-red-900/30 text-red-400 border border-red-700/40 rounded-full px-2.5 py-0.5">
                    Expired
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold" style={{ color }}>
                {progress?.points ?? 0}
              </div>
              <div className="text-xs text-gray-500">points</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock size={14} style={{ color }} />
              <span>{isExpired ? 'Expired' : countdown}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Users size={14} style={{ color }} />
              <span>{room.totalParticipants} players</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Zap size={14} style={{ color }} />
              <span>10 pts / question</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{solved} / 10 questions solved</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{ width: `${(solved / 10) * 100}%`, backgroundColor: color }}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Your Problems
            </h2>
            {generating && (
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <div
                  className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: color, borderTopColor: 'transparent' }}
                />
                Generating AI variants...
              </span>
            )}
          </div>

          {cache ? (
            <ProblemList roomId={room.id} cache={cache} progress={progress} />
          ) : (
            <LockedProblemList count={10} />
          )}
        </div>
      </div>
    </div>
  )
}
