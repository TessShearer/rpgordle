<template>
  <main class="container py-2">
    <div class="game-wrapper">

      <!-- ── Intro ──────────────────────────────────────────────────────── -->
      <div v-if="screen === 'intro'" class="text-center">
        <div class="art-placeholder art-placeholder--hero mb-4">Art goes here</div>
        <button class="btn btn-press px-5 py-3 fs-5" @click="showClassSelect">
          Start Adventure
        </button>
      </div>

      <!-- ── Class Select ───────────────────────────────────────────────── -->
      <div v-else-if="screen === 'class-select'">
        <p class="game-meta text-center mb-4">Choose your class</p>
        <div class="class-options">
          <div
            v-for="(cls, i) in CLASSES"
            :key="cls.id"
            class="class-option"
            :class="{ animated: classesAnimated }"
            :style="{ transitionDelay: `${i * 0.15}s` }"
            @click="selectClass(cls.id)"
          >
            <div class="art-placeholder art-placeholder--class">
              Art for {{ cls.name }} goes here
            </div>
            <div
              class="class-text"
              :style="{ transitionDelay: `${0.5 + i * 0.15}s` }"
            >
              <p class="class-name">{{ cls.name }}</p>
              <p class="class-desc">{{ cls.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Game ───────────────────────────────────────────────────────── -->
      <template v-else>

        <div v-if="gameState === 'loading'" class="text-center py-5">
          <p class="game-meta">Loading word…</p>
        </div>

        <div v-else-if="gameState === 'error'" class="text-center py-5"> 
          <p class="text-danger mb-3">Could not load a word. Make sure the PHP server is running.</p>
          <button class="btn btn-press px-4" @click="startStage(stage)">Try Again</button>
        </div>

        <div v-else class="game-layout">

          <!-- Left panel: class character art -->
          <aside class="game-panel game-panel--left">
            <div class="class-feature" :class="{ 'class-feature--reveal': playerClass === 'seer' || playerClass === 'scholar' }">
              <div class="art-placeholder art-placeholder--feature">{{ featureArtText }}</div>
              <div v-if="playerClass === 'seer'" class="feature-hint">
                <p class="feature-label">this word has a...</p>
                <p class="feature-letter">{{ hintLetter }}</p>
              </div>
              <div v-if="playerClass === 'scholar'" class="feature-hint">
                <p class="feature-label">this word is a...</p>
                <p class="feature-word">{{ hintWordType }}</p>
              </div>
            </div>
          </aside>

          <!-- Center: game board -->
          <div class="game-center">
            <!-- Journey progress -->
            <div class="text-center mb-2">
              <p class="game-meta mb-2">Word {{ stage + 1 }} of {{ JOURNEY_LENGTH }}</p>
              <div class="journey-dots mb-2">
                <span
                  v-for="i in JOURNEY_LENGTH"
                  :key="i"
                  class="journey-dot"
                  :class="dotClass(i - 1)"
                ></span>
              </div>
              <p class="game-meta">
                {{ wordLength }}-letter word &middot; {{ guessesLeft }} guess{{ guessesLeft !== 1 ? 'es' : '' }} left
              </p>
            </div>

            <!-- Board -->
            <div class="board mb-2" :style="{ '--cols': wordLength }">
              <template v-for="row in currentMaxGuesses" :key="row">
                <div
                  v-for="col in wordLength"
                  :key="col"
                  class="tile"
                  :class="tileClass(row - 1, col - 1)"
                >
                  {{ tileChar(row - 1, col - 1) }}
                </div>
              </template>
            </div>

            <p v-if="inputError" class="text-danger text-center small mb-2">{{ inputError }}</p>

            <!-- Submit + Keyboard -->
            <div v-if="gameState === 'playing'" class="text-center mb-2">
              <button class="btn btn-press px-4 py-1" @click="handleKey('ENTER')">Submit</button>
            </div>
            <div v-if="gameState === 'playing'" class="keyboard">
              <div v-for="(row, r) in KEY_ROWS" :key="r" class="key-row">
                <button
                  v-for="key in row"
                  :key="key"
                  class="key"
                  :class="keyClass(key)"
                  @click="handleKey(key)"
                >{{ key }}</button>
              </div>
            </div>

            <div class="text-center mt-3">
              <button class="btn btn-reset px-4 py-2" @click="restartJourney">
                Start journey again
              </button>
              <p class="debug-answer mt-2">{{ secretWord.toLowerCase() }}</p>
            </div>
          </div>

          <!-- Right panel: monster + enemy art -->
          <aside class="game-panel game-panel--right">
            <div class="monster-section">
              <div class="art-placeholder art-placeholder--monster">Art of {{ monsterType }}</div>
              <p class="monster-text">A {{ monsterType }} appeared! Find the word of power to defeat it!</p>
            </div>
            <div v-for="enemy in activeEnemies" :key="enemy.id" class="enemy-section">
              <div class="art-placeholder art-placeholder--enemy">Art of {{ enemy.name }}</div>
              <p class="enemy-name">{{ enemy.name }}</p>
            </div>
          </aside>

        </div>

      </template>

      <!-- Modal (sits above all screens) -->
      <Transition name="modal">
        <div v-if="modal" class="modal-overlay">
          <div class="modal-card">
            <template v-if="modal === 'enemy'">
              <p class="modal-message">You've attracted the attention of a {{ latestEnemy.name }}!</p>
              <div class="art-placeholder art-placeholder--modal-monster my-3">Art of {{ latestEnemy.name }}</div>
              <p class="modal-submessage">From now on: {{ latestEnemy.effect }}</p>
            </template>
            <template v-else-if="modal === 'monster'">
              <p class="modal-message">A {{ monsterType }} appeared!</p>
              <div class="art-placeholder art-placeholder--modal-monster my-3">Art of {{ monsterType }}</div>
              <p class="modal-submessage">Find the word of power to defeat it!</p>
            </template>
            <template v-else>
              <p class="modal-message">{{ MODAL_CONTENT[modal].message }}</p>
              <p v-if="modal === 'lost'" class="modal-word">{{ secretWord.toLowerCase() }}</p>
            </template>
            <button class="btn btn-press px-5 py-2 mt-3" @click="handleModalAction">
              {{ MODAL_CONTENT[modal].button }}
            </button>
          </div>
        </div>
      </Transition>

    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const MAX_GUESSES    = 6
const JOURNEY_LENGTH = 7


const KEY_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','⌫'],
]

const CLASSES = [
  { id: 'peasant', name: 'Peasant', description: 'Play as Peasant for no bonuses' },
  { id: 'seer',    name: 'Seer',    description: 'Play as Seer to reveal a letter in each word' },
  { id: 'knight',  name: 'Knight',  description: 'Play as Knight for extra chances after failure' },
  { id: 'scholar', name: 'Scholar', description: 'Reveals information about the word' },
]

const MODAL_CONTENT = {
  enemy:    { button: 'Continue' },
  monster:  { button: 'Begin!'   },
  won:      { message: 'Word discovered! Continue?',               button: 'Continue'  },
  lost:     { message: 'Oh no, you failed! Try again?',            button: 'Try Again' },
  complete: { message: 'You completed your quest! New Game?',      button: 'New Game'  },
  armor:    { message: 'The knight lost his armor but continues!', button: 'Continue'  },
}

const ENEMIES = [
  { id: 'useless-goblin',  name: 'Useless Goblin',  effect: 'He will try his best to stop you, but ultimately have no effect' },
  { id: 'annoying-kid',    name: 'Annoying Kid',    effect: 'He will make your first guess for you' },
  { id: 'shadow-sorcerer', name: 'Shadow Sorcerer', effect: 'The centermost column is obscured' },
]

const ENEMY_TRIGGER_STAGE = 4

// ── Screen / class ────────────────────────────────────────────────────────────
const screen          = ref('intro')
const playerClass     = ref(null)
const classesAnimated = ref(false)

// ── Game state ────────────────────────────────────────────────────────────────
const stage        = ref(0)
const secretWord   = ref('')
const guesses      = ref([])
const currentGuess = ref('')
const gameState    = ref('loading')
const inputError   = ref('')
const modal        = ref(null)
const hintLetter   = ref('')
const hintWordType = ref('')
const armorGranted  = ref(false)
const activeEnemies = ref([])

const latestEnemy  = computed(() => activeEnemies.value[activeEnemies.value.length - 1] ?? null)
const obscuredCol  = computed(() => {
  if (!activeEnemies.value.some(e => e.id === 'shadow-sorcerer')) return -1
  return Math.floor((wordLength.value - 1) / 2)
})

// ── Derived ───────────────────────────────────────────────────────────────────
const wordLength        = computed(() => secretWord.value.length)
const currentMaxGuesses = computed(() =>
  playerClass.value === 'knight' && armorGranted.value ? MAX_GUESSES + 3 : MAX_GUESSES
)
const guessesLeft  = computed(() => currentMaxGuesses.value - guesses.value.length)
const monsterType = ref('monster')

const featureArtText = computed(() => {
  if (playerClass.value === 'seer')    return 'Art of seer thinking'
  if (playerClass.value === 'scholar') return 'Art of scholar'
  if (playerClass.value === 'knight')  return armorGranted.value ? 'Art of naked knight' : 'Art of knight'
  return 'Art of Peasant'
})

// ── Evaluation ────────────────────────────────────────────────────────────────
function evaluateGuess(guess) {
  const status = Array(guess.length).fill('absent')
  const pool   = secretWord.value.split('')

  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === pool[i]) { status[i] = 'correct'; pool[i] = null }
  }
  for (let i = 0; i < guess.length; i++) {
    if (status[i] === 'correct') continue
    const j = pool.indexOf(guess[i])
    if (j !== -1) { status[i] = 'present'; pool[j] = null }
  }

  return guess.split('').map((letter, i) => ({ letter, status: status[i] }))
}

