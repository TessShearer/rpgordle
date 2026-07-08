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

      <!-- ── Stats Screen ───────────────────────────────────────────────── -->
      <div v-else-if="screen === 'stats'" class="stats-screen">
        <h2 class="stats-title">{{ gameResult === 'won' ? '⚔️ Quest Complete!' : '💀 Quest Failed' }}</h2>

        <div class="stats-body">
          <p class="stats-label">Played as:</p>
          <p class="stats-class-name">{{ CLASSES.find(c => c.id === playerClass)?.name }}</p>

          <template v-for="(entry, ei) in gameLog" :key="ei">
            <div v-if="!entry.isBoss" class="stats-encounter">
              <p class="stats-encounter-name">
                {{ entry.name }}: {{ totalGuessCount(entry) }} {{ totalGuessCount(entry) === 1 ? 'guess' : 'guesses' }}
              </p>
              <template v-for="(board, bi) in entry.boards" :key="bi">
                <p v-if="entry.boards.length > 1" class="stats-board-divider">— Word {{ bi + 1 }} —</p>
                <p v-for="(guess, gi) in board.guesses" :key="gi" class="stats-row">{{ emojiRow(guess, board.secretWord) }}</p>
                <p v-if="!board.solved" class="stats-answer">Answer: {{ board.secretWord.toLowerCase() }}</p>
              </template>
            </div>
          </template>

          <template v-if="gameLog.some(e => e.isBoss)">
            <template v-for="(entry, ei) in gameLog.filter(e => e.isBoss)" :key="ei">
              <div class="stats-encounter">
                <p class="stats-encounter-name">
                  {{ entry.name }}{{ gameLog.filter(e => e.isBoss).length > 1 ? ` (Round ${entry.roundIndex + 1})` : '' }}:
                  {{ totalGuessCount(entry) }} {{ totalGuessCount(entry) === 1 ? 'guess' : 'guesses' }}
                </p>
                <template v-for="(board, bi) in entry.boards" :key="bi">
                  <p v-if="entry.boards.length > 1" class="stats-board-divider">— Head {{ bi + 1 }} —</p>
                  <p v-for="(guess, gi) in board.guesses" :key="gi" class="stats-row">{{ emojiRow(guess, board.secretWord) }}</p>
                  <p v-if="!board.solved" class="stats-answer">Answer: {{ board.secretWord.toLowerCase() }}</p>
                </template>
              </div>
            </template>
          </template>

          <p class="stats-health">
            {{ gameResult === 'won' ? `Remaining health: ${playerHealth}` : 'Defeated!' }}
          </p>
        </div>

        <div class="stats-actions">
          <button class="btn btn-press px-5 py-2" @click="copyStats">
            {{ copied ? '✓ Copied!' : 'Copy to Clipboard' }}
          </button>
          <button class="btn btn-reset px-5 py-2 mt-2" @click="restartJourney">Play Again</button>
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
              <div class="art-placeholder art-placeholder--portrait" :class="{ 'h-shake': bossShaking }">Art of {{ currentEnemy.name }}</div>
              <div v-if="currentEnemy.id === 'slumbering-giant'" class="snore-bars" :class="{ 'snore-bars--awake': giantAwake }">
                <div v-for="i in 4" :key="i" class="snore-bar" :class="{ 'snore-bar--filled': i <= giantSnoreBars }"></div>
              </div>
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

          <!-- Center: game board(s) -->
          <div class="game-center">
            <!-- Journey progress -->
            <div class="text-center mb-2">
              <p class="game-meta mb-2">Enemy {{ stage + 1 }} of {{ JOURNEY_LENGTH }}</p>
              <div class="journey-dots mb-2">
                <span v-for="i in JOURNEY_LENGTH" :key="i" class="journey-dot" :class="dotClass(i - 1)"></span>
              </div>
            </div>

            <!-- Board(s) -->
            <div class="boards-container" :class="{ 'boards-container--multi': boards.length > 1 }">
              <WordleBoard
                v-for="board in boards"
                :key="board.id"
                :ref="(el) => setBoardRef(board.id, el)"
                :board="board"
                :current-guess="currentGuess"
                :game-state="gameState"
                :boss="currentBoss"
                :is-boss-fight="isBossFight"
                :has-seer="hasAbility('seer')"
                :has-scholar="hasAbility('scholar')"
                :board-shaking="boardShaking"
                :zombie-rising="zombieRising"
                :compact="board.solved && boards.length > 1"
                @shake-end="boardShaking = false"
              />
            </div>

            <Transition name="modal">
              <div v-if="wonMessage" class="won-message-inline">
                <p class="won-message-text"><span v-if="wonDamage > 0">{{ wonDamage }} damage!</span><span v-else>{{ currentEnemy?.name }} defeated!</span></p>
                <p v-if="lastRegen > 0" class="won-message-sub">{{ lastRegen }} healed!</p>
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
              <p class="monster-text text-center">{{ currentBoss.effect }}</p>
            </div>

            <div v-if="currentBoss?.id === 'necromancer'" class="graveyard-slot graveyard-slot--strip mt-2">
              <GraveyardDisplay :words="allGuessedWords" />
            </div>

            <!-- Testing box -->
            <div class="testing-box mt-3">
              <span class="testing-label">for testing</span>
              <p class="testing-reveal-label">reveal answer</p>
              <p v-for="b in boards" :key="b.id" class="debug-answer mb-1">{{ b.secretWord.toLowerCase() }}</p>
            </div>
          </div>

          <!-- Right panel: current enemy -->
          <aside class="game-panel game-panel--right">
            <div v-if="currentEnemy" class="enemy-section">
              <div class="art-placeholder art-placeholder--monster" :class="{ 'h-shake': bossShaking }"
                @animationend="bossShaking = false">Art of {{ currentEnemy.name }}</div>
              <div v-if="currentEnemy.id === 'slumbering-giant'" class="snore-bars" :class="{ 'snore-bars--awake': giantAwake }">
                <div v-for="i in 4" :key="i" class="snore-bar" :class="{ 'snore-bar--filled': i <= giantSnoreBars }"></div>
              </div>
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
            <template v-else-if="modal === 'know-it-all'">
              <Transition name="kit-fade" mode="out-in">
                <p v-if="knowItAllModalPhase === 'taunt'" key="taunt" class="modal-message kit-message">
                  Looks like you're having trouble... not everyone can have the extensive vocabulary that I do... let me help you
                </p>
                <p v-else key="definition" class="modal-message kit-message">
                  This word is defined as <em class="kit-definition">{{ knowItAllDefinition }}</em>
                </p>
              </Transition>
              <button class="btn btn-press px-5 py-2 mt-3 kit-dismiss"
                :disabled="!knowItAllCanDismiss"
                @click="dismissKnowItAllModal">
                {{ knowItAllCanDismiss ? 'Got it' : '...' }}
              </button>
            </template>
            <template v-else>
              <p class="modal-message">{{ MODAL_CONTENT[modal].message }}</p>
              <p v-if="modal === 'lost'" class="modal-word">{{ boards.map(b => b.secretWord.toLowerCase()).join(', ') }}</p>
            </template>
            <button v-if="modal !== 'shop' && modal !== 'use-item' && modal !== 'know-it-all'" class="btn btn-press px-5 py-2 mt-3"
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
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { CLASSES, ENEMIES, MINIBOSSES, BOSSES, SHOP_ITEMS, ALL_ITEMS, STAGE_SEQUENCE, JOURNEY_LENGTH } from '@/data/gameData.js'
import BossIntro from '@/components/BossIntro.vue'
import BossFightIntro from '@/components/BossFightIntro.vue'
import ClassSelect from '@/components/ClassSelect.vue'
import BossSelect from '@/components/BossSelect.vue'
import EnemyIntro from '@/components/EnemyIntro.vue'
import WordleBoard from '@/components/WordleBoard.vue'
import GraveyardDisplay from '@/components/GraveyardDisplay.vue'
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
const wonDamage = ref(0)

