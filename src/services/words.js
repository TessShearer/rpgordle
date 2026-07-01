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
export async function fetchGameWord({ minLength = 3, maxLength = 5 } = {}) {
  const seed = Math.random()
  const targetLength = minLength + Math.floor(Math.random() * (maxLength - minLength + 1))
  const col  = collection(db, COL)
  const base = [
    where('enabled', '==', true),
    where('length',  '==', targetLength),
  ]

  // Walk forward from random seed point
  let snap = await getDocs(
    query(col, ...base, where('randomSeed', '>=', seed), orderBy('randomSeed'), limit(1))
  )

  // Wrap around to the start of the collection if nothing found ahead
  if (snap.empty) {
    snap = await getDocs(
      query(col, ...base, orderBy('randomSeed'), limit(1))
    )
  }

  if (snap.empty) {
    throw new Error(
      `No enabled words found with length ${targetLength}. ` +
      `Add words to the Firestore "words" collection.`
    )
  }

  const data = snap.docs[0].data()
  return {
    word:         data.word,
    partOfSpeech: data.partOfSpeech ?? null,
    definition:   data.definition   ?? null,
  }
}
