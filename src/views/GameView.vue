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
      <div v-else-if="screen === 'class-select'" class="class-select-layout">
        <div class="class-select-main">
          <p class="game-meta text-center mb-4">Choose your class</p>
          <div class="class-options">
            <div
              v-for="(cls, i) in CLASSES"
              :key="cls.id"
              class="class-option"
              :class="{ animated: classesAnimated, 'class-option--selected': selectedClass === cls.id }"
              :style="{ transitionDelay: `${i * 0.15}s` }"
              @click="selectedClass = cls.id"
            >
              <div class="art-with-shadow">
                <img v-if="CHARACTER_IMAGES[cls.id]" :src="CHARACTER_IMAGES[cls.id]" :alt="cls.name" class="class-img" />
                <div v-else class="art-placeholder art-placeholder--class">
                  Art for {{ cls.name }} goes here
                </div>
                <div class="class-option-shadow"></div>
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
        <Transition name="slide-in">
          <div v-if="selectedClass" class="class-select-aside">
            <button class="btn btn-press px-4 py-3 fs-5" @click="selectClass(selectedClass)">
              Continue
            </button>
          </div>
        </Transition>
      </div>

      <!-- ── Boss Intro ────────────────────────────────────────────────── -->
      <BossIntro
        v-else-if="screen === 'boss-intro'"
        :boss="currentBoss"
        :player-class="playerClass"
        @begin="beginJourney"
      />

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

          <!-- Mobile-only portraits strip (hidden on desktop) -->
          <div class="mobile-portraits">
            <div class="portrait-slot">
              <img v-if="featureArtImage" :src="featureArtImage" :alt="featureArtText" class="portrait-img" />
              <div v-else class="art-placeholder art-placeholder--portrait">{{ featureArtText }}</div>
              <template v-if="playerClass === 'seer' && hintLetter">
                <p class="portrait-hint-label">This word has a...</p>
                <p class="portrait-hint-value">{{ hintLetter }}</p>
              </template>
              <template v-else-if="playerClass === 'scholar' && hintWordType">
                <p class="portrait-hint-label">is a...</p>
                <p class="portrait-hint-value portrait-hint-value--word">{{ hintWordType }}</p>
              </template>
              <p class="portrait-stat">HP: {{ playerHealth }}/{{ playerMaxHealth }}</p>
              <div class="player-health-pips portrait-pips">
                <span
                  v-for="n in playerMaxHealth"
                  :key="n"
                  class="health-pip health-pip--player"
                  :class="{ 'health-pip--lost': n > playerHealth }"
                ></span>
              </div>
              <template v-if="crystalHints.length">
                <p class="portrait-hint-label">crystal ball</p>
                <p class="portrait-hint-value">{{ crystalHints.join(', ') }}</p>
              </template>
              <div v-if="inventoryItems.length" class="inventory mt-1">
                <p class="portrait-hint-label">Inventory</p>
                <div class="inventory-list">
                  <div v-for="(item, i) in inventoryItems" :key="i" class="inventory-item" :title="item.description" @click="confirmUseItem(item)">
                    <div class="art-placeholder art-placeholder--inv">{{ item.name }}</div>
                    <p class="inventory-item-name">{{ item.name }}</p>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="currentEnemy" class="portrait-slot">
              <div class="art-placeholder art-placeholder--portrait">Art of {{ currentEnemy.name }}</div>
              <p class="portrait-stat">{{ currentEnemy.name }}</p>
              <div class="enemy-health portrait-pips">
                <span
                  v-for="n in currentEnemy.health"
                  :key="n"
                  class="health-pip"
                  :class="{ 'health-pip--lost': n > enemyHealth }"
                ></span>
              </div>
              <template v-if="dangerLetters.length">
                <p class="portrait-hint-label">Danger {{ dangerLetters.length > 1 ? 'letters' : 'letter' }}</p>
                <p v-for="l in dangerLetters" :key="l" class="danger-letter">{{ l }}</p>
              </template>
            </div>
          </div>

          <!-- Left panel: class character art (desktop only) -->
          <aside class="game-panel game-panel--left">
            <div class="class-feature" :class="{ 'class-feature--reveal': playerClass === 'seer' || playerClass === 'scholar' }">
              <img v-if="featureArtImage" :src="featureArtImage" :alt="featureArtText" class="feature-img" />
              <div v-else class="art-placeholder art-placeholder--feature">{{ featureArtText }}</div>
              <div v-if="playerClass === 'seer'" class="feature-hint">
                <p class="feature-label">this word has a...</p>
                <p class="feature-letter">{{ hintLetter }}</p>
              </div>
              <div v-if="playerClass === 'scholar'" class="feature-hint">
                <p class="feature-label">this word is a...</p>
                <p class="feature-word">{{ hintWordType }}</p>
              </div>
              <div v-if="crystalHints.length" class="feature-hint">
                <p class="feature-label">crystal ball reveals...</p>
                <p class="feature-letter">{{ crystalHints.join(', ') }}</p>
              </div>
              <div class="player-health mt-2">
                <p class="feature-label">HP: {{ playerHealth }} / {{ playerMaxHealth }}</p>
                <div class="player-health-pips">
                  <span
                    v-for="n in playerMaxHealth"
                    :key="n"
                    class="health-pip health-pip--player"
                    :class="{ 'health-pip--lost': n > playerHealth }"
                  ></span>
                </div>
              </div>
              <div v-if="inventoryItems.length" class="inventory mt-2">
                <p class="feature-label">Inventory</p>
                <div class="inventory-list">
                  <div v-for="(item, i) in inventoryItems" :key="i" class="inventory-item" :title="item.description" @click="confirmUseItem(item)">
                    <div class="art-placeholder art-placeholder--inv">{{ item.name }}</div>
                    <p class="inventory-item-name">{{ item.name }}</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <!-- Center: game board -->
          <div class="game-center">
            <!-- Journey progress -->
            <div class="text-center mb-2">
              <p class="game-meta mb-2">Enemy {{ stage + 1 }} of {{ JOURNEY_LENGTH }}</p>
              <div class="journey-dots mb-2">
                <span
                  v-for="i in JOURNEY_LENGTH"
                  :key="i"
                  class="journey-dot"
                  :class="dotClass(i - 1)"
                ></span>
              </div>
              <p class="game-meta">{{ wordLength }}-letter word</p>
            </div>

            <!-- Board -->
            <div class="board mb-2" :style="{ '--cols': wordLength }">
              <template v-for="row in boardRows" :key="row">
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

            <button class="btn btn-reset btn-restart-fixed" @click="restartJourney">
              Start over
            </button>

            <!-- Testing box -->
            <div class="testing-box mt-3">
              <span class="testing-label">for testing</span>
              <p class="testing-reveal-label">reveal answer</p>
              <p class="debug-answer mb-2">{{ secretWord.toLowerCase() }}</p>
            </div>
          </div>

          <!-- Right panel: current enemy -->
          <aside class="game-panel game-panel--right">
            <div v-if="currentEnemy" class="enemy-section">
              <div class="art-placeholder art-placeholder--monster">Art of {{ currentEnemy.name }}</div>
              <p class="enemy-name">{{ currentEnemy.name }}</p>
              <div class="enemy-health">
                <span
                  v-for="n in currentEnemy.health"
                  :key="n"
                  class="health-pip"
                  :class="{ 'health-pip--lost': n > enemyHealth }"
                ></span>
              </div>
              <p class="monster-text">{{ currentEnemy.effect }}</p>
              <div v-if="dangerLetters.length" class="danger-display mt-1">
                <p class="monster-text">Danger {{ dangerLetters.length > 1 ? 'letters' : 'letter' }}</p>
                <p v-for="l in dangerLetters" :key="l" class="danger-letter">{{ l }}</p>
              </div>
            </div>
          </aside>

        </div>

      </template>

      <!-- Modal (sits above all screens) -->
      <Transition name="modal">
        <div v-if="modal" class="modal-overlay">
          <div class="modal-card" :class="{ 'modal-card--wide': modal === 'shop' }">
            <template v-if="modal === 'boss-announcement'">
              <div class="art-placeholder art-placeholder--modal-monster my-3">Art of {{ currentBoss.name }}</div>
              <p class="modal-message">{{ currentBoss.announcement }}</p>
            </template>
            <template v-else-if="modal === 'boss-fight'">
              <div class="art-placeholder art-placeholder--modal-monster my-3">Art of {{ currentBoss.name }}</div>
              <p class="modal-message">{{ currentBoss.enhancedAnnouncement }}</p>
            </template>
            <template v-else-if="modal === 'encounter'">
              <p class="modal-message">{{ articleFor(currentEnemy.name) }} {{ currentEnemy.name }} blocks your path!</p>
              <div class="art-placeholder art-placeholder--modal-monster my-3">Art of {{ currentEnemy.name }}</div>
              <p class="modal-submessage">{{ currentEnemy.effect }}</p>
            </template>
            <template v-else-if="modal === 'hit'">
              <div class="art-placeholder art-placeholder--modal-monster my-3">Art of {{ currentEnemy.name }} (damaged)</div>
              <p class="modal-message">{{ hitWord }} guessed, 1 damage!</p>
            </template>
            <template v-else-if="modal === 'shop'">
              <p class="modal-message">You found a shop!</p>
              <p class="modal-submessage">Choose one item to purchase.</p>
              <div class="shop-items">
                <div
                  v-for="item in SHOP_ITEMS"
                  :key="item.id"
                  class="shop-item"
                  @click="buyItem(item)"
                >
                  <div class="art-placeholder art-placeholder--item">{{ item.name }}</div>
                  <p class="shop-item-name">{{ item.name }}</p>
                </div>
              </div>
            </template>
            <template v-else-if="modal === 'use-item'">
              <p class="modal-message">Use {{ pendingUseItem.name }}?</p>
              <p class="modal-submessage">{{ pendingUseItem.description }}</p>
              <div class="modal-actions mt-3">
                <button class="btn btn-press px-4 py-2" @click="useItem">Yes</button>
                <button class="btn btn-reset px-4 py-2" @click="cancelUseItem">No</button>
              </div>
            </template>
            <template v-else>
              <p class="modal-message">{{ MODAL_CONTENT[modal].message }}</p>
              <p v-if="modal === 'won' && lastRegen > 0" class="modal-submessage">You healed {{ lastRegen }} HP!</p>
              <p v-if="modal === 'lost'" class="modal-word">{{ secretWord.toLowerCase() }}</p>
            </template>
            <button v-if="modal !== 'shop' && modal !== 'use-item'" class="btn btn-press px-5 py-2 mt-3" @click="handleModalAction">
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
import { CLASSES, ENEMIES, MINIBOSSES, BOSSES, SHOP_ITEMS } from '@/data/gameData.js'
import BossIntro from '@/components/BossIntro.vue'
import { CHARACTER_IMAGES } from '@/assets/characterImages.js'

