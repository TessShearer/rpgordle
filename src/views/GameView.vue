<template>
  <main class="container py-2">
    <div class="game-wrapper">

      <!-- Daily loading -->
      <div v-if="dailyLoading" class="text-center py-5">
        <p class="game-meta">Loading today's adventure…</p>
      </div>
      <div v-else-if="dailyError" class="text-center py-5">
        <p class="text-danger mb-3">Could not load today's game. Please refresh.</p>
      </div>

      <!-- Intro -->
      <div v-else-if="screen === 'intro'" class="text-center">
        <div class="art-placeholder art-placeholder--hero mb-4">Art goes here</div>
        <button class="btn btn-press px-5 py-3 fs-5" @click="showClassSelect">
          Start Adventure
        </button>
      </div>

      <!-- Class Select -->
      <ClassSelect v-else-if="screen === 'class-select'" :classes="selectableClasses" :selected-class-id="selectedClass"
        :show-randomize="mode !== 'daily'" @select="selectedClass = $event" @confirm="selectClass($event)" />

      <!-- Boss Select -->
      <BossSelect v-else-if="screen === 'boss-select'" :bosses="BOSSES" :selected-boss-id="selectedBoss"
        :show-randomize="mode !== 'daily'" @select="selectedBoss = $event" @confirm="confirmBossSelect" />

      <!-- Miniboss Select -->
      <div v-else-if="screen === 'miniboss-select' && (mode === 'testing' || mode === 'freeplay')" class="miniboss-test-wrapper">
        <BossSelect :bosses="testingMinibossOptions" :selected-boss-id="selectedMiniboss" :show-randomize="true" label="Miniboss"
          @select="selectedMiniboss = $event" @confirm="confirmMinibossSelect" />
      </div>

      <!-- Boss Intro Carousel - BossIntro.vue -->
      <BossIntro v-else-if="screen === 'boss-intro'" ref="bossIntroRef" :boss="currentBoss" :player-class="playerClass"
        @begin="beginJourney" />

      <!-- Boss Fight Intro - BossFightIntro.vue -->
      <BossFightIntro v-else-if="screen === 'boss-fight-intro'" ref="bossFightIntroRef" :boss="currentBoss"
        @begin="beginBossFight" />

      <!-- Game  -->
      <template v-else>

        <div v-if="gameState === 'loading'" class="text-center py-5">
          <p class="game-meta">Loading word…</p>
        </div>

        <div v-else-if="gameState === 'error'" class="text-center py-5">
          <p class="text-danger mb-3">There was an issue loading</p>
          <button class="btn btn-press px-4" @click="startStage(stage)">Try Again</button>
        </div>

        <div v-else class="game-layout" :class="{ 'bow-targeting-active': bowTargeting }">

          <!-- character info on mobile  -->
          <div class="mobile-portraits">
            <div class="portrait-slot">
              <div class="portrait-img-col small-card"
                :class="{ 'health-hit': playerDamageAnim === 'damage', 'health-heal': playerDamageAnim === 'heal' }">
                <!-- Damage and Heal in testing -->
                <div v-if="mode === 'testing'" class="test-health-btns">
                  <button class="btn-test-health btn-test-heal" @click="testHeal">Heal</button>
                  <button class="btn-test-health btn-test-damage" @click="testDamage">Damage</button>
                </div>

                <!-- character image -->
                <img v-if="featureArtImage" :src="featureArtImage" :alt="featureArtText" class="portrait-img" />
                <!-- placeholder image -->
                <div v-else class="art-placeholder art-placeholder--portrait">{{ featureArtText }}</div>
                <!-- character health -->
                <p class="portrait-stat">HP: {{ playerHealth }}/{{ playerMaxHealth }}</p>
                <div class="player-health-pips portrait-pips">
                  <span v-for="n in playerMaxHealth" :key="n" class="health-pip health-pip--player"
                    :class="{ 'health-pip--lost': n > playerHealth }"></span>
                </div>

                <!-- character ability -->
                <template v-if="playerClass === 'changeling' && changelingAbilities.length">
                  <p v-for="ability in changelingAbilities" :key="ability" class="portrait-enemy-effect">
                    {{ CLASSES.find(c => c.id === ability)?.description }}
                  </p>
                </template>
                <p v-else-if="CLASSES.find(c => c.id === playerClass)?.description" class="portrait-enemy-effect">
                  {{ CLASSES.find(c => c.id === playerClass)?.description }}
                </p>
              </div>
            </div>

            <!-- items that have been used and have ongoing abilities appear here (mobile) -->
            <div v-if="vampiricDaggerStacks > 0 || recorderStacks > 0 || vorpalSwordActive || damageBlockActive || smokeBombActive" class="active-buffs">
              <div v-if="vampiricDaggerStacks > 0" class="buff-indicator">
                <img v-if="ITEM_IMAGES['vampiric-dagger']" :src="ITEM_IMAGES['vampiric-dagger']" alt="Vampiric Dagger" class="buff-img" />
                <div v-else class="art-placeholder art-placeholder--buff">Vampiric Dagger</div>
                <p class="buff-label">+{{ vampiricDaggerStacks }} hp when correct</p>
              </div>
              <div v-if="recorderStacks > 0" class="buff-indicator">
                <img v-if="ITEM_IMAGES['recorder']" :src="ITEM_IMAGES['recorder']" alt="Recorder" class="buff-img" />
                <div v-else class="art-placeholder art-placeholder--buff">Recorder</div>
                <p class="buff-label">+{{ recorderStacks }} hp every 4 guesses</p>
              </div>
              <div v-if="vorpalSwordActive" class="buff-indicator">
                <img v-if="ITEM_IMAGES['vorpalSword']" :src="ITEM_IMAGES['vorpalSword']" alt="Vorpal Sword" class="buff-img" />
                <div v-else class="art-placeholder art-placeholder--buff">Vorpal Sword</div>
                <p class="buff-label">+1 to damage</p>
              </div>
              <div v-if="damageBlockActive" class="buff-indicator">
                <img v-if="ITEM_IMAGES['shield']" :src="ITEM_IMAGES['shield']" alt="Shield" class="buff-img" />
                <div v-else class="art-placeholder art-placeholder--buff">Shield</div>
                <p class="buff-label">No Damage</p>
              </div>
              <div v-if="smokeBombActive" class="buff-indicator">
                <img v-if="ITEM_IMAGES['smoke-bomb']" :src="ITEM_IMAGES['smoke-bomb']" alt="Smoke Bomb" class="buff-img" />
                <div v-else class="art-placeholder art-placeholder--buff">Smoke Bomb</div>
                <p class="buff-label">Hidden from Boss</p>
              </div>
            </div>

            <!-- enemy info on mobile -->
            <div v-if="currentEnemy" class="portrait-slot portrait-slot--enemy">
              <div class="portrait-img-col small-card" :class="{ 'health-hit': enemyHitAnim }">
                <img v-if="CHARACTER_IMAGES[currentEnemy.id]" :src="CHARACTER_IMAGES[currentEnemy.id]"
                  :alt="currentEnemy.name" class="portrait-img" :class="{ 'h-shake': bossShaking }" />
                <div v-else class="art-placeholder art-placeholder--portrait" :class="{ 'h-shake': bossShaking }">Art of {{
        currentEnemy.name }}</div>
                <div v-if="currentEnemy.id === 'slumbering-giant'" class="snore-bars"
                  :class="{ 'snore-bars--awake': giantAwake }">
                  <div v-for="i in 4" :key="i" class="snore-bar" :class="{ 'snore-bar--filled': i <= giantSnoreBars }">
                  </div>
                </div>
                <p class="portrait-stat">{{ currentEnemy.name }}</p>
                <div class="enemy-health portrait-pips">
                  <span v-for="n in currentEnemy.health" :key="n" class="health-pip"
                    :class="{ 'health-pip--lost': n > enemyHealth }"></span>
                </div>
                <p v-if="currentEnemy.regen > 0" class="portrait-enemy-effect">Player heals {{ currentEnemy.regen }}
                  health on kill</p>
                <p v-if="knowItAllReveal" class="portrait-enemy-effect">{{ knowItAllReveal }}</p>
                <p v-else-if="currentEnemyEffect" class="portrait-enemy-effect">{{ currentEnemyEffect }}</p>
              </div>
            </div>
          </div>

          <!-- character and inventory column on browser -->
          <aside class="game-panel game-panel--left">
            <div class="class-feature">
              <div class="class-feature-img-col"
                :class="{ 'health-hit': playerDamageAnim === 'damage', 'health-heal': playerDamageAnim === 'heal' }">
                <div class="small-card">
                  <div v-if="mode === 'testing'" class="test-health-btns">
                    <button class="btn-test-health btn-test-heal" @click="testHeal">Heal</button>
                    <button class="btn-test-health btn-test-damage" @click="testDamage">Damage</button>
                  </div>
                  <img v-if="featureArtImage" :src="featureArtImage" :alt="featureArtText" class="feature-img" />
                  <div v-else class="art-placeholder art-placeholder--feature">{{ featureArtText }}</div>
                  <p class="feature-label text-white">HP: {{ playerHealth }} / {{ playerMaxHealth }}</p>
                  <div class="player-health-pips">
                    <span v-for="n in playerMaxHealth" :key="n" class="health-pip health-pip--player"
                      :class="{ 'health-pip--lost': n > playerHealth }"></span>
                  </div>
                  <template v-if="playerClass === 'changeling' && changelingAbilities.length">
                    <p v-for="ability in changelingAbilities" :key="ability" class="portrait-enemy-effect">
                      {{ CLASSES.find(c => c.id === ability)?.description }}
                    </p>
                  </template>
                  <p v-else-if="CLASSES.find(c => c.id === playerClass)?.description" class="portrait-enemy-effect">
                    {{ CLASSES.find(c => c.id === playerClass)?.description }}
                  </p>
                </div>
                <div class="inventory small-card mt-2">
                  <div class="inventory-title-row">
                    <p class="inventory-label">Inventory</p>
                  </div>
                  <div class="inventory-list">
                    <div v-for="(item, i) in inventoryItems" :key="i" class="inventory-item"
                      @click="confirmUseItem(item)">
                      <div class="inventory-item-inner">
                        <div class="inventory-item-front">
                          <img v-if="ITEM_IMAGES[item.id]" :src="ITEM_IMAGES[item.id]" :alt="item.name"
                            class="inv-img" />
                          <div v-else class="art-placeholder art-placeholder--inv">{{ item.name }}</div>
                          <!-- <p class="inventory-item-name">{{ item.name }}</p> -->
                        </div>
                        <div class="inventory-item-back">
                          <p class="inventory-item-desc">{{ item.description }}</p>
                        </div>
                      </div>
                    </div>
                    <button v-if="mode === 'testing'" class="btn-test-add-item" title="Add item"
                      @click="modal = 'test-shop'">+</button>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <!-- game board(s) -->
          <div class="game-center">
            <!-- Journey progress -->
            <div class="text-center mb-2">
              <p class="game-meta mb-2">Enemy {{ stage + 1 }} of {{ journeyLength }}</p>
              <div class="journey-dots mb-2">
                <span v-for="i in journeyLength" :key="i" class="journey-dot" :class="dotClass(i - 1)"></span>
              </div>
            </div>

            <!-- Bow targeting message for archer -->
            <div v-if="bowTargeting" class="bow-target-msg">
              <span>Pick a target!</span>
              <button class="btn btn-reset btn-sm ms-3" @click="bowTargeting = false">Cancel</button>
            </div>

            <!-- gameboard(s) -->
            <div class="boards-container" :class="{ 'boards-container--multi': boards.length > 1 }">
              <template v-for="board in boards" :key="board.id">
                <div v-if="board.solved && boards.length > 1" class="solved-word-chip">
                  <span v-for="(letter, i) in board.secretWord.split('')" :key="i" class="solved-chip-tile">{{ letter
                    }}</span>
                </div>
                <!-- this is where I gradually put 1000 effects -->
                <WordleBoard v-else :ref="(el) => setBoardRef(board.id, el)" :board="board"
                  :current-guess="currentGuess" :game-state="gameState"
                  :has-seer="hasAbility('seer')" :has-scholar="hasAbility('scholar')"
                  :shadow-obscured-col="shadowObscuredCol" :board-shaking="boardShaking" :zombie-rising="zombieRising"
                  :graveyard-wobble="graveyardWobble"
                  :compact="false" :bow-targeting="bowTargeting && !board.solved" :danger-letters="dangerLetters"
                  :fire-letters="dragonFireBypassed ? [] : fireLetters" :key-letter-colors="keyLetterColors"
                  :mimic-danger-letters="mimicDangerLetters"
                  @shake-end="boardShaking = false"
                  @bow-target="useBowAtCol($event)" />
              </template>
            </div>

            <Transition name="modal">
              <div v-if="wonMessage" class="won-message-inline">
                <p class="won-message-text"><span v-if="wonDamage > 0">{{ wonDamage }} damage!</span><span v-else>{{
        currentEnemy?.name }} defeated!</span></p>
                <p v-if="lastRegen > 0" class="won-message-sub">{{ lastRegen }} healed!</p>
                <div class="won-progress-track">
                  <div class="won-progress-fill"></div>
                </div>
              </div>
            </Transition>

            <p v-if="inputError" class="text-danger text-center small mb-2">{{ inputError }}</p>

            <p v-if="gameState === 'lost'" class="text-center small mb-2">
              The word{{ lostWords.length > 1 ? 's were' : ' was' }}
              <span v-for="(word, wi) in lostWords" :key="wi">
                <strong>{{ word.toLowerCase() }}</strong><span v-if="wi < lostWords.length - 1">, </span>
              </span>
            </p>

            <!-- Submit + Keyboard -->
            <div v-if="gameState === 'playing'" class="submit-row mb-2">
              <button class="btn btn-press px-4 py-1" @click="handleKey('ENTER')">Submit</button>
              <button v-if="inventory.includes('sneak-attack')" class="btn btn-sneak-attack px-4 py-1"
                @click="triggerSneakAttack">
                <span class="sneak-attack-text">Sneak Attack!</span>
              </button>
            </div>
            <div v-else-if="gameResult" class="submit-row mb-2">
              <button class="btn btn-press px-4 py-1" @click="modal = 'stats'">View Stats</button>
            </div>
            <div v-if="gameState === 'playing'" class="keyboard">
              <div v-for="(row, r) in KEY_ROWS" :key="r" class="key-row">
                <button v-for="key in row" :key="key" class="key"
                  :class="[keyClass(key), { 'key--pop': poppingKey === key, 'h-shake': shakingKey === key }]" @click="handleKey(key)">
                  <span v-if="lockedLetterColors[key] && !keyMasterLocksBypassed" class="lock-icon" :class="`lock-icon--${lockedLetterColors[key]}`"></span><img v-if="keyLetterColors[key]" :src="KEY_IMAGES[keyLetterColors[key]]" class="key-icon" alt="" /><span v-if="dangerLetters.includes(key)" class="slime-icon"></span><span class="key-letter">{{ key }}</span>
                </button>
              </div>
            </div>

            <!-- current boss info and image, mobile inventory, graveyard -->
            <div v-if="currentBoss" class="mt-3 text-center">
              <p class="game-meta mb-0"><strong>The realm has been attacked by the {{ currentBoss.name }}:</strong>
                {{ isBossFight && currentBoss.enhancedEffect ? currentBoss.enhancedEffect : currentBoss.effect }}</p>
            </div>

            <div v-if="currentBoss" class="boss-strip-area mt-2">
              <div class="boss-strip-inventory">
                <p class="boss-strip-inv-label">Inventory</p>
                <div class="boss-strip-inv-list">
                  <div v-for="(item, i) in inventoryItems" :key="i" class="boss-strip-inv-item"
                    @click="confirmUseItem(item)">
                    <img v-if="ITEM_IMAGES[item.id]" :src="ITEM_IMAGES[item.id]" :alt="item.name" class="boss-inv-img" />
                    <div v-else class="art-placeholder art-placeholder--boss-inv">{{ item.name }}</div>
                  </div>
                  <button v-if="mode === 'testing'" class="btn-test-add-item boss-strip-add-btn" title="Add item"
                    @click="modal = 'test-shop'">+</button>
                </div>
              </div>
              <div v-if="currentBoss?.id === 'necromancer'" class="boss-image-strip">
                <GraveyardDisplay :words="allGuessedWords" />
              </div>
              <div v-else class="boss-image-strip">
                <img v-if="CHARACTER_IMAGES[currentBoss.id]" :src="CHARACTER_IMAGES[currentBoss.id]"
                  :alt="currentBoss.name" class="boss-strip-img" />
                <div v-else class="art-placeholder art-placeholder--boss-strip">Art of {{ currentBoss.name }}</div>
              </div>
            </div>

            <!-- Testing box -->
            <div v-if="mode === 'testing'" class="testing-box mt-3">
              <span class="testing-label">for testing</span>
              <p class="testing-reveal-label">reveal answer</p>
              <p v-for="b in boards" :key="b.id" class="debug-answer mb-1">{{ b.secretWord.toLowerCase() }}</p>
            </div>
          </div>

          <!-- current enemy and ongoing item abilities -->
          <aside class="game-panel game-panel--right">
            <div v-if="currentEnemy" class="enemy-section small-card" :class="{ 'health-hit': enemyHitAnim }">
              <img v-if="CHARACTER_IMAGES[currentEnemy.id]" :src="CHARACTER_IMAGES[currentEnemy.id]"
                :alt="currentEnemy.name" class="monster-img" :class="{ 'h-shake': bossShaking }"
                @animationend="bossShaking = false" />
              <div v-else class="art-placeholder art-placeholder--monster" :class="{ 'h-shake': bossShaking }"
                @animationend="bossShaking = false">Art of {{ currentEnemy.name }}</div>
              <div v-if="currentEnemy.id === 'slumbering-giant'" class="snore-bars"
                :class="{ 'snore-bars--awake': giantAwake }">
                <div v-for="i in 4" :key="i" class="snore-bar" :class="{ 'snore-bar--filled': i <= giantSnoreBars }">
                </div>
              </div>
              <p class="enemy-name">{{ currentEnemy.name }}</p>
              <div class="enemy-health">
                <span v-for="n in currentEnemy.health" :key="n" class="health-pip"
                  :class="{ 'health-pip--lost': n > enemyHealth }"></span>
              </div>
              <p v-if="currentEnemy.regen > 0" class="monster-text">Player heals {{ currentEnemy.regen }} health on kill</p>
              <p v-if="knowItAllReveal" class="monster-text">{{ knowItAllReveal }}</p>
              <p v-else class="monster-text">{{ currentEnemyEffect }}</p>
            </div>
            <div v-if="vampiricDaggerStacks > 0 || recorderStacks > 0 || vorpalSwordActive || damageBlockActive || smokeBombActive" class="active-buffs active-buffs--right">
              <div v-if="vampiricDaggerStacks > 0" class="buff-indicator">
                <img v-if="ITEM_IMAGES['vampiric-dagger']" :src="ITEM_IMAGES['vampiric-dagger']" alt="Vampiric Dagger" class="buff-img" />
                <div v-else class="art-placeholder art-placeholder--buff">Vampiric Dagger</div>
                <p class="buff-label">+{{ vampiricDaggerStacks }} hp when correct</p>
              </div>
              <div v-if="recorderStacks > 0" class="buff-indicator">
                <img v-if="ITEM_IMAGES['recorder']" :src="ITEM_IMAGES['recorder']" alt="Recorder" class="buff-img" />
                <div v-else class="art-placeholder art-placeholder--buff">Recorder</div>
                <p class="buff-label">+{{ recorderStacks }} hp every 4 guesses</p>
              </div>
              <div v-if="vorpalSwordActive" class="buff-indicator">
                <img v-if="ITEM_IMAGES['vorpalSword']" :src="ITEM_IMAGES['vorpalSword']" alt="Vorpal Sword" class="buff-img" />
                <div v-else class="art-placeholder art-placeholder--buff">Vorpal Sword</div>
                <p class="buff-label">+1 to damage</p>
              </div>
              <div v-if="damageBlockActive" class="buff-indicator">
                <img v-if="ITEM_IMAGES['shield']" :src="ITEM_IMAGES['shield']" alt="Shield" class="buff-img" />
                <div v-else class="art-placeholder art-placeholder--buff">Shield</div>
                <p class="buff-label">No Damage</p>
              </div>
              <div v-if="smokeBombActive" class="buff-indicator">
                <img v-if="ITEM_IMAGES['smoke-bomb']" :src="ITEM_IMAGES['smoke-bomb']" alt="Smoke Bomb" class="buff-img" />
                <div v-else class="art-placeholder art-placeholder--buff">Smoke Bomb</div>
                <p class="buff-label">Hidden from Boss</p>
              </div>
            </div>
          </aside>

        </div>

      </template>

      <!-- Modal -->
      <Transition name="modal">
        <div v-if="modal" class="modal-overlay">
          <div class="modal-card-glow" :class="{ 'modal-card--wide': modal === 'shop' || modal === 'test-shop' || modal === 'stats' || modal === 'changeling-test-pick' || modal === 'dwarven-puzzle-box' }">
          <div class="modal-card">

            <!-- Boss announcement -->
            <template v-if="modal === 'boss-announcement'">
              <img v-if="CHARACTER_IMAGES[currentBoss.id]" :src="CHARACTER_IMAGES[currentBoss.id]"
                :alt="currentBoss.name" class="modal-monster-img my-3" />
              <div v-else class="art-placeholder art-placeholder--modal-monster my-3">Art of {{ currentBoss.name }}</div>
              <p class="modal-message">{{ currentBoss.announcement }}</p>
            </template>

            <!-- Shop -->
            <template v-else-if="modal === 'shop'">
              <p class="modal-message">You found a shop!</p>
              <p class="modal-submessage">{{ shopPrompt }}</p>
              <div class="shop-items">
                <div v-for="item in currentShopItems" :key="item.id" class="shop-item"
                  :class="{ 'shop-item--flipped': selectedShopItemId === item.id }"
                  @click="selectedShopItemId = item.id">
                  <div class="shop-item-inner">
                    <div class="shop-item-front">
                      <img v-if="ITEM_IMAGES[item.id]" :src="ITEM_IMAGES[item.id]" :alt="item.name" class="shop-img" />
                      <div v-else class="art-placeholder art-placeholder--item">{{ item.name }}</div>
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

            <!-- Use an item modal -->
            <template v-else-if="modal === 'use-item'">
              <p class="modal-message">
                <template v-if="pendingUseItem.effect === 'dwarven-puzzle-box'">{{ pendingUseItem.name }}</template>
                <template v-else>Use {{ pendingUseItem.name }}?</template>
              </p>
              <p class="modal-submessage">{{ pendingUseItem.description }}</p>
              <div class="modal-actions mt-3">
                <!-- Dwarven Puzzle Box triggers itself automatically — nothing to confirm, just a "Got it" -->
                <button v-if="pendingUseItem.effect === 'dwarven-puzzle-box'"
                  class="btn btn-press px-4 py-2" @click="cancelUseItem">Got it</button>
                <template v-else>
                  <button v-if="!(pendingUseItem.effect === 'vorpal-sword' && !isBossFight)"
                    class="btn btn-press px-4 py-2" @click="useItem">Yes</button>
                  <button class="btn btn-press px-4 py-2"
                    style="white-space: normal; max-width: 160px; line-height: 1.2;"
                    @click="cancelUseItem">
                    {{ pendingUseItem.effect === 'vorpal-sword' && !isBossFight ? 'Wait until boss fight to use' : 'No' }}
                  </button>
                </template>
              </div>
            </template>

            <!-- Know it all -->
            <template v-else-if="modal === 'know-it-all'">
              <Transition name="kit-fade" mode="out-in">
                <p v-if="knowItAllModalPhase === 'taunt'" key="taunt" class="modal-message kit-message">
                  Looks like you're having trouble... not everyone can have the extensive vocabulary that I do... let me help you
                </p>
                <div v-else key="definition" class="modal-message kit-message">
                  <span>This word is defined as</span>
                  <em class="kit-definition">{{ knowItAllDefinition }}</em>
                </div>
              </Transition>
              <button class="btn btn-press px-5 py-2 mt-3 kit-dismiss"
                :disabled="!knowItAllCanDismiss"
                @click="dismissKnowItAllModal">
                {{ knowItAllCanDismiss ? 'Got it' : '...' }}
              </button>
            </template>

            <!-- Scholar's 4th-wrong-guess definition -->
            <template v-else-if="modal === 'scholar-definition'">
              <p class="modal-message">
                <template v-if="scholarDefinitionText">The Scholar has found that this word is defined as "{{ scholarDefinitionText }}"</template>
                <template v-else>The scholar is studying...</template>
              </p>
              <button class="btn btn-press px-5 py-2 mt-3"
                :disabled="!scholarDefinitionText"
                @click="dismissScholarDefinitionModal">
                {{ scholarDefinitionText ? 'Got it' : '...' }}
              </button>
            </template>

            <!-- Scholar vs Know-It-All -->
            <template v-else-if="modal === 'scholar-jealous'">
              <img v-if="CHARACTER_IMAGES['scholar']" :src="CHARACTER_IMAGES['scholar']"
                alt="Scholar" class="modal-monster-img my-3" />
              <div v-else class="art-placeholder art-placeholder--modal-monster my-3">Art of Scholar</div>
              <p class="modal-message">Hey, that's my job!</p>
              <button class="btn btn-press px-5 py-2 mt-3" @click="modal = null">Got it</button>
            </template>

            <!-- Ancient Tome -->
            <template v-else-if="modal === 'ancient-tome'">
              <p class="modal-message">
                <template v-if="ancientTomeDefinition">The ancient tome reveals this word is defined as "{{ ancientTomeDefinition }}"</template>
                <template v-else>The tome's pages are turning...</template>
              </p>
              <button class="btn btn-press px-5 py-2 mt-3"
                :disabled="!ancientTomeDefinition"
                @click="dismissAncientTomeModal">
                {{ ancientTomeDefinition ? 'Got it' : '...' }}
              </button>
            </template>

            <!-- Dwarven Puzzle Box -->
            <template v-else-if="modal === 'dwarven-puzzle-box'">
              <p class="modal-message">Your puzzle box has opened</p>
              <div class="shop-items">
                <div v-for="item in dwarvenPuzzleBoxItems" :key="item.id" class="shop-item">
                  <div class="shop-item-inner">
                    <div class="shop-item-front">
                      <img v-if="ITEM_IMAGES[item.id]" :src="ITEM_IMAGES[item.id]" :alt="item.name" class="shop-img" />
                      <div v-else class="art-placeholder art-placeholder--item">{{ item.name }}</div>
                      <p class="shop-item-name">{{ item.name }}</p>
                    </div>
                  </div>
                </div>
              </div>
              <button class="btn btn-press px-5 py-2 mt-3" @click="dismissDwarvenPuzzleBoxModal">Got it</button>
            </template>

            <!-- Test shop -->
            <template v-else-if="modal === 'test-shop'">
              <button class="modal-close-btn" type="button" aria-label="Close" @click="modal = null">✕</button>
              <p class="modal-message">Testing - Add Items</p>
              <div class="shop-items">
                <div v-for="item in SHOP_ITEMS" :key="item.id" class="shop-item"
                  @click="testAddItem(item)">
                  <div class="shop-item-inner">
                    <div class="shop-item-front">
                      <img v-if="ITEM_IMAGES[item.id]" :src="ITEM_IMAGES[item.id]" :alt="item.name" class="shop-img" />
                      <div v-else class="art-placeholder art-placeholder--item">{{ item.name }}</div>
                      <p class="shop-item-name">{{ item.name }}</p>
                    </div>
                    <div class="shop-item-back">
                      <p class="shop-item-desc">{{ item.description }}</p>
                    </div>
                  </div>
                  <Transition name="item-added-fade">
                    <div v-if="testAddedItemId === item.id" class="shop-item-added-badge">✓ Added</div>
                  </Transition>
                </div>
              </div>
              <button class="btn btn-press px-5 py-2 mt-3" @click="modal = null">Close</button>
            </template>
            <template v-else-if="modal === 'defeat'">
              <button class="modal-close-btn" type="button" aria-label="Close" @click="modal = null">✕</button>
              <p class="modal-message">You were defeated!</p>
              <p class="modal-submessage">
                The answer{{ lostWords.length > 1 ? 's were' : ' was' }}:
                <span v-for="(word, wi) in lostWords" :key="wi">
                  <strong>{{ word.toLowerCase() }}</strong><span v-if="wi < lostWords.length - 1">, </span>
                </span>
              </p>
              <div class="modal-actions mt-3">
                <button class="btn btn-press px-5 py-2" @click="modal = 'stats'">View Stats</button>
                <button class="btn btn-reset px-5 py-2 mt-2" @click="restartJourney">Try Again</button>
              </div>
            </template>
            <template v-else-if="modal === 'stats'">
              <button class="modal-close-btn" type="button" aria-label="Close" @click="modal = null">✕</button>
              <h2 class="stats-title">{{ gameResult === 'won' ? 'Quest Complete!' : 'Quest Failed' }}</h2>
              <div class="stats-body">
                <p class="stats-label">Played as:</p>
                <p class="stats-class-name">{{ CLASSES.find(c => c.id === playerClass)?.name }}</p>
                <template v-for="entry in gameLog" :key="entry.name + entry.roundIndex">
                  <div v-if="!entry.isBoss" class="stats-encounter">
                    <p class="stats-encounter-name">
                      {{ entry.name }}: {{ totalGuessCount(entry) }} {{ totalGuessCount(entry) === 1 ? 'guess' : 'guesses' }}
                    </p>
                  </div>
                </template>
                <template v-if="gameLog.some(e => e.isBoss)">
                  <template v-for="entry in gameLog.filter(e => e.isBoss)" :key="entry.name + entry.roundIndex">
                    <div class="stats-encounter">
                      <p class="stats-encounter-name">
                        {{ entry.name }}{{ gameLog.filter(e => e.isBoss).length > 1 ? ` (Round ${entry.roundIndex + 1})` : '' }}:
                        {{ totalGuessCount(entry) }} {{ totalGuessCount(entry) === 1 ? 'guess' : 'guesses' }}
                      </p>
                    </div>
                  </template>
                </template>
                <p class="stats-health">
                  {{ gameResult === 'won' ? `Remaining health: ${playerHealth}` : 'Defeated!' }}
                </p>
              </div>
              <div class="modal-actions mt-3">
                <button class="btn btn-press px-5 py-2" @click="copyStats">
                  {{ copied ? '✓ Copied!' : 'Copy to Clipboard' }}
                </button>
              </div>
            </template>
            <template v-else-if="modal === 'changeling-test-pick'">
              <p class="modal-message">The changeling {{ changelingRevealIsSecond ? 'also ' : '' }}becomes...</p>
              <p class="modal-submessage">Choose</p>
              <div class="changeling-pick-grid">
                <div v-for="cls in CLASSES.filter(c => c.id !== 'changeling')" :key="cls.id"
                  class="changeling-pick-item"
                  @click="pickChangelingAbility(cls.id)">
                  <p class="changeling-pick-name">{{ cls.name }}</p>
                  <p class="changeling-pick-desc">{{ cls.description }}</p>
                </div>
              </div>
            </template>
            <template v-else-if="modal === 'changeling-reveal'">
              <div class="changeling-reveal" @click="advanceChangelingReveal">
                <Transition name="reveal-fade" mode="out-in">
                  <div :key="changelingRevealPhase" class="reveal-phase">
                    <template v-if="changelingRevealPhase === 0">
                      <img v-if="CHARACTER_IMAGES[changelingRevealFromId]" :src="CHARACTER_IMAGES[changelingRevealFromId]" class="reveal-img" :alt="CLASSES.find(c => c.id === changelingRevealFromId)?.name" />
                      <div v-else class="art-placeholder art-placeholder--reveal">{{ CLASSES.find(c => c.id === changelingRevealFromId)?.name ?? 'Changeling' }}</div>
                      <p class="reveal-caption">{{ changelingRevealIsSecond ? 'The changeling also becomes...' : 'The changeling becomes...' }}</p>
                    </template>
                    <template v-else-if="changelingRevealPhase === 1">
                      <img v-if="CHARACTER_IMAGES['changeling-smoke']" :src="CHARACTER_IMAGES['changeling-smoke']" class="reveal-img" alt="Purple smoke" />
                      <div v-else class="art-placeholder art-placeholder--reveal reveal-smoke">ooh smoke n sparkles</div>
                    </template>
                    <template v-else>
                      <img v-if="CHARACTER_IMAGES[changelingRevealToId]" :src="CHARACTER_IMAGES[changelingRevealToId]" class="reveal-img" :alt="CLASSES.find(c => c.id === changelingRevealToId)?.name" />
                      <div v-else class="art-placeholder art-placeholder--reveal">{{ CLASSES.find(c => c.id === changelingRevealToId)?.name }}</div>
                      <p class="reveal-caption reveal-caption--name">{{ /^[aeiou]/i.test(CLASSES.find(c => c.id === changelingRevealToId)?.name ?? '') ? 'An' : 'A' }} {{ CLASSES.find(c => c.id === changelingRevealToId)?.name }}!</p>
                      <button class="btn btn-press px-5 py-2 mt-2" @click.stop="advanceChangelingReveal">Continue</button>
                    </template>
                  </div>
                </Transition>
              </div>
            </template>
            <template v-else-if="modal === 'enemy-intro'">
              <p class="modal-message">{{ enemyIntroHeadline }}</p>
              <div class="art-placeholder art-placeholder--modal-monster my-2">Art of {{ currentEnemy.name }}</div>
              <div class="enemy-intro-stats mt-1" style="align-items:center">
                <div class="enemy-stat-row">
                  <span class="enemy-stat-label">HP</span>
                  <span class="enemy-stat-value">{{ currentEnemy.health }}</span>
                </div>
                <div v-if="currentEnemy.effect && currentEnemy.effect !== 'No effect'" class="enemy-stat-row">
                  <span class="enemy-stat-label">Ability</span>
                  <span class="enemy-stat-value">{{ currentEnemy.effect }}</span>
                </div>
                <div v-if="currentEnemy.regen > 0" class="enemy-stat-row">
                  <span class="enemy-stat-label">Heal on kill</span>
                  <span class="enemy-stat-value">{{ currentEnemy.regen }}</span>
                </div>
              </div>
              <button class="btn btn-press px-5 py-2 mt-3" @click="beginEnemyEncounter">Fight!</button>
            </template>
            <template v-else>
              <p class="modal-message">{{ MODAL_CONTENT[modal].message }}</p>
            </template>
            <button v-if="modal !== 'shop' && modal !== 'use-item' && modal !== 'know-it-all' && modal !== 'scholar-definition' && modal !== 'scholar-jealous' && modal !== 'ancient-tome' && modal !== 'dwarven-puzzle-box' && modal !== 'test-shop' && modal !== 'defeat' && modal !== 'stats' && modal !== 'changeling-reveal' && modal !== 'changeling-test-pick' && modal !== 'enemy-intro'" class="btn btn-press px-5 py-2 mt-3"
              @click="handleModalAction">
              {{ MODAL_CONTENT[modal].button }}
            </button>
          </div>
          </div>
        </div>
      </Transition>

    </div>

    <!-- Caltrops throw animation -->
    <div v-if="caltropsFlyingAnim" class="caltrops-projectile" aria-hidden="true"></div>

    <!-- Vorpal Sword strike animation -->
    <img v-if="vorpalSwordAnim" :src="ITEM_IMAGES['vorpalSword']" alt="" class="vorpal-sword-projectile" aria-hidden="true" />

    <!-- Health Potion animation -->
    <img v-if="healthPotionAnim" :src="ITEM_IMAGES['health-potion']" alt="" class="health-potion-projectile" aria-hidden="true" />

    <!-- Shield animation -->
    <div v-if="shieldAnim" class="shield-anim" aria-hidden="true"></div>

    <!-- Crossbow arrow animation -->
    <div v-if="crossbowAnim" class="crossbow-arrow" aria-hidden="true"></div>

    <!-- Key Master unlock animation -->
    <template v-if="keyUnlockAnim">
      <template v-if="keyUnlockAnim.phase === 'meeting'">
        <img :src="KEY_IMAGES[keyUnlockAnim.color]" alt="" class="key-unlock-key" aria-hidden="true" />
        <div class="key-unlock-lock" :class="`key-unlock-lock--${keyUnlockAnim.color}`" aria-hidden="true">Lock</div>
      </template>
      <div v-else class="key-unlock-open" aria-hidden="true">Unlocked!</div>
    </template>

  </main>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { CLASSES, ENEMIES, MINIBOSSES, BOSSES, SHOP_ITEMS, ALL_ITEMS, CHANGELING_POOL, getStageSequence, getJourneyLength } from '@/data/gameData.js'
