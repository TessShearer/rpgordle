<template>
  <main class="container py-4">

    <section class="info-section mb-5">
      <h2 class="info-heading mb-3">Characters</h2>
      <div class="info-grid">
        <div v-for="cls in CLASSES" :key="cls.id" class="info-card">
          <div class="art-placeholder art-placeholder--class mb-3">Art for {{ cls.name }}</div>
          <p class="info-name">{{ cls.name }}</p>
          <p class="info-desc">{{ cls.description }}</p>
        </div>
      </div>
    </section>

    <section class="info-section">
      <h2 class="info-heading mb-3">Enemies</h2>
      <p class="info-note mb-3">One enemy is chosen randomly and appears before word 5.</p>
      <div class="info-grid">
        <div v-for="enemy in ENEMIES" :key="enemy.id" class="info-card">
          <div class="art-placeholder art-placeholder--class mb-3">Art for {{ enemy.name }}</div>
          <p class="info-name">{{ enemy.name }}</p>
          <p class="info-desc">{{ enemy.effect }}</p>
        </div>
      </div>
    </section>

  </main>
</template>

<script setup>
import { CLASSES, ENEMIES } from '@/data/gameData.js'
</script>
