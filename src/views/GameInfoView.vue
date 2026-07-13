<template>
  <main class="container py-4">


    <!-- ── Game ─────────────────────────────────────────────────────────── -->
    <section class="info-section mb-5">
      <h2 class="info-heading mb-3">Game</h2>
      <p class="info-body mb-4">
        The game is 1 enemy, a miniboss, then a shop. After the shop you get an item in your inventory that you can use
        at any time. Then you fight another regular enemy then a boss.

        The boss effects the entire game from the very beginning with its ability, but gets stronger on the boss level.

        All enemies have 1 health except for the bosses.
      </p>
      <NoteSection title="Game Notes" :notes="notes.game" :loading="submitting.game" v-model="draft.game"
        @add="addNote('game')" @delete="deleteNote" />
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
      <NoteSection title="Suggest a Character" placeholder="Describe a character idea..." :notes="notes.character"
        :loading="submitting.character" v-model="draft.character" @add="addNote('character')" @delete="deleteNote" />
    </section>

    <!-- ── Enemies ────────────────────────────────────────────────────────── -->
    <section class="info-section mb-5">
      <h2 class="info-heading mb-3">Enemies</h2>
      <div class="info-grid mb-4">
        <div v-for="enemy in ENEMIES" :key="enemy.id" class="info-card">
          <div class="art-placeholder art-placeholder--class mb-3">Art for {{ enemy.name }}</div>
          <p class="info-name">{{ enemy.name }}</p>
          <p class="info-desc">{{ enemy.effect }}</p>
          <p class="info-stat">HP: {{ enemy.health }} &middot; Regen: {{ enemy.regen }}</p>
        </div>
      </div>
      <NoteSection title="Suggest an Enemy" placeholder="Describe an enemy idea..." :notes="notes.enemy"
        :loading="submitting.enemy" v-model="draft.enemy" @add="addNote('enemy')" @delete="deleteNote" />
    </section>

    <!-- ── Minibosses ───────────────────────────────────────────────────────── -->
    <section class="info-section mb-5">
      <h2 class="info-heading mb-3">Minibosses</h2>
      <div class="info-grid mb-4">
        <div v-for="mb in MINIBOSSES" :key="mb.id" class="info-card">
          <div class="art-placeholder art-placeholder--class mb-3">Art for {{ mb.name }}</div>
          <p class="info-name">{{ mb.name }}</p>
          <p class="info-desc">{{ mb.effect }}</p>
          <p class="info-stat">HP: {{ mb.health }} &middot; Regen: {{ mb.regen }}</p>
        </div>
      </div>
      <NoteSection title="Suggest a Miniboss" placeholder="Describe a miniboss idea..." :notes="notes.miniboss"
        :loading="submitting.miniboss" v-model="draft.miniboss" @add="addNote('miniboss')" @delete="deleteNote" />
    </section>

    <!-- ── Bosses ────────────────────────────────────────────────────────────── -->
    <section class="info-section mb-5">
      <h2 class="info-heading mb-3">Bosses</h2>
      <div class="info-grid mb-4">
        <div v-for="boss in BOSSES" :key="boss.id" class="info-card">
          <div class="art-placeholder art-placeholder--class mb-3">Art for {{ boss.name }}</div>
          <p class="info-name">{{ boss.name }}</p>
          <p class="info-desc">{{ boss.effect }}</p>
          <p class="info-stat">HP: {{ boss.health }}</p>
        </div>
      </div>
      <NoteSection title="Suggest a Boss" placeholder="Describe a boss idea..." :notes="notes.boss"
        :loading="submitting.boss" v-model="draft.boss" @add="addNote('boss')" @delete="deleteNote" />
    </section>

    <!-- ── Shop Items ─────────────────────────────────────────────────────── -->
    <section class="info-section">
      <h2 class="info-heading mb-3">Shop Items</h2>
      <div class="info-grid mb-4">
        <div v-for="item in SHOP_ITEMS" :key="item.id" class="info-card">
          <div class="art-placeholder art-placeholder--class mb-3">Art for {{ item.name }}</div>
          <p class="info-name">{{ item.name }}</p>
          <p class="info-desc">{{ item.description }}</p>
        </div>
      </div>
      <NoteSection title="Suggest a Shop Item" placeholder="Describe a shop item idea..." :notes="notes.shop"
        :loading="submitting.shop" v-model="draft.shop" @add="addNote('shop')" @delete="deleteNote" />
    </section>

  </main>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { CLASSES, ENEMIES, MINIBOSSES, BOSSES, SHOP_ITEMS } from '@/data/gameData.js'
import { db } from '@/firebase.js'
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, query, where, serverTimestamp,
} from 'firebase/firestore'
import NoteSection from '@/components/NoteSection.vue'

const draft = ref({ game: '', character: '', enemy: '', miniboss: '', boss: '', shop: '' })
const submitting = ref({ game: false, character: false, enemy: false, miniboss: false, boss: false, shop: false })
const notes = ref({ game: [], character: [], enemy: [], miniboss: [], boss: [], shop: [] })
const unsubs = []

function subscribeNotes() {
  for (const cat of ['game', 'character', 'enemy', 'miniboss', 'boss', 'shop']) {
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
