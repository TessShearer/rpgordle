<template>
  <div class="class-select-layout">
    <div class="class-select-main">
      <p class="game-meta text-center my-4">Choose your {{label}}</p>
      <div class="class-options">
        <div
          v-for="(boss, i) in bosses"
          :key="boss.id"
          class="class-option"
          :class="{ 'class-option--selected': selectedBossId === boss.id }"
          :style="{ animationDelay: `${i * 0.1}s` }"
          @click="choose(boss.id)"
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
        <div v-if="showRandomize" class="class-option" :style="{ animationDelay: `${bosses.length * 0.1}s` }" @click="randomize">
          <div class="art-with-shadow">
            <div class="art-placeholder art-placeholder--class art-placeholder--random">?</div>
            <div class="class-option-shadow"></div>
          </div>
          <div class="class-text">
            <p class="class-name">Random</p>
            <p class="class-desc">Choose a random option</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  bosses:         { type: Array,  required: true },
  selectedBossId: { type: String, default: null },
  showRandomize:  { type: Boolean, default: false },
  label:          { type: String, default: 'Boss' },
})
const emit = defineEmits(['select', 'confirm'])

function choose(id) {
  emit('select', id)
  emit('confirm', id)
}

function randomize() {
  const item = props.bosses[Math.floor(Math.random() * props.bosses.length)]
  choose(item.id)
}
</script>
