<template>
  <div class="class-select-layout">
    <div class="class-select-main">
      <p class="game-meta text-center my-4">Choose your character</p>
      <div class="class-options">
        <div v-for="(cls, i) in classes" :key="cls.id" class="class-option"
          :class="{ 'class-option--selected': selectedClassId === cls.id }" :style="{ animationDelay: `${i * 0.1}s` }"
          @click="choose(cls.id)">
          <div class="art-with-shadow">
            <img v-if="CHARACTER_IMAGES[cls.id]" :src="CHARACTER_IMAGES[cls.id]" :alt="cls.name" class="class-img" />
            <div v-else class="art-placeholder art-placeholder--class">Art for {{ cls.name }} goes here</div>
            <div class="class-option-shadow"></div>
          </div>
          <div>
            <p class="pt-1 class-name">{{ cls.name }}</p>
            <p class="class-health">{{ cls.health }} Health</p>
            <p class="class-desc">{{ cls.description }}</p>
          </div>
        </div>
        <div v-if="showRandomize" class="class-option" :style="{ animationDelay: `${classes.length * 0.1}s` }"
          @click="randomize">
          <div class="art-with-shadow">
            <div class="art-placeholder art-placeholder--class art-placeholder--random">?</div>
            <div class="class-option-shadow"></div>
          </div>
          <div>
            <p class="pt-1 class-name">Random</p>
            <p class="class-desc">Choose a random option</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { CHARACTER_IMAGES } from '@/assets/characterImages.js'

const props = defineProps({
  classes: { type: Array, required: true },
  selectedClassId: { type: String, default: null },
  showRandomize: { type: Boolean, default: false },
})
const emit = defineEmits(['select', 'confirm'])

function choose(id) {
  emit('select', id)
  emit('confirm', id)
}

function randomize() {
  const item = props.classes[Math.floor(Math.random() * props.classes.length)]
  choose(item.id)
}
</script>
