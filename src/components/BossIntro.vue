<template>
  <div class="boss-intro">

    <div class="boss-intro-slides">
      <div class="boss-intro-track" :style="{ transform: `translateX(-${currentSlide * 100}%)` }">

        <div class="intro-slide" @click="next">
          <div class="art-placeholder art-placeholder--intro">Art of {{ boss.name }}</div>
          <p class="intro-caption">
            The kingdom has been attacked by <strong>{{ boss.name }}</strong>!
          </p>
        </div>

        <div class="intro-slide" @click="next">
          <img v-if="powerImage" :src="powerImage" :alt="`${boss.name}'s power`" class="intro-img" />
          <div v-else class="art-placeholder art-placeholder--intro">Illustration of {{ boss.name }}'s power</div>
          <p class="intro-caption">{{ boss.announcement }}</p>
        </div>

        <div class="intro-slide">
          <img v-if="classImage" :src="classImage" :alt="classLabel" class="intro-img" />
          <div v-else class="art-placeholder art-placeholder--intro">Art of {{ classLabel }}</div>
          <p class="intro-caption">Fight your way to the boss and defeat them to save the kingdom!</p>
        </div>

      </div>
    </div>

    <div class="carousel-dots">
      <button
        v-for="i in SLIDE_COUNT"
        :key="i"
        class="carousel-dot"
        :class="{ active: currentSlide === i - 1 }"
        @click.stop="currentSlide = i - 1"
      ></button>
    </div>

    <div class="intro-begin">
      <button
        class="btn btn-press px-5 py-3 fs-5"
        :class="{ 'intro-begin--faded': !allVisible }"
        @click="allVisible ? $emit('begin') : next()"
      >
        Begin
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import shadowPower from '@/assets/shadow-sorcerer-power.png'
import cubePower   from '@/assets/gelatinuos-cube-power.png'
import { CHARACTER_IMAGES } from '@/assets/characterImages.js'

const POWER_IMAGES = {
  'shadow-sorcerer': shadowPower,
  'gelatinous-cube': cubePower,
}

const CLASS_LABELS = {
  peasant: 'Peasant', seer: 'Seer', knight: 'Knight', scholar: 'Scholar',
  merchant: 'Merchant', assassin: 'Assassin', cleric: 'Cleric',
  'village-idiot': 'Village Idiot', thief: 'The Thief', changeling: 'The Changeling',
}

const props = defineProps({
  boss:        { type: Object,  required: true },
  playerClass: { type: String,  required: true },
})

defineEmits(['begin'])

const SLIDE_COUNT  = 3
const currentSlide = ref(0)
const allVisible   = computed(() => currentSlide.value >= SLIDE_COUNT - 1)

function next() {
  if (currentSlide.value < SLIDE_COUNT - 1) currentSlide.value++
}

function skip() {
  currentSlide.value = SLIDE_COUNT - 1
}

defineExpose({ allVisible, skip })

const powerImage = computed(() => POWER_IMAGES[props.boss.id] ?? null)
const classImage = computed(() => CHARACTER_IMAGES[props.playerClass] ?? null)
const classLabel = computed(() => CLASS_LABELS[props.playerClass] ?? props.playerClass)
</script>
