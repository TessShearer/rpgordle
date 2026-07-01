// Usage: node scripts/import-words.js path/to/words.csv
//
// Expected CSV columns (order doesn't matter, header row required):
//   word          — the word, any case (stored lowercase)
//   partOfSpeech  — e.g. noun, verb, adjective
//   definition    — one short definition
//   enabled       — TRUE or FALSE (optional, defaults to TRUE)
//
// The script auto-computes:  length, randomSeed
// The Firestore document ID is the word itself, so re-running safely overwrites.

const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore }        = require('firebase-admin/firestore')
const fs                      = require('fs')
const path                    = require('path')

// ── Service account ───────────────────────────────────────────────────────────
const keyPath = path.resolve(__dirname, '../firebase-service-account.json')
if (!fs.existsSync(keyPath)) {
  console.error(
    '\nMissing firebase-service-account.json in the project root.\n' +
    'Get it from: Firebase Console → Project Settings → Service Accounts → Generate new private key\n'
  )
  process.exit(1)
}

initializeApp({ credential: cert(require(keyPath)) })
const db = getFirestore()

// ── CSV parser (handles quoted fields containing commas) ──────────────────────
function parseCSV(text) {
  const lines = text.replace(/\r/g, '').trim().split('\n')
  if (lines.length < 2) throw new Error('CSV has no data rows.')

  const headers = splitCSVLine(lines[0]).map(h => h.trim())

  return lines.slice(1)
    .filter(l => l.trim())
    .map(line => {
      const values = splitCSVLine(line)
      const row = {}
      headers.forEach((h, i) => { row[h] = (values[i] ?? '').trim() })
      return row
    })
}

function splitCSVLine(line) {
  const values = []
  let current  = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      // Handle escaped quotes ("")
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      values.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  values.push(current)
  return values
}

// ── Import ────────────────────────────────────────────────────────────────────
const BATCH_SIZE = 400  // Firestore max per batch is 500; stay under it

async function importWords(csvPath) {
  const text = fs.readFileSync(path.resolve(csvPath), 'utf8')
  const rows = parseCSV(text)

  console.log(`\nParsed ${rows.length} rows from ${path.basename(csvPath)}`)

  let imported = 0
  let skipped  = 0
  let batch    = db.batch()
  let batchCount = 0

  for (const row of rows) {
    const word = row.word?.toLowerCase().replace(/[^a-z]/g, '').trim()
    if (!word) { skipped++; continue }

    const enabled = row.enabled?.toUpperCase() !== 'FALSE'

    const data = {
      word,
      length:       word.length,
      partOfSpeech: row.partOfSpeech || null,
      definition:   row.definition   || null,
      enabled,
      randomSeed:   Math.random(),
    }

    batch.set(db.collection('words').doc(word), data)
    batchCount++
    imported++

    // Commit when batch is full
    if (batchCount >= BATCH_SIZE) {
      await batch.commit()
      console.log(`  ${imported} words written...`)
      batch      = db.batch()
      batchCount = 0
    }
  }

  // Commit any remaining
  if (batchCount > 0) await batch.commit()

  console.log(`\nDone!  ✓ ${imported} imported   ✗ ${skipped} skipped (blank/invalid)`)
  process.exit(0)
}

const csvPath = process.argv[2]
if (!csvPath) {
  console.error('Usage: node scripts/import-words.js path/to/words.csv')
  process.exit(1)
}

importWords(csvPath).catch(err => { console.error(err); process.exit(1) })
