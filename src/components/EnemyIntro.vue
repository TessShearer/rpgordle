<template>
  <div class="enemy-intro" :class="{ 'skip-anim': skipAnim }" @animationend="allVisible = true">
    <h3>{{ headline }}</h3>

    <div class="enemy-intro-panel">
      <div class="enemy-intro-art">
        <img v-if="enemyImage" :src="enemyImage" :alt="enemy.name" class="enemy-intro-img" />
        <div v-else class="art-placeholder art-placeholder--enemy-intro">Art of {{ enemy.name }}</div>
      </div>
      <div class="enemy-intro-stats">
        <div class="enemy-stat-row">
          <span class="enemy-stat-label">HP</span>
          <span class="enemy-stat-value">{{ enemy.health }}</span>
        </div>
        <div v-if="enemy.effect && enemy.effect !== 'No effect'" class="enemy-stat-row">
          <span class="enemy-stat-label">Ability</span>
          <span class="enemy-stat-value">{{ enemy.effect }}</span>
        </div>
        <div v-if="enemy.regen > 0" class="enemy-stat-row">
          <span class="enemy-stat-label">Heal on kill</span>
          <span class="enemy-stat-value">{{ enemy.regen }}</span>
        </div>
      </div>
    </div>

    <div class="enemy-intro-begin">
      <button class="btn btn-press px-5 py-3 fs-5" @click="$emit('begin')">Fight</button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  enemy: { type: Object, required: true },
})

defineEmits(['begin'])

const allVisible = ref(false)
const skipAnim   = ref(false)

function skip() {
  skipAnim.value   = true
  allVisible.value = true
}

defineExpose({ allVisible, skip })

const enemyImage = computed(() => null)

const headline = computed(() => {
  const article = /^[aeiou]/i.test(props.enemy.name) ? 'An' : 'A'
  return `${article} ${props.enemy.name} blocks your path!`
})
</script>