const STAGE_SEQUENCE = ['enemy', 'miniboss', 'enemy']
const JOURNEY_LENGTH = STAGE_SEQUENCE.length + 1  // 3 normal stages + 1 boss fight


const KEY_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','⌫'],
]


const MODAL_CONTENT = {
  'boss-announcement': { button: 'Begin Quest'    },
  'boss-fight':        { button: 'Face the Boss!' },
  encounter:           { button: 'Begin!'          },
  hit:                 { button: 'Continue'        },
  won:                 { message: 'Enemy defeated! Continue?',           button: 'Continue'  },
  lost:                { message: 'Oh no, you failed! Try again?',       button: 'Try Again' },
  complete:            { message: 'You completed your quest! New Game?', button: 'New Game'  },
}

// ── Screen / class ────────────────────────────────────────────────────────────
const screen          = ref('intro')
const playerClass     = ref(null)
const classesAnimated = ref(false)
const selectedClass   = ref(null)

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
const playerHealth    = ref(0)
const playerMaxHealth = ref(0)
const currentBoss     = ref(null)
const currentEnemy    = ref(null)
const enemyHealth     = ref(0)
const hitWord         = ref('')
const lastRegen       = ref(0)
const dangerLetters   = ref([])
const inventory       = ref([])
const inventoryItems  = computed(() => inventory.value.map(id => SHOP_ITEMS.find(i => i.id === id)))
const pendingUseItem  = ref(null)
const shieldedRows    = ref(new Set())
const crystalHints    = ref([])