import { useGameNavStore } from '@/stores/gameNav.js'
import BossIntro from '@/components/BossIntro.vue'
import BossFightIntro from '@/components/BossFightIntro.vue'
import ClassSelect from '@/components/ClassSelect.vue'
import BossSelect from '@/components/BossSelect.vue'
import WordleBoard from '@/components/WordleBoard.vue'
import GraveyardDisplay from '@/components/GraveyardDisplay.vue'
import { CHARACTER_IMAGES } from '@/assets/characterImages.js'
import { ITEM_IMAGES } from '@/assets/itemImages.js'
import blueKeyImg from '@/assets/blue-key.png'
import redKeyImg from '@/assets/red-key.png'
import purpleKeyImg from '@/assets/purple-key.png'
import { fetchOrCreateDaily } from '@/services/daily.js'
import { fetchGameWord, fetchWordData } from '@/services/words.js'
import { recordGameResult } from '@/services/stats.js'

const props = defineProps({
  mode: { type: String, default: 'daily' },
})

const KEY_MASTER_COLORS = ['blue', 'red', 'purple']
const KEY_IMAGES = { blue: blueKeyImg, red: redKeyImg, purple: purpleKeyImg }

const KEY_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
]

// Dragon fire keys. Array of keys that dragon fire can spread to if one key is on fire. Kind of huge but seemed the smallest way to do it
const KEYBOARD_ADJACENCY = {
  Q: ['W', 'A'],
  W: ['Q', 'E', 'A', 'S'],
  E: ['W', 'R', 'S', 'D'],
  R: ['E', 'T', 'D', 'F'],
  T: ['R', 'Y', 'F', 'G'],
  Y: ['T', 'U', 'G', 'H'],
  U: ['Y', 'I', 'H', 'J'],
  I: ['U', 'O', 'J', 'K'],
  O: ['I', 'P', 'K', 'L'],
  P: ['O', 'L'],
  A: ['Q', 'W', 'S', 'Z'],
  S: ['W', 'E', 'A', 'D', 'Z', 'X'],
  D: ['E', 'R', 'S', 'F', 'X', 'C'],
  F: ['R', 'T', 'D', 'G', 'C', 'V'],
  G: ['T', 'Y', 'F', 'H', 'V', 'B'],
  H: ['Y', 'U', 'G', 'J', 'B', 'N'],
  J: ['U', 'I', 'H', 'K', 'N', 'M'],
  K: ['I', 'O', 'J', 'L', 'M'],
  L: ['O', 'P', 'K'],
  Z: ['A', 'S', 'X'],
  X: ['S', 'D', 'Z', 'C'],
  C: ['D', 'F', 'X', 'V'],
  V: ['F', 'G', 'C', 'B'],
  B: ['G', 'H', 'V', 'N'],
  N: ['H', 'J', 'B', 'M'],
  M: ['J', 'K', 'N'],
}