const evaluatedRows  = computed(() => guesses.value.map(evaluateGuess))
const letterStatuses = computed(() => {
  const priority = { correct: 3, present: 2, absent: 1 }
  const map = {}
  for (const row of evaluatedRows.value)
    for (const { letter, status } of row)
      if (!map[letter] || priority[status] > priority[map[letter]]) map[letter] = status
  return map
})

// ── Tile / key helpers ────────────────────────────────────────────────────────
function dotClass(i) {
  if (i < stage.value)   return 'dot--done'
  if (i === stage.value) return 'dot--active'
  return 'dot--pending'
}

function isObscured(col) {
  return obscuredCol.value !== -1 && col === obscuredCol.value && gameState.value !== 'won'
}

function tileChar(row, col) {
  if (isObscured(col)) return ''
  if (row < guesses.value.length)   return guesses.value[row][col] ?? ''
  if (row === guesses.value.length) return currentGuess.value[col] ?? ''
  return ''
}

function tileClass(row, col) {
  if (isObscured(col)) return 'tile--obscured'
  if (row < guesses.value.length) return `tile--${evaluatedRows.value[row][col].status}`
  if (row === guesses.value.length && gameState.value === 'playing')
    return currentGuess.value[col] ? 'tile--filled' : 'tile--empty'
  return 'tile--empty'
}