// ── Game state ────────────────────────────────────────────────────────────────
const stage = ref(0)
const boards = ref([])
const currentGuess = ref('')
const gameState = ref('loading')
const inputError = ref('')
const modal = ref(null)
const playerHealth = ref(0)
const playerMaxHealth = ref(0)
const currentBoss = ref(null)
const currentEnemy = ref(null)
const enemyHealth = ref(0)
const lastRegen = ref(0)
const dangerLetters = ref([])
const inventory = ref([])
const inventoryItems = computed(() => inventory.value.map(id => ALL_ITEMS.find(i => i.id === id)).filter(Boolean))
const pendingUseItem = ref(null)
const allGuessedWords = ref([])

// ── Class abilities ───────────────────────────────────────────────────────────
const sneakAttackAvailable = ref(false)
const vorpalSwordActive = ref(false)
const boardShaking = ref(false)
const bossShaking = ref(false)
const shopPicksRemaining = ref(1)
const shopTotalPicks = ref(1)
const selectedShopItemId = ref(null)
const freeplayShopItems = ref([])
const validating = ref(false)
const annoyingKidTyping = ref(false)
const zombieRising = ref(false)
const fortuneTellerGreyLetters = ref([])
const giantSnoreBars = ref(0)
const giantAwake = ref(false)

// ── Board component refs (plain object — not reactive) ────────────────────────
const boardRefs = {}

function setBoardRef(id, el) {
  if (el) boardRefs[id] = el
  else delete boardRefs[id]
}

