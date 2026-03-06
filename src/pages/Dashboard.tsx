import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useRoom } from '@/hooks/useRoom'
import { useProgress } from '@/hooks/useProgress'
import { pruneExpiredCaches, hasJoinedRoom } from '@/lib/variantCache'
import { RoomCard } from '@/components/RoomCard'
import { LevelBadge } from '@/components/LevelBadge'
import { LEVEL_TIME_LIMITS, LEVEL_LABELS } from '@/types'
import { formatTime } from '@/lib/levelUtils'
import { Code2, Trophy, LogOut } from 'lucide-react'

export function Dashboard() {
  const { user, profile, logout } = useAuth()
  const { room, loading: roomLoading } = useRoom(profile?.level ?? null)
  const { progress, loading: progressLoading } = useProgress(room?.id ?? null, user?.uid ?? null)

  useEffect(() => {
    pruneExpiredCaches()
  }, [])

  const isLoading = roomLoading || progressLoading

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0d1117' }}>
      <nav className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 size={22} className="text-green-400" />
          <span className="text-white font-bold text-lg">FunCode</span>
        </div>
        <div className="flex items-center gap-4">
          {room && (
            <Link
              to={`/room/${room.id}/leaderboard`}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <Trophy size={15} />
              Leaderboard
            </Link>
          )}
          <div className="flex items-center gap-2">
            {user?.photoURL && (
              <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" />
            )}
            <span className="text-sm text-gray-300">{user?.displayName}</span>
          </div>
          <button
            onClick={logout}
            className="text-gray-500 hover:text-gray-300 transition-colors"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Welcome back, {user?.displayName?.split(' ')[0]}
            </h1>
            <div className="flex items-center gap-3">
              {profile && <LevelBadge level={profile.level} size="md" />}
              <span className="text-gray-500 text-sm">
                {profile?.totalSolvedCount ?? 0} total questions solved
              </span>
            </div>
          </div>
          {profile && (
            <div className="text-right text-xs text-gray-500">
              <div>Time limit to level up:</div>
              <div className="text-gray-400 font-mono">
                {formatTime(LEVEL_TIME_LIMITS[profile.level])}
              </div>
              <div className="text-gray-600">for all 10 questions in {LEVEL_LABELS[profile.level]} room</div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-48 rounded-xl bg-gray-900/60 border border-gray-800 animate-pulse" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-gray-900/40 border border-gray-800/40 animate-pulse" />
              ))}
            </div>
          </div>
        ) : room ? (
          <RoomCard
            room={room}
            progress={progress}
            generating={false}
            hasJoined={user ? hasJoinedRoom(room.id, user.uid) : false}
          />
        ) : (
          <div className="text-center py-16 text-gray-500">
            <Code2 size={48} className="mx-auto mb-4 text-gray-700" />
            <p>No active room found for your level.</p>
            <p className="text-sm mt-1">Check back soon — rooms are created weekly.</p>
          </div>
        )}
      </div>
    </div>
  )
}
