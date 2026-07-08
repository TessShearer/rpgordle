import { db } from '@/firebase.js'
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import {
  CLASSES, ENEMIES, MINIBOSSES, BOSSES, SHOP_ITEMS, STAGE_SEQUENCE,
} from '@/data/gameData.js'
import { fetchGameWord } from '@/services/words.js'

export function getTodayKey() {
  const d    = new Date()
  const yyyy = d.getFullYear()
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const dd   = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function offsetDayKey(baseKey, offset) {
  const [yyyy, mm, dd] = baseKey.split('-').map(Number)
  const d = new Date(yyyy, mm - 1, dd)
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function pickRandom(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return count ? shuffled.slice(0, count) : shuffled[0]
}

async function fetchWord(length = 5, extra = {}) {
  const word = await fetchGameWord({ minLength: length, maxLength: length, ...extra })
  return word.toUpperCase()
}

async function getRecentDailies(dateKey) {
  const keys  = [-1, -2, -3].map(n => offsetDayKey(dateKey, n))
  const snaps = await Promise.all(keys.map(k => getDoc(doc(db, 'dailies', k))))
  return snaps.filter(s => s.exists()).map(s => s.data())
}

async function generateDaily(dateKey) {
  const recents = await getRecentDailies(dateKey)

  // Boss: exclude any boss used in the last 3 days
  const recentBossIds = recents.map(r => r.bossId).filter(Boolean)
  const bossPool      = BOSSES.filter(b => !recentBossIds.includes(b.id))
  const boss          = pickRandom(bossPool.length ? bossPool : BOSSES)

  // Classes: exclude any class offered yesterday
  const yesterdayClassIds = recents[0]?.classIds ?? []
  const classPool         = CLASSES.filter(c => !yesterdayClassIds.includes(c.id))
  const classIds          = pickRandom(classPool.length >= 3 ? classPool : CLASSES, 3).map(c => c.id)

  const shopPool = boss.id === 'hydra' ? SHOP_ITEMS.filter(s => s.id !== 'shield') : SHOP_ITEMS
  const shopItemIds = pickRandom(shopPool, 3).map(s => s.id)

  const stageEnemies = {}
  for (let i = 0; i < STAGE_SEQUENCE.length; i++) {
    if (STAGE_SEQUENCE[i] === 'miniboss' && boss.id === 'hydra') {
      stageEnemies[i] = 'hydra-miniboss'
    } else {
      const pool = STAGE_SEQUENCE[i] === 'miniboss'
        ? MINIBOSSES.filter(m => m.id !== 'hydra-miniboss')
        : ENEMIES
      stageEnemies[i] = pickRandom(pool).id
    }
  }

  const words = {}
  for (let i = 0; i < STAGE_SEQUENCE.length; i++) {
    const stageType = STAGE_SEQUENCE[i]
    const pool = stageType === 'miniboss' ? MINIBOSSES : ENEMIES
    const enemy = pool.find(e => e.id === stageEnemies[i])
    const stageBoardCount = enemy?.boardCount ?? 1
    const stageWordLen = enemy?.wordLength ?? 5
    const wordExtra = {}
    if (enemy?.id === 'mirror-spirit') wordExtra.palindrome = true
    if (enemy?.id === 'know-it-all') wordExtra.difficulty = 2
    if (stageBoardCount > 1) {
      for (let b = 0; b < stageBoardCount; b++) {
        words[`stage-${i}-board-${b}`] = await fetchWord(stageWordLen, wordExtra)
      }
    } else {
      words[`stage-${i}`] = await fetchWord(stageWordLen, wordExtra)
    }
  }
  for (let round = 0; round < boss.health; round++) {
    const roundConfig = boss.rounds?.[round]
    const bossBoardCount = roundConfig?.boardCount ?? boss.boardCount ?? 1
    const bossWordLen = roundConfig?.wordLength ?? boss.wordLength ?? 5
    if (bossBoardCount > 1) {
      for (let b = 0; b < bossBoardCount; b++) {
        words[`boss-${round}-board-${b}`] = await fetchWord(bossWordLen)
      }
    } else {
      words[`boss-${round}`] = await fetchWord(bossWordLen)
    }
  }

  const config = {
    date: dateKey,
    classIds,
    bossId: boss.id,
    stageEnemies,
    shopItemIds,
    words,
    createdAt: serverTimestamp(),
  }

  await setDoc(doc(db, 'dailies', dateKey), config)

  // Keep only the last 30 days — delete the entry from 30 days ago if it exists
  const expiredKey = offsetDayKey(dateKey, -30)
  await deleteDoc(doc(db, 'dailies', expiredKey))

  return config
}

export async function fetchOrCreateDaily() {
  const dateKey = getTodayKey()
  const snap    = await getDoc(doc(db, 'dailies', dateKey))
  if (snap.exists()) return snap.data()
  return generateDaily(dateKey)
}