// ── Daily / freeplay ──────────────────────────────────────────────────────────
const dailyConfig = ref(null)
const dailyLoading = ref(props.mode === 'daily')
const dailyError = ref(false)
const selectedBoss = ref(null)
const bossWordIndex = ref(0)

// ── Stats ─────────────────────────────────────────────────────────────────────
const gameLog = ref([])
const gameResult = ref(null)
const copied = ref(false)

// ── Know It All modal ─────────────────────────────────────────────────────────
const knowItAllDefinition = ref('')
const knowItAllModalPhase = ref('taunt')
const knowItAllCanDismiss = ref(false)

// ── Board helpers ─────────────────────────────────────────────────────────────
function makeBoard(id, secretWord) {
  return {
    id,
    secretWord,
    guesses: [],
    hintLetter: '',
    hintWordType: '',
    frozenSlots: {},
    shieldedRows: new Set(),
    crystalHints: [],
    solved: false,
  }
}

function buildEffectiveGuess(board) {
  const frozen = board.frozenSlots
  const len = board.secretWord.length
  const result = []
  let userIdx = 0
  for (let i = 0; i < len; i++) {
    if (frozen[i] !== undefined) {
      result.push(frozen[i])
    } else {
      result.push(currentGuess.value[userIdx] ?? '')
      userIdx++
    }
  }
  return result.join('')
}

