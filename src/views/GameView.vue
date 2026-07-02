<template>
  <main class="container py-2">
    <div class="game-wrapper">

      <!-- ── Daily loading / error ─────────────────────────────────────── -->
      <div v-if="dailyLoading" class="text-center py-5">
        <p class="game-meta">Loading today's adventure…</p>
      </div>
      <div v-else-if="dailyError" class="text-center py-5">
        <p class="text-danger mb-3">Could not load today's game. Please refresh.</p>
      </div>

      <!-- ── Intro ──────────────────────────────────────────────────────── -->
      <div v-else-if="screen === 'intro'" class="text-center">
        <div class="art-placeholder art-placeholder--hero mb-4">Art goes here</div>
        <button class="btn btn-press px-5 py-3 fs-5" @click="showClassSelect">
          Start Adventure
        </button>
      </div>

      <!-- ── Class Select ───────────────────────────────────────────────── -->
      <ClassSelect v-else-if="screen === 'class-select'" :classes="selectableClasses" :selected-class-id="selectedClass"
        @select="selectedClass = $event" @confirm="selectClass($event)" />

      <!-- ── Boss Select (free play) ──────────────────────────────────── -->
      <BossSelect v-else-if="screen === 'boss-select'" :bosses="BOSSES" :selected-boss-id="selectedBoss"
        @select="selectedBoss = $event" @confirm="confirmBossSelect" />

      <!-- ── Boss Intro ────────────────────────────────────────────────── -->
      <BossIntro v-else-if="screen === 'boss-intro'" ref="bossIntroRef" :boss="currentBoss" :player-class="playerClass"
        @begin="beginJourney" />

      <!-- ── Enemy Intro ───────────────────────────────────────────────── -->
      <EnemyIntro v-else-if="screen === 'enemy-intro'" ref="enemyIntroRef" :enemy="currentEnemy"
        @begin="beginEnemyEncounter" />

      <!-- ── Boss Fight Intro ──────────────────────────────────────────── -->
      <BossFightIntro v-else-if="screen === 'boss-fight-intro'" ref="bossFightIntroRef" :boss="currentBoss"
        @begin="beginBossFight" />

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
              <div class="portrait-img-col">
                <img v-if="featureArtImage" :src="featureArtImage" :alt="featureArtText" class="portrait-img" />
                <div v-else class="art-placeholder art-placeholder--portrait">{{ featureArtText }}</div>
                <p class="portrait-stat">HP: {{ playerHealth }}/{{ playerMaxHealth }}</p>
                <div class="player-health-pips portrait-pips">
                  <span v-for="n in playerMaxHealth" :key="n" class="health-pip health-pip--player"
                    :class="{ 'health-pip--lost': n > playerHealth }"></span>
                </div>
                <template v-if="playerClass === 'changeling' && changelingAbilities.length">
                  <p v-for="label in changelingAbilityLabels" :key="label" class="changeling-ability-line">a {{ label }}!</p>
                </template>
              </div>
              <div class="portrait-info-col">
                <div v-if="inventoryItems.length" class="inventory">
                  <p class="portrait-hint-label">Inventory</p>
                  <div class="inventory-list">
                    <div v-for="(item, i) in inventoryItems" :key="i" class="inventory-item" :title="item.description"
                      @click="confirmUseItem(item)">
                      <div class="art-placeholder art-placeholder--inv">{{ item.name }}</div>
                      <p class="inventory-item-name">{{ item.name }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="currentEnemy" class="portrait-slot">
              <div class="art-placeholder art-placeholder--portrait" :class="{ 'h-shake': bossShaking }">Art of {{
        currentEnemy.name
      }}</div>
              <p class="portrait-stat">{{ currentEnemy.name }}</p>
              <div class="enemy-health portrait-pips">
                <span v-for="n in currentEnemy.health" :key="n" class="health-pip"
                  :class="{ 'health-pip--lost': n > enemyHealth }"></span>
              </div>
            </div>
          </div>

          <!-- Left panel: class character art (desktop only) -->
          <aside class="game-panel game-panel--left">
            <div class="class-feature">
              <div class="class-feature-img-col">
                <img v-if="featureArtImage" :src="featureArtImage" :alt="featureArtText" class="feature-img" />
                <div v-else class="art-placeholder art-placeholder--feature">{{ featureArtText }}</div>
                <p class="feature-label">HP: {{ playerHealth }} / {{ playerMaxHealth }}</p>
                <div class="player-health-pips">
                  <span v-for="n in playerMaxHealth" :key="n" class="health-pip health-pip--player"
                    :class="{ 'health-pip--lost': n > playerHealth }"></span>
                </div>
                <template v-if="playerClass === 'changeling' && changelingAbilities.length">
                  <p v-for="label in changelingAbilityLabels" :key="label" class="changeling-ability-line">Changeling becomes... a {{ label }}!</p>
                </template>
              </div>
              <div class="class-feature-info-col">
                <div v-if="inventoryItems.length" class="inventory">
                  <p class="feature-label">Inventory</p>
                  <div class="inventory-list">
                    <div v-for="(item, i) in inventoryItems" :key="i" class="inventory-item" :title="item.description"
                      @click="confirmUseItem(item)">
                      <div class="art-placeholder art-placeholder--inv">{{ item.name }}</div>
                      <p class="inventory-item-name">{{ item.name }}</p>
                    </div>
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
                <span v-for="i in JOURNEY_LENGTH" :key="i" class="journey-dot" :class="dotClass(i - 1)"></span>
              </div>
              <p class="game-meta">{{ wordLength }}-letter {{ hasAbility('scholar') ? hintWordType : 'word' }}</p>
              <p v-if="hasAbility('seer') && hintLetter" class="game-meta seer-hint">
                Seer reveals this word has a{{ /^[aeiou]/i.test(hintLetter) ? 'n' : '' }} {{ hintLetter }}
              </p>
              <p v-if="hasAbility('scholar') && hintWordType" class="game-meta seer-hint">
                Scholar lectures on {{ hintWordType }}s
              </p>
            </div>

            <!-- Board -->
            <div class="board mb-2" :style="{ '--cols': wordLength }" :class="{ 'h-shake': boardShaking }"
              @animationend="boardShaking = false">
              <template v-for="row in boardRows" :key="row">
                <div v-for="col in wordLength" :key="col" class="tile" :class="tileClass(row - 1, col - 1)">
                  {{ tileChar(row - 1, col - 1) }}
                </div>
              </template>
            </div>

            <Transition name="modal">
              <div v-if="wonMessage" class="won-message-inline">
                <p class="won-message-text">Word guessed!<span v-if="wonDamage"> 1 damage!</span></p>
                <p v-if="lastRegen > 0" class="won-message-sub">You healed {{ lastRegen }} HP!</p>
                <div class="won-progress-track">
                  <div class="won-progress-fill"></div>
                </div>
              </div>
            </Transition>

            <p v-if="inputError" class="text-danger text-center small mb-2">{{ inputError }}</p>

            <!-- Submit + Keyboard -->
            <div v-if="gameState === 'playing'" class="text-center mb-2">
              <button class="btn btn-press px-4 py-1" @click="handleKey('ENTER')">Submit</button>
            </div>
            <div v-if="gameState === 'playing'" class="keyboard">
              <div v-for="(row, r) in KEY_ROWS" :key="r" class="key-row">
                <button v-for="key in row" :key="key" class="key" :class="keyClass(key)" @click="handleKey(key)">{{ key
                  }}</button>
              </div>
            </div>

            <button class="btn btn-reset btn-restart-fixed" @click="restartJourney">
              Start over
            </button>

            <div class="mt-3">
              <p class="enemy-name text-center">{{ currentBoss.name }} attacked the kingdom!</p>
              <p class="monster-text text-center">{{ currentBoss.effect }}
              </p>
            </div>

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
              <div class="art-placeholder art-placeholder--monster" :class="{ 'h-shake': bossShaking }"
                @animationend="bossShaking = false">Art of {{ currentEnemy.name }}</div>
              <p class="enemy-name">{{ currentEnemy.name }}</p>
              <div class="enemy-health">
                <span v-for="n in currentEnemy.health" :key="n" class="health-pip"
                  :class="{ 'health-pip--lost': n > enemyHealth }"></span>
              </div>
              <p class="monster-text">{{ currentEnemy.effect }}</p>
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
            <template v-else-if="modal === 'shop'">
              <p class="modal-message">You found a shop!</p>
              <p class="modal-submessage">{{ shopPrompt }}</p>
              <div class="shop-items">
                <div v-for="item in currentShopItems" :key="item.id" class="shop-item"
                  :class="{ 'shop-item--flipped': selectedShopItemId === item.id }"
                  @click="selectedShopItemId = item.id">
                  <div class="shop-item-inner">
                    <div class="shop-item-front">
                      <div class="art-placeholder art-placeholder--item">{{ item.name }}</div>
                      <p class="shop-item-name">{{ item.name }}</p>
                    </div>
                    <div class="shop-item-back">
                      <p class="shop-item-desc">{{ item.description }}</p>
                    </div>
                  </div>
                </div>
              </div>
              <Transition name="slide-in">
                <button v-if="selectedShopItemId" class="btn btn-press px-5 py-2 mt-3" @click="buySelectedItem">
                  Buy
                </button>
              </Transition>
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
              <p v-if="modal === 'lost'" class="modal-word">{{ secretWord.toLowerCase() }}</p>
            </template>
            <button v-if="modal !== 'shop' && modal !== 'use-item'" class="btn btn-press px-5 py-2 mt-3"
              @click="handleModalAction">
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
import { CLASSES, ENEMIES, MINIBOSSES, BOSSES, SHOP_ITEMS, ALL_ITEMS, STAGE_SEQUENCE, JOURNEY_LENGTH } from '@/data/gameData.js'
import BossIntro from '@/components/BossIntro.vue'
import BossFightIntro from '@/components/BossFightIntro.vue'
import ClassSelect from '@/components/ClassSelect.vue'
import BossSelect from '@/components/BossSelect.vue'
import EnemyIntro from '@/components/EnemyIntro.vue'
import { CHARACTER_IMAGES } from '@/assets/characterImages.js'
import { fetchOrCreateDaily } from '@/services/daily.js'
import { fetchGameWord, fetchWordData } from '@/services/words.js'

const props = defineProps({
  mode: { type: String, default: 'daily' },
})


const KEY_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
]


