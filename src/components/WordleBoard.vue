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
          <template v-if="board.hintWordType">Scholar lectures on <span :key="board.hintWordType" class="scholar-word-type">{{ board.hintWordType }}s</span><span v-if="board.hintDefinition"> and defines the word as "{{ board.hintDefinition }}"</span></template>
          <template v-else>The scholar isn't helpful today</template>
        </p>
        <p v-if="board.tomeDefinition" class="game-meta seer-hint">
          The ancient tome defines this word as "{{ board.tomeDefinition }}"
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
            'tile--fire': isFireAt(row - 1, col - 1),
            'tile--mimic': isMimicDangerAt(row - 1, col - 1),
            'tile--wily-reveal': isWilyRevealAt(row - 1, col - 1),
            'tile--wily-appear': isWilyAppearAt(row - 1, col - 1),
            'tile--elf-slide-out': isElfSlideOutAt(row - 1, col - 1),
            'tile--elf-slide-in': isElfSlideInAt(row - 1, col - 1),
          }]"
          :style="tileStyle(row - 1, col - 1)"
          :ref="(el) => setTileRef(row - 1, col - 1, el)"
          @click="bowTargeting && isInputRow(row - 1) && !isHintedCol(col - 1) && $emit('bow-target', col - 1)"
        >
          <img v-if="keyLetterColorAt(row - 1, col - 1)" :src="KEY_IMAGES[keyLetterColorAt(row - 1, col - 1)]" class="key-icon" alt="" />
          <span v-if="beetleColorAt(row - 1, col - 1)" class="beetle-icon" :class="`beetle-icon--${beetleColorAt(row - 1, col - 1)}`"></span>
          <span v-if="isDangerAt(row - 1, col - 1)" class="slime-icon"></span>
          <span class="tile-letter">{{ tileChar(row - 1, col - 1) }}</span>
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
import blueKeyImg from '@/assets/blue-key.png'
import redKeyImg from '@/assets/red-key.png'
import purpleKeyImg from '@/assets/purple-key.png'

const KEY_IMAGES = { blue: blueKeyImg, red: redKeyImg, purple: purpleKeyImg }

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
  fireLetters:     { type: Array, default: () => [] },
  keyLetterColors: { type: Object, default: () => ({}) },
  mimicDangerLetters: { type: Array, default: () => [] },
  beetleColors:    { type: Object, default: () => ({}) },
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

// Wily Magician: overrides one tile's status with a lie for the guess it was just told
// on, and again (still lying) while the previous guess's lie is mid reveal-animation —
// see isWilyRevealAt for the animation trigger itself.
const evaluatedRows = computed(() => props.board.guesses.map((guess, row) => {
  const evaluated = evaluateGuess(guess)
  const lie = props.board.wilyLieCell
  const reveal = props.board.wilyRevealCell
  if (lie && lie.row === row) evaluated[lie.col] = { ...evaluated[lie.col], status: lie.fakeStatus }
  if (reveal && reveal.row === row) evaluated[reveal.col] = { ...evaluated[reveal.col], status: reveal.fakeStatus }
  return evaluated
}))

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

function isFireAt(row, col) {
  if (!isInputRow(row) || !props.fireLetters.length) return false
  const typed = props.currentGuess[col]
  return !!typed && props.fireLetters.includes(typed)
}

function isMimicDangerAt(row, col) {
  if (!isInputRow(row) || !props.mimicDangerLetters.length) return false
  const typed = props.currentGuess[col]
  return !!typed && props.mimicDangerLetters.includes(typed)
}

function isWilyRevealAt(row, col) {
  const reveal = props.board.wilyRevealCell
  return !!reveal && reveal.row === row && reveal.col === col
}

function isWilyAppearAt(row, col) {
  const appear = props.board.wilyAppearCell
  return !!appear && appear.row === row && appear.col === col
}

function keyLetterColorAt(row, col) {
  if (!isInputRow(row)) return null
  const typed = props.currentGuess[col]
  return typed ? (props.keyLetterColors[typed] ?? null) : null
}

function beetleColorAt(row, col) {
  if (!isInputRow(row)) return null
  const typed = props.currentGuess[col]
  return typed ? (props.beetleColors[typed] ?? null) : null
}

// Shadow Sorcerer, already-submitted row: fully hidden, letter never rendered.
function isObscuredCommitted(row, col) {
  if (props.board.solved) return false
  if (props.board.abilityBlockedRows.has(row)) return false
  if (row >= props.board.guesses.length) return false
  return props.board.obscuredGuessPositions?.[row] === col &&
         props.board.obscuredGuessPositions[row] !== null
}

// Shadow Sorcerer, current input row: the letter still renders (so the player can check
// what they typed) but at reduced opacity — it only goes fully dark once submitted, at
// which point isObscuredCommitted takes over for that same column.
function isObscuredTyping(row, col) {
  if (props.board.solved) return false
  if (props.board.abilityBlockedRows.has(row)) return false
  if (row !== props.board.guesses.length) return false
  return props.shadowObscuredCol !== null && props.shadowObscuredCol === col
}

function isElfSlideOutAt(row, col) {
  const cell = props.board.littleElfSlideOutCell
  return !!cell && cell.row === row && cell.col === col
}

function isElfSlideInAt(row, col) {
  const cell = props.board.littleElfSlideInCell
  return !!cell && cell.row === row && cell.col === col
}

// Little Elf: the tile is blank once it's fully stolen, but visible again the instant it
// starts sliding back in (isElfSlideInAt), even though littleElfStealCell hasn't cleared yet
function isElfHidden(row, col) {
  if (isElfSlideInAt(row, col)) return false
  const cell = props.board.littleElfStealCell
  return !!cell && cell.row === row && cell.col === col
}

function tileChar(row, col) {
  if (props.compact && props.board.solved) {
    return props.board.guesses[props.board.guesses.length - 1]?.[col] ?? ''
  }
  if (isObscuredCommitted(row, col)) return ''
  if (isElfHidden(row, col)) return ''
  if (row < props.board.guesses.length) return props.board.guesses[row][col] ?? ''
  if (row === props.board.guesses.length) return props.currentGuess[col] ?? hintLetterAt(col) ?? ''
  return ''
}

function tileClass(row, col) {
  if (props.compact && props.board.solved) return 'tile--correct tile--compact-shrink'
  if (isObscuredCommitted(row, col)) return 'tile--obscured'
  if (isObscuredTyping(row, col)) return 'tile--filled tile--obscured-typing'
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
