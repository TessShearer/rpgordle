<template>
  <main class="container-fluid py-4 px-4">
    <h5 class="mb-3">Word Info <br><span class="text-muted fw-normal small">This is a bunch of Tess relevant stuff about how we are getting the word and what limits we can put on it. I tried to make it other people friendly in case one of y'all wanted to experiment with it for character ideas. Some info:</span></h5>

    <ul>
      <li>
        I can include as many "parts of speech" limits as we want.
      </li>
      <li>
        corpus count is a count for how common a word is. The higher it goes the more common the word is. I am putting
        us at 5000 or more for the project.
      </li>
      <li>
        dictionary count is because the place im using to get the words draws from a bunch of different dictionaries, and this is how many of those dictionaries have those definitions. Manipulating this would be silly of us but it is here for me so I can test.
      </li>
      <li>def limit is how many definitions we are allowing to come back in the call. We don't currently show the definition on our sight, but we could make an item that reads us a definition (would use def limit 1)</li>
    </ul>


    <div class="word-info-layout">

      <!-- LEFT: all parameter controls -->
      <div>
        <div class="param-grid mb-3">

          <div>
            <label class="form-label counter-label"><b>includePartOfSpeech</b></label>
            <select class="form-select gs-select form-select-sm" v-model="params.includePartOfSpeech">
              <option value="">any</option>
              <option v-for="pos in POS_OPTIONS" :key="pos" :value="pos">{{ pos }}</option>
            </select>
          </div>

          <div>
            <label class="form-label counter-label"><b>excludePartOfSpeech</b></label>
            <select class="form-select gs-select form-select-sm" v-model="params.excludePartOfSpeech">
              <option value="">none</option>
              <option v-for="pos in POS_OPTIONS" :key="pos" :value="pos">{{ pos }}</option>
            </select>
          </div>

          <div>
            <label class="form-label counter-label"><b>minLength</b></label>
            <input type="number" class="form-control gs-select form-control-sm" v-model.number="params.minLength"
              min="1" max="30" />
          </div>

          <div>
            <label class="form-label counter-label"><b>maxLength</b></label>
            <input type="number" class="form-control gs-select form-control-sm" v-model.number="params.maxLength"
              min="-1" max="30" />
          </div>

          <div>
            <label class="form-label counter-label"><b>minCorpusCount</b></label>
            <input type="number" class="form-control gs-select form-control-sm" v-model.number="params.minCorpusCount"
              min="0" step="1000" />
          </div>

          <div>
            <label class="form-label counter-label"><b>maxCorpusCount</b></label>
            <input type="number" class="form-control gs-select form-control-sm" v-model.number="params.maxCorpusCount"
              min="-1" step="1000" />
          </div>

          <div>
            <label class="form-label counter-label"><b>minDictionaryCount</b></label>
            <input type="number" class="form-control gs-select form-control-sm"
              v-model.number="params.minDictionaryCount" min="1" />
          </div>

          <div>
            <label class="form-label counter-label"><b>maxDictionaryCount</b></label>
            <input type="number" class="form-control gs-select form-control-sm"
              v-model.number="params.maxDictionaryCount" min="-1" />
          </div>

          <div>
            <label class="form-label counter-label"><b>defLimit</b></label>
            <input type="number" class="form-control gs-select form-control-sm" v-model.number="params.defLimit" min="1"
              max="200" />
          </div>

          <div class="d-flex align-items-end pb-1">
            <div class="form-check mb-0">
              <input class="form-check-input" type="checkbox" id="dictDef" v-model="params.hasDictionaryDef" />
              <label class="form-check-label small" for="dictDef">hasDictionaryDef</label>
            </div>
          </div>

        </div>

        <button class="btn btn-press w-100 py-2" :disabled="loading" @click="fetchWord">
          {{ loading ? 'Fetching…' : 'Get Random Word' }}
        </button>
        <p v-if="error" class="text-danger small mt-2 mb-0">{{ error }}</p>
      </div>

      <!-- RIGHT: results -->
      <div>
        <template v-if="word">
          <div class="counter-card p-3 mb-3 text-center">
            <p class="counter-label mb-1">Random Word</p>
            <span class="counter-value">{{ word }}</span>
          </div>

          <div class="mb-3">
            <p class="counter-label mb-1">API call (randomWord)</p>
            <code class="api-url-display">{{ lastUrl }}</code>
          </div>

          <div class="mb-2">
            <p class="counter-label mb-1">randomWord</p>
            <pre class="raw-pre">{{ JSON.stringify(rawWord, null, 2) }}</pre>
          </div>
          <div class="mb-2">
            <p class="counter-label mb-1">definitions</p>
            <pre class="raw-pre">{{ JSON.stringify(rawDefinitions, null, 2) }}</pre>
          </div>
          <div class="mb-2">
            <p class="counter-label mb-1">syllables</p>
            <pre class="raw-pre">{{ JSON.stringify(rawSyllables, null, 2) }}</pre>
          </div>
          <div class="mb-2">
            <p class="counter-label mb-1">frequency</p>
            <pre class="raw-pre">{{ JSON.stringify(rawFrequency, null, 2) }}</pre>
          </div>
        </template>
      </div>

    </div>
  </main>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { fetchRandomWord, fetchDefinitions, fetchSyllables, fetchFrequency } from '@/services/wordnik.js'