const MODAL_CONTENT = {
  'boss-announcement': { button: 'Begin Quest' },
  lost: { message: 'Oh no, you failed! Try again?', button: 'Try Again' },
  complete: { message: 'You completed your quest and the realm has been saved! New Game?', button: 'New Game' },
}


// ── Screen / class ────────────────────────────────────────────────────────────
const screen = ref('intro')
const playerClass = ref(null)
const changelingAbilities = ref([])
const selectedClass = ref(null)
const bossIntroRef = ref(null)
const bossFightIntroRef = ref(null)
const enemyIntroRef = ref(null)
const wonMessage = ref(false)
const wonDamage = ref(false)

// ── Game state ────────────────────────────────────────────────────────────────
const stage = ref(0)
const secretWord = ref('')
const guesses = ref([])
const currentGuess = ref('')
const gameState = ref('loading')
const inputError = ref('')
const modal = ref(null)
const hintLetter = ref('')
const hintWordType = ref('')
const playerHealth = ref(0)
const playerMaxHealth = ref(0)
const currentBoss = ref(null)
const currentEnemy = ref(null)
const enemyHealth = ref(0)
const hitWord = ref('')
const lastRegen = ref(0)
const dangerLetters = ref([])
const inventory = ref([])
const inventoryItems = computed(() => inventory.value.map(id => ALL_ITEMS.find(i => i.id === id)).filter(Boolean))
const pendingUseItem = ref(null)
const shieldedRows = ref(new Set())
const crystalHints = ref([])
const frozenSlots = ref({})
const allGuessedWords = ref([])

