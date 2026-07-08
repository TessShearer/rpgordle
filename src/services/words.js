import { db } from '@/firebase'
import {
  collection, query, where, orderBy, limit, getDocs,
} from 'firebase/firestore'

/**
 * Firestore "words" collection schema
 * ------------------------------------
 * Each document should have these fields:
 *
 *   word         {string}  — the word, lowercase          e.g. "castle"
 *   length       {number}  — word.length (store explicitly) e.g. 6
 *   partOfSpeech {string}  — "noun" | "verb" | "adjective" | etc.
 *   definition   {string}  — one short definition
 *   enabled      {boolean} — false = retired, won't appear in game
 *   randomSeed   {number}  — random float 0–1 assigned at import time
 *
 * In your spreadsheet, generate randomSeed with =RAND() before exporting.
 *
 * Required Firestore composite index:
 *   Collection: words  |  Fields: enabled ASC, length ASC, randomSeed ASC
 * Firestore will log a clickable link to create it the first time this query runs.
 */

const COL = 'words'

/**
 * Returns a random word object { word, partOfSpeech, definition } from Firestore.
 * Picks a random target length within [minLength, maxLength], then uses a
 * randomSeed range query so every call gets a different word without fetching
 * the whole collection.
 */
export async function fetchGameWord({ minLength = 5, maxLength = 5, palindrome = null, difficulty = null } = {}) {
  const targetLength = minLength + Math.floor(Math.random() * (maxLength - minLength + 1))
  const col  = collection(db, COL)
  const base = [
    where('enabled', '==', true),
    where('length',  '==', targetLength),
  ]

  // Filtered queries (palindrome / difficulty): fetch a pool and pick randomly.
  // These require additional Firestore composite indexes. Firestore will log a
  // clickable link to create them the first time each query runs.
  if (palindrome !== null || difficulty !== null) {
    const filters = [...base]
    if (palindrome !== null) filters.push(where('palindrome', '==', palindrome))
    if (difficulty !== null) filters.push(where('difficulty', '==', difficulty))
    const snap = await getDocs(query(col, ...filters, limit(200)))
    if (snap.empty) throw new Error(`No matching words found with length ${targetLength}.`)
    const docs = snap.docs
    return docs[Math.floor(Math.random() * docs.length)].data().word
  }

  // Standard random-seed approach for regular words
  const seed = Math.random()
  let snap = await getDocs(
    query(col, ...base, where('randomSeed', '>=', seed), orderBy('randomSeed'), limit(1))
  )
  if (snap.empty) {
    snap = await getDocs(query(col, ...base, orderBy('randomSeed'), limit(1)))
  }
  if (snap.empty) {
    throw new Error(
      `No enabled words found with length ${targetLength}. ` +
      `Add words to the Firestore "words" collection.`
    )
  }
  return snap.docs[0].data().word
}

/**
 * Fetch the full metadata for a known word: { word, length, partOfSpeech, definition, enabled }
 * Use this when you need definition/partOfSpeech — e.g. post-game reveal.
 */
export async function fetchWordData(word) {
  const snap = await getDocs(
    query(collection(db, COL), where('word', '==', word.toLowerCase()), limit(1))
  )
  return snap.empty ? null : snap.docs[0].data()
}
