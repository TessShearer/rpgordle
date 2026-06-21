<template>
  <main class="container py-4">
    <div class="game-wrapper">

      <div v-if="gameState === 'loading'" class="text-center py-5">
        <p class="game-meta">Loading word…</p>
      </div>

      <div v-else-if="gameState === 'error'" class="text-center py-5">
        <p class="text-danger mb-3">Could not load a word. Make sure the PHP server is running.</p>
        <button class="btn btn-press px-4" @click="startGame">Try Again</button>
      </div>

      <template v-else>
        <!-- Status -->
        <div class="text-center mb-3">
          <p v-if="gameState === 'won'" class="game-status won">You got it!</p>
          <p v-else-if="gameState === 'lost'" class="game-status lost">
            The word was <strong>{{ secretWord.toLowerCase() }}</strong>
          </p>
          <p v-else class="game-meta">
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

        <div class="text-center mt-4">
          <button class="btn btn-reset px-4 py-2" @click="startGame">New Game</button>
        </div>
      </template>

    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const MAX_GUESSES = 6
const KEY_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','⌫'],
]

const secretWord   = ref('')
const guesses      = ref([])
const currentGuess = ref('')
const gameState    = ref('loading')
const inputError   = ref('')

const wordLength   = computed(() => secretWord.value.length)
const guessesLeft  = computed(() => MAX_GUESSES - guesses.value.length)
const tileFontSize = computed(() => {
  const len = wordLength.value
  return len <= 4 ? '2rem' : len <= 6 ? '1.75rem' : '1.4rem'
})

// Evaluate a guess: two-pass algorithm handles duplicate letters correctly
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

// Best status per letter, used to colour the keyboard
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
  if (e.key === 'Enter') return handleKey('ENTER')
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
  } else if (guesses.value.length >= MAX_GUESSES) {
    gameState.value = 'lost'
  }
}

async function startGame() {
  gameState.value    = 'loading'
  secretWord.value   = ''
  guesses.value      = []
  currentGuess.value = ''
  inputError.value   = ''

  try {
    const res = await fetch('/api/word/random')
    if (!res.ok) throw new Error()
    const data = await res.json()
    secretWord.value = data.word.toUpperCase()
    gameState.value  = 'playing'
  } catch {
    gameState.value = 'error'
  }
}

onMounted(() => {
  startGame()
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>
