import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { pruneExpiredCaches } from '@/lib/variantCache'
import { RoomCard } from '@/components/RoomCard'
import { RoomCardWithProgress } from '@/components/RoomCardWithProgress'
import { LevelBadge } from '@/components/LevelBadge'
import { LEVEL_ORDER, LEVEL_TIME_LIMITS, LEVEL_LABELS, type Room } from '@/types'
import { formatTime } from '@/lib/levelUtils'
import {
  getAllActiveRooms,
  getActiveRoom,
  createRoom,
  getRandomQuestionIds,
  expireOldRooms,
  getPastRooms,
  deleteExpiredRooms,
} from '@/lib/roomUtils'
import { Code2, Trophy, LogOut, History, ChevronRight } from 'lucide-react'

export function Dashboard() {
  const { user, profile, logout } = useAuth()

  const [rooms, setRooms] = useState<Room[]>([])
  const [pastRooms, setPastRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    pruneExpiredCaches()
  }, [])

  useEffect(() => {
    if (!profile) return

    async function loadRooms() {
      if (!profile) return
      setLoading(true)

      await expireOldRooms()

      let allRooms = await getAllActiveRooms()

      // Fallback: ensure user's own level always has a room (in case cron hasn't run yet)
      const hasOwnRoom = allRooms.some((r) => r.level === profile.level)
      if (!hasOwnRoom) {
        let ownRoom = await getActiveRoom(profile.level)
        if (!ownRoom) {
          const questionIds = await getRandomQuestionIds(profile.level, 10)
          ownRoom = await createRoom(profile.level, questionIds)
        }
        allRooms = [...allRooms, ownRoom].sort(
          (a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level),
        )
      }

      setRooms(allRooms)
      setLoading(false)

      // Load past contests and clean up stale rooms (fire-and-forget)
      deleteExpiredRooms()
      getPastRooms(profile.level).then(setPastRooms)
    }

    loadRooms()
  }, [profile?.level])

  const userLevelIdx = profile ? LEVEL_ORDER.indexOf(profile.level) : -1

  const ownLevelRoom = rooms.find((r) => r.level === profile?.level) ?? null

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0d1117' }}>
      <nav className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 size={22} className="text-green-400" />
          <span className="text-white font-bold text-lg">FunCode</span>
        </div>
        <div className="flex items-center gap-4">
          {ownLevelRoom && (
            <Link
              to={`/room/${ownLevelRoom.id}/leaderboard`}
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
        {/* Header */}
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
              <div className="text-gray-600">
                for all 10 questions in {LEVEL_LABELS[profile.level]} room
              </div>
            </div>
          )}
        </div>

        {/* Active Rooms */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-48 rounded-xl bg-gray-900/60 border border-gray-800 animate-pulse"
              />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Code2 size={48} className="mx-auto mb-4 text-gray-700" />
            <p>No active rooms found.</p>
            <p className="text-sm mt-1">Check back soon — rooms are created daily.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rooms.map((room) => {
              const roomLevelIdx = LEVEL_ORDER.indexOf(room.level)
              const isLocked = roomLevelIdx > userLevelIdx
              const isOwnLevel = room.level === profile?.level

              return (
                <div key={room.id}>
                  {isOwnLevel && (
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"
                      />
                      Your Room
                    </div>
                  )}
                  {isLocked ? (
                    <RoomCard
                      room={room}
                      progress={null}
                      generating={false}
                      locked={true}
                    />
                  ) : user ? (
                    <RoomCardWithProgress room={room} uid={user.uid} />
                  ) : null}
                </div>
              )
            })}
          </div>
        )}

        {/* Past Contests */}
        {pastRooms.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <History size={16} className="text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Past Contests
              </h2>
            </div>
            <div className="rounded-xl border border-gray-800 overflow-hidden">
              {pastRooms.map((room, idx) => {
                const endedDate = new Date(room.expiryDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
                return (
                  <div
                    key={room.id}
                    className={`flex items-center justify-between px-5 py-3 hover:bg-gray-900/40 transition-colors ${
                      idx < pastRooms.length - 1 ? 'border-b border-gray-800/60' : ''
                    }`}
                  >
                    <div>
                      <span className="text-sm text-gray-200">{room.roomName}</span>
                      <span className="text-xs text-gray-600 ml-3">Ended {endedDate}</span>
                    </div>
                    <Link
                      to={`/room/${room.id}/leaderboard`}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      View Results
                      <ChevronRight size={12} />
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