const obscuredCols = computed(() => {
  if (currentBoss.value?.id !== 'shadow-sorcerer') return []
  const center = Math.floor((wordLength.value - 1) / 2)
  const isBossFight = stage.value >= STAGE_SEQUENCE.length
  return isBossFight ? [center, center + 1] : [center]
})

// ── Derived ───────────────────────────────────────────────────────────────────
const wordLength        = computed(() => secretWord.value.length)
const boardRows = computed(() =>
  guesses.value.length + (gameState.value === 'playing' ? 1 : 0)
)

const featureArtText = computed(() => {
  if (playerClass.value === 'seer')    return 'Art of seer thinking'
  if (playerClass.value === 'scholar') return 'Art of scholar'
  if (playerClass.value === 'knight')  return 'Art of knight'
  return 'Art of Peasant'
})

const featureArtImage = computed(() => CHARACTER_IMAGES[playerClass.value] ?? null)

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

function isObscured(row, col) {
  if (obscuredCols.value.length === 0 || !obscuredCols.value.includes(col)) return false
  if (gameState.value === 'won') return false
  if (shieldedRows.value.has(row)) return false
  return true
}

function tileChar(row, col) {
  if (isObscured(row, col)) return ''
  if (row < guesses.value.length)   return guesses.value[row][col] ?? ''
  if (row === guesses.value.length) return currentGuess.value[col] ?? ''
  return ''
}

