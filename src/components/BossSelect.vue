<template>
  <div class="class-select-layout">
    <div class="class-select-main">
      <p class="game-meta text-center my-4">Choose your boss</p>
      <div class="class-options">
        <div
          v-for="(boss, i) in bosses"
          :key="boss.id"
          class="class-option"
          :class="{ 'class-option--selected': selectedBossId === boss.id }"
          :style="{ animationDelay: `${i * 0.1}s` }"
          @click="$emit('select', boss.id)"
        >
          <div class="art-with-shadow">
            <div class="art-placeholder art-placeholder--class">Art of {{ boss.name }}</div>
            <div class="class-option-shadow"></div>
          </div>
          <div class="class-text">
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
defineProps({
  bosses:         { type: Array,  required: true },
  selectedBossId: { type: String, default: null },
})
defineEmits(['select', 'confirm'])
</script>