// ── Class abilities ───────────────────────────────────────────────────────────
const sneakAttackAvailable = ref(false)
const boardShaking = ref(false)
const bossShaking = ref(false)
const shopPicksRemaining = ref(1)
const shopTotalPicks = ref(1)
const selectedShopItemId = ref(null)
const freeplayShopItems = ref([])
const validating = ref(false)

// ── Daily / freeplay ──────────────────────────────────────────────────────────
const dailyConfig = ref(null)
const dailyLoading = ref(props.mode === 'daily')
const dailyError = ref(false)
const selectedBoss = ref(null)
const bossWordIndex = ref(0)

const selectableClasses = computed(() => {
  if (props.mode === 'daily' && dailyConfig.value) {
    return CLASSES.filter(c => dailyConfig.value.classIds.includes(c.id))
  }
  return CLASSES
})

const availableShopItems = computed(() => {
  if (props.mode === 'daily' && dailyConfig.value) {
    return SHOP_ITEMS.filter(s => dailyConfig.value.shopItemIds.includes(s.id))
  }
  return SHOP_ITEMS
})

const currentShopItems = computed(() =>
  props.mode === 'daily' ? availableShopItems.value : freeplayShopItems.value
)

function openShop() {
  if (props.mode !== 'daily') {
    const shuffled = [...SHOP_ITEMS].sort(() => Math.random() - 0.5)
    freeplayShopItems.value = shuffled.slice(0, 3)
  }
  modal.value = 'shop'
}