const MODAL_CONTENT = {
  'boss-announcement': { button: 'Begin Quest' },
  lost: { message: 'Oh no, you failed! Try again?', button: 'Try Again' },
  complete: { message: 'You completed your quest and the realm has been saved! New Game?', button: 'New Game' },
}


const gameNav = useGameNavStore()

// Screen / class
const screen = ref('intro')
const playerClass = ref(null)
const changelingAbilities = ref([])
const selectedClass = ref(null)
const bossIntroRef = ref(null)
const bossFightIntroRef = ref(null)
const wonMessage = ref(false)
const wonDamage = ref(0)

// Game state 
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
// Dragon guess count and current on fire letters
const dragonGuessCount = ref(0)
const fireLetters = ref([])
// Key Master locked and keyed letters
const lockedLetterColors = ref({})
const keyLetterColors = ref({})
// Little Elves stolen letter
const littleElfStolenLetter = ref(null)
// Mimic: letters from the last guess, reusing one deals +1 damage on the next guess
const mimicDangerLetters = computed(() => boards.value.find(b => !b.solved)?.mimicDangerLetters ?? [])
const shakingKey = ref(null)
const inventory = ref([])
const inventoryItems = computed(() => inventory.value.map(id => ALL_ITEMS.find(i => i.id === id)).filter(Boolean))
const pendingUseItem = ref(null)
const allGuessedWords = ref([])
// Secret words (all together to check they aren't the same)
const usedSecretWords = ref([])