function tileClass(row, col) {
  if (isObscured(row, col)) return 'tile--obscured'
  if (row < guesses.value.length) return `tile--${evaluatedRows.value[row][col].status}`
  if (row === guesses.value.length && gameState.value === 'playing')
    return currentGuess.value[col] ? 'tile--filled' : 'tile--empty'
  return 'tile--empty'
}

function keyClass(key) {
  if (key === 'ENTER' || key === '⌫') return 'key--action'
  if (currentBoss.value?.id === 'shadow-sorcerer') return ''
  if (dangerLetters.value.length > 0 && dangerLetters.value.includes(key)) return 'key--danger'
  return letterStatuses.value[key] ? `key--${letterStatuses.value[key]}` : ''
}

// ── Input ─────────────────────────────────────────────────────────────────────
function handleKey(key) {
  if (gameState.value !== 'playing' || modal.value) return
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
    enemyHealth.value -= 1
    if (enemyHealth.value <= 0) {
      const regen = currentEnemy.value.regen
      lastRegen.value = Math.min(regen, playerMaxHealth.value - playerHealth.value)
      playerHealth.value = Math.min(playerMaxHealth.value, playerHealth.value + regen)
      gameState.value = 'won'
      const isLast = stage.value === JOURNEY_LENGTH - 1
      const isMiniboss = MINIBOSSES.some(m => m.id === currentEnemy.value?.id)
      setTimeout(() => {
        modal.value = isLast ? 'complete' : isMiniboss ? 'shop' : 'won'
      }, 600)
    } else {
      // Hit but not dead — show damage modal, then load a fresh word
      hitWord.value   = submitted.toLowerCase()
      gameState.value = 'won'
      setTimeout(() => { modal.value = 'hit' }, 600)
    }
  } else {
    const guessRow     = guesses.value.length - 1
    const isShielded   = shieldedRows.value.has(guessRow)
    const doubleDamage = !isShielded
                         && currentBoss.value?.id === 'gelatinous-cube'
                         && dangerLetters.value.length > 0
                         && dangerLetters.value.some(l => submitted.includes(l))
    playerHealth.value -= doubleDamage ? 2 : 1
    if (playerHealth.value <= 0) {
      gameState.value = 'lost'
      setTimeout(() => { modal.value = 'lost' }, 600)
    }
  }
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function handleModalAction() {
  if (modal.value === 'boss-announcement') {
    startStage(0)
  } else if (modal.value === 'boss-fight') {
    loadWord(false)
  } else if (modal.value === 'encounter') {
    modal.value = null
    if (currentEnemy.value?.id === 'annoying-kid') {
      applyAnnoyingKidGuess()
    } else {
      gameState.value = 'playing'
    }
  } else if (modal.value === 'hit') {
    loadWord(false)
  } else if (modal.value === 'won') {
    startStage(stage.value + 1)
  } else {
    // lost or complete → back to intro
    screen.value          = 'intro'
    playerClass.value     = null
    modal.value           = null
    gameState.value       = 'loading'
    playerHealth.value    = 0
    playerMaxHealth.value = 0
    currentBoss.value     = null
    currentEnemy.value    = null
    enemyHealth.value     = 0
    dangerLetters.value   = []
    inventory.value       = []
    shieldedRows.value    = new Set()
    crystalHints.value    = []
  }
}

// ── Navigation ────────────────────────────────────────────────────────────────
function restartJourney() {
  screen.value          = 'intro'
  playerClass.value     = null
  modal.value           = null
  gameState.value       = 'loading'
  playerHealth.value    = 0
  playerMaxHealth.value = 0
  currentBoss.value     = null
  currentEnemy.value    = null
  enemyHealth.value     = 0
  dangerLetters.value   = []
  inventory.value       = []
  shieldedRows.value    = new Set()
  crystalHints.value    = []
}

function showClassSelect() {
  classesAnimated.value = false
  selectedClass.value   = null
  screen.value = 'class-select'
  nextTick(() => { classesAnimated.value = true })
}

