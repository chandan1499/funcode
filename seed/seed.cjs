const admin = require('firebase-admin')
const serviceAccount = require('../funcode-arena-firebase-adminsdk-fbsvc-eacd9532e5.json')
const questions = require('./dsa_130_questions.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

async function seed() {
  console.log(`Seeding ${questions.length} questions...`)

  // Firestore batch limit is 500 ops; use multiple batches
  const BATCH_SIZE = 400
  let seeded = 0
  let skipped = 0

  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = db.batch()
    const chunk = questions.slice(i, i + BATCH_SIZE)

    chunk.forEach((q) => {
      const { id, testCases, ...rest } = q

      // Convert testCases to Firestore format: { inputJson, expectedOutputJson }
      const firestoreTestCases = testCases.map((tc) => ({
        inputJson: JSON.stringify(tc.input),
        expectedOutputJson: JSON.stringify(tc.expectedOutput),
      }))

      const docRef = db.collection('questions').doc(id)
      batch.set(docRef, { ...rest, testCases: firestoreTestCases })
    })

    await batch.commit()
    seeded += chunk.length
    console.log(`  ✓ Committed ${seeded}/${questions.length}`)
  }

  console.log(`\nDone! ${seeded} questions seeded, ${skipped} skipped.`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
