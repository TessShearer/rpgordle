<template>
  <main class="container py-5">
    <div class="row justify-content-center">
      <div class="col-md-6 text-center">
        <h1 class="mb-4">RPGordle</h1>

        <div class="counter-card p-4 mb-4">
          <p class="counter-label mb-1">Random Word</p>
          <span v-if="wordData" class="counter-value">{{ wordData.word }}</span>
          <span v-else class="display-6 text-muted">—</span>
        </div>

        <div class="mb-3 text-start">
          <label for="posSelect" class="form-label counter-label">Part of Speech</label>
          <select id="posSelect" class="form-select gs-select" v-model="selectedPos">
            <option value="">Any</option>
            <option value="n">Noun</option>
            <option value="v">Verb</option>
            <option value="adj">Adjective</option>
            <option value="adv">Adverb</option>
          </select>
        </div>

        <button
          class="btn btn-press w-100 py-3 mb-4"
          :disabled="loading"
          @click="fetchWord"
        >
          {{ loading ? 'Fetching…' : 'Get Random Word' }}
        </button>

        <p v-if="error" class="text-danger mb-4 small">{{ error }}</p>

        <div v-if="wordData" class="text-start">
          <table class="table table-sm table-bordered">
            <tbody>
              <tr>
                <th scope="row">Word</th>
                <td><strong>{{ wordData.word }}</strong></td>
              </tr>
              <tr>
                <th scope="row">Score</th>
                <td>{{ wordData.score }}</td>
              </tr>
              <tr v-if="wordData.numSyllables">
                <th scope="row">Syllables</th>
                <td>{{ wordData.numSyllables }}</td>
              </tr>
              <tr v-if="partsOfSpeech.length">
                <th scope="row">Parts of speech</th>
                <td>{{ partsOfSpeech.join(', ') }}</td>
              </tr>
              <tr v-if="frequency !== null">
                <th scope="row">Frequency</th>
                <td>{{ frequency }}</td>
              </tr>
              <tr v-if="wordData.defs && wordData.defs.length">
                <th scope="row">Definitions</th>
                <td>
                  <ol class="mb-0 ps-3">
                    <li v-for="(def, i) in wordData.defs" :key="i">
                      <em>{{ defPos(def) }}</em> {{ defText(def) }}
                    </li>
                  </ol>
                </td>
              </tr>
              <tr v-if="wordData.tags && wordData.tags.length">
                <th scope="row">Raw tags</th>
                <td>{{ wordData.tags.join(', ') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed } from 'vue'

const wordData   = ref(null)
const loading    = ref(false)
const error      = ref('')
const selectedPos = ref('')

const partsOfSpeech = computed(() => {
  if (!wordData.value?.tags) return []
  const posMap = { n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb', u: 'unknown' }
  return wordData.value.tags
    .filter(t => !t.startsWith('f:'))
    .map(t => posMap[t] ?? t)
})

const frequency = computed(() => {
  if (!wordData.value?.tags) return null
  const tag = wordData.value.tags.find(t => t.startsWith('f:'))
  return tag ? parseFloat(tag.slice(2)) : null
})

function defPos(def) {
  const tab = def.indexOf('\t')
  return tab === -1 ? '' : def.slice(0, tab)
}

function defText(def) {
  const tab = def.indexOf('\t')
  return tab === -1 ? def : def.slice(tab + 1)
}

async function fetchWord() {
  loading.value  = true
  error.value    = ''
  wordData.value = null
  try {
    const params = selectedPos.value ? `?pos=${selectedPos.value}` : ''
    const res = await fetch(`/api/word/random${params}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    wordData.value = await res.json()
  } catch {
    error.value = 'Could not fetch a word. Make sure the PHP server is running (npm run php).'
  } finally {
    loading.value = false
  }
}
</script>
