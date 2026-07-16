import { db } from '@/firebase.js'
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import {
  CLASSES, ENEMIES, MINIBOSSES, BOSSES, SHOP_ITEMS, getStageSequence,
} from '@/data/gameData.js'
import { fetchGameWord, fetchWordData } from '@/services/words.js'

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

// Returns { word: 'CASTLE', partOfSpeech: 'noun', definition: '...' } — either may be
// null if not in Firestore
async function fetchWord(length = 5, extra = {}) {
  const wordLower = await fetchGameWord({ minLength: length, maxLength: length, ...extra })
  const data = await fetchWordData(wordLower).catch(() => null)
  return {
    word: wordLower.toUpperCase(),
    partOfSpeech: data?.partOfSpeech ?? null,
    definition: data?.definition ?? null,
  }
}

async function getRecentDailies(dateKey) {
  const keys  = [-1, -2, -3].map(n => offsetDayKey(dateKey, n))
  const snaps = await Promise.all(keys.map(k => getDoc(doc(db, 'dailies', k))))
  return snaps.filter(s => s.exists()).map(s => s.data())
}

const CHANGELING_POOL = ['seer', 'scholar', 'assassin', 'cleric', 'village-idiot', 'thief']

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

  // Smoke Bomb (blocks a boss's per-guess ability) has nothing to block against
  // Hydra or the Giant Slime — neither has a per-guess status effect to bypass
  const shopPool = ['hydra', 'giant-slime'].includes(boss.id) ? SHOP_ITEMS.filter(s => s.id !== 'smoke-bomb') : SHOP_ITEMS
  const shopItemIds = pickRandom(shopPool, 3).map(s => s.id)

  // Pre-generate Changeling abilities so all players get the same two
  const changelingAbilities = pickRandom([...CHANGELING_POOL], 2).map(id => id)

  // Pre-generate Treasurer starting items (only relevant if Treasurer is a selectable class today)
  // so all players who pick Treasurer get the same two.
  const treasurerItemIds = classIds.includes('treasurer')
    ? pickRandom([...shopPool], 2).map(s => s.id)
    : []

  const stageSequence = getStageSequence(boss.id)
  const stageEnemies = {}
  for (let i = 0; i < stageSequence.length; i++) {
    if (stageSequence[i] === 'miniboss' && boss.id === 'hydra') {
      stageEnemies[i] = 'hydra-miniboss'
    } else {
      let pool = stageSequence[i] === 'miniboss'
        ? MINIBOSSES.filter(m => m.id !== 'hydra-miniboss')
        : ENEMIES
      // Cerberus's 3-board mechanic conflicts with the Abominable Snowman's letter-freezing
      if (stageSequence[i] === 'miniboss' && boss.id === 'abominable-snowman') {
        pool = pool.filter(m => m.id !== 'cerberus')
      }
      stageEnemies[i] = pickRandom(pool).id
    }
  }

  // Tracks every secret word assigned so far so the same word never comes up twice
  // in one daily game (across stages, minibosses, and boss rounds/boards)
  const usedWords = new Set()
  async function fetchUnusedWord(length, extra = {}) {
    const entry = await fetchWord(length, { ...extra, exclude: [...usedWords] })
    usedWords.add(entry.word.toLowerCase())
    return entry
  }

  const words = {}
  for (let i = 0; i < stageSequence.length; i++) {
    const stageType = stageSequence[i]
    const pool = stageType === 'miniboss' ? MINIBOSSES : ENEMIES
    const enemy = pool.find(e => e.id === stageEnemies[i])
    const stageBoardCount = enemy?.boardCount ?? 1
    const stageWordLen = enemy?.wordLength ?? 5
    const wordExtra = {}
    if (enemy?.id === 'mirror-spirit') wordExtra.palindrome = true
    if (enemy?.id === 'know-it-all') wordExtra.difficulty = 2
    if (stageBoardCount > 1) {
      for (let b = 0; b < stageBoardCount; b++) {
        words[`stage-${i}-board-${b}`] = await fetchUnusedWord(stageWordLen, wordExtra)
      }
    } else {
      words[`stage-${i}`] = await fetchUnusedWord(stageWordLen, wordExtra)
    }

    // Annoying Kid forces the player's first guess — pre-generate that word too, so it's
    // the same for everyone (it must differ from the stage's own secret word)
    if (enemy?.id === 'annoying-kid') {
      let kidWord
      do {
        kidWord = await fetchWord(stageWordLen)
      } while (kidWord.word === words[`stage-${i}`]?.word)
      words[`stage-${i}-annoying-kid`] = kidWord
    }
  }
  for (let round = 0; round < boss.health; round++) {
    const roundConfig = boss.rounds?.[round]
    const bossBoardCount = roundConfig?.boardCount ?? boss.boardCount ?? 1
    const bossWordLen = roundConfig?.wordLength ?? boss.wordLength ?? 5
    if (bossBoardCount > 1) {
      for (let b = 0; b < bossBoardCount; b++) {
        words[`boss-${round}-board-${b}`] = await fetchUnusedWord(bossWordLen)
      }
    } else {
      words[`boss-${round}`] = await fetchUnusedWord(bossWordLen)
    }
  }

  const config = {
    date: dateKey,
    classIds,
    bossId: boss.id,
    stageEnemies,
    shopItemIds,
    changelingAbilities,
    treasurerItemIds,
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