// Class abilities (getting real long)
const vorpalSwordActive = ref(false)
const boardShaking = ref(false)
const bossShaking = ref(false)
const shopPicksRemaining = ref(1)
const shopTotalPicks = ref(1)
const selectedShopItemId = ref(null)
const freeplayShopItems = ref([])
const purchasedShopItemIds = ref([])
const validating = ref(false)
const annoyingKidTyping = ref(false)
const zombieRising = ref(false)
const fortuneTellerGreyLetters = ref([])
const giantSnoreBars = ref(0)
const giantAwake = ref(false)
const damageBlockActive = ref(false)
// Counting vampiric daggers
const vampiricDaggerStacks = ref(0)
const MAX_VAMPIRIC_DAGGER_STACKS = 2
// Counting recorders
const recorderStacks = ref(0)
const MAX_RECORDER_STACKS = 2
const recorderGuessCount = ref(0)
// Ancient tome
const ancientTomeDefinition = ref('')
// Dwarven Puzzle Box
const dwarvenPuzzleBoxItems = ref([])
let _dwarvenPuzzleBoxContinue = null
const changelingRevealPhase = ref(0)
const changelingRevealFromId = ref(null)
const changelingRevealToId = ref(null)
const changelingRevealIsSecond = ref(false)
const changelingRevealCallback = ref(null)
let _changelingRevealTimers = []
const playerDamageAnim = ref(null)
const enemyHitAnim = ref(false)
const animatingHealth = ref(false)
const poppingKey = ref(null)
const _keyPopQueue = []
let _keyPopRunning = false
const caltropsFlyingAnim = ref(false)
const vorpalSwordAnim = ref(false)
const healthPotionAnim = ref(false)
const shieldAnim = ref(false)
const crossbowAnim = ref(false)

// Key Master unlock animation
const keyUnlockAnim = ref(null)
const _keyUnlockQueue = []
let _keyUnlockRunning = false
const bowTargeting = ref(false)
const shadowObscuredCol = ref(null)
const _pendingKeyPops = []

// Boss / miniboss selection ─────────────────────────────────────────────────
const selectedMiniboss = ref(null)

// Board component refs 
const boardRefs = {}

function setBoardRef(id, el) {
  if (el) boardRefs[id] = el
  else delete boardRefs[id]
}

// Daily / freeplay
const dailyConfig = ref(null)
const dailyLoading = ref(props.mode === 'daily')
const dailyError = ref(false)
const selectedBoss = ref(null)
const bossWordIndex = ref(0)

// Stats
const gameLog = ref([])
const gameResult = ref(null)
const copied = ref(false)

const lostWords = computed(() => {
  if (gameResult.value !== 'lost') return []
  const lastEntry = gameLog.value[gameLog.value.length - 1]
  if (!lastEntry) return []
  return lastEntry.boards.filter(b => !b.solved).map(b => b.secretWord)
})

// Know It All modal - sphinx modal but original name know-it-all, visual name sphinx
const knowItAllDefinition = ref('')
const knowItAllModalPhase = ref('taunt')
const knowItAllCanDismiss = ref(false)
// Scholar's 4th-wrong-guess perk: queued per board so a multi-board fight (Cerberus,
// Hydra) where several boards hit 4 wrong guesses on the same turn shows one modal at a
// time instead of colliding. Suppressed entirely against Know-It-All, who already reveals
// the definition at guess 3 — see the "Hey, that's my job!" gag in dismissKnowItAllModal.
const scholarDefinitionQueue = []
let scholarDefinitionRunning = false
const scholarDefinitionText = ref('')
const scholarJealousShown = ref(false)

// Board helpers 
function makeBoard(id, secretWord) {
  return {
    id,
    secretWord,
    guesses: [],
    hintLetter: '',
    hintWordType: '',
    hintDefinition: '', // Scholar's 4th-wrong-guess perk — persists until this board is solved
    hintSlots: {},    // Abominable Snowman — enforced: must retype the matching letter
    bowSlots: {},     // Bow and Arrow — a clue only, persists, never enforced
    crossbowSlots: {}, // Crossbow — a clue only, lasts one guess, never enforced
    obscuredGuessPositions: [],
    abilityBlockedRows: new Set(),
    crystalHints: [],
    wilyLieCell: null,    // Wily Magician — { row, col, fakeStatus } for the latest guess's lie
    wilyRevealCell: null, // Wily Magician — previous guess's lie, mid shrink-and-spin reveal
    wilyAppearCell: null, // Wily Magician — { row, col } for the true tile mid grow-in, right after reveal
    littleElfStealCell: null,   // Little Elf — { row, col, letter } currently stolen (tile hidden)
    littleElfSlideOutCell: null, // Little Elf — { row, col } tile mid slide-away-and-vanish
    littleElfSlideInCell: null,  // Little Elf — { row, col } tile mid slide-back-into-place
    mimicDangerLetters: [], // Mimic — unique letters from the last guess; reusing one deals +1 damage next guess
    solved: false,
  }
}

const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth']
function ordinal(n) {
  return ORDINALS[n - 1] ?? `${n}th`
}

// Some smoke bomb logic
function hintEnforcementBypassed(board) {
  return currentBoss.value?.id === 'abominable-snowman' && board.abilityBlockedRows.has(board.guesses.length)
}

const smokeBombActive = computed(() => {
  const board = boards.value[0]
  return !!board && board.abilityBlockedRows.has(board.guesses.length)
})

const keyMasterLocksBypassed = computed(() =>
  currentBoss.value?.id === 'key-master' && smokeBombActive.value
)

const dragonFireBypassed = computed(() =>
  currentBoss.value?.id === 'dragon' && smokeBombActive.value
)
// End smoke bomb logic

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

// Wily Magician: picks one of the two statuses that ISN'T the true one, so the lie is
// always visibly wrong (green shows as grey/yellow, yellow as green/grey, grey as green/yellow)
function pickWilyFakeStatus(trueStatus) {
  const others = ['correct', 'present', 'absent'].filter(s => s !== trueStatus)
  return others[Math.floor(Math.random() * others.length)]
}
// Must match the .tile--wily-reveal / .tile--wily-appear animation durations in main.css
const WILY_REVEAL_MS = 800
const WILY_APPEAR_MS = 800

// Must match the .tile--elf-slide-out / .tile--elf-slide-in animation duration in main.css
const LITTLE_ELF_SLIDE_MS = 500

// Little Elf: steals the last letter of every guess off the keyboard, returning it (with
// a reverse slide) the instant the next guess comes in, right before stealing that one's
// last letter in turn. Fire-and-forget — doesn't block submitGuess like a damage animation
// would, since nothing else depends on it finishing.
function runLittleElfTurn(board, guessRowIndex) {
  const startNewSteal = () => {
    if (board.solved) return
    const guess = board.guesses[guessRowIndex]
    const col = guess.length - 1
    const letter = guess[col]
    const stealing = { row: guessRowIndex, col, letter }
    board.littleElfSlideOutCell = stealing
    setTimeout(() => {
      if (board.littleElfSlideOutCell === stealing) board.littleElfSlideOutCell = null
      board.littleElfStealCell = stealing
      littleElfStolenLetter.value = letter
    }, LITTLE_ELF_SLIDE_MS)
  }

  const prevSteal = board.littleElfStealCell
  if (prevSteal) {
    board.littleElfSlideInCell = prevSteal
    littleElfStolenLetter.value = null
    setTimeout(() => {
      if (board.littleElfSlideInCell === prevSteal) board.littleElfSlideInCell = null
      if (board.littleElfStealCell === prevSteal) board.littleElfStealCell = null
      startNewSteal()
    }, LITTLE_ELF_SLIDE_MS)
  } else {
    startNewSteal()
  }
}

function getUnionLetterStatuses() {
  const priority = { correct: 3, present: 2, absent: 1 }
  const map = {}
  for (const board of boards.value) {
    board.guesses.forEach((guess, gi) => {
      const obscuredCol = board.obscuredGuessPositions[gi] ?? null
      evaluateGuess(guess, board.secretWord).forEach(({ letter, status }, col) => {
        if (col === obscuredCol) return
        if (!map[letter] || priority[status] > priority[map[letter]]) map[letter] = status
      })
    })
  }
  return map
}

const selectableClasses = computed(() => {
  if (props.mode === 'daily' && dailyConfig.value) {
    return CLASSES.filter(c => dailyConfig.value.classIds.includes(c.id))
  }
  return CLASSES
})

// Testing screen's manual miniboss picker — Hydra's own miniboss never shows up here since
// picking Hydra as the boss skips this screen entirely, Cerberus's 3-board mechanic
// conflicts with the Abominable Snowman's letter-freezing ability (which also conflicts
// with Little Elf's letter-stealing, both fighting over the same keyboard letters), and
// the Mirror Spirit forces every guess to be a palindrome, which combined with the Key
// Master's locked letters can leave too few usable letters to form any valid guess.
const testingMinibossOptions = computed(() => {
  let pool = MINIBOSSES.filter(m => m.id !== 'hydra-miniboss')
  if (currentBoss.value?.id === 'abominable-snowman') {
    pool = pool.filter(m => m.id !== 'cerberus' && m.id !== 'little-elves')
  }
  if (currentBoss.value?.id === 'key-master') {
    pool = pool.filter(m => m.id !== 'mirror-spirit')
  }
  return pool
})

const availableShopItems = computed(() => {
  // Smoke Bomb (blocks a boss's per-guess ability) has nothing to block against
  // Hydra or the Giant Slime — neither has a per-guess status effect to bypass
  const noBossBlockItem = ['hydra', 'giant-slime'].includes(currentBoss.value?.id)
  if (props.mode === 'daily' && dailyConfig.value) {
    return SHOP_ITEMS.filter(s =>
      dailyConfig.value.shopItemIds.includes(s.id) && !(noBossBlockItem && s.id === 'smoke-bomb')
    )
  }
  return noBossBlockItem ? SHOP_ITEMS.filter(s => s.id !== 'smoke-bomb') : SHOP_ITEMS
})

const currentShopItems = computed(() => {
  const pool = props.mode === 'daily' ? availableShopItems.value : freeplayShopItems.value
  return pool.filter(item => !purchasedShopItemIds.value.includes(item.id))
})

function openShop() {
  if (props.mode !== 'daily') {
    const pool = ['hydra', 'giant-slime'].includes(currentBoss.value?.id)
      ? SHOP_ITEMS.filter(s => s.id !== 'smoke-bomb')
      : SHOP_ITEMS
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    freeplayShopItems.value = shuffled.slice(0, 3)
  }
  purchasedShopItemIds.value = []
  modal.value = 'shop'
}

const stageSequence = computed(() => getStageSequence(currentBoss.value?.id))
const journeyLength = computed(() => getJourneyLength(currentBoss.value?.id))

const isBossFight = computed(() => stage.value >= stageSequence.value.length)

// During the boss fight, show the boss's enhanced ability instead of its base one
const currentEnemyEffect = computed(() => {
  if (!currentEnemy.value) return ''
  if (isBossFight.value && currentEnemy.value.enhancedEffect) return currentEnemy.value.enhancedEffect
  return currentEnemy.value.effect
})

// Know It All: once he's revealed the definition, show it in place of his effect text
// until he's defeated (currentEnemy moves on, so this naturally stops applying)
const knowItAllReveal = computed(() =>
  currentEnemy.value?.id === 'know-it-all' && knowItAllDefinition.value
    ? `This word is defined as ${knowItAllDefinition.value}`
    : ''
)

const enemyIntroHeadline = computed(() => {
  if (!currentEnemy.value) return ''
  const article = /^[aeiou]/i.test(currentEnemy.value.name) ? 'An' : 'A'
  return `${article} ${currentEnemy.value.name} blocks your path!`
})

// ── Derived ───────────────────────────────────────────────────────────────────
const wordLength = computed(() => boards.value[0]?.secretWord.length ?? 5)

// Necromancer: wobble the in-progress guess live once it fully matches a graveyard word,
// warning the player before they submit into the double-damage penalty
const graveyardWobble = computed(() =>
  currentBoss.value?.id === 'necromancer' &&
  currentGuess.value.length === wordLength.value &&
  allGuessedWords.value.includes(currentGuess.value)
)

const featureArtText = computed(() => {
  if (playerClass.value === 'changeling' && changelingAbilities.value.length > 0) {
    const latest = changelingAbilities.value[changelingAbilities.value.length - 1]
    const cls = CLASSES.find(c => c.id === latest)
    return cls ? `Art of ${cls.name}` : 'Art of Changeling'
  }
  const cls = CLASSES.find(c => c.id === playerClass.value)
  return cls ? `Art of ${cls.name}` : 'Art of Peasant'
})

const shopPrompt = computed(() => {
  if (shopPicksRemaining.value > 1) return `Choose ${shopPicksRemaining.value} items.`
  if (shopTotalPicks.value > 1) return 'Choose 1 more item.'
  return 'Choose one item to purchase.'
})

const featureArtImage = computed(() => {
  if (playerClass.value === 'changeling' && changelingAbilities.value.length > 0) {
    const latest = changelingAbilities.value[changelingAbilities.value.length - 1]
    return CHARACTER_IMAGES[latest] ?? null
  }
  return CHARACTER_IMAGES[playerClass.value] ?? null
})