function keyClass(key) {
  if (key === 'ENTER' || key === '⌫') return 'key--action'
  return letterStatuses.value[key] ? `key--${letterStatuses.value[key]}` : ''
}

// ── Input ─────────────────────────────────────────────────────────────────────
function handleKey(key) {
  if (gameState.value !== 'playing') return
  inputError.value = ''
  if (key === '⌫') {
    currentGuess.value = currentGuess.value.slice(0, -1)
  } else if (key === 'ENTER') {
    submitGuess()
  } else if (currentGuess.value.length < wordLength.value) {
    currentGuess.value += key
  }
}

function onKeyDown(e) {
  if (e.key === 'Backspace') return handleKey('⌫')
  if (e.key === 'Enter')     return handleKey('ENTER')
  if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toUpperCase())
}

function submitGuess() {
  if (currentGuess.value.length < wordLength.value) {
    inputError.value = `Guess must be ${wordLength.value} letters`
    return
  }

  const submitted    = currentGuess.value
  guesses.value      = [...guesses.value, submitted]
  currentGuess.value = ''

  if (submitted === secretWord.value) {
    gameState.value = 'won'
    const isLast = stage.value === JOURNEY_LENGTH - 1
    setTimeout(() => { modal.value = isLast ? 'complete' : 'won' }, 600)
  } else if (playerClass.value === 'knight' && !armorGranted.value && guesses.value.length >= MAX_GUESSES) {
    // Knight uses armor — grant 3 extra guesses instead of losing
    armorGranted.value = true
    setTimeout(() => { modal.value = 'armor' }, 600)
  } else if (guesses.value.length >= currentMaxGuesses.value) {
    gameState.value = 'lost'
    setTimeout(() => { modal.value = 'lost' }, 600)
  }
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function handleModalAction() {
  if (modal.value === 'enemy') {
    modal.value = 'monster'
  } else if (modal.value === 'monster') {
    modal.value = null
    if (activeEnemies.value.some(e => e.id === 'annoying-kid')) {
      applyAnnoyingKidGuess()
    } else {
      gameState.value = 'playing'
    }
  } else if (modal.value === 'won') {
    startStage(stage.value + 1)
  } else if (modal.value === 'armor') {
    modal.value = null  // game continues, keyboard stays active
  } else {
    // lost or complete → back to intro
    screen.value        = 'intro'
    playerClass.value   = null
    modal.value         = null
    gameState.value     = 'loading'
    activeEnemies.value = []
  }
}

// ── Navigation ────────────────────────────────────────────────────────────────
function restartJourney() {
  screen.value        = 'intro'
  playerClass.value   = null
  modal.value         = null
  gameState.value     = 'loading'
  activeEnemies.value = []
}

function showClassSelect() {
  classesAnimated.value = false
  screen.value = 'class-select'
  nextTick(() => { classesAnimated.value = true })
}

function selectClass(cls) {
  playerClass.value = cls
  screen.value      = 'playing'
  startStage(0)
}

// ── Game lifecycle ────────────────────────────────────────────────────────────
async function startStage(stageNum) {
  gameState.value    = 'loading'
  stage.value        = stageNum
  secretWord.value   = ''
  guesses.value      = []
  currentGuess.value = ''
  inputError.value   = ''
  modal.value        = null
  armorGranted.value = false
  hintLetter.value   = ''
  hintWordType.value = ''

  let min, max
  if (stageNum >= JOURNEY_LENGTH - 1) {
    monsterType.value = 'boss'
    min = 8; max = 12
  } else if (Math.random() < 0.5) {
    monsterType.value = 'small monster'
    min = 3; max = 4
  } else {
    monsterType.value = 'monster'
    min = 5; max = 7
  }

  try {
    const length = Math.floor(Math.random() * (max - min + 1)) + min
    const res = await fetch(`/api/word/random?length=${length}`)
    if (!res.ok) throw new Error()
    const data = await res.json()
    secretWord.value = data.word.toUpperCase()
    if (playerClass.value === 'seer') {
      const idx = Math.floor(Math.random() * secretWord.value.length)
      hintLetter.value = secretWord.value[idx]
    }
    if (playerClass.value === 'scholar') {
      const posMap = { n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb' }
      const tags = data.tags || []
      const types = Object.entries(posMap)
        .filter(([tag]) => tags.includes(tag))
        .map(([, label]) => label)
      hintWordType.value = types.length ? types.join(', ') : 'word'
    }
    gameState.value = 'ready'
    if (stageNum === ENEMY_TRIGGER_STAGE && activeEnemies.value.length === 0) {
      activeEnemies.value = [ENEMIES[Math.floor(Math.random() * ENEMIES.length)]]
      modal.value = 'enemy'
    } else {
      modal.value = 'monster'
    }
  } catch {
    gameState.value = 'error'
  }
}

async function applyAnnoyingKidGuess() {
  let word
  try {
    const res  = await fetch(`/api/word/random?length=${wordLength.value}`)
    const data = res.ok ? await res.json() : null
    word = data?.word?.toUpperCase()
  } catch { /* fall through */ }
  if (!word || word === secretWord.value) {
    const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    do { word = Array.from({ length: wordLength.value }, () => alpha[Math.floor(Math.random() * 26)]).join('') }
    while (word === secretWord.value)
  }
  guesses.value   = [word]
  gameState.value = 'playing'
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
</script>
