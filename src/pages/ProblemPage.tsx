import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { useAuth } from '@/hooks/useAuth'
import { getCachedRoom, updateCachedVariant } from '@/lib/variantCache'
import { runCodeInWorker, parseFirestoreTestCases } from '@/lib/codeWorker'
import { recordSolve, useProgress, updateUserLevel } from '@/hooks/useProgress'
import { getRoomById } from '@/hooks/useRoom'
import { checkLevelUp } from '@/lib/levelUtils'
import { db, doc, getDoc, updateDoc, increment } from '@/lib/firebase'
import type { Question, Variant, TestResult, Room } from '@/types'
import { generateVariant } from '@/lib/groq'
import { ResultPanel } from '@/components/ResultPanel'
import { LevelBadge } from '@/components/LevelBadge'

import {
  ArrowLeft, Play, Send, Trophy, ChevronRight, CheckCircle, Loader2, RefreshCw
} from 'lucide-react'

export function ProblemPage() {
  const { roomId, questionId } = useParams<{ roomId: string; questionId: string }>()
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const [room, setRoom] = useState<Room | null>(null)
  const [question, setQuestion] = useState<Question | null>(null)
  const [variant, setVariant] = useState<Variant | null>(null)
  const [code, setCode] = useState('')
  const [results, setResults] = useState<TestResult[] | null>(null)
  const [runStatus, setRunStatus] = useState<'idle' | 'running' | 'passed' | 'failed'>('idle')
  const [submitting, setSubmitting] = useState(false)
  const [alreadySolved, setAlreadySolved] = useState(false)
  const [levelUpMsg, setLevelUpMsg] = useState<string | null>(null)
  const [refreshingVariant, setRefreshingVariant] = useState(false)

  const { progress, setProgress } = useProgress(roomId ?? null, user?.uid ?? null)

  // Persist open timestamp in sessionStorage so a page refresh doesn't reset the timer
  const openedAtRef = useRef<number>(0)
  if (openedAtRef.current === 0) {
    const key = `funcode_opened_${roomId}_${questionId}`
    const stored = sessionStorage.getItem(key)
    if (stored) {
      openedAtRef.current = parseInt(stored, 10)
    } else {
      const now = Date.now()
      sessionStorage.setItem(key, String(now))
      openedAtRef.current = now
    }
  }

  useEffect(() => {
    if (!roomId || !questionId || !user) return

    async function load() {
      if (!roomId || !questionId || !user) return
      const [roomData, qSnap] = await Promise.all([
        getRoomById(roomId),
        getDoc(doc(db, 'questions', questionId)),
      ])

      // Guard: question must belong to this room
      if (!roomData || !roomData.questionIds.includes(questionId)) {
        navigate(roomData ? `/room/${roomId}` : '/', { replace: true })
        return
      }

      setRoom(roomData)

      if (qSnap.exists()) {
        const raw = qSnap.data()
        const q: Question = {
          id: qSnap.id,
          ...raw,
          testCases: parseFirestoreTestCases(raw.testCases ?? []),
        } as Question
        setQuestion(q)
        setCode(q.starterCode)
      }

      const cache = getCachedRoom(roomId, user.uid)
      if (cache) {
        const v = cache.variants.find((v) => v.questionId === questionId)
        if (v) setVariant(v)
      }
    }

    load()
  }, [roomId, questionId, user])

  useEffect(() => {
    if (progress && questionId) {
      setAlreadySolved(progress.solvedQuestionIds.includes(questionId))
    }
  }, [progress, questionId])

  const runCode = async (submitMode: boolean) => {
    if (!question || !code.trim()) return
    setRunStatus('running')
    setResults(null)

    const testCases = submitMode ? question.testCases : question.testCases.slice(0, 2)
    const res = await runCodeInWorker(code, question.functionName, testCases)
    const allPassed = res.every((r) => r.passed)

    setResults(res)
    setRunStatus(allPassed ? 'passed' : 'failed')

    if (submitMode && allPassed && !alreadySolved) {
      await handleSuccessfulSubmit()
    }
  }

  const handleSuccessfulSubmit = async () => {
    if (!roomId || !questionId || !user || !profile || !question) return
    setSubmitting(true)

    try {
      const timeTaken = Date.now() - openedAtRef.current
      const newProgress = await recordSolve(
        roomId,
        user.uid,
        profile.displayName,
        profile.photoURL,
        { questionId, solvedAt: Date.now(), timeTaken },
        progress,
      )

      // Clear the persisted timer — question is done
      sessionStorage.removeItem(`funcode_opened_${roomId}_${questionId}`)

      setProgress(newProgress)
      setAlreadySolved(true)

      await updateDoc(doc(db, 'users', user.uid), {
        totalSolvedCount: increment(1),
      })

      const newTotalSolved = (profile.totalSolvedCount ?? 0) + 1

      // Level-up only applies when solving the user's own level room
      if (room && room.level === profile.level) {
        const newLevel = checkLevelUp(
          profile.level,
          newProgress.solvedQuestionIds.length,
          newProgress.totalSolveTime,
        )

        if (newLevel !== profile.level) {
          await updateUserLevel(user.uid, newLevel, newTotalSolved)
          setLevelUpMsg(`Level Up! You are now ${newLevel.charAt(0).toUpperCase() + newLevel.slice(1)}!`)
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleRefreshVariant = async () => {
    if (!roomId || !user || !question || alreadySolved || refreshingVariant) return
    setRefreshingVariant(true)
    try {
      const newVariant = await generateVariant(question)
      updateCachedVariant(roomId, user.uid, newVariant)
      setVariant(newVariant)
    } finally {
      setRefreshingVariant(false)
    }
  }

  if (!room || !question || !variant) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0d1117' }}>
        <Loader2 size={24} className="text-green-400 animate-spin" />
      </div>
    )
  }

  const isExpired = Date.now() > room.expiryDate

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#0d1117' }}>
      <nav className="flex items-center justify-between px-4 py-2 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/room/${roomId}`)}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            {room.roomName}
          </button>
          <ChevronRight size={12} className="text-gray-600" />
          <span className="text-sm text-gray-200 truncate max-w-[240px]">{variant.variantTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          {alreadySolved && (
            <span className="flex items-center gap-1 text-xs text-green-400 bg-green-900/20 border border-green-800/40 rounded-full px-2 py-0.5">
              <CheckCircle size={11} />
              Solved +10pts
            </span>
          )}
          <Link
            to={`/room/${roomId}/leaderboard`}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <Trophy size={13} />
            Leaderboard
          </Link>
        </div>
      </nav>

      {levelUpMsg && (
        <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border-b border-green-700/40 px-4 py-2 text-center text-sm text-green-300">
          🎉 {levelUpMsg}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[45%] flex flex-col border-r border-gray-800 overflow-y-auto">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <LevelBadge level={room.level} size="sm" />
              {alreadySolved && (
                <span className="text-xs text-green-500 bg-green-900/20 border border-green-800/40 rounded-full px-2 py-0.5">
                  ✓ Solved
                </span>
              )}
              {!alreadySolved && (
                <button
                  onClick={handleRefreshVariant}
                  disabled={refreshingVariant}
                  title="Get a different variant of this question"
                  className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded px-2 py-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {refreshingVariant
                    ? <Loader2 size={11} className="animate-spin" />
                    : <RefreshCw size={11} />
                  }
                  {refreshingVariant ? 'Refreshing...' : 'New Variant'}
                </button>
              )}
            </div>

            <h1 className="text-xl font-bold text-white mb-4">{variant.variantTitle}</h1>

            <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap mb-6">
              {variant.variantDescription}
            </div>

            {variant.variantExamples.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Examples</h3>
                <div className="space-y-3">
                  {variant.variantExamples.map((ex, idx) => (
                    <div key={idx} className="bg-gray-900/60 border border-gray-800 rounded-lg p-3">
                      <div className="text-xs font-semibold text-gray-500 mb-2">Example {idx + 1}</div>
                      <div className="font-mono text-xs space-y-1">
                        <div><span className="text-gray-500">Input:</span> <span className="text-gray-200">{ex.input}</span></div>
                        <div><span className="text-gray-500">Output:</span> <span className="text-green-300">{ex.output}</span></div>
                        {ex.explanation && (
                          <div className="text-gray-500 pt-1">{ex.explanation}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {question.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-gray-800 text-gray-400 rounded px-2 py-0.5">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              value={code}
              onChange={(v) => setCode(v ?? '')}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                lineNumbers: 'on',
                renderLineHighlight: 'line',
                suggestOnTriggerCharacters: true,
                tabSize: 2,
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                fontLigatures: true,
              }}
            />
          </div>

          <div className="border-t border-gray-800 flex flex-col" style={{ height: '240px' }}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800 shrink-0">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Output</span>
              <div className="flex gap-2">
                <button
                  onClick={() => runCode(false)}
                  disabled={runStatus === 'running' || submitting || isExpired}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  <Play size={11} />
                  Run
                </button>
                <button
                  onClick={() => runCode(true)}
                  disabled={runStatus === 'running' || submitting || alreadySolved || isExpired}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50 transition-colors"
                  style={{
                    backgroundColor: alreadySolved || isExpired ? '#1f2937' : '#16a34a',
                    color: alreadySolved || isExpired ? '#6b7280' : 'white',
                  }}
                >
                  {submitting ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <Send size={11} />
                  )}
                  {alreadySolved ? 'Submitted' : 'Submit'}
                </button>
              </div>
            </div>

            {isExpired && (
              <div className="px-4 py-2 text-xs text-red-400 bg-red-900/10 border-b border-red-800/20">
                This room has expired. Submissions are closed.
              </div>
            )}

            <div className="flex-1 overflow-hidden">
              <ResultPanel results={results} running={runStatus === 'running'} status={runStatus} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
