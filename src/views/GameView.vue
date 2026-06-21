<template>
  <main class="container py-4">
    <div class="game-wrapper">

      <div v-if="gameState === 'loading'" class="text-center py-5">
        <p class="game-meta">Loading word…</p>
      </div>

      <div v-else-if="gameState === 'error'" class="text-center py-5">
        <p class="text-danger mb-3">Could not load a word. Make sure the PHP server is running.</p>
        <button class="btn btn-press px-4" @click="startStage(stage)">Try Again</button>
      </div>

      <template v-else>
        <!-- Journey progress -->
        <div class="text-center mb-3">
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
        <div class="board mb-3" :style="{ '--cols': wordLength, fontSize: tileFontSize }">
          <template v-for="row in MAX_GUESSES" :key="row">
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

        <!-- Keyboard -->
        <div class="keyboard">
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
      </template>

      <!-- Modal -->
      <Transition name="modal">
        <div v-if="modal" class="modal-overlay">
          <div class="modal-card">
            <p class="modal-message">{{ MODAL_CONTENT[modal].message }}</p>
            <button class="btn btn-press px-5 py-2" @click="handleModalAction">
              {{ MODAL_CONTENT[modal].button }}
            </button>
          </div>
        </div>
      </Transition>

    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const MAX_GUESSES     = 6
const JOURNEY_LENGTH  = 8
const JOURNEY_START   = 3  // first word is 3 letters, last is 10

const KEY_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','⌫'],
]

const MODAL_CONTENT = {
  won:      { message: 'Word discovered! Continue?',       button: 'Continue' },
  lost:     { message: 'Oh no, you failed! Try again?',    button: 'Try Again' },
  complete: { message: 'You completed your quest! New Game?', button: 'New Game' },
}

const stage        = ref(0)
const secretWord   = ref('')
const guesses      = ref([])
const currentGuess = ref('')
const gameState    = ref('loading')
const inputError   = ref('')
const modal        = ref(null)

const wordLength   = computed(() => secretWord.value.length)
const guessesLeft  = computed(() => MAX_GUESSES - guesses.value.length)
const tileFontSize = computed(() => {
  const len = wordLength.value
  if (len <= 4) return '2rem'
  if (len <= 6) return '1.6rem'
  if (len <= 8) return '1.3rem'
  return '1.1rem'
})

// ── Evaluation ────────────────────────────────────────────────────────────────

function evaluateGuess(guess) {
  const status = Array(guess.length).fill('absent')
  const pool   = secretWord.value.split('')

  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === pool[i]) {
      status[i] = 'correct'
      pool[i]   = null
    }
  }
  for (let i = 0; i < guess.length; i++) {
    if (status[i] === 'correct') continue
    const j = pool.indexOf(guess[i])
    if (j !== -1) {
      status[i] = 'present'
      pool[j]   = null
    }
  }

  return guess.split('').map((letter, i) => ({ letter, status: status[i] }))
}

const evaluatedRows = computed(() => guesses.value.map(evaluateGuess))

const letterStatuses = computed(() => {
  const priority = { correct: 3, present: 2, absent: 1 }
  const map = {}
  for (const row of evaluatedRows.value) {
    for (const { letter, status } of row) {
      if (!map[letter] || priority[status] > priority[map[letter]]) {
        map[letter] = status
      }
    }
  }
  return map
})

// ── Tile & key helpers ────────────────────────────────────────────────────────

function dotClass(i) {
  if (i < stage.value)  return 'dot--done'
  if (i === stage.value) return 'dot--active'
  return 'dot--pending'
}

function tileChar(row, col) {
  if (row < guesses.value.length) return guesses.value[row][col] ?? ''
  if (row === guesses.value.length) return currentGuess.value[col] ?? ''
  return ''
}

function tileClass(row, col) {
  if (row < guesses.value.length) return `tile--${evaluatedRows.value[row][col].status}`
  if (row === guesses.value.length && gameState.value === 'playing') {
    return currentGuess.value[col] ? 'tile--filled' : 'tile--empty'
  }
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
  } else if (guesses.value.length >= MAX_GUESSES) {
    gameState.value = 'lost'
    setTimeout(() => { modal.value = 'lost' }, 600)
  }
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function handleModalAction() {
  if (modal.value === 'won') {
    startStage(stage.value + 1)
  } else {
    // lost or complete → restart from the beginning
    startStage(0)
  }
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

  const targetLength = stageNum + JOURNEY_START
  try {
    const res = await fetch(`/api/word/random?length=${targetLength}`)
    if (!res.ok) throw new Error()
    const data = await res.json()
    secretWord.value = data.word.toUpperCase()
    gameState.value  = 'playing'
  } catch {
    gameState.value = 'error'
  }
}

onMounted(() => {
  startStage(0)
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>
