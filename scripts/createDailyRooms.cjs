/**
 * Creates daily rooms for all 5 difficulty levels.
 * Run via GitHub Actions daily cron, or manually:
 *   node scripts/createDailyRooms.cjs
 *
 * Auth (in order of preference):
 *   1. FIREBASE_SERVICE_ACCOUNT_JSON env var (GitHub Actions)
 *   2. firebase-adminsdk-*.json key file in project root (local dev)
 */

const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const fs = require('fs')
const path = require('path')

const LEVELS = ['beginner', 'easy', 'medium', 'hard', 'pro']
const QUESTIONS_PER_ROOM = 10
const ROOM_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

function getTodayRoomId(level) {
  const now = new Date()
  const yyyy = now.getUTCFullYear()
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(now.getUTCDate()).padStart(2, '0')
  return `${level}_${yyyy}_${mm}_${dd}`
}

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

// Resolve Firebase credentials
let credential
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  console.log('Using FIREBASE_SERVICE_ACCOUNT_JSON env var')
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  credential = cert(serviceAccount)
} else {
  const keyPath = findServiceAccountKey()
  if (!keyPath) {
    console.error('No Firebase credentials found. Set FIREBASE_SERVICE_ACCOUNT_JSON or place a service account key JSON in the project root.')
    process.exit(1)
  }
  console.log(`Using local key: ${path.basename(keyPath)}`)
  credential = cert(require(keyPath))
}

const app = initializeApp({ credential })
const db = getFirestore(app)

async function getRandomQuestionIds(level, count) {
  const snap = await db.collection('questions').where('difficulty', '==', level).get()
  const ids = snap.docs.map((d) => d.id)
  const shuffled = ids.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

async function createDailyRooms() {
  const now = Date.now()
  const date = new Date()
  const week = Math.ceil(
    ((date - new Date(date.getFullYear(), 0, 1)) / 86400000 + 1) / 7,
  )
  const year = date.getFullYear()

  console.log(`Creating rooms for ${date.toISOString().slice(0, 10)}...`)

  for (const level of LEVELS) {
    const roomId = getTodayRoomId(level)
    const roomRef = db.collection('rooms').doc(roomId)
    const existing = await roomRef.get()

    if (existing.exists) {
      console.log(`  [${level}] Room ${roomId} already exists — skipping`)
      continue
    }

    const questionIds = await getRandomQuestionIds(level, QUESTIONS_PER_ROOM)
    if (questionIds.length < QUESTIONS_PER_ROOM) {
      console.warn(`  [${level}] Only ${questionIds.length} questions available (need ${QUESTIONS_PER_ROOM}) — skipping`)
      continue
    }

    const label = level.charAt(0).toUpperCase() + level.slice(1)
    const room = {
      id: roomId,
      roomName: `${label} Room — Week ${week}, ${year}`,
      level,
      questionIds,
      startDate: now,
      expiryDate: now + ROOM_EXPIRY_MS,
      status: 'active',
      totalParticipants: 0,
    }

    await roomRef.set(room)
    console.log(`  [${level}] Created ${roomId} (expires in 24h)`)
  }

  console.log('Done.')
  process.exit(0)
}

createDailyRooms().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
