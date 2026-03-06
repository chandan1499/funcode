import type { TestCase, TestResult, FirestoreTestCase } from '@/types'

export function parseFirestoreTestCases(raw: FirestoreTestCase[]): TestCase[] {
  return raw.map((tc) => ({
    input: JSON.parse(tc.inputJson) as unknown[],
    expectedOutput: JSON.parse(tc.expectedOutputJson),
  }))
}

export function runCodeInWorker(
  code: string,
  functionName: string,
  testCases: TestCase[],
  timeoutMs = 5000,
): Promise<TestResult[]> {
  return new Promise((resolve) => {
    const workerCode = `
      self.onmessage = function(e) {
        const { code, functionName, testCases } = e.data;
        const results = [];

        try {
          const fn = new Function(code + '\\nreturn ' + functionName + ';')();

          for (const tc of testCases) {
            try {
              const actual = fn(...tc.input);
              const passed = JSON.stringify(actual) === JSON.stringify(tc.expectedOutput);
              results.push({
                passed,
                input: JSON.stringify(tc.input),
                expected: JSON.stringify(tc.expectedOutput),
                actual: JSON.stringify(actual),
              });
            } catch (err) {
              results.push({
                passed: false,
                input: JSON.stringify(tc.input),
                expected: JSON.stringify(tc.expectedOutput),
                actual: '',
                error: err instanceof Error ? err.message : String(err),
              });
            }
          }
        } catch (err) {
          for (const tc of testCases) {
            results.push({
              passed: false,
              input: JSON.stringify(tc.input),
              expected: JSON.stringify(tc.expectedOutput),
              actual: '',
              error: err instanceof Error ? err.message : String(err),
            });
          }
        }

        self.postMessage({ results });
      };
    `

    const blob = new Blob([workerCode], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    const worker = new Worker(url)

    const timer = setTimeout(() => {
      worker.terminate()
      URL.revokeObjectURL(url)
      resolve(
        testCases.map((tc) => ({
          passed: false,
          input: JSON.stringify(tc.input),
          expected: JSON.stringify(tc.expectedOutput),
          actual: '',
          error: 'Time limit exceeded (5s)',
        })),
      )
    }, timeoutMs)

    worker.onmessage = (e: MessageEvent<{ results: TestResult[] }>) => {
      clearTimeout(timer)
      worker.terminate()
      URL.revokeObjectURL(url)
      resolve(e.data.results)
    }

    worker.onerror = (err) => {
      clearTimeout(timer)
      worker.terminate()
      URL.revokeObjectURL(url)
      resolve(
        testCases.map((tc) => ({
          passed: false,
          input: JSON.stringify(tc.input),
          expected: JSON.stringify(tc.expectedOutput),
          actual: '',
          error: err.message,
        })),
      )
    }

    worker.postMessage({ code, functionName, testCases })
  })
}
