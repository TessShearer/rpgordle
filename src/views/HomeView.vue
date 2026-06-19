<template>
  <main class="container py-5">
    <div class="row justify-content-center">
      <div class="col-md-6 text-center">
        <h1 class="mb-4">RPGordle</h1>

        <div class="counter-card p-4 mb-4">
          <p class="counter-label mb-1">Random Word</p>
          <span v-if="word" class="counter-value">{{ word }}</span>
          <span v-else class="display-6 text-muted">—</span>
        </div>

        <button
          class="btn btn-press w-100 py-3"
          :disabled="loading"
          @click="fetchWord"
        >
          {{ loading ? 'Fetching…' : 'Get Random Word' }}
        </button>

        <p v-if="error" class="text-danger mt-3 small">{{ error }}</p>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref } from 'vue'

const word    = ref('')
const loading = ref(false)
const error   = ref('')

async function fetchWord() {
  loading.value = true
  error.value   = ''
  try {
    const res = await fetch('/api/word/random')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    word.value = data.word
  } catch {
    error.value = 'Could not fetch a word. Make sure the PHP server is running (npm run php).'
  } finally {
    loading.value = false
  }
}
</script>
