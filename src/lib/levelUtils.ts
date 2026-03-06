import type { Difficulty } from '@/types'
import { LEVEL_ORDER, LEVEL_TIME_LIMITS } from '@/types'

export function getLevelFromSolvedCount(count: number): Difficulty {
  if (count >= 35) return 'pro'
  if (count >= 20) return 'hard'
  if (count >= 10) return 'medium'
  if (count >= 5) return 'easy'
  return 'beginner'
}

export function getNextLevel(current: Difficulty): Difficulty | null {
  const idx = LEVEL_ORDER.indexOf(current)
  if (idx === -1 || idx === LEVEL_ORDER.length - 1) return null
  return LEVEL_ORDER[idx + 1]
}

export function checkLevelUp(
  currentLevel: Difficulty,
  solvedCount: number,
  totalSolveTime: number,
): Difficulty {
  if (solvedCount < 10) return currentLevel
  const limit = LEVEL_TIME_LIMITS[currentLevel]
  if (totalSolveTime <= limit) {
    const next = getNextLevel(currentLevel)
    return next ?? currentLevel
  }
  return currentLevel
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

export function formatCountdown(expiryDate: number): string {
  const remaining = expiryDate - Date.now()
  if (remaining <= 0) return 'Expired'

  const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) return `${days}d ${hours}h remaining`
  if (hours > 0) return `${hours}h ${minutes}m remaining`
  return `${minutes}m remaining`
}
