import type { TestResult } from '@/types'
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResultPanelProps {
  results: TestResult[] | null
  running: boolean
  status: 'idle' | 'running' | 'passed' | 'failed'
}

export function ResultPanel({ results, running, status }: ResultPanelProps) {
  if (running) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        Running test cases...
      </div>
    )
  }

  if (!results) {
    return (
      <div className="px-4 py-3 text-sm text-gray-600">
        Click Run to test your solution, or Submit to check all test cases.
      </div>
    )
  }

  const passed = results.filter((r) => r.passed).length
  const total = results.length

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
        {status === 'passed' ? (
          <>
            <CheckCircle size={16} className="text-green-500" />
            <span className="text-green-400 font-semibold text-sm">All test cases passed!</span>
          </>
        ) : (
          <>
            <XCircle size={16} className="text-red-500" />
            <span className="text-red-400 font-semibold text-sm">
              {passed}/{total} test cases passed
            </span>
          </>
        )}
      </div>

      <div className="p-3 space-y-2">
        {results.map((result, idx) => (
          <div
            key={idx}
            className={cn(
              'rounded-lg border p-3 text-xs font-mono',
              result.passed
                ? 'border-green-800/40 bg-green-900/10'
                : 'border-red-800/40 bg-red-900/10',
            )}
          >
            <div className="flex items-center gap-1.5 mb-2">
              {result.passed ? (
                <CheckCircle size={12} className="text-green-500" />
              ) : result.error ? (
                <AlertCircle size={12} className="text-yellow-500" />
              ) : (
                <XCircle size={12} className="text-red-500" />
              )}
              <span className={result.passed ? 'text-green-400' : 'text-red-400'}>
                Test Case {idx + 1}: {result.passed ? 'Passed' : result.error ? 'Error' : 'Failed'}
              </span>
            </div>

            {result.error?.includes('Time limit') ? (
              <div className="flex items-center gap-1 text-yellow-400">
                <Clock size={11} />
                {result.error}
              </div>
            ) : (
              <div className="space-y-1 text-gray-400">
                <div><span className="text-gray-500">Input:</span> {result.input}</div>
                <div><span className="text-gray-500">Expected:</span> {result.expected}</div>
                {!result.passed && (
                  <div>
                    <span className="text-gray-500">
                      {result.error ? 'Error:' : 'Got:'}
                    </span>{' '}
                    <span className={result.error ? 'text-yellow-400' : 'text-red-400'}>
                      {result.error ?? result.actual}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