function evaluateGuess(guess, secretWord) {
  const status = Array(guess.length).fill('absent')
  const pool = secretWord.split('')
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

function getUnionLetterStatuses() {
  const priority = { correct: 3, present: 2, absent: 1 }
  const map = {}
  for (const board of boards.value) {
    for (const guess of board.guesses) {
      for (const { letter, status } of evaluateGuess(guess, board.secretWord)) {
        if (!map[letter] || priority[status] > priority[map[letter]]) map[letter] = status
      }
    }
  }
  return map
}

const selectableClasses = computed(() => {
  if (props.mode === 'daily' && dailyConfig.value) {
    return CLASSES.filter(c => dailyConfig.value.classIds.includes(c.id))
  }
  return CLASSES
})

const availableShopItems = computed(() => {
  const noShield = currentBoss.value?.id === 'hydra'
  if (props.mode === 'daily' && dailyConfig.value) {
    return SHOP_ITEMS.filter(s =>
      dailyConfig.value.shopItemIds.includes(s.id) && !(noShield && s.id === 'shield')
    )
  }
  return noShield ? SHOP_ITEMS.filter(s => s.id !== 'shield') : SHOP_ITEMS
})

const currentShopItems = computed(() =>
  props.mode === 'daily' ? availableShopItems.value : freeplayShopItems.value
)

function openShop() {
  if (props.mode !== 'daily') {
    const pool = currentBoss.value?.id === 'hydra'
      ? SHOP_ITEMS.filter(s => s.id !== 'shield')
      : SHOP_ITEMS
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    freeplayShopItems.value = shuffled.slice(0, 3)
  }
  modal.value = 'shop'
}

const isBossFight = computed(() => stage.value >= STAGE_SEQUENCE.length)

const obscuredCols = computed(() => {
  if (currentBoss.value?.id !== 'shadow-sorcerer') return []
  const center = Math.floor((wordLength.value - 1) / 2)
  return isBossFight.value ? [center, center + 1] : [center]
})

// ── Derived ───────────────────────────────────────────────────────────────────
const wordLength = computed(() => boards.value[0]?.secretWord.length ?? 5)

// Max non-frozen positions across all active boards (user must type enough for the most open board)
const nonFrozenCount = computed(() => {
  const active = boards.value.filter(b => !b.solved)
  if (!active.length) return wordLength.value
  return Math.max(...active.map(board => {
    const frozen = Object.keys(board.frozenSlots).filter(k => Number(k) < wordLength.value).length
    return wordLength.value - frozen
  }))
})

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

// Union letter statuses across all boards, skipping obscured columns, with class/crystal hints layered on top
const keyboardStatuses = computed(() => {
  const priority = { correct: 3, present: 2, absent: 1 }
  const obscured = obscuredCols.value
  const base = {}

  for (const board of boards.value) {
    board.guesses.forEach((guess) => {
      const evaluated = evaluateGuess(guess, board.secretWord)
      evaluated.forEach(({ letter, status }, col) => {
        if (obscured.includes(col)) return
        if (!base[letter] || priority[status] > priority[base[letter]]) base[letter] = status
      })
    })
  }

  // Seer hint from first board
  if (hasAbility('seer')) {
    const seerLetter = boards.value[0]?.hintLetter
    if (seerLetter && base[seerLetter] !== 'correct') {
      if (!base[seerLetter] || base[seerLetter] === 'absent') base[seerLetter] = 'present'
    }
  }

  // Crystal hints from all boards
  for (const board of boards.value) {
    for (const letter of board.crystalHints) {
      if (!base[letter] || base[letter] === 'absent') base[letter] = 'present'
    }
  }

  // Fortune Teller: pre-reveal absent letters (only if not already known from guesses)
  for (const letter of fortuneTellerGreyLetters.value) {
    if (!base[letter]) base[letter] = 'absent'
  }

  return base
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
  if (gameState.value !== 'playing' || modal.value || validating.value || annoyingKidTyping.value) return
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

function recordCurrentRound() {
  gameLog.value.push({
    name: currentEnemy.value?.name ?? '',
    isBoss: isBossFight.value,
    roundIndex: isBossFight.value ? bossWordIndex.value : 0,
    boards: boards.value.map(b => ({
      secretWord: b.secretWord,
      guesses: [...b.guesses],
      solved: b.solved,
    }))
  })
}

function emojiRow(guess, secretWord) {
  const status = Array(guess.length).fill('absent')
  const pool = secretWord.split('')
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === pool[i]) { status[i] = 'correct'; pool[i] = null }
  }
  for (let i = 0; i < guess.length; i++) {
    if (status[i] === 'correct') continue
    const j = pool.indexOf(guess[i])
    if (j !== -1) { status[i] = 'present'; pool[j] = null }
  }
  return status.map(s => s === 'correct' ? '🟩' : s === 'present' ? '🟨' : '⬜️').join(' ')
}

function totalGuessCount(entry) {
  return entry.boards.reduce((sum, b) => sum + b.guesses.length, 0)
}

function generateStatsText() {
  const lines = []
  const className = CLASSES.find(c => c.id === playerClass.value)?.name ?? playerClass.value
  lines.push('Played as:')
  lines.push(className)

  for (const entry of gameLog.value.filter(e => !e.isBoss)) {
    lines.push('')
    const count = totalGuessCount(entry)
    lines.push(`${entry.name}: ${count} ${count === 1 ? 'guess' : 'guesses'}`)
    for (let bi = 0; bi < entry.boards.length; bi++) {
      const board = entry.boards[bi]
      if (entry.boards.length > 1) lines.push(`Word ${bi + 1}:`)
      for (const guess of board.guesses) lines.push(emojiRow(guess, board.secretWord))
      if (!board.solved) lines.push(`Answer: ${board.secretWord.toLowerCase()}`)
      if (bi < entry.boards.length - 1) lines.push('')
    }
  }

  const bossEntries = gameLog.value.filter(e => e.isBoss)
  if (bossEntries.length > 0) {
    lines.push('')
    for (const entry of bossEntries) {
      lines.push('')
      const count = totalGuessCount(entry)
      const roundLabel = bossEntries.length > 1 ? ` (Round ${entry.roundIndex + 1})` : ''
      lines.push(`${entry.name}${roundLabel}: ${count} ${count === 1 ? 'guess' : 'guesses'}`)
      for (let bi = 0; bi < entry.boards.length; bi++) {
        const board = entry.boards[bi]
        if (entry.boards.length > 1) lines.push(`Head ${bi + 1}:`)
        for (const guess of board.guesses) lines.push(emojiRow(guess, board.secretWord))
        if (!board.solved) lines.push(`Answer: ${board.secretWord.toLowerCase()}`)
        if (bi < entry.boards.length - 1) lines.push('')
      }
    }
  }

  lines.push('')
  lines.push(gameResult.value === 'won'
    ? `Remaining health: ${playerHealth.value}`
    : 'Defeated!')

  return lines.join('\n')
}

async function copyStats() {
  try {
    await navigator.clipboard.writeText(generateStatsText())
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch { /* clipboard unavailable */ }
}

// ── Tricksy Fairy FLIP scramble ───────────────────────────────────────────────
// Returns a mapping of oldCol → newCol for a Fisher-Yates shuffle.
// Handles duplicate letters by greedy first-available matching.
function computeColMapping(oldLetters, newLetters) {
  const mapping = {}
  const usedNewCols = new Set()
  oldLetters.forEach((letter, oldCol) => {
    for (let newCol = 0; newCol < newLetters.length; newCol++) {
      if (!usedNewCols.has(newCol) && newLetters[newCol] === letter) {
        mapping[oldCol] = newCol
        usedNewCols.add(newCol)
        break
      }
    }
  })
  return mapping
}

async function doFairyScramble(board) {
  // 1. Snapshot tile positions and letters BEFORE the shuffle
  const snapshots = boardRefs[board.id]?.getInputRowRects() ?? []
  if (snapshots.length === 0) return

  const snapshotByCol = {}
  snapshots.forEach(s => { snapshotByCol[s.col] = s })

  // 2. Compute shuffle permutation
  const oldLetters = currentGuess.value.split('')
  const newLetters = [...oldLetters]
  for (let i = newLetters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newLetters[i], newLetters[j]] = [newLetters[j], newLetters[i]]
  }

  const colMapping = computeColMapping(oldLetters, newLetters)

  // 3. Update currentGuess — tiles now show the new letters at their grid positions
  currentGuess.value = newLetters.join('')
  await nextTick()

  // 4. Invert: apply transforms so each tile appears at its letter's old position
  // (tile at newCol gets the transform to look like it's still at oldCol)
  Object.entries(colMapping).forEach(([oldColStr, newCol]) => {
    const oldCol = parseInt(oldColStr)
    if (oldCol === newCol) return
    const dx = snapshotByCol[oldCol].rect.left - snapshotByCol[newCol].rect.left
    const dy = snapshotByCol[oldCol].rect.top - snapshotByCol[newCol].rect.top
    const el = snapshotByCol[newCol].el
    el.style.transition = 'none'
    el.style.transform = `translate(${dx}px, ${dy}px)`
  })

  // 5. Force reflow so the browser registers the inverted positions before animating
  document.body.getBoundingClientRect()

  // 6. Play: clear transforms with a spring transition — letters fly to their new homes
  snapshots.forEach(({ el }) => {
    el.style.transition = 'transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)'
    el.style.transform = ''
  })

  await new Promise(r => setTimeout(r, 420))

  // 7. Cleanup inline styles
  snapshots.forEach(({ el }) => {
    el.style.transition = ''
    el.style.transform = ''
  })
}

// Called whenever all boards are solved — applies damage and advances
function handleAllBoardsSolved() {
  const hitDamage = vorpalSwordActive.value ? 2 : 1
  vorpalSwordActive.value = false
  lastRegen.value = 0
  enemyHealth.value -= hitDamage
  if (enemyHealth.value > 0) bossShaking.value = true

  if (enemyHealth.value <= 0) {
    recordCurrentRound()
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
      gameResult.value = 'won'
      wonDamage.value = 0
      wonMessage.value = true
      setTimeout(() => {
        wonMessage.value = false
        screen.value = 'stats'
      }, 1800)
    } else if (isMiniboss) {
      wonDamage.value = 0
      wonMessage.value = true
      shopPicksRemaining.value = hasAbility('thief') ? 2 : 1
      shopTotalPicks.value = shopPicksRemaining.value
      setTimeout(() => {
        wonMessage.value = false
        openShop()
      }, 1800)
    } else {
      wonDamage.value = 0
      wonMessage.value = true
      setTimeout(() => {
        wonMessage.value = false
        startStage(stage.value + 1)
      }, 1800)
    }
  } else {
    recordCurrentRound()
    gameState.value = 'won'
    wonDamage.value = hitDamage
    wonMessage.value = true
    const advancing = isBossFight.value
    setTimeout(() => {
      wonMessage.value = false
      if (advancing) bossWordIndex.value++
      loadWord(false)
    }, 1800)
  }
}

