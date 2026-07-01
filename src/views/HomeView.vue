<template>
  <main class="container-fluid py-4 px-4">
    <h5 class="mb-3">Word Info <br><span class="text-muted fw-normal small">Test the Firebase word list. Fetch a random word by length and see everything stored about it.</span></h5>

    <div class="word-info-layout">

      <!-- LEFT: controls -->
      <div>
        <div class="param-grid mb-3">

          <div>
            <label class="form-label counter-label"><b>minLength</b></label>
            <input type="number" class="form-control gs-select form-control-sm" v-model.number="minLength"
              min="1" max="20" />
          </div>

          <div>
            <label class="form-label counter-label"><b>maxLength</b></label>
            <input type="number" class="form-control gs-select form-control-sm" v-model.number="maxLength"
              min="1" max="20" />
          </div>

        </div>

        <button class="btn btn-press w-100 py-2" :disabled="loading" @click="doFetch">
          {{ loading ? 'Fetching…' : 'Get Random Word' }}
        </button>
        <p v-if="fetchError" class="text-danger small mt-2 mb-0">{{ fetchError }}</p>
      </div>

      <!-- RIGHT: results -->
      <div>
        <template v-if="result">
          <div class="counter-card p-3 mb-3 text-center">
            <p class="counter-label mb-1">Word</p>
            <span class="counter-value">{{ result.word?.toUpperCase() }}</span>
          </div>

          <table class="info-table mb-3">
            <tbody>
              <tr><th>length</th><td>{{ result.length }}</td></tr>
              <tr><th>partOfSpeech</th><td>{{ result.partOfSpeech }}</td></tr>
              <tr><th>enabled</th><td>{{ result.enabled }}</td></tr>
              <tr><th>randomSeed</th><td>{{ result.randomSeed?.toFixed(6) }}</td></tr>
            </tbody>
          </table>

          <div v-if="result.definition" class="counter-card p-3">
            <p class="counter-label mb-1">Definition</p>
            <p class="mb-0 small">{{ result.definition }}</p>
          </div>
        </template>
      </div>

    </div>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { fetchGameWord, fetchWordData } from '@/services/words.js'

const loading = ref(false)
const fetchError = ref('')
const result = ref(null)
const minLength = ref(5)
const maxLength = ref(5)

async function doFetch() {
  loading.value = true
  fetchError.value = ''
  result.value = null
  try {
    const word = await fetchGameWord({ minLength: minLength.value, maxLength: maxLength.value })
    result.value = await fetchWordData(word)
  } catch (e) {
    fetchError.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.word-info-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;
}

@media (max-width: 700px) {
  .word-info-layout {
    grid-template-columns: 1fr;
  }
}

.param-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}

.info-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.info-table th {
  width: 40%;
  text-align: left;
  padding: 0.3rem 0.5rem;
  color: var(--gs-500);
  font-weight: 600;
}

.info-table td {
  padding: 0.3rem 0.5rem;
}

.info-table tr + tr th,
.info-table tr + tr td {
  border-top: 1px solid var(--gs-200);
}
</style>
