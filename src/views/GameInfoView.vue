<template>
  <main class="container py-4">

    <!-- ── Game ─────────────────────────────────────────────────────────── -->
    <section class="info-section mb-5">
      <h2 class="info-heading mb-3">Game</h2>
      <p class="info-body mb-4">
        The game is 5 rounds following the difficulty pattern: Easy → Medium → Easy → Medium → Hard.
        A random enemy is chosen each round based on that round's difficulty.
        Each wrong guess costs 1 HP; reaching 0 HP ends the run.
        Defeating an enemy restores HP equal to its regen value (capped at your class max).
      </p>
      <NoteSection
        title="Game Notes"
        :notes="notes.game"
        :loading="submitting.game"
        v-model="draft.game"
        @add="addNote('game')" @delete="deleteNote"
      />
    </section>

    <!-- ── Characters ────────────────────────────────────────────────────── -->
    <section class="info-section mb-5">
      <h2 class="info-heading mb-3">Characters</h2>
      <div class="info-grid mb-4">
        <div v-for="cls in CLASSES" :key="cls.id" class="info-card">
          <div class="art-placeholder art-placeholder--class mb-3">Art for {{ cls.name }}</div>
          <p class="info-name">{{ cls.name }}</p>
          <p class="info-desc">{{ cls.description }}</p>
          <p class="info-stat">HP: {{ cls.health }}</p>
        </div>
      </div>
      <NoteSection
        title="Suggest a Character"
        placeholder="Describe a character idea..."
        :notes="notes.character"
        :loading="submitting.character"
        v-model="draft.character"
        @add="addNote('character')" @delete="deleteNote"
      />
    </section>

    <!-- ── Enemies ────────────────────────────────────────────────────────── -->
    <section class="info-section">
      <h2 class="info-heading mb-3">Enemies</h2>
      <div class="info-grid mb-4">
        <div v-for="enemy in ENEMIES" :key="enemy.id" class="info-card">
          <div class="art-placeholder art-placeholder--class mb-3">Art for {{ enemy.name }}</div>
          <p class="info-name">{{ enemy.name }}</p>
          <p class="info-desc">{{ enemy.effect }}</p>
          <p class="info-stat">HP: {{ enemy.health }} &middot; Regen: {{ enemy.regen }} &middot; Diff: {{ enemy.difficulty }}</p>
        </div>
      </div>
      <NoteSection
        title="Suggest an Enemy"
        placeholder="Describe an enemy idea..."
        :notes="notes.enemy"
        :loading="submitting.enemy"
        v-model="draft.enemy"
        @add="addNote('enemy')" @delete="deleteNote"
      />
    </section>

  </main>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { CLASSES, ENEMIES } from '@/data/gameData.js'
import { db } from '@/firebase.js'
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, query, where, serverTimestamp,
} from 'firebase/firestore'
import NoteSection from '@/components/NoteSection.vue'

const draft      = ref({ game: '', character: '', enemy: '' })
const submitting = ref({ game: false, character: false, enemy: false })
const notes      = ref({ game: [], character: [], enemy: [] })
const unsubs     = []

function subscribeNotes() {
  for (const cat of ['game', 'character', 'enemy']) {
    const q = query(collection(db, 'notes'), where('type', '==', cat))
    unsubs.push(onSnapshot(q,
      snap => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        docs.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
        notes.value[cat] = docs
      },
      err => console.error(`notes/${cat}:`, err),
    ))
  }
}

async function deleteNote(id) {
  await deleteDoc(doc(db, 'notes', id))
}

async function addNote(cat) {
  const text = draft.value[cat].trim()
  if (!text) return
  submitting.value[cat] = true
  try {
    await addDoc(collection(db, 'notes'), { type: cat, text, createdAt: serverTimestamp() })
    draft.value[cat] = ''
  } finally {
    submitting.value[cat] = false
  }
}

onMounted(subscribeNotes)
onUnmounted(() => unsubs.forEach(u => u()))
</script>
