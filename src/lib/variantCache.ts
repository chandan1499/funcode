import type { RoomCache, Variant } from '@/types'

function cacheKey(roomId: string, uid: string): string {
  return `funcode_${roomId}_${uid}`
}

export function getCachedRoom(roomId: string, uid: string): RoomCache | null {
  try {
    const raw = localStorage.getItem(cacheKey(roomId, uid))
    if (!raw) return null
    const cache: RoomCache = JSON.parse(raw)
    if (Date.now() > cache.expiryDate) {
      localStorage.removeItem(cacheKey(roomId, uid))
      return null
    }
    return cache
  } catch {
    return null
  }
}

export function setCachedRoom(
  roomId: string,
  uid: string,
  expiryDate: number,
  problemOrder: number[],
  variants: Variant[],
): void {
  const cache: RoomCache = { roomId, expiryDate, problemOrder, variants }
  localStorage.setItem(cacheKey(roomId, uid), JSON.stringify(cache))
}

export function pruneExpiredCaches(): void {
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith('funcode_')) continue
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const cache: RoomCache = JSON.parse(raw)
      if (Date.now() > cache.expiryDate) {
        keysToRemove.push(key)
      }
    } catch {
      keysToRemove.push(key!)
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k))
}

// Separate join-tracking key — not tied to variant cache lifetime
function joinKey(roomId: string, uid: string): string {
  return `funcode_joined_${roomId}_${uid}`
}

export function hasJoinedRoom(roomId: string, uid: string): boolean {
  return localStorage.getItem(joinKey(roomId, uid)) === '1'
}

export function markRoomJoined(roomId: string, uid: string): void {
  localStorage.setItem(joinKey(roomId, uid), '1')
}

export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}