const obscuredCols = computed(() => {
  if (currentBoss.value?.id !== 'shadow-sorcerer') return []
  const center = Math.floor((wordLength.value - 1) / 2)
  const isBossFight = stage.value >= STAGE_SEQUENCE.length
  return isBossFight ? [center, center + 1] : [center]
})

// ── Derived ───────────────────────────────────────────────────────────────────
const wordLength = computed(() => secretWord.value.length)
const boardRows = computed(() =>
  guesses.value.length + (gameState.value === 'playing' ? 1 : 0)
)

const featureArtText = computed(() => {
  const cls = CLASSES.find(c => c.id === playerClass.value)
  return cls ? `Art of ${cls.name}` : 'Art of Peasant'
})

const shopPrompt = computed(() => {
  if (shopPicksRemaining.value > 1) return `Choose ${shopPicksRemaining.value} items.`
  if (shopTotalPicks.value > 1) return 'Choose 1 more item.'
  return 'Choose one item to purchase.'
})

const featureArtImage = computed(() => CHARACTER_IMAGES[playerClass.value] ?? null)

// ── Evaluation ────────────────────────────────────────────────────────────────
function evaluateGuess(guess) {
  const status = Array(guess.length).fill('absent')
  const pool = secretWord.value.split('')

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

const evaluatedRows = computed(() => guesses.value.map(evaluateGuess))
const letterStatuses = computed(() => {
  const priority = { correct: 3, present: 2, absent: 1 }
  const map = {}
  for (const row of evaluatedRows.value)
    for (const { letter, status } of row)
      if (!map[letter] || priority[status] > priority[map[letter]]) map[letter] = status
  return map
})

// Like letterStatuses but skips obscured columns — used for keyboard hints so
// the shadow sorcerer's hidden columns don't accidentally reveal letter info.
const visibleLetterStatuses = computed(() => {
  if (!obscuredCols.value.length) return letterStatuses.value
  const priority = { correct: 3, present: 2, absent: 1 }
  const map = {}
  for (const row of evaluatedRows.value) {
    for (let c = 0; c < row.length; c++) {
      if (obscuredCols.value.includes(c)) continue
      const { letter, status } = row[c]
      if (!map[letter] || priority[status] > priority[map[letter]]) map[letter] = status
    }
  }
  return map
})

// Layers seer + crystal ball hints on top of visibleLetterStatuses.
// Revealed letters start yellow and only upgrade (never downgrade) from there.
const keyboardStatuses = computed(() => {
  let base = visibleLetterStatuses.value
  if (hasAbility('seer') && hintLetter.value && base[hintLetter.value] !== 'correct') {
    base = { ...base, [hintLetter.value]: 'present' }
  }
  for (const letter of crystalHints.value) {
    if (!base[letter] || base[letter] === 'absent') {
      base = { ...base, [letter]: 'present' }
    }
  }
  return base
})

// Snowman: non-frozen position count for input length gating
const nonFrozenCount = computed(() => {
  const frozenCount = Object.keys(frozenSlots.value).filter(k => Number(k) < wordLength.value).length
  return wordLength.value - frozenCount
})

// Snowman: merges frozen letters with user-typed chars into a positional array
const effectiveGuessArr = computed(() => {
  const frozen = frozenSlots.value
  const result = []
  let userIdx = 0
  for (let i = 0; i < wordLength.value; i++) {
    if (frozen[i] !== undefined) {
      result.push(frozen[i])
    } else {
      result.push(currentGuess.value[userIdx] ?? '')
      userIdx++
    }
  }
  return result
})

const changelingAbilityLabels = computed(() =>
  changelingAbilities.value.map(id => CLASSES.find(c => c.id === id)?.name ?? id)
)

// ── Tile / key helpers ────────────────────────────────────────────────────────
function dotClass(i) {
  if (i < stage.value) return 'dot--done'
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
  if (row < guesses.value.length) return guesses.value[row][col] ?? ''
  if (row === guesses.value.length) return effectiveGuessArr.value[col] ?? ''
  return ''
}

function tileClass(row, col) {
  if (isObscured(row, col)) return 'tile--obscured'
  if (row < guesses.value.length) return `tile--${evaluatedRows.value[row][col].status}`
  if (row === guesses.value.length && gameState.value === 'playing') {
    if (frozenSlots.value[col] !== undefined) return 'tile--frozen'
    return effectiveGuessArr.value[col] ? 'tile--filled' : 'tile--empty'
  }
  return 'tile--empty'
}

function keyClass(key) {
  if (key === 'ENTER' || key === '⌫') return 'key--action'
  const isDanger = dangerLetters.value.length > 0 && dangerLetters.value.includes(key)
  const status = keyboardStatuses.value[key]
  const classes = []
  if (status) classes.push(`key--${status}`)
  if (isDanger) classes.push('key--danger')
  return classes.join(' ')
}

// ── Input ─────────────────────────────────────────────────────────────────────
function handleKey(key) {
  if (gameState.value !== 'playing' || modal.value || validating.value) return
  inputError.value = ''
  if (key === '⌫') {
    currentGuess.value = currentGuess.value.slice(0, -1)
  } else if (key === 'ENTER') {
    submitGuess()
  } else if (currentGuess.value.length < nonFrozenCount.value) {
    currentGuess.value += key
  }
}

function onKeyDown(e) {
  if (screen.value === 'intro') {
    if (e.key === 'Enter') showClassSelect()
    return
  }
  if (screen.value === 'class-select') {
    const list = selectableClasses.value
    const idx = list.findIndex(c => c.id === selectedClass.value)
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      selectedClass.value = list[(idx + 1) % list.length].id
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      selectedClass.value = list[idx < 1 ? list.length - 1 : idx - 1].id
    } else if (e.key === 'Enter' && selectedClass.value) {
      selectClass(selectedClass.value)
    }
    return
  }
  if (screen.value === 'boss-select') {
    const idx = BOSSES.findIndex(b => b.id === selectedBoss.value)
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      selectedBoss.value = BOSSES[(idx + 1) % BOSSES.length].id
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      selectedBoss.value = BOSSES[idx < 1 ? BOSSES.length - 1 : idx - 1].id
    } else if (e.key === 'Enter' && selectedBoss.value) {
      confirmBossSelect(selectedBoss.value)
    }
    return
  }
  if (screen.value === 'boss-intro') {
    if (e.key === 'Enter') {
      if (bossIntroRef.value?.allVisible) beginJourney()
      else bossIntroRef.value?.skip()
    }
    return
  }
  if (screen.value === 'boss-fight-intro') {
    if (e.key === 'Enter') {
      if (bossFightIntroRef.value?.allVisible) beginBossFight()
      else bossFightIntroRef.value?.skip()
    }
    return
  }
  if (screen.value === 'enemy-intro') {
    if (e.key === 'Enter') {
      if (enemyIntroRef.value?.allVisible) beginEnemyEncounter()
      else enemyIntroRef.value?.skip()
    }
    return
  }
  if (/^[1-9]$/.test(e.key) && gameState.value === 'playing' && !modal.value && !validating.value) {
    const item = inventoryItems.value[parseInt(e.key) - 1]
    if (item) { confirmUseItem(item); return }
  }
  if (e.key === 'Backspace') return handleKey('⌫')
  if (e.key === 'Enter') return handleKey('ENTER')
  if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toUpperCase())
}

