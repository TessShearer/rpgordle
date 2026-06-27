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
        <img v-if="powerImage" :src="powerImage" :alt="`${boss.name}'s power`" class="intro-img" />
        <div v-else class="art-placeholder art-placeholder--intro">Illustration of {{ boss.name }}'s power</div>
        <p class="intro-caption">{{ boss.announcement }}</p>
      </div>

      <div class="intro-panel intro-panel--3">
        <img v-if="classImage" :src="classImage" :alt="classLabel" class="intro-img" />
        <div v-else class="art-placeholder art-placeholder--intro">Art of {{ classLabel }}</div>
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
import shadowPower from '@/assets/shadow-sorcerer-power.png'
import cubePower   from '@/assets/gelatinuos-cube-power.png'
import { CHARACTER_IMAGES } from '@/assets/characterImages.js'

const POWER_IMAGES = {
  'shadow-sorcerer': shadowPower,
  'gelatinous-cube': cubePower,
}

const props = defineProps({
  boss:        { type: Object,  required: true },
  playerClass: { type: String,  required: true },
})

defineEmits(['begin'])

const powerImage = computed(() => POWER_IMAGES[props.boss.id] ?? null)
const classImage = computed(() => CHARACTER_IMAGES[props.playerClass] ?? null)

const classLabel = computed(() => {
  const labels = { peasant: 'Peasant', seer: 'Seer', knight: 'Knight', scholar: 'Scholar' }
  return labels[props.playerClass] ?? props.playerClass
})
</script>