// Union letter statuses across all boards, skipping obscured columns, with class/crystal hints layered on top
const keyboardStatuses = computed(() => {
  const priority = { correct: 3, present: 2, absent: 1 }
  const base = {}

  for (const board of boards.value) {
    if (board.solved && boards.value.length > 1) continue
    board.guesses.forEach((guess, gi) => {
      const obscuredCol = board.obscuredGuessPositions[gi] ?? null
      const evaluated = evaluateGuess(guess, board.secretWord)
      evaluated.forEach(({ letter, status }, col) => {
        if (col === obscuredCol) return
        // Wily Magician: the keyboard shows the same lie as the tile while it's active
        const lie = board.wilyLieCell
        const reveal = board.wilyRevealCell
        const effectiveStatus = (lie && lie.row === gi && lie.col === col) ? lie.fakeStatus
          : (reveal && reveal.row === gi && reveal.col === col) ? reveal.fakeStatus
          : status
        if (!base[letter] || priority[effectiveStatus] > priority[base[letter]]) base[letter] = effectiveStatus
      })
    })
  }

  // Seer hint from all boards
  if (hasAbility('seer')) {
    for (const board of boards.value) {
      const seerLetter = board.hintLetter
      if (seerLetter && base[seerLetter] !== 'correct') {
        if (!base[seerLetter] || base[seerLetter] === 'absent') base[seerLetter] = 'present'
      }
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
  const isFire = fireLetters.value.length > 0 && fireLetters.value.includes(key) && !dragonFireBypassed.value
  const isLocked = !!lockedLetterColors.value[key] && !keyMasterLocksBypassed.value
  const isStolen = littleElfStolenLetter.value === key
  const isMimicDanger = mimicDangerLetters.value.length > 0 && mimicDangerLetters.value.includes(key)
  const status = keyboardStatuses.value[key]
  const classes = []
  if (status) classes.push(`key--${status}`)
  if (isDanger) classes.push('key--danger')
  if (isFire) classes.push('key--fire')
  if (isLocked) classes.push('key--locked')
  if (isStolen) classes.push('key--stolen')
  if (isMimicDanger) classes.push('key--mimic')
  return classes.join(' ')
}

// ── Input ─────────────────────────────────────────────────────────────────────
function handleKey(key) {
  if (gameState.value !== 'playing' || modal.value || validating.value || annoyingKidTyping.value || animatingHealth.value) return
  inputError.value = ''
  if (key === '⌫') {
    currentGuess.value = currentGuess.value.slice(0, -1)
  } else if (key === 'ENTER') {
    submitGuess()
  } else if (currentBoss.value?.id === 'key-master' && lockedLetterColors.value[key] && !keyLetterColors.value[key] && !keyMasterLocksBypassed.value) {
    inputError.value = 'Cannot use locked letters, find a key first.'
    shakingKey.value = null
    nextTick(() => { shakingKey.value = key })
    setTimeout(() => { if (shakingKey.value === key) shakingKey.value = null }, 400)
  } else if (currentEnemy.value?.id === 'little-elves' && littleElfStolenLetter.value === key) {
    // Stolen letter — does nothing until the elf hands it back
  } else if (currentGuess.value.length < wordLength.value) {
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
  if (screen.value === 'miniboss-select') {
    const list = testingMinibossOptions.value
    const idx = list.findIndex(m => m.id === selectedMiniboss.value)
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      selectedMiniboss.value = list[(idx + 1) % list.length].id
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      selectedMiniboss.value = list[idx < 1 ? list.length - 1 : idx - 1].id
    } else if (e.key === 'Enter' && selectedMiniboss.value) {
      confirmMinibossSelect(selectedMiniboss.value)
    } else if (e.key === 'Escape') {
      screen.value = 'boss-select'
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
  if (modal.value === 'enemy-intro') {
    if (e.key === 'Enter') beginEnemyEncounter()
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

// Fire-and-forget: records this game's outcome for the Game Info page's win/loss tables.
// Testing-tab games are skipped — they're not real playthroughs (dev-only boss/miniboss/item
// picks), so counting them would skew the win/loss stats.
function recordGameEnd(result) {
  if (props.mode === 'testing') return
  recordGameResult({
    classId: playerClass.value,
    bossId: currentBoss.value?.id,
    result,
  }).catch(err => console.error('recordGameResult:', err))
}

function totalGuessCount(entry) {
  return Math.max(0, ...entry.boards.map(b => b.guesses.length))
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
  }

  const bossEntries = gameLog.value.filter(e => e.isBoss)
  if (bossEntries.length > 0) {
    lines.push('')
    for (const entry of bossEntries) {
      const count = totalGuessCount(entry)
      const roundLabel = bossEntries.length > 1 ? ` (Round ${entry.roundIndex + 1})` : ''
      lines.push(`${entry.name}${roundLabel}: ${count} ${count === 1 ? 'guess' : 'guesses'}`)
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

async function animatePlayerDamage(amount) {
  animatingHealth.value = true
  for (let i = 0; i < amount; i++) {
    playerHealth.value = Math.max(0, playerHealth.value - 1)
    playerDamageAnim.value = 'damage'
    await new Promise(r => setTimeout(r, 440))
    playerDamageAnim.value = null
    if (i < amount - 1) await new Promise(r => setTimeout(r, 70))
  }
  animatingHealth.value = false
}

// Plague Lord: every heal is reduced by 1, but never below 1 (so single-HP heals,
// like a 1-regen enemy or the Vampiric Dagger's usual tick, are unaffected)
function plagueLordHeal(amount) {
  if (amount <= 0 || currentBoss.value?.id !== 'plague-lord') return amount
  return Math.max(1, amount - 1)
}

async function animatePlayerHeal(amount) {
  animatingHealth.value = true
  for (let i = 0; i < amount; i++) {
    playerHealth.value = Math.min(playerMaxHealth.value, playerHealth.value + 1)
    playerDamageAnim.value = 'heal'
    await new Promise(r => setTimeout(r, 800))
    playerDamageAnim.value = null
    if (i < amount - 1) await new Promise(r => setTimeout(r, 60))
  }
  animatingHealth.value = false
}

async function animateEnemyDamage(amount) {
  for (let i = 0; i < amount; i++) {
    enemyHealth.value = Math.max(0, enemyHealth.value - 1)
    enemyHitAnim.value = true
    await new Promise(r => setTimeout(r, 440))
    enemyHitAnim.value = false
    if (i < amount - 1) await new Promise(r => setTimeout(r, 70))
  }
}

// Called whenever all boards are solved — applies damage and advances
async function handleAllBoardsSolved() {
  const hitDamage = vorpalSwordActive.value ? 2 : 1
  vorpalSwordActive.value = false
  lastRegen.value = 0

  if (hitDamage > 1) {
    vorpalSwordAnim.value = true
    await new Promise(r => setTimeout(r, 750))
    vorpalSwordAnim.value = false
    await new Promise(r => setTimeout(r, 100))
  }

  await animateEnemyDamage(hitDamage)

  if (enemyHealth.value <= 0) {
    recordCurrentRound()
    const regen = currentEnemy.value.regen
    const healAmt = plagueLordHeal(Math.min(regen, playerMaxHealth.value - playerHealth.value))
    lastRegen.value = healAmt
    if (healAmt > 0) await animatePlayerHeal(healAmt)
    gameState.value = 'won'
    const isLast = stage.value === journeyLength.value - 1
    // Shop opens right before the miniboss stage, regardless of where that falls in stageSequence
    const nextIsMiniboss = stageSequence.value[stage.value + 1] === 'miniboss'
    if (isLast) {
      gameResult.value = 'won'
      recordGameEnd('won')
      wonDamage.value = 0
      wonMessage.value = true
      setTimeout(() => {
        wonMessage.value = false
        modal.value = 'stats'
      }, 1800)
    } else if (nextIsMiniboss) {
      wonDamage.value = 0
      wonMessage.value = true
      const needsSecondAbility = playerClass.value === 'changeling' && changelingAbilities.value.length < 2
      if (needsSecondAbility && props.mode !== 'testing') {
        if (props.mode === 'daily' && dailyConfig.value?.changelingAbilities?.[1]) {
          changelingAbilities.value = [...changelingAbilities.value, dailyConfig.value.changelingAbilities[1]]
        } else {
          grantChangelingAbility()
        }
        applyChangelingSecondAbilityBonus()
      }
      shopPicksRemaining.value = hasAbility('thief') ? 2 : 1
      shopTotalPicks.value = shopPicksRemaining.value
      setTimeout(() => {
        wonMessage.value = false
        const proceedToShop = () => {
          if (needsSecondAbility && props.mode === 'testing') {
            showChangelingTestPick(true, () => {
              shopPicksRemaining.value = hasAbility('thief') ? 2 : 1
              shopTotalPicks.value = shopPicksRemaining.value
              openShop()
            })
          } else if (needsSecondAbility) {
            showChangelingReveal(changelingAbilities.value[0], changelingAbilities.value[1], true, () => openShop())
          } else {
            openShop()
          }
        }
        if (inventory.value.includes('dwarven-puzzle-box')) triggerDwarvenPuzzleBox(proceedToShop)
        else proceedToShop()
      }, 1800)
    } else {
      wonDamage.value = 0
      wonMessage.value = true
      setTimeout(() => {
        wonMessage.value = false
        const proceedToNextStage = () => startStage(stage.value + 1)
        if (inventory.value.includes('dwarven-puzzle-box')) triggerDwarvenPuzzleBox(proceedToNextStage)
        else proceedToNextStage()
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

// Dwarven Puzzle Box: consumed the moment the next enemy (of any kind) is defeated,
// granting two random items from the same pool the shop offers right now. Pauses whatever
// win-flow transition (shop/next stage) was about to happen until the modal is dismissed.
function triggerDwarvenPuzzleBox(onDone) {
  const idx = inventory.value.indexOf('dwarven-puzzle-box')
  if (idx === -1) { onDone(); return }
  inventory.value.splice(idx, 1)
  const pool = availableShopItems.value.filter(i => i.id !== 'dwarven-puzzle-box')
  const granted = [...pool].sort(() => Math.random() - 0.5).slice(0, 2)
  inventory.value = [...inventory.value, ...granted.map(i => i.id)]
  dwarvenPuzzleBoxItems.value = granted
  _dwarvenPuzzleBoxContinue = onDone
  modal.value = 'dwarven-puzzle-box'
}

function dismissDwarvenPuzzleBoxModal() {
  modal.value = null
  const cb = _dwarvenPuzzleBoxContinue
  _dwarvenPuzzleBoxContinue = null
  if (cb) cb()
}

async function submitGuess(skipValidation = false, skipScramble = false) {
  const activeBoards = boards.value.filter(b => !b.solved)
  if (!activeBoards.length) return

  if (currentGuess.value.length < wordLength.value) {
    inputError.value = `Guess must be ${wordLength.value} letters`
    return
  }

  const firstActive = activeBoards[0]
  const submitted = currentGuess.value

  // Tricksy Fairy: FLIP-animate the scramble unless the guess is already correct
  if (!skipScramble && currentEnemy.value?.id === 'tricksy-fairy' && submitted !== firstActive.secretWord) {
    await doFairyScramble(firstActive)
    await submitGuess(true, true)
    return
  }

  // Abominable Snowman: previously-frozen green letters must be retyped correctly
  if (currentBoss.value?.id === 'abominable-snowman') {
    for (const board of activeBoards) {
      if (hintEnforcementBypassed(board)) continue
      const cols = Object.keys(board.hintSlots).map(Number).sort((a, b) => a - b)
      const badCol = cols.find(col => submitted[col] !== board.hintSlots[col])
      if (badCol !== undefined) {
        inputError.value = `The ${ordinal(badCol + 1)} letter must be a ${board.hintSlots[badCol]}`
        currentGuess.value = ''
        return
      }
    }
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
  const isCorrectAnswer = activeBoards.some(b => submitted === b.secretWord)
  if (!hasAbility('village-idiot') && !skipValidation && !isCorrectAnswer) {
    validating.value = true
    try {
      const res = await fetch(`/api/word/validate?word=${submitted.toLowerCase()}`)
      const data = await res.json()
      if (!data.valid) {
        boardShaking.value = true
        inputError.value = 'Not a valid word'
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

  // Block repeated guesses — except against the Necromancer where repeating is an intentional mechanic
  if (alreadyGuessed && !isCorrectAnswer && currentBoss.value?.id !== 'necromancer') {
    boardShaking.value = true
    inputError.value = 'Word already guessed'
    return
  }

  // Necromancer: animate repeated words rising up as zombies before submitting
  if (currentBoss.value?.id === 'necromancer' && alreadyGuessed && !isCorrectAnswer) {
    zombieRising.value = true
    await new Promise(r => setTimeout(r, wordLength.value * 100 + 950))
    zombieRising.value = false
  }

  if (!allGuessedWords.value.includes(submitted)) {
    allGuessedWords.value = [...allGuessedWords.value, submitted]
  }
  currentGuess.value = ''

  // Dragon: every guess (correct or not, across the whole game) stokes the fire
  if (currentBoss.value?.id === 'dragon') {
    dragonGuessCount.value += 1
    if (dragonGuessCount.value % 3 === 0) igniteNextLetter()
  }

  // Recorder: every guess (correct or not, across the whole game) counts toward the next
  // heal — each stack adds +1 to how much that heal restores
  if (recorderStacks.value > 0) {
    recorderGuessCount.value += 1
    if (recorderGuessCount.value % 4 === 0) await animatePlayerHeal(plagueLordHeal(recorderStacks.value))
  }

  // Key Master: guessing a color's key letter clears only that color's locks and key
  if (currentBoss.value?.id === 'key-master') {
    for (const [letter, color] of Object.entries(keyLetterColors.value)) {
      if (submitted.includes(letter)) {
        clearKeyMasterColor(color)
        queueKeyUnlockAnim(color)
      }
    }
  }

  // Mimic: set below, once the guess just submitted is checked against the danger
  // letters left over from the previous guess. Combined into the damage total further down.
  let mimicPenalty = 0

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
  let boardsSolvedThisGuess = 0
  for (let bi = 0; bi < activeBoards.length; bi++) {
    const board = activeBoards[bi]
    const boardSubmitted = submitted
    const guessRowIndex = board.guesses.length
    const rowAbilityBlocked = board.abilityBlockedRows.has(guessRowIndex)
    board.obscuredGuessPositions = [...board.obscuredGuessPositions, rowAbilityBlocked ? null : shadowObscuredCol.value]
    board.guesses = [...board.guesses, boardSubmitted]

    if (boardSubmitted === board.secretWord) {
      board.solved = true
      anyBoardSolvedThisGuess = true
      boardsSolvedThisGuess++
    } else if (currentBoss.value?.id === 'abominable-snowman') {
      // Remember new green positions — these must be retyped correctly from now on
      const guessEval = evaluateGuess(boardSubmitted, board.secretWord)
      const newHints = { ...board.hintSlots }
      guessEval.forEach(({ letter, status }, col) => {
        if (status === 'correct' && newHints[col] === undefined) newHints[col] = letter
      })
      board.hintSlots = newHints
    }
  }

  // Clear temporary crossbow slots — they only last for one guess
  for (const board of boards.value) {
    if (Object.keys(board.crossbowSlots).length) board.crossbowSlots = {}
  }

  // Wily Magician: lies about one tile's color in every guess. The previous guess's lie
  // (if any) starts its reveal animation now and clears itself once that finishes; a
  // fresh lie is picked for the guess that was just submitted, unless it won the board —
  // see WordleBoard.vue's evaluatedRows/isWilyRevealAt for how these get rendered.
  if (currentEnemy.value?.id === 'wily-magician') {
    for (const board of boards.value) {
      const guessRowIndex = board.guesses.length - 1
      if (board.wilyLieCell) {
        const prevLie = board.wilyLieCell
        board.wilyRevealCell = prevLie
        setTimeout(() => {
          if (board.wilyRevealCell !== prevLie) return
          board.wilyRevealCell = null
          const appearing = { row: prevLie.row, col: prevLie.col }
          board.wilyAppearCell = appearing
          setTimeout(() => {
            if (board.wilyAppearCell === appearing) board.wilyAppearCell = null
          }, WILY_APPEAR_MS)
        }, WILY_REVEAL_MS)
      }
      if (board.solved) {
        board.wilyLieCell = null
      } else {
        const wordLen = board.secretWord.length
        const obscuredCol = board.obscuredGuessPositions[guessRowIndex]
        const candidates = [...Array(wordLen).keys()].filter(c => c !== obscuredCol)
        const pool = candidates.length ? candidates : [...Array(wordLen).keys()]
        const col = pool[Math.floor(Math.random() * pool.length)]
        const trueStatus = evaluateGuess(board.guesses[guessRowIndex], board.secretWord)[col].status
        board.wilyLieCell = { row: guessRowIndex, col, fakeStatus: pickWilyFakeStatus(trueStatus) }
      }
    }
  }

  // Mimic: reusing a letter from the previous guess deals +1 damage.
  if (currentEnemy.value?.id === 'mimic') {
    for (const board of boards.value) {
      const guessRowIndex = board.guesses.length - 1
      if (board === firstActive
        && !board.abilityBlockedRows.has(guessRowIndex)
        && board.mimicDangerLetters.some(l => submitted.includes(l))) {
        mimicPenalty = 1
      }
      board.mimicDangerLetters = board.solved ? [] : [...new Set(submitted.split(''))]
    }
  }

  // Little Elves: steals the last letter of every guess off the keyboard until the next one
  if (currentEnemy.value?.id === 'little-elves') {
    for (const board of boards.value) {
      runLittleElfTurn(board, board.guesses.length - 1)
    }
  }

  // Shadow Sorcerer: after first guess clear it; in boss fight re-randomize each guess
  if (currentBoss.value?.id === 'shadow-sorcerer') {
    if (isBossFight.value) {
      const len = boards.value[0]?.secretWord.length ?? 5
      shadowObscuredCol.value = Math.floor(Math.random() * len)
    } else {
      shadowObscuredCol.value = null
    }
  }

  const allSolved = boards.value.every(b => b.solved)

  if (anyBoardSolvedThisGuess) {
    if (vampiricDaggerStacks.value > 0) await animatePlayerHeal(plagueLordHeal(boardsSolvedThisGuess * vampiricDaggerStacks.value))
    if (hasAbility('cleric')) {
      const healAmt = plagueLordHeal(playerMaxHealth.value - playerHealth.value)
      if (healAmt > 0) await animatePlayerHeal(healAmt)
    }
  }

  if (allSolved) {
    handleAllBoardsSolved()
  } else if (!anyBoardSolvedThisGuess) {
    // Shared by both branches below so the Slumbering Giant's own damage reacts to the
    // same modifiers as any other guess (gelatinous cube's danger letters, dragon's fire,
    // necromancer's penalties) instead of being a flat, unmodified number.
    const guessRow = firstActive.guesses.length - 1
    const abilityBlocked = firstActive.abilityBlockedRows.has(guessRow)
    const doubleDamage = !abilityBlocked
      && currentBoss.value?.id === 'gelatinous-cube'
      && dangerLetters.value.length > 0
      && dangerLetters.value.some(l => submitted.includes(l))

    let necroPenalty = 0
    if (currentBoss.value?.id === 'necromancer') {
      if (alreadyGuessed && !isCorrectAnswer) necroPenalty += 1
      if (isBossFight.value) {
        const hasAbsentLetter = submitted.split('').some(l => prevAbsentLetters.has(l))
        if (hasAbsentLetter) necroPenalty += 1
      }
    }

    const dragonPenalty = (!abilityBlocked
      && currentBoss.value?.id === 'dragon'
      && fireLetters.value.some(l => submitted.includes(l))) ? 1 : 0

    if (currentEnemy.value?.id === 'slumbering-giant') {
      // Slumbering Giant: wrong guesses fill snore bars while asleep, not player health.
      // Waking up (guess 4) is a big +5 hit; every guess after is a smaller ongoing +1 —
      // both stack on top of the modifiers above rather than being a flat number.
      let justWoke = false
      if (!giantAwake.value) {
        giantSnoreBars.value++
        if (giantSnoreBars.value >= 4) {
          giantAwake.value = true
          justWoke = true
        }
      }
      if (giantAwake.value) {
        if (damageBlockActive.value) {
          damageBlockActive.value = false
        } else {
          const giantPenalty = justWoke ? 5 : 1
          await animatePlayerDamage((doubleDamage ? 2 : 1) + necroPenalty + dragonPenalty + giantPenalty + mimicPenalty)
          if (playerHealth.value <= 0) {
            recordCurrentRound()
            gameState.value = 'lost'
            gameResult.value = 'lost'
            recordGameEnd('lost')
            setTimeout(() => { modal.value = 'defeat' }, 1200)
          }
        }
      }
    } else {
      // No board solved — player takes damage (shield absorbs it if active)
      if (damageBlockActive.value) {
        damageBlockActive.value = false
      } else {
        await animatePlayerDamage((doubleDamage ? 2 : 1) + necroPenalty + dragonPenalty + mimicPenalty)
        if (playerHealth.value <= 0) {
          recordCurrentRound()
          gameState.value = 'lost'
          gameResult.value = 'lost'
          recordGameEnd('lost')
          setTimeout(() => { modal.value = 'defeat' }, 1200)
          return
        }
      }

      // These run on any wrong guess regardless of smoke bomb
      if (hasAbility('assassin') && !inventory.value.includes('sneak-attack')) {
        // 3/5 yellow letters (60%) unlocks the sneak attack — scaled by word length so
        // longer words aren't harder to qualify for
        const anyQualifies = activeBoards.some((board) => {
          const presentCount = evaluateGuess(submitted, board.secretWord)
            .filter(c => c.status === 'present').length
          return presentCount / board.secretWord.length >= 0.6
        })
        if (anyQualifies) {
          inventory.value = [...inventory.value, 'sneak-attack']
        }
      }
      if (currentEnemy.value?.id === 'know-it-all') {
        const active = boards.value.find(b => !b.solved)
        if (active && active.guesses.length === 3) {
          showKnowItAllModal(active.secretWord)
        }
      } else if (hasAbility('scholar')) {
        for (const board of boards.value) {
          if (!board.solved && board.guesses.length === 4 && !board.hintDefinition) {
            queueScholarDefinition(board)
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
  } else if (modal.value === 'changeling-reveal') {
    advanceChangelingReveal()
  } else if (modal.value === 'changeling-test-pick') {
    // handled by pickChangelingAbility clicks
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
    dragonGuessCount.value = 0
    fireLetters.value = []
    lockedLetterColors.value = {}
    keyLetterColors.value = {}
    littleElfStolenLetter.value = null
    inventory.value = []
    boards.value = []
    allGuessedWords.value = []
    usedSecretWords.value = []
    vorpalSwordActive.value = false
    wonMessage.value = false
    wonDamage.value = 0
    lastRegen.value = 0
    selectedBoss.value = null
    selectedMiniboss.value = null
    shadowObscuredCol.value = null
    bossWordIndex.value = 0
    shopPicksRemaining.value = 1
    shopTotalPicks.value = 1
    freeplayShopItems.value = []
    purchasedShopItemIds.value = []
    validating.value = false
    fortuneTellerGreyLetters.value = []
    giantSnoreBars.value = 0
  damageBlockActive.value = false
  vampiricDaggerStacks.value = 0
  recorderStacks.value = 0
  recorderGuessCount.value = 0
    giantAwake.value = false
    gameLog.value = []
    gameResult.value = null
    copied.value = false
    knowItAllDefinition.value = ''
    knowItAllModalPhase.value = 'taunt'
    knowItAllCanDismiss.value = false
    scholarJealousShown.value = false
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
  dragonGuessCount.value = 0
  fireLetters.value = []
  lockedLetterColors.value = {}
  keyLetterColors.value = {}
  littleElfStolenLetter.value = null
  inventory.value = []
  boards.value = []
  allGuessedWords.value = []
  usedSecretWords.value = []
  vorpalSwordActive.value = false
  bowTargeting.value = false
  wonMessage.value = false
  wonDamage.value = 0
  lastRegen.value = 0
  selectedBoss.value = null
  selectedMiniboss.value = null
  shadowObscuredCol.value = null
  bossWordIndex.value = 0
  shopPicksRemaining.value = 1
  freeplayShopItems.value = []
  purchasedShopItemIds.value = []
  validating.value = false
  fortuneTellerGreyLetters.value = []
  giantSnoreBars.value = 0
  damageBlockActive.value = false
  vampiricDaggerStacks.value = 0
  recorderStacks.value = 0
  recorderGuessCount.value = 0
  giantAwake.value = false
  gameLog.value = []
  gameResult.value = null
  copied.value = false
  knowItAllDefinition.value = ''
  knowItAllModalPhase.value = 'taunt'
  knowItAllCanDismiss.value = false
  scholarJealousShown.value = false
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
  // Scholar already does this exact job — Know-It-All beat him to it this once
  if (hasAbility('scholar') && !scholarJealousShown.value) {
    scholarJealousShown.value = true
    modal.value = 'scholar-jealous'
  } else {
    modal.value = null
  }
}

// ── Ancient Tome ───────────────────────────────────────────────────────────────
async function useAncientTome() {
  const board = boards.value.find(b => !b.solved)
  if (!board) return
  ancientTomeDefinition.value = ''
  modal.value = 'ancient-tome'
  const definition = await fetchWordData(board.secretWord.toLowerCase())
    .then(data => data?.definition || 'a most sophisticated word')
    .catch(() => 'a most sophisticated word')
  if (modal.value === 'ancient-tome') ancientTomeDefinition.value = definition
}

function dismissAncientTomeModal() {
  if (!ancientTomeDefinition.value) return
  modal.value = null
}

// ── Scholar's 4th-wrong-guess definition ──────────────────────────────────────
function queueScholarDefinition(board) {
  scholarDefinitionQueue.push(board)
  if (!scholarDefinitionRunning) processScholarDefinitionQueue()
}

async function processScholarDefinitionQueue() {
  const board = scholarDefinitionQueue.shift()
  if (!board) { scholarDefinitionRunning = false; return }
  scholarDefinitionRunning = true
  scholarDefinitionText.value = ''
  modal.value = 'scholar-definition'

  const definition = await fetchWordData(board.secretWord.toLowerCase())
    .then(data => data?.definition || 'a most sophisticated word')
    .catch(() => 'a most sophisticated word')

  board.hintDefinition = definition
  if (modal.value === 'scholar-definition') scholarDefinitionText.value = definition
}

function dismissScholarDefinitionModal() {
  if (!scholarDefinitionText.value) return
  modal.value = null
  processScholarDefinitionQueue()
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
    selectedMiniboss.value = null
    screen.value = 'boss-select'
  }
}

function confirmBossSelect(bossId) {
  currentBoss.value = BOSSES.find(b => b.id === bossId)
  // The Hydra and its miniboss are a package deal — one implies the other, so Hydra
  // skips the testing miniboss screen entirely rather than asking a moot question.
  if (bossId === 'hydra') {
    selectedMiniboss.value = 'hydra-miniboss'
    beginJourney()
  } else if (props.mode === 'testing' || props.mode === 'freeplay') {
    selectedMiniboss.value = null
    screen.value = 'miniboss-select'
  } else {
    selectedMiniboss.value = null
    beginJourney()
  }
}

function confirmMinibossSelect(minibossId) {
  selectedMiniboss.value = minibossId
  beginJourney()
}

// ── Testing helpers ───────────────────────────────────────────────────────────
function testHeal() {
  if (playerHealth.value >= playerMaxHealth.value) playerMaxHealth.value++
  playerHealth.value++
}
function testDamage() {
  playerHealth.value = Math.max(0, playerHealth.value - 1)
}
const testAddedItemId = ref(null)
let testAddedTimer = null
function testAddItem(item) {
  inventory.value.push(item.id)
  testAddedItemId.value = item.id
  clearTimeout(testAddedTimer)
  testAddedTimer = setTimeout(() => { testAddedItemId.value = null }, 900)
}

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

function applyChangelingSecondAbilityBonus() {
  const latest = changelingAbilities.value[changelingAbilities.value.length - 1]
  if (latest === 'knight') {
    playerMaxHealth.value += 3
    playerHealth.value = Math.min(playerHealth.value + 3, playerMaxHealth.value)
    inventory.value.push('shield')
  } else if (latest === 'treasurer') {
    if (props.mode === 'daily' && dailyConfig.value?.treasurerItemIds?.length) {
      dailyConfig.value.treasurerItemIds.forEach(id => inventory.value.push(id))
    } else {
      const pool = availableShopItems.value
      const shuffled = [...pool].sort(() => Math.random() - 0.5)
      shuffled.slice(0, 2).forEach(item => inventory.value.push(item.id))
    }
  } else if (latest === 'archer') {
    inventory.value.push('bow-and-arrow')
    inventory.value.push('bow-and-arrow')
  }
}

function showChangelingReveal(fromId, toId, isSecond, callback) {
  _changelingRevealTimers.forEach(t => clearTimeout(t))
  _changelingRevealTimers = []
  changelingRevealFromId.value = fromId
  changelingRevealToId.value = toId
  changelingRevealIsSecond.value = isSecond
  changelingRevealPhase.value = 0
  changelingRevealCallback.value = callback
  modal.value = 'changeling-reveal'
  _changelingRevealTimers.push(setTimeout(() => {
    if (modal.value !== 'changeling-reveal') return
    changelingRevealPhase.value = 1
    _changelingRevealTimers.push(setTimeout(() => {
      if (modal.value !== 'changeling-reveal') return
      changelingRevealPhase.value = 2
    }, 1000))
  }, 1500))
}

function advanceChangelingReveal() {
  _changelingRevealTimers.forEach(t => clearTimeout(t))
  _changelingRevealTimers = []
  if (changelingRevealPhase.value < 2) {
    changelingRevealPhase.value++
    if (changelingRevealPhase.value === 1) {
      _changelingRevealTimers.push(setTimeout(() => {
        if (modal.value !== 'changeling-reveal') return
        changelingRevealPhase.value = 2
      }, 800))
    }
  } else {
    modal.value = null
    const cb = changelingRevealCallback.value
    changelingRevealCallback.value = null
    if (cb) cb()
  }
}

function showChangelingTestPick(isSecond, callback) {
  changelingRevealIsSecond.value = isSecond
  changelingRevealCallback.value = callback
  modal.value = 'changeling-test-pick'
}

function pickChangelingAbility(classId) {
  changelingAbilities.value = changelingRevealIsSecond.value
    ? [...changelingAbilities.value, classId]
    : [classId]
  applyChangelingSecondAbilityBonus()
  modal.value = null
  const cb = changelingRevealCallback.value
  changelingRevealCallback.value = null
  if (cb) cb()
}

function beginJourney() {
  screen.value = 'playing'
  allGuessedWords.value = []
  usedSecretWords.value = []
  if (playerClass.value === 'knight') {
    inventory.value.push('shield')
  }
  if (playerClass.value === 'archer') {
    inventory.value.push('bow-and-arrow')
    inventory.value.push('bow-and-arrow')
  }
  if (playerClass.value === 'treasurer') {
    if (props.mode === 'daily' && dailyConfig.value?.treasurerItemIds?.length) {
      dailyConfig.value.treasurerItemIds.forEach(id => inventory.value.push(id))
    } else {
      const pool = availableShopItems.value
      const shuffled = [...pool].sort(() => Math.random() - 0.5)
      shuffled.slice(0, 2).forEach(item => inventory.value.push(item.id))
    }
  }
  if (playerClass.value === 'changeling') {
    changelingAbilities.value = []
    if (props.mode === 'testing') {
      showChangelingTestPick(false, () => startStage(0))
      return
    }
    if (props.mode === 'daily' && dailyConfig.value?.changelingAbilities?.[0]) {
      changelingAbilities.value = [dailyConfig.value.changelingAbilities[0]]
    } else {
      grantChangelingAbility()
    }
    applyChangelingSecondAbilityBonus()
    showChangelingReveal('changeling', changelingAbilities.value[0], false, () => startStage(0))
    return
  }

  startStage(0)
}

function beginEnemyEncounter() {
  modal.value = null
  if (currentEnemy.value?.id === 'annoying-kid') {
    applyAnnoyingKidGuess()
  } else {
    gameState.value = 'playing'
  }
  flushPendingKeyPops()
}

function beginBossFight() {
  screen.value = 'playing'
  loadWord(false)
}

// ── Game lifecycle ────────────────────────────────────────────────────────────
async function startStage(stageNum) {
  stage.value = stageNum
  if (isBossFight.value) {
    currentEnemy.value = currentBoss.value
    enemyHealth.value = currentBoss.value.health
    bossWordIndex.value = 0
    screen.value = 'boss-fight-intro'
  } else {
    const stageType = stageSequence.value[stageNum]
    if (stageType === 'miniboss') {
      if (selectedMiniboss.value) {
        // Use the forced miniboss chosen on the dev test screen
        currentEnemy.value = MINIBOSSES.find(m => m.id === selectedMiniboss.value)
      } else {
        let pool
        if (currentBoss.value?.id === 'hydra') {
          pool = MINIBOSSES.filter(m => m.id === 'hydra-miniboss')
        } else {
          pool = MINIBOSSES.filter(m => m.id !== 'hydra-miniboss')
          // Cerberus's 3-board mechanic conflicts with the Abominable Snowman's letter-freezing,
          // and so does Little Elf's letter-stealing — both fight over the same keyboard letters
          if (currentBoss.value?.id === 'abominable-snowman') pool = pool.filter(m => m.id !== 'cerberus' && m.id !== 'little-elves')
          // Mirror Spirit forces every guess to be a palindrome, which combined with the Key
          // Master's locked letters can leave too few usable letters to form any valid guess
          if (currentBoss.value?.id === 'key-master') pool = pool.filter(m => m.id !== 'mirror-spirit')
        }
        if (props.mode === 'daily' && dailyConfig.value) {
          const enemyId = dailyConfig.value.stageEnemies[stageNum]
          currentEnemy.value = pool.find(e => e.id === enemyId) ?? pool[Math.floor(Math.random() * pool.length)]
        } else {
          currentEnemy.value = pool[Math.floor(Math.random() * pool.length)]
        }
      }
    } else {
      const pool = ENEMIES
      if (props.mode === 'daily' && dailyConfig.value) {
        const enemyId = dailyConfig.value.stageEnemies[stageNum]
        currentEnemy.value = pool.find(e => e.id === enemyId) ?? pool[Math.floor(Math.random() * pool.length)]
      } else {
        currentEnemy.value = pool[Math.floor(Math.random() * pool.length)]
      }
    }
    enemyHealth.value = currentEnemy.value.health
    await loadWord(true)
  }
}

function queueKeyboardPops(letters, beforeEach) {
  if (!letters?.length) return
  for (const letter of letters) {
    _keyPopQueue.push({ letter, before: beforeEach ? () => beforeEach(letter) : null })
  }
  if (!_keyPopRunning) processKeyPopQueue()
}

async function processKeyPopQueue() {
  _keyPopRunning = true
  while (_keyPopQueue.length > 0) {
    // Hold until any modal clears — animations shouldn't run behind an overlay
    while (modal.value) await new Promise(r => setTimeout(r, 50))
    const { letter, before } = _keyPopQueue.shift()
    if (before) {
      before()
      await nextTick()
    }
    poppingKey.value = letter
    await new Promise(r => setTimeout(r, 620))
    poppingKey.value = null
    await new Promise(r => setTimeout(r, 80))
  }
  _keyPopRunning = false
}

// Dragon: light up one more keyboard letter. The first is arbitrary; every letter after
// that must be physically adjacent to one already on fire, so the flame visibly spreads.
function igniteNextLetter() {
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  const lit = fireLetters.value
  let candidates
  if (!lit.length) {
    candidates = alpha
  } else {
    const neighbors = new Set()
    lit.forEach(letter => (KEYBOARD_ADJACENCY[letter] ?? []).forEach(n => neighbors.add(n)))
    candidates = [...neighbors].filter(l => !lit.includes(l))
    if (!candidates.length) candidates = alpha.filter(l => !lit.includes(l))
  }
  if (!candidates.length) return
  const letter = candidates[Math.floor(Math.random() * candidates.length)]
  queueKeyboardPops([letter], (l) => { fireLetters.value = [...fireLetters.value, l] })
}

function applyDangerLetters(isBoss) {
  if (currentBoss.value?.id !== 'gelatinous-cube') return
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const count = isBoss ? 3 : 1
  const picked = new Set()
  while (picked.size < count) picked.add(alpha[Math.floor(Math.random() * 26)])
  for (const letter of [...picked]) {
    _pendingKeyPops.push({ letter, before: () => { dangerLetters.value = [...dangerLetters.value, letter] } })
  }
}

// Clears one Key Master color's locks and key off the keyboard — called from submitGuess
// once that color's key letter has been guessed.
function clearKeyMasterColor(color) {
  const locked = { ...lockedLetterColors.value }
  for (const letter of Object.keys(locked)) {
    if (locked[letter] === color) delete locked[letter]
  }
  lockedLetterColors.value = locked
  const keys = { ...keyLetterColors.value }
  for (const letter of Object.keys(keys)) {
    if (keys[letter] === color) delete keys[letter]
  }
  keyLetterColors.value = keys
}

// Purely visual: a key and its color's padlock slide in from either side and meet in the
// center, then swap for an "unlocked" placeholder for a beat. Queued so two colors
// clearing on the same guess play one after another instead of overlapping.
function queueKeyUnlockAnim(color) {
  _keyUnlockQueue.push(color)
  if (!_keyUnlockRunning) processKeyUnlockQueue()
}

function processKeyUnlockQueue() {
  const color = _keyUnlockQueue.shift()
  if (!color) { _keyUnlockRunning = false; return }
  _keyUnlockRunning = true
  keyUnlockAnim.value = { color, phase: 'meeting' }
  setTimeout(() => {
    keyUnlockAnim.value = { color, phase: 'open' }
    setTimeout(() => {
      keyUnlockAnim.value = null
      processKeyUnlockQueue()
    }, 550)
  }, 650)
}

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U'])
// Rare/awkward-to-intentionally-guess consonants — during the boss fight these never
// spawn as a key, since a key letter has to show up in a submitted guess on purpose and
// these are too easy to end up stranded with no reasonable word to fish them out with.
const KEY_MASTER_BANNED_KEY_LETTERS = new Set(['M', 'W', 'F', 'G', 'Y', 'P', 'B', 'V', 'K', 'J', 'X', 'Q', 'Z'])

// Key Master: lock 3 random letters and mark 1 other as a key, per color. Guessing a
// color's key letter clears that color's locks and key — see submitGuess and
// clearKeyMasterColor. Each color's 3 locked letters guarantee exactly one is in the
// secret word, so the player must find every color's key to win. Outside the direct boss
// fight only 'blue' is in play; the boss fight itself layers 'red' and 'purple' on top as
// two more independent sets, all running side by side.
//
// A locked letter may double as a *different* color's key — it's still typable, since
// handleKey only blocks letters that are locked and not themselves a key (a fun little
// "key hidden behind another lock" wrinkle) — but never its own color's key, and no two
// colors ever share a key letter, or the player could be locked out for good. During the
// boss fight this wrinkle is forced to happen exactly once: every other lock/key pick
// unconditionally avoids the opposite set, and only the last color (`forceOverlapAt`) has
// its key deliberately planted into an earlier color's locked set instead of drawn fresh —
// it goes last because by then it has the widest pool of earlier locks to draw from,
// which combined with the banned-letters cap below (rarely, ~1 word in a few hundred) can
// otherwise leave nothing eligible to force, in which case that one word just quietly
// skips the guarantee rather than risk an invalid pick. A second safety cap keeps at least
// 2 vowels free: at most 3 of the 5 vowels may ever be locked up across all colors
// combined — `lockedVowelCount` tracks the running total so the 4th+ vowel is skipped over.
function applyKeyMasterLocks() {
  if (currentBoss.value?.id !== 'key-master') return
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const secretLetters = [...new Set(boards.value.flatMap(b => b.secretWord.split('')))]
    .sort(() => Math.random() - 0.5)
  const colors = isBossFight.value ? KEY_MASTER_COLORS : ['blue']
  const usedLocked = new Set()
  const usedKeys = new Set()
  let secretIdx = 0
  let lockedVowelCount = 0
  // The last color gets the widest pool of earlier locked letters to draw an overlap
  // from (every prior color's locks), which is what makes forcing one nearly always
  // possible despite the banned-letter restriction below.
  const forceOverlapAt = colors.length > 1 ? colors.length - 1 : -1

  const vowelCapped = (letter) => VOWELS.has(letter) && lockedVowelCount >= 3
  const bannedKey = (letter) => isBossFight.value && KEY_MASTER_BANNED_KEY_LETTERS.has(letter)
  function lockLetter(locked, letter) {
    locked.add(letter)
    if (VOWELS.has(letter)) lockedVowelCount += 1
  }

  colors.forEach((color, colorIdx) => {
    const locked = new Set()
    while (secretIdx < secretLetters.length &&
      (vowelCapped(secretLetters[secretIdx]) || usedKeys.has(secretLetters[secretIdx]))) {
      secretIdx += 1
    }
    if (secretIdx < secretLetters.length) {
      lockLetter(locked, secretLetters[secretIdx])
      secretIdx += 1
    }
    // Filler letters never come from secretLetters — only the guaranteed slot above may
    // be a necessary letter, so an earlier color's filler can never starve a later color
    // of the one necessary letter it's reserved further down the shuffled list.
    while (locked.size < 3) {
      const letter = alpha[Math.floor(Math.random() * 26)]
      if (usedLocked.has(letter) || locked.has(letter) || secretLetters.includes(letter)) continue
      if (vowelCapped(letter) || usedKeys.has(letter)) continue
      lockLetter(locked, letter)
    }
    locked.forEach(l => usedLocked.add(l))

    let key
    const forcingOverlap = colorIdx === forceOverlapAt
    const overlapCandidates = forcingOverlap
      ? [...usedLocked].filter(l => !locked.has(l) && !usedKeys.has(l) && !bannedKey(l))
      : []
    if (forcingOverlap && overlapCandidates.length > 0) {
      key = overlapCandidates[Math.floor(Math.random() * overlapCandidates.length)]
    } else {
      do {
        key = alpha[Math.floor(Math.random() * 26)]
      } while (locked.has(key) || usedKeys.has(key) || usedLocked.has(key) || bannedKey(key))
    }
    usedKeys.add(key)

    for (const letter of locked) {
      _pendingKeyPops.push({ letter, before: () => {
        lockedLetterColors.value = { ...lockedLetterColors.value, [letter]: color }
      } })
    }
    _pendingKeyPops.push({ letter: key, before: () => {
      keyLetterColors.value = { ...keyLetterColors.value, [key]: color }
    } })
  })
}

function applyFortuneTellerHints() {
  if (!hasAbility('fortune-teller')) return
  let letters
  if (props.mode === 'daily' && dailyConfig.value?.fortuneTellerHints) {
    const key = isBossFight.value ? `boss-${bossWordIndex.value}` : `stage-${stage.value}`
    letters = dailyConfig.value.fortuneTellerHints[key]
  }
  if (!letters?.length) {
    const allWordLetters = new Set(boards.value.flatMap(b => b.secretWord.split('')))
    const pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(l => !allWordLetters.has(l))
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    letters = shuffled.slice(0, 4)
  }
  for (const letter of letters) {
    _pendingKeyPops.push({ letter, before: () => { fortuneTellerGreyLetters.value = [...fortuneTellerGreyLetters.value, letter] } })
  }
}

function flushPendingKeyPops() {
  const items = _pendingKeyPops.splice(0)
  if (!items.length) return
  nextTick(() => {
    _keyPopQueue.push(...items)
    if (!_keyPopRunning) processKeyPopQueue()
  })
}

function finishWordLoad(showModal) {
  if (currentBoss.value?.id === 'shadow-sorcerer' && boards.value.length > 0) {
    const len = boards.value[0].secretWord.length
    shadowObscuredCol.value = Math.floor(Math.random() * len)
  } else {
    shadowObscuredCol.value = null
  }
  gameState.value = 'ready'
  if (showModal) {
    screen.value = 'playing'
    modal.value = 'enemy-intro'
    // pops deferred to beginEnemyEncounter, after keyboard renders
  } else if (currentEnemy.value?.id === 'annoying-kid') {
    applyAnnoyingKidGuess()
    flushPendingKeyPops()
  } else {
    gameState.value = 'playing'
    flushPendingKeyPops()
  }
}

async function loadWord(showModal) {
  gameState.value = 'loading'
  boards.value = []
  currentGuess.value = ''
  inputError.value = ''
  modal.value = null
  dangerLetters.value = []
  lockedLetterColors.value = {}
  keyLetterColors.value = {}
  littleElfStolenLetter.value = null
  fortuneTellerGreyLetters.value = []
  giantSnoreBars.value = 0
  damageBlockActive.value = false
  // Necromancer: guessed words stay double-damage and in the graveyard for the whole game
  if (currentBoss.value?.id !== 'necromancer') {
    allGuessedWords.value = []
  }
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
      const wordEntry = dailyConfig.value.words[wordKey] ?? dailyConfig.value.words[fallbackKey] ?? ''
      // Support both old string format and new { word, partOfSpeech } object format
      const word = (typeof wordEntry === 'object' ? wordEntry.word : wordEntry).toUpperCase() || ''
      const b = makeBoard(i, word)
      if (hasAbility('seer') && word) {
        const dailySeerLetter = dailyConfig.value.seerHints?.[wordKey] ?? dailyConfig.value.seerHints?.[fallbackKey]
        b.hintLetter = dailySeerLetter ?? word[Math.floor(Math.random() * word.length)]
        _pendingKeyPops.push({ letter: b.hintLetter, before: null })
      }
      if (hasAbility('scholar')) b.hintWordType = (typeof wordEntry === 'object' ? wordEntry.partOfSpeech : null) || ''
      boards.value.push(b)
    }
    applyDangerLetters(isBoss)
    applyFortuneTellerHints()
    applyKeyMasterLocks()
    finishWordLoad(showModal)
    return
  }

  try {
    const wordOptions = { minLength: wordLen, maxLength: wordLen }
    if (currentEnemy.value?.id === 'mirror-spirit') wordOptions.palindrome = true
    if (currentEnemy.value?.id === 'know-it-all') wordOptions.difficulty = 2
    for (let i = 0; i < boardCount; i++) {
      const wordLower = await fetchGameWord({ ...wordOptions, exclude: usedSecretWords.value })
      usedSecretWords.value = [...usedSecretWords.value, wordLower]
      const word = wordLower.toUpperCase()
      const b = makeBoard(i, word)
      if (hasAbility('seer')) {
        b.hintLetter = word[Math.floor(Math.random() * word.length)]
        _pendingKeyPops.push({ letter: b.hintLetter, before: null })
      }
      if (hasAbility('scholar')) {
        try {
          const data = await fetchWordData(wordLower)
          b.hintWordType = data?.partOfSpeech || ''
        } catch {
          b.hintWordType = ''
        }
      }
      boards.value.push(b)
    }
    applyDangerLetters(isBoss)
    applyFortuneTellerHints()
    applyKeyMasterLocks()
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
  purchasedShopItemIds.value = [...purchasedShopItemIds.value, item.id]
  shopPicksRemaining.value -= 1
  if (shopPicksRemaining.value <= 0) {
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
  if (item.effect === 'bow-and-arrow') {
    if (gameState.value !== 'playing') return
    bowTargeting.value = true
    return
  }
  pendingUseItem.value = item
  modal.value = 'use-item'
}

function cancelUseItem() {
  pendingUseItem.value = null
  modal.value = null
}

function useBowAtCol(col) {
  for (const board of boards.value) {
    if (!board.solved && board.hintSlots[col] === undefined && board.bowSlots[col] === undefined) {
      board.bowSlots = { ...board.bowSlots, [col]: board.secretWord[col] }
    }
  }
  if (shadowObscuredCol.value === col) shadowObscuredCol.value = null
  bowTargeting.value = false
  const idx = inventory.value.indexOf('bow-and-arrow')
  if (idx !== -1) inventory.value.splice(idx, 1)
}

function triggerSneakAttack() {
  if (gameState.value !== 'playing') return
  const idx = inventory.value.indexOf('sneak-attack')
  if (idx === -1) return
  for (const board of boards.value) {
    if (board.solved) continue
    const lastGuess = board.guesses[board.guesses.length - 1]
    if (!lastGuess) continue
    const yellows = evaluateGuess(lastGuess, board.secretWord).filter(c => c.status === 'present').length
    if (yellows >= 3) {
      board.guesses = [...board.guesses, board.secretWord]
      board.solved = true
    }
  }
  inventory.value.splice(idx, 1)
  if (boards.value.every(b => b.solved)) handleAllBoardsSolved()
}

function useItem() {
  const item = pendingUseItem.value
  if (!item) return
  if (item.effect === 'heal') {
    healthPotionAnim.value = true
    setTimeout(() => {
      healthPotionAnim.value = false
      animatePlayerHeal(plagueLordHeal(3))
    }, 700)
  } else if (item.effect === 'shield') {
    shieldAnim.value = true
    setTimeout(() => { shieldAnim.value = false }, 950)
    damageBlockActive.value = true
  } else if (item.effect === 'crystal-ball') {
    revealCrystalHint()
  } else if (item.effect === 'crossbow') {
    crossbowAnim.value = true
    setTimeout(() => { crossbowAnim.value = false }, 700)
    const unsolvedBoards = boards.value.filter(b => !b.solved)
    for (const board of unsolvedBoards) {
      const letter = board.secretWord[0]
      if (letter) board.crossbowSlots = { 0: letter }
    }
    if (shadowObscuredCol.value === 0) shadowObscuredCol.value = null
  } else if (item.effect === 'vorpal-sword') {
    vorpalSwordActive.value = true
  } else if (item.effect === 'smoke-bomb') {
    const rowToBlock = boards.value[0]?.guesses.length ?? 0
    for (const board of boards.value) {
      board.abilityBlockedRows = new Set([...board.abilityBlockedRows, rowToBlock])
    }
  } else if (item.effect === 'vampiric-dagger') {
    vampiricDaggerStacks.value = Math.min(vampiricDaggerStacks.value + 1, MAX_VAMPIRIC_DAGGER_STACKS)
  } else if (item.effect === 'recorder') {
    recorderStacks.value = Math.min(recorderStacks.value + 1, MAX_RECORDER_STACKS)
  } else if (item.effect === 'ancient-tome') {
    const idx = inventory.value.indexOf(item.id)
    if (idx !== -1) inventory.value.splice(idx, 1)
    pendingUseItem.value = null
    useAncientTome()
    return
  } else if (item.effect === 'caltrops') {
    const allWordLetters = new Set(boards.value.flatMap(b => b.secretWord.split('')))
    const already = new Set(fortuneTellerGreyLetters.value)
    const revealed = keyboardStatuses.value
    const pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(l => !allWordLetters.has(l) && !already.has(l) && revealed[l] !== 'absent')
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    const newLetters = shuffled.slice(0, 4)
    caltropsFlyingAnim.value = true
    setTimeout(() => {
      caltropsFlyingAnim.value = false
      queueKeyboardPops(newLetters, (l) => {
        fortuneTellerGreyLetters.value = [...fortuneTellerGreyLetters.value, l]
      })
    }, 850)
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
  const unsolvedBoards = boards.value.filter(b => !b.solved)
  if (!unsolvedBoards.length) return
  const revealed = keyboardStatuses.value
  const TARGET_LETTERS = 2
  const pickedLetters = new Set()
  const letterBoardPairs = []

  // One pass over all boards, picking at most one letter per board. When preferFresh is
  // true, only letters not already yellow/green on the keyboard are eligible.
  const pickPass = (preferFresh) => {
    let progress = false
    for (const board of unsolvedBoards) {
      if (pickedLetters.size >= TARGET_LETTERS) break
      const known = new Set(pickedLetters)
      if (board.hintLetter) known.add(board.hintLetter)
      board.crystalHints.forEach(l => known.add(l))
      const wordLetters = [...new Set(board.secretWord.split(''))]
      let candidates = wordLetters.filter(l => !known.has(l))
      if (preferFresh) candidates = candidates.filter(l => revealed[l] !== 'correct' && revealed[l] !== 'present')
      if (!candidates.length) continue
      const letter = candidates[Math.floor(Math.random() * candidates.length)]
      letterBoardPairs.push({ board, letter })
      pickedLetters.add(letter)
      progress = true
    }
    return progress
  }

  // Exhaust not-yet-revealed letters across all boards first; only fall back to
  // redundant (already yellow/green) letters if none remain anywhere.
  while (pickedLetters.size < TARGET_LETTERS && pickPass(true));
  while (pickedLetters.size < TARGET_LETTERS && pickPass(false));

  queueKeyboardPops(letterBoardPairs.map(p => p.letter), (l) => {
    const pair = letterBoardPairs.find(p => p.letter === l)
    if (pair) pair.board.crystalHints = [...pair.board.crystalHints, l]
  })
}

async function applyAnnoyingKidGuess() {
  const board = boards.value[0]
  if (!board) return

  let word
  if (props.mode === 'daily' && dailyConfig.value) {
    const wordEntry = dailyConfig.value.words[`stage-${stage.value}-annoying-kid`]
    const savedWord = (typeof wordEntry === 'object' ? wordEntry?.word : wordEntry)?.toUpperCase()
    if (savedWord && savedWord.length === board.secretWord.length && savedWord !== board.secretWord) {
      word = savedWord
    }
  }
  if (!word) {
    try {
      word = (await fetchGameWord({ minLength: board.secretWord.length, maxLength: board.secretWord.length })).toUpperCase()
    } catch { /* fall through */ }
  }
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

// Surface the restart action to the navbar (App.vue), which lives outside this routed view
watch(screen, (val) => { gameNav.active = val === 'playing' }, { immediate: true })

onMounted(async () => {
  window.addEventListener('keydown', onKeyDown)
  gameNav.restart = restartJourney
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
onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  gameNav.active = false
  gameNav.restart = null
  clearTimeout(testAddedTimer)
})
</script>
