<template>
  <div class="boss-intro">
    <div class="boss-intro-panels">

      <div class="intro-panel intro-panel--1">
        <div class="art-placeholder art-placeholder--intro">Art of {{ boss.name }}</div>
        <p class="intro-caption">
          The kingdom has been attacked by <strong>{{ boss.name }}</strong>!
        </p>
      </div>

      <div class="intro-panel intro-panel--2">
        <div class="art-placeholder art-placeholder--intro">Illustration of {{ boss.name }}'s power</div>
        <p class="intro-caption">{{ boss.announcement }}</p>
      </div>

      <div class="intro-panel intro-panel--3">
        <div class="art-placeholder art-placeholder--intro">Art of {{ classLabel }}</div>
        <p class="intro-caption">Fight your way to the boss and defeat them to save the kingdom!</p>
      </div>

    </div>
    <div class="intro-begin">
      <button class="btn btn-press px-5 py-3 fs-5" @click="$emit('begin')">Begin</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  boss:        { type: Object,  required: true },
  playerClass: { type: String,  required: true },
})

defineEmits(['begin'])

const classLabel = computed(() => {
  const labels = { peasant: 'Peasant', seer: 'Seer', knight: 'Knight', scholar: 'Scholar' }
  return labels[props.playerClass] ?? props.playerClass
})
</script>