async function submitGuess(skipValidation = false, skipScramble = false) {
  const activeBoards = boards.value.filter(b => !b.solved)
  if (!activeBoards.length) return

  if (currentGuess.value.length < nonFrozenCount.value) {
    inputError.value = `Guess must be ${wordLength.value} letters`
    return
  }

  const firstActive = activeBoards[0]
  const submitted = buildEffectiveGuess(firstActive)

  // Tricksy Fairy: FLIP-animate the scramble unless the guess is already correct
  if (!skipScramble && currentEnemy.value?.id === 'tricksy-fairy' && submitted !== firstActive.secretWord) {
    await doFairyScramble(firstActive)
    await submitGuess(true, true)
    return
  }

  // Enhanced Snowman: all known-yellow letters must appear in the guess
  if (currentBoss.value?.id === 'abominable-snowman' && isBossFight.value) {
    const unionStatuses = getUnionLetterStatuses()
    const missing = Object.keys(unionStatuses)
      .filter(l => unionStatuses[l] === 'present' && !submitted.includes(l))
    if (missing.length > 0) {
      inputError.value = `Must use yellow letters: ${missing.join(', ')}`
      return
    }
  }

  // Mirror Spirit: all guesses must be palindromes
  if (currentEnemy.value?.id === 'mirror-spirit') {
    if (submitted !== submitted.split('').reverse().join('')) {
      boardShaking.value = true
      inputError.value = 'Guess must be a palindrome!'
      return
    }
  }

  // Validate word (Village Idiot, internal calls, and correct answers skip this)
  const isCorrectAnswer = activeBoards.some(b => buildEffectiveGuess(b) === b.secretWord)
  if (!hasAbility('village-idiot') && !skipValidation && !isCorrectAnswer) {
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

  // Build all per-board submissions BEFORE clearing currentGuess
  const boardSubmissions = activeBoards.map(board => buildEffectiveGuess(board))

  const alreadyGuessed = allGuessedWords.value.includes(submitted)

  // Necromancer: animate repeated words rising up as zombies before submitting
  if (currentBoss.value?.id === 'necromancer' && alreadyGuessed) {
    zombieRising.value = true
    await new Promise(r => setTimeout(r, wordLength.value * 100 + 950))
    zombieRising.value = false
  }

  allGuessedWords.value = [...allGuessedWords.value, submitted]
  currentGuess.value = ''

  // Snapshot absent letters from PREVIOUS guesses before this one is recorded.
  // Used by the Necromancer boss-fight penalty — must be computed here, not after
  // board.guesses is updated, or the current guess would evaluate itself as absent.
  const prevAbsentLetters = new Set()
  if (currentBoss.value?.id === 'necromancer' && isBossFight.value) {
    const prevStatuses = getUnionLetterStatuses()
    for (const [l, s] of Object.entries(prevStatuses)) {
      if (s === 'absent') prevAbsentLetters.add(l)
    }
  }

  // Apply guess to each active board
  let anyBoardSolvedThisGuess = false
  for (let bi = 0; bi < activeBoards.length; bi++) {
    const board = activeBoards[bi]
    const boardSubmitted = boardSubmissions[bi]
    board.guesses = [...board.guesses, boardSubmitted]

    if (boardSubmitted === board.secretWord) {
      board.solved = true
      anyBoardSolvedThisGuess = true
    } else if (currentBoss.value?.id === 'abominable-snowman') {
      // Freeze new green positions
      const guessEval = evaluateGuess(boardSubmitted, board.secretWord)
      const newFrozen = { ...board.frozenSlots }
      guessEval.forEach(({ letter, status }, col) => {
        if (status === 'correct' && newFrozen[col] === undefined) newFrozen[col] = letter
      })
      board.frozenSlots = newFrozen
    }
  }

  const allSolved = boards.value.every(b => b.solved)

  if (allSolved) {
    handleAllBoardsSolved()
  } else if (!anyBoardSolvedThisGuess) {
    if (currentEnemy.value?.id === 'slumbering-giant') {
      // Slumbering Giant: wrong guesses fill snore bars, not player health
      if (!giantAwake.value) {
        giantSnoreBars.value++
        if (giantSnoreBars.value >= 4) {
          giantAwake.value = true
          playerHealth.value -= 7
          if (playerHealth.value <= 0) {
            recordCurrentRound()
            gameState.value = 'lost'
            gameResult.value = 'lost'
            setTimeout(() => { screen.value = 'stats' }, 1200)
          }
        }
      } else {
        // Giant is awake: 2 damage per wrong guess
        playerHealth.value -= 2
        if (playerHealth.value <= 0) {
          recordCurrentRound()
          gameState.value = 'lost'
          gameResult.value = 'lost'
          setTimeout(() => { screen.value = 'stats' }, 1200)
        }
      }
    } else {
      // No board solved — player takes damage
      const guessRow = firstActive.guesses.length - 1
      const isShielded = firstActive.shieldedRows.has(guessRow)
      const doubleDamage = !isShielded
        && currentBoss.value?.id === 'gelatinous-cube'
        && dangerLetters.value.length > 0
        && dangerLetters.value.some(l => submitted.includes(l))

      let necroPenalty = 0
      if (currentBoss.value?.id === 'necromancer') {
        if (alreadyGuessed) necroPenalty += 1
        if (isBossFight.value) {
          const hasAbsentLetter = submitted.split('').some(l => prevAbsentLetters.has(l))
          if (hasAbsentLetter) necroPenalty += 1
        }
      }

      playerHealth.value -= (doubleDamage ? 2 : 1) + necroPenalty
      if (playerHealth.value <= 0) {
        recordCurrentRound()
        gameState.value = 'lost'
        gameResult.value = 'lost'
        setTimeout(() => { screen.value = 'stats' }, 1200)
      } else {
        if (hasAbility('assassin') && sneakAttackAvailable.value) {
          const guessEval = evaluateGuess(submitted, firstActive.secretWord)
          const yellowCount = guessEval.filter(c => c.status === 'present').length
          if (yellowCount >= 4) {
            sneakAttackAvailable.value = false
            inventory.value = [...inventory.value, 'sneak-attack']
          }
        }
        if (currentEnemy.value?.id === 'know-it-all') {
          const active = boards.value[0]
          if (active && !active.solved && active.guesses.length === 3) {
            showKnowItAllModal(active.secretWord)
          }
        }
      }
    }
  }
  // If anyBoardSolvedThisGuess but not allSolved: game continues, no damage
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function handleModalAction() {
  if (modal.value === 'boss-announcement') {
    startStage(0)
  } else if (modal.value === 'know-it-all') {
    dismissKnowItAllModal()
  } else {
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
    boards.value = []
    allGuessedWords.value = []
    vorpalSwordActive.value = false
    wonMessage.value = false
    wonDamage.value = 0
    lastRegen.value = 0
    selectedBoss.value = null
    bossWordIndex.value = 0
    sneakAttackAvailable.value = false
    shopPicksRemaining.value = 1
    shopTotalPicks.value = 1
    freeplayShopItems.value = []
    validating.value = false
    fortuneTellerGreyLetters.value = []
    giantSnoreBars.value = 0
    giantAwake.value = false
    gameLog.value = []
    gameResult.value = null
    copied.value = false
    knowItAllDefinition.value = ''
    knowItAllModalPhase.value = 'taunt'
    knowItAllCanDismiss.value = false
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
  boards.value = []
  allGuessedWords.value = []
  vorpalSwordActive.value = false
  wonMessage.value = false
  wonDamage.value = 0
  lastRegen.value = 0
  selectedBoss.value = null
  bossWordIndex.value = 0
  sneakAttackAvailable.value = false
  shopPicksRemaining.value = 1
  freeplayShopItems.value = []
  validating.value = false
  fortuneTellerGreyLetters.value = []
  giantSnoreBars.value = 0
  giantAwake.value = false
  gameLog.value = []
  gameResult.value = null
  copied.value = false
  knowItAllDefinition.value = ''
  knowItAllModalPhase.value = 'taunt'
  knowItAllCanDismiss.value = false
}

// ── Know It All modal ─────────────────────────────────────────────────────────
async function showKnowItAllModal(secretWord) {
  knowItAllModalPhase.value = 'taunt'
  knowItAllCanDismiss.value = false
  knowItAllDefinition.value = ''
  modal.value = 'know-it-all'

  // Fetch definition and wait for taunt display time in parallel
  const [data] = await Promise.all([
    fetchWordData(secretWord.toLowerCase()).catch(() => null),
    new Promise(r => setTimeout(r, 2500)),
  ])

  if (modal.value !== 'know-it-all') return
  knowItAllDefinition.value = data?.definition || 'a most sophisticated word'
  knowItAllModalPhase.value = 'definition'
  setTimeout(() => {
    if (modal.value === 'know-it-all') knowItAllCanDismiss.value = true
  }, 1000)
}

function dismissKnowItAllModal() {
  if (!knowItAllCanDismiss.value) return
  modal.value = null
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
  if (isBossFight.value) {
    currentEnemy.value = currentBoss.value
    enemyHealth.value = currentBoss.value.health
    bossWordIndex.value = 0
    screen.value = 'boss-fight-intro'
  } else {
    const stageType = STAGE_SEQUENCE[stageNum]
    let pool
    if (stageType === 'miniboss') {
      pool = currentBoss.value?.id === 'hydra'
        ? MINIBOSSES.filter(m => m.id === 'hydra-miniboss')
        : MINIBOSSES.filter(m => m.id !== 'hydra-miniboss')
    } else {
      pool = ENEMIES
    }
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

function applyDangerLetters(isBoss) {
  if (currentBoss.value?.id !== 'gelatinous-cube') return
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const count = isBoss ? 3 : 1
  const picked = new Set()
  while (picked.size < count) picked.add(alpha[Math.floor(Math.random() * 26)])
  dangerLetters.value = [...picked]
}

function applyFortuneTellerHints() {
  if (!hasAbility('fortune-teller')) return
  const allWordLetters = new Set(boards.value.flatMap(b => b.secretWord.split('')))
  const pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(l => !allWordLetters.has(l))
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  fortuneTellerGreyLetters.value = shuffled.slice(0, 4)
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
  boards.value = []
  currentGuess.value = ''
  inputError.value = ''
  modal.value = null
  dangerLetters.value = []
  fortuneTellerGreyLetters.value = []
  giantSnoreBars.value = 0
  giantAwake.value = false
  // Unused sneak attack disappears when a new word begins
  inventory.value = inventory.value.filter(id => id !== 'sneak-attack')

  const isBoss = isBossFight.value
  let boardCount, wordLen
  if (isBoss) {
    const roundConfig = currentBoss.value?.rounds?.[bossWordIndex.value]
    boardCount = roundConfig?.boardCount ?? currentBoss.value?.boardCount ?? 1
    wordLen = roundConfig?.wordLength ?? currentBoss.value?.wordLength ?? 5
  } else {
    boardCount = currentEnemy.value?.boardCount ?? 1
    wordLen = currentEnemy.value?.wordLength ?? 5
  }

  if (props.mode === 'daily' && dailyConfig.value) {
    for (let i = 0; i < boardCount; i++) {
      const wordKey = isBoss ? `boss-${bossWordIndex.value}-board-${i}` : `stage-${stage.value}-board-${i}`
      const fallbackKey = isBoss ? `boss-${bossWordIndex.value}` : `stage-${stage.value}`
      const word = (dailyConfig.value.words[wordKey] ?? dailyConfig.value.words[fallbackKey] ?? '').toUpperCase()
      const b = makeBoard(i, word)
      if (hasAbility('seer') && word) b.hintLetter = word[Math.floor(Math.random() * word.length)]
      if (hasAbility('scholar')) b.hintWordType = 'word'
      boards.value.push(b)
    }
    applyDangerLetters(isBoss)
    applyFortuneTellerHints()
    finishWordLoad(showModal)
    return
  }

  try {
    const wordOptions = { minLength: wordLen, maxLength: wordLen }
    if (currentEnemy.value?.id === 'mirror-spirit') wordOptions.palindrome = true
    if (currentEnemy.value?.id === 'know-it-all') wordOptions.difficulty = 2
    for (let i = 0; i < boardCount; i++) {
      const wordLower = await fetchGameWord(wordOptions)
      const word = wordLower.toUpperCase()
      const b = makeBoard(i, word)
      if (hasAbility('seer')) {
        b.hintLetter = word[Math.floor(Math.random() * word.length)]
      }
      if (hasAbility('scholar')) {
        try {
          const data = await fetchWordData(wordLower)
          b.hintWordType = data?.partOfSpeech || 'word'
        } catch {
          b.hintWordType = 'word'
        }
      }
      boards.value.push(b)
    }
    applyDangerLetters(isBoss)
    applyFortuneTellerHints()
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
    // Shield the current guess row on all boards
    const rowToShield = boards.value[0]?.guesses.length ?? 0
    for (const board of boards.value) {
      board.shieldedRows = new Set([...board.shieldedRows, rowToShield])
    }
  } else if (item.effect === 'crystal-ball') {
    revealCrystalHint()
  } else if (item.effect === 'crossbow') {
    const board = boards.value.find(b => !b.solved) ?? boards.value[0]
    const first = board?.secretWord[0]
    if (first) currentGuess.value = first + currentGuess.value.slice(1)
  } else if (item.effect === 'vorpal-sword') {
    vorpalSwordActive.value = true
  } else if (item.effect === 'caltrops') {
    const allWordLetters = new Set(boards.value.flatMap(b => b.secretWord.split('')))
    const already = new Set(fortuneTellerGreyLetters.value)
    const pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(l => !allWordLetters.has(l) && !already.has(l))
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    fortuneTellerGreyLetters.value = [...fortuneTellerGreyLetters.value, ...shuffled.slice(0, 4)]
  } else if (item.effect === 'sneak-attack') {
    // Auto-solve the first unsolved board by inserting its answer directly
    const board = boards.value.find(b => !b.solved)
    if (board) {
      board.guesses = [...board.guesses, board.secretWord]
      board.solved = true
    }
    const idx = inventory.value.indexOf(item.id)
    if (idx !== -1) inventory.value.splice(idx, 1)
    pendingUseItem.value = null
    // Trigger win if that was the last board
    if (boards.value.every(b => b.solved)) handleAllBoardsSolved()
    return
  }
  const idx = inventory.value.indexOf(item.id)
  if (idx !== -1) inventory.value.splice(idx, 1)
  pendingUseItem.value = null
  modal.value = null
}

function revealCrystalHint() {
  const board = boards.value.find(b => !b.solved) ?? boards.value[0]
  if (!board) return
  const unionStatuses = getUnionLetterStatuses()
  const known = new Set(Object.keys(unionStatuses))
  if (board.hintLetter) known.add(board.hintLetter)
  board.crystalHints.forEach(l => known.add(l))
  const wordLetters = [...new Set(board.secretWord.split(''))]
  const unknown = wordLetters.filter(l => !known.has(l))
  const pool = unknown.length ? unknown : wordLetters
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  board.crystalHints = [...board.crystalHints, ...shuffled.slice(0, 2)]
}

async function applyAnnoyingKidGuess() {
  const board = boards.value[0]
  if (!board) return

  let word
  try {
    word = (await fetchGameWord({ minLength: board.secretWord.length, maxLength: board.secretWord.length })).toUpperCase()
  } catch { /* fall through */ }
  if (!word || word === board.secretWord) {
    const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    do { word = Array.from({ length: board.secretWord.length }, () => alpha[Math.floor(Math.random() * 26)]).join('') }
    while (word === board.secretWord)
  }

  // Show the board and block player input while the kid types
  gameState.value = 'playing'
  annoyingKidTyping.value = true
  currentGuess.value = ''

  for (const letter of word) {
    await new Promise(r => setTimeout(r, 180))
    currentGuess.value += letter
  }

  // Brief pause so the player can read the word before it submits
  await new Promise(r => setTimeout(r, 500))

  annoyingKidTyping.value = false
  await submitGuess(true)
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