function selectClass(cls) {
  const classData       = CLASSES.find(c => c.id === cls)
  playerClass.value     = cls
  playerHealth.value    = classData.health
  playerMaxHealth.value = classData.health
  currentBoss.value     = BOSSES[Math.floor(Math.random() * BOSSES.length)]
  screen.value          = 'boss-intro'
  gameState.value       = 'ready'
}

function beginJourney() {
  screen.value = 'playing'
  startStage(0)
}

// ── Game lifecycle ────────────────────────────────────────────────────────────
async function startStage(stageNum) {
  stage.value = stageNum
  const isBossFight = stageNum >= STAGE_SEQUENCE.length
  if (isBossFight) {
    currentEnemy.value = currentBoss.value
    enemyHealth.value  = currentBoss.value.health
    modal.value        = 'boss-fight'
  } else {
    const stageType    = STAGE_SEQUENCE[stageNum]
    const pool         = stageType === 'miniboss' ? MINIBOSSES : ENEMIES
    currentEnemy.value = pool[Math.floor(Math.random() * pool.length)]
    enemyHealth.value  = currentEnemy.value.health
    await loadWord(true)
  }
}

async function loadWord(showModal) {
  gameState.value    = 'loading'
  secretWord.value   = ''
  guesses.value      = []
  currentGuess.value = ''
  inputError.value   = ''
  modal.value        = null
  hintLetter.value      = ''
  hintWordType.value    = ''
  dangerLetters.value   = []
  shieldedRows.value    = new Set()
  crystalHints.value    = []


  const isBossFight = stage.value >= STAGE_SEQUENCE.length
  const [min, max]  = isBossFight ? [8, 12] : [4, 7]

  try {
    const length = Math.floor(Math.random() * (max - min + 1)) + min
    const res = await fetch(`/api/word/random?length=${length}`)
    if (!res.ok) throw new Error()
    const data = await res.json()
    secretWord.value = data.word.toUpperCase()
    if (currentBoss.value?.id === 'gelatinous-cube') {
      const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      const isBossFight = stage.value >= STAGE_SEQUENCE.length
      const count = isBossFight ? 3 : 1
      const picked = new Set()
      while (picked.size < count) picked.add(alpha[Math.floor(Math.random() * 26)])
      dangerLetters.value = [...picked]
    }
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
    if (showModal) {
      modal.value = 'encounter'
    } else if (currentEnemy.value?.id === 'annoying-kid') {
      applyAnnoyingKidGuess()
    } else {
      gameState.value = 'playing'
    }
  } catch {
    gameState.value = 'error'
  }
}


function buyItem(item) {
  inventory.value.push(item.id)
  modal.value = null
  startStage(stage.value + 1)
}

function confirmUseItem(item) {
  pendingUseItem.value = item
  modal.value = 'use-item'
}

function cancelUseItem() {
  pendingUseItem.value = null
  modal.value = null
}

function useItem() {
  const item = pendingUseItem.value
  if (!item) return
  if (item.effect === 'heal') {
    playerHealth.value = Math.min(playerMaxHealth.value, playerHealth.value + 1)
  } else if (item.effect === 'shield') {
    shieldedRows.value = new Set([...shieldedRows.value, guesses.value.length])
  } else if (item.effect === 'crystal-ball') {
    revealCrystalHint()
  }
  const idx = inventory.value.indexOf(item.id)
  if (idx !== -1) inventory.value.splice(idx, 1)
  pendingUseItem.value = null
  modal.value = null
}

function revealCrystalHint() {
  const known = new Set(Object.keys(letterStatuses.value))
  if (hintLetter.value) known.add(hintLetter.value)
  const wordLetters = [...new Set(secretWord.value.split(''))]
  const unknown = wordLetters.filter(l => !known.has(l))
  const pool = unknown.length ? unknown : wordLetters
  crystalHints.value = [...crystalHints.value, pool[Math.floor(Math.random() * pool.length)]]
}

function articleFor(name) {
  return /^[aeiou]/i.test(name) ? 'An' : 'A'
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
  guesses.value = [word]

  const doubleDamage = currentBoss.value?.id === 'gelatinous-cube'
                       && dangerLetters.value.length > 0
                       && dangerLetters.value.some(l => word.includes(l))
  playerHealth.value -= doubleDamage ? 2 : 1

  if (playerHealth.value <= 0) {
    gameState.value = 'lost'
    setTimeout(() => { modal.value = 'lost' }, 600)
  } else {
    gameState.value = 'playing'
  }
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
</script>
