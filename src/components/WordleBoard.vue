<template>
  <div class="wordle-board" :class="{ 'wordle-board--solved': board.solved }">
    <!-- Per-board hints -->
    <div class="text-center mb-2">
      <p class="game-meta">{{ wordLength }}-letter {{ hasScholar && board.hintWordType ? board.hintWordType : 'word' }}</p>
      <p v-if="hasSeer && board.hintLetter" class="game-meta seer-hint">
        Seer reveals this word has a{{ /^[aeiou]/i.test(board.hintLetter) ? 'n' : '' }} {{ board.hintLetter }}
      </p>
      <p v-if="hasScholar && board.hintWordType" class="game-meta seer-hint">
        Scholar lectures on {{ board.hintWordType }}s
      </p>
    </div>

    <!-- Board grid -->
    <div class="board mb-2" :style="{ '--cols': wordLength }"
      :class="{ 'h-shake': boardShaking && !board.solved }"
      @animationend="$emit('shake-end')">
      <template v-for="row in boardRows" :key="row">
        <div v-for="col in wordLength" :key="col" class="tile" :class="tileClass(row - 1, col - 1)">
          {{ tileChar(row - 1, col - 1) }}
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
  boss: { type: Object, default: null },
  isBossFight: { type: Boolean, default: false },
  hasSeer: { type: Boolean, default: false },
  hasScholar: { type: Boolean, default: false },
  boardShaking: { type: Boolean, default: false },
})

defineEmits(['shake-end'])

const wordLength = computed(() => props.board.secretWord.length || 5)

const obscuredCols = computed(() => {
  if (props.boss?.id !== 'shadow-sorcerer') return []
  const center = Math.floor((wordLength.value - 1) / 2)
  return props.isBossFight ? [center, center + 1] : [center]
})

const effectiveGuessArr = computed(() => {
  const frozen = props.board.frozenSlots
  const result = []
  let userIdx = 0
  for (let i = 0; i < wordLength.value; i++) {
    if (frozen[i] !== undefined) {
      result.push(frozen[i])
    } else {
      result.push(props.currentGuess[userIdx] ?? '')
      userIdx++
    }
  }
  return result
})

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

const boardRows = computed(() =>
  props.board.guesses.length + (props.gameState === 'playing' && !props.board.solved ? 1 : 0)
)

function isObscured(row, col) {
  if (!obscuredCols.value.includes(col)) return false
  if (props.board.solved) return false
  if (props.board.shieldedRows.has(row)) return false
  return true
}

function tileChar(row, col) {
  if (isObscured(row, col)) return ''
  if (row < props.board.guesses.length) return props.board.guesses[row][col] ?? ''
  if (row === props.board.guesses.length) return effectiveGuessArr.value[col] ?? ''
  return ''
}

function tileClass(row, col) {
  if (isObscured(row, col)) return 'tile--obscured'
  if (row < props.board.guesses.length) return `tile--${evaluatedRows.value[row][col].status}`
  if (row === props.board.guesses.length && props.gameState === 'playing' && !props.board.solved) {
    if (props.board.frozenSlots[col] !== undefined) return 'tile--frozen'
    return effectiveGuessArr.value[col] ? 'tile--filled' : 'tile--empty'
  }
  return 'tile--empty'
}
</script>