async function submitGuess(skipValidation = false) {
  if (currentGuess.value.length < nonFrozenCount.value) {
    inputError.value = `Guess must be ${wordLength.value} letters`
    return
  }

  const submitted = effectiveGuessArr.value.join('')

  // Enhanced Snowman: all known-present (yellow) letters must appear in the guess
  if (currentBoss.value?.id === 'abominable-snowman' && stage.value >= STAGE_SEQUENCE.length) {
    const missing = Object.keys(letterStatuses.value)
      .filter(l => letterStatuses.value[l] === 'present' && !submitted.includes(l))
    if (missing.length > 0) {
      inputError.value = `Must use yellow letters: ${missing.join(', ')}`
      return
    }
  }

  // Validate word (Village Idiot and internal calls skip this)
  if (!hasAbility('village-idiot') && !skipValidation) {
    validating.value = true
    try {
      const res = await fetch(`/api/word/validate?word=${submitted.toLowerCase()}`)
      const data = await res.json()
      if (!data.valid) {
        boardShaking.value = true
        currentGuess.value = ''
        return
      }
    } catch {
      // network error → allow the guess
    } finally {
      validating.value = false
    }
  }

  const alreadyGuessed = allGuessedWords.value.includes(submitted)
  allGuessedWords.value = [...allGuessedWords.value, submitted]
  guesses.value = [...guesses.value, submitted]
  currentGuess.value = ''

  if (submitted === secretWord.value) {
    enemyHealth.value -= 1
    if (enemyHealth.value > 0) bossShaking.value = true
    if (enemyHealth.value <= 0) {
      // Cleric: heal to full on enemy defeat
      if (hasAbility('cleric')) {
        lastRegen.value = playerMaxHealth.value - playerHealth.value
        playerHealth.value = playerMaxHealth.value
      } else {
        const regen = currentEnemy.value.regen
        lastRegen.value = Math.min(regen, playerMaxHealth.value - playerHealth.value)
        playerHealth.value = Math.min(playerMaxHealth.value, playerHealth.value + regen)
      }
      gameState.value = 'won'
      const isLast = stage.value === JOURNEY_LENGTH - 1
      const isMiniboss = MINIBOSSES.some(m => m.id === currentEnemy.value?.id)
      if (isLast) {
        setTimeout(() => { modal.value = 'complete' }, 600)
      } else if (isMiniboss) {
        wonDamage.value = false
        wonMessage.value = true
        shopPicksRemaining.value = hasAbility('thief') ? 2 : 1
        shopTotalPicks.value = shopPicksRemaining.value
        setTimeout(() => {
          wonMessage.value = false
          openShop()
        }, 1800)
      } else {
        wonDamage.value = false
        wonMessage.value = true
        setTimeout(() => {
          wonMessage.value = false
          startStage(stage.value + 1)
        }, 1800)
      }
    } else {
      gameState.value = 'won'
      wonDamage.value = true
      wonMessage.value = true
      const advancingBoss = stage.value >= STAGE_SEQUENCE.length
      setTimeout(() => {
        wonMessage.value = false
        if (advancingBoss) bossWordIndex.value++
        loadWord(false)
      }, 1800)
    }
  } else {
    // Abominable Snowman: freeze new green positions for future guesses
    if (currentBoss.value?.id === 'abominable-snowman') {
      const guessEval = evaluateGuess(submitted)
      const newFrozen = { ...frozenSlots.value }
      guessEval.forEach(({ letter, status }, col) => {
        if (status === 'correct' && newFrozen[col] === undefined) newFrozen[col] = letter
      })
      frozenSlots.value = newFrozen
    }

    const guessRow = guesses.value.length - 1
    const isShielded = shieldedRows.value.has(guessRow)
    const doubleDamage = !isShielded
      && currentBoss.value?.id === 'gelatinous-cube'
      && dangerLetters.value.length > 0
      && dangerLetters.value.some(l => submitted.includes(l))

    // Necromancer: +1 for reused words; +1 enhanced for using absent (grey) letters
    let necroPenalty = 0
    if (currentBoss.value?.id === 'necromancer') {
      if (alreadyGuessed) necroPenalty += 1
      if (stage.value >= STAGE_SEQUENCE.length) {
        const hasAbsentLetter = Object.keys(letterStatuses.value)
          .some(l => letterStatuses.value[l] === 'absent' && submitted.includes(l))
        if (hasAbsentLetter) necroPenalty += 1
      }
    }

    playerHealth.value -= (doubleDamage ? 2 : 1) + necroPenalty
    if (playerHealth.value <= 0) {
      gameState.value = 'lost'
      setTimeout(() => { modal.value = 'lost' }, 600)
    } else if (hasAbility('assassin') && sneakAttackAvailable.value) {
      // Trigger sneak attack if 4+ letters are yellow (present)
      const guessEval = evaluateGuess(submitted)
      const yellowCount = guessEval.filter(c => c.status === 'present').length
      if (yellowCount >= 4) {
        sneakAttackAvailable.value = false
        inventory.value = [...inventory.value, 'sneak-attack']
      }
    }
  }
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function handleModalAction() {
  if (modal.value === 'boss-announcement') {
    startStage(0)
  } else {
    // lost or complete → back to intro
    screen.value = 'intro'
    playerClass.value = null
    changelingAbilities.value = []
    modal.value = null
    gameState.value = 'loading'
    playerHealth.value = 0
    playerMaxHealth.value = 0
    currentBoss.value = null
    currentEnemy.value = null
    enemyHealth.value = 0
    dangerLetters.value = []
    inventory.value = []
    shieldedRows.value = new Set()
    crystalHints.value = []
    frozenSlots.value = {}
    allGuessedWords.value = []
    selectedBoss.value = null
    bossWordIndex.value = 0
    sneakAttackAvailable.value = false
    shopPicksRemaining.value = 1
    shopTotalPicks.value = 1
    freeplayShopItems.value = []
    validating.value = false
  }
}

// ── Navigation ────────────────────────────────────────────────────────────────
function restartJourney() {
  screen.value = 'intro'
  playerClass.value = null
  changelingAbilities.value = []
  modal.value = null
  gameState.value = 'loading'
  playerHealth.value = 0
  playerMaxHealth.value = 0
  currentBoss.value = null
  currentEnemy.value = null
  enemyHealth.value = 0
  dangerLetters.value = []
  inventory.value = []
  shieldedRows.value = new Set()
  crystalHints.value = []
  frozenSlots.value = {}
  allGuessedWords.value = []
  selectedBoss.value = null
  bossWordIndex.value = 0
  sneakAttackAvailable.value = false
  shopPicksRemaining.value = 1
  freeplayShopItems.value = []
  validating.value = false
}

function showClassSelect() {
  selectedClass.value = null
  screen.value = 'class-select'
}

function selectClass(cls) {
  const classData = CLASSES.find(c => c.id === cls)
  playerClass.value = cls
  playerHealth.value = classData.health
  playerMaxHealth.value = classData.health
  gameState.value = 'ready'
  if (props.mode === 'daily' && dailyConfig.value) {
    currentBoss.value = BOSSES.find(b => b.id === dailyConfig.value.bossId)
    screen.value = 'boss-intro'
  } else {
    selectedBoss.value = null
    screen.value = 'boss-select'
  }
}

function confirmBossSelect(bossId) {
  currentBoss.value = BOSSES.find(b => b.id === bossId)
  beginJourney()
}

// Abilities the changeling can inherit (excludes stat-only and starting-bonus classes)
const CHANGELING_POOL = ['seer', 'scholar', 'assassin', 'cleric', 'village-idiot', 'thief']

function hasAbility(id) {
  return playerClass.value === id ||
    (playerClass.value === 'changeling' && changelingAbilities.value.includes(id))
}

function grantChangelingAbility() {
  const available = CHANGELING_POOL.filter(id => !changelingAbilities.value.includes(id))
  if (!available.length) return
  const picked = available[Math.floor(Math.random() * available.length)]
  changelingAbilities.value = [...changelingAbilities.value, picked]
}

function beginJourney() {
  screen.value = 'playing'
  allGuessedWords.value = []
  if (playerClass.value === 'treasurer') {
    const pool = availableShopItems.value
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    shuffled.slice(0, 2).forEach(item => inventory.value.push(item.id))
  }
  if (playerClass.value === 'changeling') {
    changelingAbilities.value = []
    grantChangelingAbility()
  }
  startStage(0)
}

function beginEnemyEncounter() {
  screen.value = 'playing'
  if (currentEnemy.value?.id === 'annoying-kid') {
    applyAnnoyingKidGuess()
  } else {
    gameState.value = 'playing'
  }
}

function beginBossFight() {
  screen.value = 'playing'
  loadWord(false)
}

// ── Game lifecycle ────────────────────────────────────────────────────────────
async function startStage(stageNum) {
  stage.value = stageNum
  sneakAttackAvailable.value = hasAbility('assassin')
  frozenSlots.value = {}
  const isBossFight = stageNum >= STAGE_SEQUENCE.length
  if (isBossFight) {
    currentEnemy.value = currentBoss.value
    enemyHealth.value = currentBoss.value.health
    bossWordIndex.value = 0
    screen.value = 'boss-fight-intro'
  } else {
    const stageType = STAGE_SEQUENCE[stageNum]
    const pool = stageType === 'miniboss' ? MINIBOSSES : ENEMIES
    if (props.mode === 'daily' && dailyConfig.value) {
      const enemyId = dailyConfig.value.stageEnemies[stageNum]
      currentEnemy.value = pool.find(e => e.id === enemyId) ?? pool[Math.floor(Math.random() * pool.length)]
    } else {
      currentEnemy.value = pool[Math.floor(Math.random() * pool.length)]
    }
    enemyHealth.value = currentEnemy.value.health
    await loadWord(true)
  }
}

function applyDangerLetters(isBossFight) {
  if (currentBoss.value?.id !== 'gelatinous-cube') return
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const count = isBossFight ? 3 : 1
  const picked = new Set()
  while (picked.size < count) picked.add(alpha[Math.floor(Math.random() * 26)])
  dangerLetters.value = [...picked]
}

function applySeerHint() {
  if (!hasAbility('seer')) return
  const idx = Math.floor(Math.random() * secretWord.value.length)
  hintLetter.value = secretWord.value[idx]
}

function finishWordLoad(showModal) {
  gameState.value = 'ready'
  if (showModal) {
    screen.value = 'enemy-intro'
  } else if (currentEnemy.value?.id === 'annoying-kid') {
    applyAnnoyingKidGuess()
  } else {
    gameState.value = 'playing'
  }
}

async function loadWord(showModal) {
  gameState.value = 'loading'
  secretWord.value = ''
  guesses.value = []
  currentGuess.value = ''
  inputError.value = ''
  modal.value = null
  hintLetter.value = ''
  hintWordType.value = ''
  dangerLetters.value = []
  shieldedRows.value = new Set()
  crystalHints.value = []
  // Unused sneak attack disappears when a new word begins
  inventory.value = inventory.value.filter(id => id !== 'sneak-attack')

  const isBossFight = stage.value >= STAGE_SEQUENCE.length

  if (props.mode === 'daily' && dailyConfig.value) {
    const wordKey = isBossFight ? `boss-${bossWordIndex.value}` : `stage-${stage.value}`
    secretWord.value = dailyConfig.value.words[wordKey]
    applyDangerLetters(isBossFight)
    applySeerHint()
    if (hasAbility('scholar')) hintWordType.value = 'word'
    finishWordLoad(showModal)
    return
  }

  try {
    const wordLen = isBossFight ? currentBoss.value.wordLength : 5
    const wordLower = await fetchGameWord({ minLength: wordLen, maxLength: wordLen })
    secretWord.value = wordLower.toUpperCase()
    applyDangerLetters(isBossFight)
    applySeerHint()
    if (hasAbility('scholar')) {
      try {
        const data = await fetchWordData(wordLower)
        hintWordType.value = data?.partOfSpeech || 'word'
      } catch {
        hintWordType.value = 'word'
      }
    }
    finishWordLoad(showModal)
  } catch {
    gameState.value = 'error'
  }
}


function buySelectedItem() {
  const item = currentShopItems.value.find(i => i.id === selectedShopItemId.value)
  if (!item) return
  selectedShopItemId.value = null
  buyItem(item)
}

function buyItem(item) {
  inventory.value.push(item.id)
  shopPicksRemaining.value -= 1
  if (shopPicksRemaining.value <= 0) {
    if (playerClass.value === 'changeling' && changelingAbilities.value.length < 2) {
      grantChangelingAbility()
    }
    modal.value = null
    startStage(stage.value + 1)
  }
}

function confirmUseItem(item) {
  if (item.effect === 'sneak-attack') {
    if (gameState.value !== 'playing') return
    pendingUseItem.value = item
    useItem()
    return
  }
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
  } else if (item.effect === 'crossbow') {
    const first = secretWord.value[0]
    if (first) currentGuess.value = first + currentGuess.value.slice(1)
  } else if (item.effect === 'sneak-attack') {
    // Build only the non-frozen portion of the secret word for currentGuess
    const frozen = frozenSlots.value
    let nonFrozenChars = ''
    for (let i = 0; i < secretWord.value.length; i++) {
      if (frozen[i] === undefined) nonFrozenChars += secretWord.value[i]
    }
    currentGuess.value = nonFrozenChars
    const idx = inventory.value.indexOf(item.id)
    if (idx !== -1) inventory.value.splice(idx, 1)
    pendingUseItem.value = null
    submitGuess(true)
    return
  }
  const idx = inventory.value.indexOf(item.id)
  if (idx !== -1) inventory.value.splice(idx, 1)
  pendingUseItem.value = null
  modal.value = null
}

function revealCrystalHint() {
  const known = new Set(Object.keys(letterStatuses.value))
  if (hintLetter.value) known.add(hintLetter.value)
  crystalHints.value.forEach(l => known.add(l))
  const wordLetters = [...new Set(secretWord.value.split(''))]
  const unknown = wordLetters.filter(l => !known.has(l))
  const pool = unknown.length ? unknown : wordLetters
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  crystalHints.value = [...crystalHints.value, ...shuffled.slice(0, 2)]
}

function articleFor(name) {
  return /^[aeiou]/i.test(name) ? 'An' : 'A'
}

async function applyAnnoyingKidGuess() {
  let word
  try {
    word = (await fetchGameWord({ minLength: wordLength.value, maxLength: wordLength.value })).toUpperCase()
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

onMounted(async () => {
  window.addEventListener('keydown', onKeyDown)
  if (props.mode === 'daily') {
    try {
      dailyConfig.value = await fetchOrCreateDaily()
    } catch (e) {
      console.error('[daily] failed to load:', e)
      dailyError.value = true
    } finally {
      dailyLoading.value = false
    }
  }
})
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
</script>
