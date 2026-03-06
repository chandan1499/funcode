/**
 * Run with: node seed/seedFirestore.cjs
 * Make sure to set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 * in your environment, or use a serviceAccountKey.json file.
 *
 * Usage with service account:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node seed/seedFirestore.cjs
 */

const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const questions = require('./questions.json')

const fs = require('fs')
const path = require('path')

function findServiceAccountKey() {
  const root = path.resolve(__dirname, '..')
  const files = fs.readdirSync(root)
  const keyFile = files.find(
    (f) => f.endsWith('.json') && f.includes('firebase') && f.includes('adminsdk'),
  )
  if (keyFile) return path.join(root, keyFile)
  const fallback = path.join(root, 'serviceAccountKey.json')
  if (fs.existsSync(fallback)) return fallback
  return null
}

const keyPath = findServiceAccountKey()
if (!keyPath) {
  console.error('Could not find a Firebase service account key JSON in the project root.')
  process.exit(1)
}

console.log(`Using service account key: ${path.basename(keyPath)}`)

let app
try {
  app = initializeApp({ credential: cert(require(keyPath)) })
} catch (e) {
  console.error('Failed to initialize Firebase Admin:', e.message)
  process.exit(1)
}

const db = getFirestore(app)

async function seed() {
  console.log(`Seeding ${questions.length} questions...`)
  const batch = db.batch()

  for (const q of questions) {
    const ref = db.collection('questions').doc(q.id)
    // Firestore doesn't support nested arrays, so serialize testCase inputs/outputs as JSON strings
    const sanitized = {
      ...q,
      testCases: q.testCases.map((tc) => ({
        inputJson: JSON.stringify(tc.input),
        expectedOutputJson: JSON.stringify(tc.expectedOutput),
      })),
    }
    batch.set(ref, sanitized)
  }

  await batch.commit()
  console.log('Done! Questions seeded to Firestore.')
}

seed().catch(console.error)
