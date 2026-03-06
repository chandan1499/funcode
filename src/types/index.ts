export type Difficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'pro'

export interface TestCase {
  input: unknown[]
  expectedOutput: unknown
}

export interface FirestoreTestCase {
  inputJson: string
  expectedOutputJson: string
}

export interface Example {
  input: string
  output: string
  explanation?: string
}

export interface Question {
  id: string
  title: string
  description: string
  difficulty: Difficulty
  examples: Example[]
  testCases: TestCase[]
  tags: string[]
  starterCode: string
  functionName: string
}

export interface Room {
  id: string
  roomName: string
  level: Difficulty
  questionIds: string[]
  startDate: number
  expiryDate: number
  status: 'active' | 'expired'
  totalParticipants: number
}

export interface SolveDetail {
  questionId: string
  solvedAt: number
  timeTaken: number
}

export interface RoomProgress {
  uid: string
  displayName: string
  photoURL: string
  solvedQuestionIds: string[]
  points: number
  solveDetails: SolveDetail[]
  totalSolveTime: number
}

export interface RoomParticipant {
  uid: string
  displayName: string
  photoURL: string
  joinedAt: number
}

export interface LeaderboardEntry {
  uid: string
  displayName: string
  photoURL: string
  joinedAt: number
  points: number
  solvedQuestionIds: string[]
  totalSolveTime: number
}

export interface UserProfile {
  uid: string
  displayName: string
  photoURL: string
  level: Difficulty
  totalSolvedCount: number
}

export interface Variant {
  questionId: string
  variantTitle: string
  variantDescription: string
  variantExamples: Example[]
}

export interface RoomCache {
  roomId: string
  expiryDate: number
  problemOrder: number[]
  variants: Variant[]
}

export interface TestResult {
  passed: boolean
  input: string
  expected: string
  actual: string
  error?: string
}

export const LEVEL_ORDER: Difficulty[] = ['beginner', 'easy', 'medium', 'hard', 'pro']

export const LEVEL_TIME_LIMITS: Record<Difficulty, number> = {
  beginner: 25 * 60 * 1000,
  easy: 35 * 60 * 1000,
  medium: 50 * 60 * 1000,
  hard: 80 * 60 * 1000,
  pro: 120 * 60 * 1000,
}

export const LEVEL_LABELS: Record<Difficulty, string> = {
  beginner: 'Beginner',
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  pro: 'Pro',
}

export const LEVEL_COLORS: Record<Difficulty, string> = {
  beginner: '#22c55e',
  easy: '#3b82f6',
  medium: '#f59e0b',
  hard: '#ef4444',
  pro: '#a855f7',
}
