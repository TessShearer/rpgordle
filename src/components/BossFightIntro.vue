<template>
  <div class="enemy-intro" :class="{ 'skip-anim': skipAnim }" @animationend="allVisible = true">

    <div class="enemy-intro-panel">
      <div class="enemy-intro-art">
        <img v-if="bossImage" :src="bossImage" :alt="boss.name" class="enemy-intro-img" />
        <div v-else class="art-placeholder art-placeholder--enemy-intro">Art of {{ boss.name }}</div>
      </div>
      <div class="enemy-intro-stats">
        <p class="enemy-stat-name">{{ boss.name }}</p>
        <div class="enemy-stat-row">
          <span class="enemy-stat-label">HP</span>
          <span class="enemy-stat-value">{{ boss.health }}</span>
        </div>
        <div class="enemy-stat-row">
          <span class="enemy-stat-label">Ability</span>
          <span class="enemy-stat-value">{{ boss.effect }}</span>
        </div>
      </div>
    </div>

    <p class="enemy-intro-caption">{{ boss.enhancedAnnouncement }}</p>

    <div class="enemy-intro-begin">
      <button class="btn btn-press px-5 py-3 fs-5" @click="$emit('begin')">Fight!</button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import shadowPower from '@/assets/shadow-sorcerer-power.png'
import cubePower   from '@/assets/gelatinuos-cube-power.png'

const BOSS_IMAGES = {
  'shadow-sorcerer': shadowPower,
  'gelatinous-cube': cubePower,
}

const props = defineProps({
  boss: { type: Object, required: true },
})

defineEmits(['begin'])

const allVisible = ref(false)
const skipAnim   = ref(false)

function skip() {
  skipAnim.value   = true
  allVisible.value = true
}

defineExpose({ allVisible, skip })

const bossImage = computed(() => BOSS_IMAGES[props.boss.id] ?? null)
</script>
