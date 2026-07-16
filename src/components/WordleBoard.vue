<template>
  <div class="wordle-board" :class="{ 'wordle-board--solved': board.solved, 'wordle-board--compact': compact && board.solved }">
    <!-- Per-board hints (hidden in compact mode) -->
    <template v-if="!(compact && board.solved)">
      <div class="text-center mb-2">
        <p class="game-meta">{{ wordLength }}-letter {{ hasScholar && board.hintWordType ? board.hintWordType : 'word' }}</p>
        <p v-if="hasSeer && board.hintLetter" class="game-meta seer-hint">
          Seer reveals this word has a{{ /^[aeiou]/i.test(board.hintLetter) ? 'n' : '' }} {{ board.hintLetter }}
        </p>
        <p v-if="hasScholar" class="game-meta seer-hint">
          <template v-if="board.hintWordType">Scholar lectures on <span :key="board.hintWordType" class="scholar-word-type">{{ board.hintWordType }}s</span></template>
          <template v-else>The scholar isn't helpful today</template>
        </p>
      </div>
    </template>

    <!-- Board grid -->
    <div class="board mb-2" :style="{ '--cols': wordLength }"
      :class="{ 'h-shake': boardShaking && !board.solved }"
      @animationend="$emit('shake-end')">
      <template v-for="row in boardRows" :key="row">
        <div
          v-for="col in wordLength" :key="col"
          class="tile"
          :class="[tileClass(row - 1, col - 1), {
            'tile--targeting': bowTargeting && isInputRow(row - 1) && !isHintedCol(col - 1),
            'tile--danger': isDangerAt(row - 1, col - 1),
          }]"
          :style="tileStyle(row - 1, col - 1)"
          :ref="(el) => setTileRef(row - 1, col - 1, el)"
          @click="bowTargeting && isInputRow(row - 1) && !isHintedCol(col - 1) && $emit('bow-target', col - 1)"
        >
          {{ tileChar(row - 1, col - 1) }}
          <div v-if="bowTargeting && isInputRow(row - 1) && !isHintedCol(col - 1)" class="crosshair-overlay">
            <div class="crosshair-ring"></div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  board: { type: Object, required: true },
  currentGuess: { type: String, default: '' },
  gameState: { type: String, required: true },
  hasSeer: { type: Boolean, default: false },
  hasScholar: { type: Boolean, default: false },
  shadowObscuredCol: { type: Number, default: null },
  boardShaking:    { type: Boolean, default: false },
  boardScrambling: { type: Boolean, default: false },
  zombieRising:    { type: Boolean, default: false },
  graveyardWobble: { type: Boolean, default: false },
  compact:         { type: Boolean, default: false },
  bowTargeting:    { type: Boolean, default: false },
  dangerLetters:   { type: Array, default: () => [] },
})

defineEmits(['shake-end', 'bow-target'])

// Keyed by [row][col] — plain object, no reactivity needed
const tileRefs = {}

function setTileRef(row, col, el) {
  if (!tileRefs[row]) tileRefs[row] = {}
  if (el) tileRefs[row][col] = el
  else delete tileRefs[row][col]
}

function getInputRowRects() {
  const row = props.board.guesses.length
  const result = []
  for (let col = 0; col < wordLength.value; col++) {
    const el = tileRefs[row]?.[col]
    if (el) result.push({ col, letter: props.currentGuess[col] ?? '', rect: el.getBoundingClientRect(), el })
  }
  return result
}

defineExpose({ getInputRowRects })

const wordLength = computed(() => props.board.secretWord.length || 5)

// The green letter to show as a ghost hint at this column, if any — from the Abominable
// Snowman (enforced elsewhere), the Bow and Arrow, or the Crossbow (neither enforced)
function hintLetterAt(col) {
  const b = props.board
  return b.hintSlots?.[col] ?? b.bowSlots?.[col] ?? b.crossbowSlots?.[col] ?? null
}

function evaluateGuess(guess) {
  const status = Array(guess.length).fill('absent')
  const pool = props.board.secretWord.split('')
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

const evaluatedRows = computed(() => props.board.guesses.map(evaluateGuess))

const boardRows = computed(() => {
  if (props.compact && props.board.solved) return 1
  return props.board.guesses.length + (props.gameState === 'playing' && !props.board.solved ? 1 : 0)
})

function isInputRow(row) {
  return row === props.board.guesses.length && props.gameState === 'playing' && !props.board.solved
}

function isHintedCol(col) {
  return hintLetterAt(col) !== null
}

function isDangerAt(row, col) {
  if (!isInputRow(row) || !props.dangerLetters.length) return false
  const typed = props.currentGuess[col]
  return !!typed && props.dangerLetters.includes(typed)
}

function isObscured(row, col) {
  if (props.board.solved) return false
  if (props.board.abilityBlockedRows.has(row)) return false
  if (row < props.board.guesses.length) {
    return props.board.obscuredGuessPositions?.[row] === col &&
           props.board.obscuredGuessPositions[row] !== null
  }
  if (row === props.board.guesses.length) {
    return props.shadowObscuredCol !== null && props.shadowObscuredCol === col
  }
  return false
}

function tileChar(row, col) {
  if (props.compact && props.board.solved) {
    return props.board.guesses[props.board.guesses.length - 1]?.[col] ?? ''
  }
  if (isObscured(row, col)) return ''
  if (row < props.board.guesses.length) return props.board.guesses[row][col] ?? ''
  if (row === props.board.guesses.length) return props.currentGuess[col] ?? hintLetterAt(col) ?? ''
  return ''
}

function tileClass(row, col) {
  if (props.compact && props.board.solved) return 'tile--correct tile--compact-shrink'
  if (isObscured(row, col)) return 'tile--obscured'
  if (row < props.board.guesses.length) return `tile--${evaluatedRows.value[row][col].status}`
  if (row === props.board.guesses.length && props.gameState === 'playing' && !props.board.solved) {
    const typed = props.currentGuess[col]
    if (props.zombieRising && typed) return 'tile--filled tile--zombie'
    if (props.graveyardWobble && typed) return 'tile--filled tile--wobble'
    if (props.boardScrambling && typed) return 'tile--filled tile--scrambling'
    if (!typed && hintLetterAt(col) !== null) return 'tile--hint'
    return typed ? 'tile--filled' : 'tile--empty'
  }
  return 'tile--empty'
}

function tileStyle(row, col) {
  const isCurrentRow = row === props.board.guesses.length && props.gameState === 'playing' && !props.board.solved
  const typed = props.currentGuess[col]
  if (isCurrentRow && props.zombieRising && typed) {
    return { animationDelay: `${col * 100}ms` }
  }
  if (isCurrentRow && props.graveyardWobble && typed) {
    return { animationDelay: `${col * 90}ms` }
  }
  if (isCurrentRow && props.boardScrambling && typed) {
    return { animationDelay: `${col * 55}ms` }
  }
  return {}
}
</script>
