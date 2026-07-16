import { db } from '@/firebase.js'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

// Records a single game's outcome so the Game Info page can show win/loss
// rates per character and per boss.
export async function recordGameResult({ classId, bossId, result }) {
  if (!classId || !bossId || (result !== 'won' && result !== 'lost')) return
  await addDoc(collection(db, 'gameResults'), {
    classId,
    bossId,
    result,
    createdAt: serverTimestamp(),
  })
}
