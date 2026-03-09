import type { Room } from '@/types'
import { useProgress } from '@/hooks/useProgress'
import { hasJoinedRoom } from '@/lib/variantCache'
import { RoomCard } from './RoomCard'

interface RoomCardWithProgressProps {
  room: Room
  uid: string
}

export function RoomCardWithProgress({ room, uid }: RoomCardWithProgressProps) {
  const { progress } = useProgress(room.id, uid)
  const hasJoined = hasJoinedRoom(room.id, uid)

  return (
    <RoomCard
      room={room}
      progress={progress}
      generating={false}
      hasJoined={hasJoined}
      locked={false}
    />
  )
}