const BASE = '/api/wordnik'

const POS_OPTIONS = [
  'noun', 'verb', 'adjective', 'adverb', 'interjection', 'pronoun',
  'preposition', 'proper-noun', 'auxiliary-verb', 'conjunction',
  'idiom', 'given-name', 'family-name', 'abbreviation', 'affix',
  'verb-intransitive', 'verb-transitive',
]

const loading = ref(false)
const error = ref('')
const word = ref('')
const lastUrl = ref('')

const rawWord = ref(null)
const rawDefinitions = ref(null)
const rawSyllables = ref(null)
const rawFrequency = ref(null)

const params = reactive({
  includePartOfSpeech: '',
  excludePartOfSpeech: '',
  minLength: 4,
  maxLength: 10,
  minCorpusCount: 5000,
  maxCorpusCount: -1,
  minDictionaryCount: 1,
  maxDictionaryCount: -1,
  hasDictionaryDef: true,
  defLimit: 10,
})

async function fetchWord() {
  loading.value = true
  error.value = ''
  word.value = ''
  lastUrl.value = ''
  rawWord.value = null
  rawDefinitions.value = null
  rawSyllables.value = null
  rawFrequency.value = null

  try {
    const wordParams = {
      minLength: params.minLength,
      maxLength: params.maxLength,
      minCorpusCount: params.minCorpusCount,
      maxCorpusCount: params.maxCorpusCount,
      minDictionaryCount: params.minDictionaryCount,
      maxDictionaryCount: params.maxDictionaryCount,
      hasDictionaryDef: params.hasDictionaryDef ? 'true' : 'false',
    }
    if (params.includePartOfSpeech) wordParams.includePartOfSpeech = params.includePartOfSpeech
    if (params.excludePartOfSpeech) wordParams.excludePartOfSpeech = params.excludePartOfSpeech

    const displayParams = new URLSearchParams(wordParams)
    if (params.includePartOfSpeech) displayParams.set('includePartOfSpeech', params.includePartOfSpeech)
    if (params.excludePartOfSpeech) displayParams.set('excludePartOfSpeech', params.excludePartOfSpeech)
    lastUrl.value = `${BASE}/random?${displayParams}`

    const wordResult = await fetchRandomWord(wordParams)
    rawWord.value = wordResult
    word.value = wordResult.word

    const [defs, sylls, freq] = await Promise.allSettled([
      fetchDefinitions(wordResult.word, { limit: params.defLimit }),
      fetchSyllables(wordResult.word),
      fetchFrequency(wordResult.word),
    ])

    if (defs.status === 'fulfilled') rawDefinitions.value = defs.value
    if (sylls.status === 'fulfilled') rawSyllables.value = sylls.value
    if (freq.status === 'fulfilled') rawFrequency.value = freq.value
  } catch (e) {
    error.value = `Wordnik error: ${e.message}`
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

.api-url-display {
  display: block;
  font-size: 0.72rem;
  word-break: break-all;
  background: var(--gs-100);
  padding: 0.4rem 0.6rem;
  border-radius: 0.3rem;
}

.raw-pre {
  background: var(--gs-900);
  color: var(--gs-100);
  padding: 0.6rem;
  border-radius: 0.4rem;
  font-size: 0.68rem;
  overflow-x: auto;
  margin: 0;
}
</style>
