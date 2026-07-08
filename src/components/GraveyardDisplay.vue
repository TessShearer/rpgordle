<template>
  <div class="graveyard">
    <div class="graveyard-bg">
      <span class="graveyard-label">graveyard</span>
    </div>
    <div class="graveyard-words">
      <span
        v-for="(word, i) in words"
        :key="i"
        class="graveyard-word"
        :style="wordStyle(word, i)"
      >{{ word.toLowerCase() }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({ words: { type: Array, default: () => [] } })

function charSum(word) {
  return word.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
}

function wordStyle(word, i) {
  const cs = charSum(word)
  const rot = (cs % 15) - 7                        // -7 to +7 degrees
  const dur = (1.8 + (cs % 9) * 0.1).toFixed(1)   // 1.8s – 2.6s
  const delay = ((i * 0.37) % 2.5).toFixed(2)
  return {
    '--rot': `${rot}deg`,
    '--dur': `${dur}s`,
    animationDelay: `${delay}s`,
  }
}
</script>
