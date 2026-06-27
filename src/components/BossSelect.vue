<template>
  <div class="class-select-layout">
    <div class="class-select-main">
      <p class="game-meta text-center mb-4">Choose your boss</p>
      <div class="class-options">
        <div
          v-for="(boss, i) in bosses"
          :key="boss.id"
          class="class-option"
          :class="{ animated: optionsAnimated, 'class-option--selected': selectedBossId === boss.id }"
          :style="{ transitionDelay: `${i * 0.15}s` }"
          @click="$emit('select', boss.id)"
        >
          <div class="art-with-shadow">
            <div class="art-placeholder art-placeholder--class">Art of {{ boss.name }}</div>
            <div class="class-option-shadow"></div>
          </div>
          <div class="class-text" :style="{ transitionDelay: `${0.5 + i * 0.15}s` }">
            <p class="class-name">{{ boss.name }}</p>
            <p class="class-desc">{{ boss.effect }}</p>
          </div>
        </div>
      </div>
    </div>
    <Transition name="slide-in">
      <div v-if="selectedBossId" class="class-select-aside">
        <button class="btn btn-press px-4 py-3 fs-5" @click="$emit('confirm', selectedBossId)">
          Continue
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'

defineProps({
  bosses:        { type: Array,  required: true },
  selectedBossId: { type: String, default: null },
})
defineEmits(['select', 'confirm'])

const optionsAnimated = ref(false)
onMounted(() => nextTick(() => { optionsAnimated.value = true }))
</script>
