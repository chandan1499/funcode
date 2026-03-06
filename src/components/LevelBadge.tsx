import type { Difficulty } from '@/types'
import { LEVEL_LABELS, LEVEL_COLORS } from '@/types'
import { cn } from '@/lib/utils'

interface LevelBadgeProps {
  level: Difficulty
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LevelBadge({ level, size = 'md', className }: LevelBadgeProps) {
  const color = LEVEL_COLORS[level]
  const label = LEVEL_LABELS[level]

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }

  return (
    <span
      className={cn('inline-flex items-center rounded-full font-semibold border', sizes[size], className)}
      style={{
        color,
        borderColor: color,
        backgroundColor: `${color}15`,
      }}
    >
      {label}
    </span>
  )
}
