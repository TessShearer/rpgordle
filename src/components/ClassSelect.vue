<template>
  <div class="class-select-layout">
    <div class="class-select-main">
      <p class="game-meta text-center my-4">Choose your character</p>
      <div class="class-options">
        <div v-for="(cls, i) in classes" :key="cls.id" class="class-option"
          :class="{ 'class-option--selected': selectedClassId === cls.id }" :style="{ animationDelay: `${i * 0.1}s` }"
          @click="$emit('select', cls.id)">
          <div class="art-with-shadow">
            <img v-if="CHARACTER_IMAGES[cls.id]" :src="CHARACTER_IMAGES[cls.id]" :alt="cls.name" class="class-img" />
            <div v-else class="art-placeholder art-placeholder--class">Art for {{ cls.name }} goes here</div>
            <div class="class-option-shadow"></div>
          </div>
          <div class="class-text">
            <p class="class-name">{{ cls.name }}</p>
            <p class="class-health">{{ cls.health }} Health</p>
            <p class="class-desc">{{ cls.description }}</p>
          </div>
        </div>
      </div>
    </div>
    <Transition name="slide-in">
      <div v-if="selectedClassId" class="class-select-aside">
        <button class="btn btn-press px-4 py-3 fs-5" @click="$emit('confirm', selectedClassId)">
          Continue
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { CHARACTER_IMAGES } from '@/assets/characterImages.js'

defineProps({
  classes: { type: Array, required: true },
  selectedClassId: { type: String, default: null },
})
defineEmits(['select', 'confirm'])
</script>
