<template>
  <main class="container-fluid py-4 px-4">
    <h5 class="mb-3">Word Info <span class="text-muted fw-normal small">— Wordnik dev tool</span></h5>

    <div class="word-info-layout">

      <!-- LEFT: controls + results -->
      <div>
        <div class="param-grid mb-3">
          <div>
            <label class="form-label counter-label">Part of speech</label>
            <select class="form-select gs-select form-select-sm" v-model="params.includePartOfSpeech">
              <option value="">Any</option>
              <option value="noun">Noun</option>
              <option value="verb">Verb</option>
              <option value="adjective">Adjective</option>
              <option value="adverb">Adverb</option>
            </select>
          </div>
          <div>
            <label class="form-label counter-label">Min length</label>
            <input type="number" class="form-control gs-select form-control-sm" v-model.number="params.minLength" min="1" max="30" />
          </div>
          <div>
            <label class="form-label counter-label">Max length</label>
            <input type="number" class="form-control gs-select form-control-sm" v-model.number="params.maxLength" min="1" max="30" />
          </div>
          <div>
            <label class="form-label counter-label">Min corpus count</label>
            <input type="number" class="form-control gs-select form-control-sm" v-model.number="params.minCorpusCount" min="0" step="1000" />
          </div>
          <div class="d-flex align-items-end pb-1">
            <div class="form-check mb-0">
              <input class="form-check-input" type="checkbox" id="dictDef" v-model="params.hasDictionaryDef" />
              <label class="form-check-label small" for="dictDef">Dict def required</label>
            </div>
          </div>
        </div>

        <button class="btn btn-press w-100 py-2 mb-3" :disabled="loading" @click="fetchWord">
          {{ loading ? 'Fetching…' : 'Get Random Word' }}
        </button>

        <p v-if="error" class="text-danger small mb-3">{{ error }}</p>

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

      <!-- RIGHT: parameter reference -->
      <div>
        <p class="counter-label mb-2">Parameters</p>

        <p class="small fw-semibold mb-1 mt-2">randomWord</p>
        <table class="table table-sm table-bordered small ref-table">
          <thead><tr><th>Parameter</th><th>Type</th><th>Notes</th></tr></thead>
          <tbody>
            <tr><td>hasDictionaryDef</td><td>boolean</td><td>Default false. Only words with a dictionary entry.</td></tr>
            <tr><td>includePartOfSpeech</td><td>string</td><td>CSV — see POS list below.</td></tr>
            <tr><td>excludePartOfSpeech</td><td>string</td><td>Same values as include.</td></tr>
            <tr><td>minCorpusCount</td><td>integer</td><td>Default 0. Raise to avoid obscure words. ~5000 = common words.</td></tr>
            <tr><td>maxCorpusCount</td><td>integer</td><td>Default -1 (no limit).</td></tr>
            <tr><td>minDictionaryCount</td><td>integer</td><td>Default 1. Dictionaries that define the word.</td></tr>
            <tr><td>maxDictionaryCount</td><td>integer</td><td>Default -1 (no limit).</td></tr>
            <tr><td>minLength</td><td>integer</td><td>Default 5.</td></tr>
            <tr><td>maxLength</td><td>integer</td><td>Default -1 (no limit).</td></tr>
          </tbody>
        </table>

        <p class="small fw-semibold mb-1 mt-3">definitions</p>
        <table class="table table-sm table-bordered small ref-table">
          <thead><tr><th>Parameter</th><th>Type</th><th>Notes</th></tr></thead>
          <tbody>
            <tr><td>limit</td><td>integer</td><td>Default 200. Max definitions returned.</td></tr>
            <tr><td>partOfSpeech</td><td>string</td><td>Default all. Filter definitions by POS.</td></tr>
            <tr><td>sourceDictionaries</td><td>string</td><td>CSV: ahd-5, century, wiktionary, wordnet, gcide.</td></tr>
            <tr><td>includeRelated</td><td>boolean</td><td>Default false. Attach related words.</td></tr>
            <tr><td>useCanonical</td><td>boolean</td><td>Default false. Resolve to base form first.</td></tr>
          </tbody>
        </table>

        <p class="small fw-semibold mb-1 mt-3">frequency</p>
        <table class="table table-sm table-bordered small ref-table">
          <thead><tr><th>Parameter</th><th>Type</th><th>Notes</th></tr></thead>
          <tbody>
            <tr><td>startYear</td><td>integer</td><td>Default 1800.</td></tr>
            <tr><td>endYear</td><td>integer</td><td>Default 2012.</td></tr>
            <tr><td>useCanonical</td><td>boolean</td><td>Default false.</td></tr>
          </tbody>
        </table>

        <p class="small fw-semibold mb-1 mt-3">syllables &amp; examples</p>
        <table class="table table-sm table-bordered small ref-table">
          <thead><tr><th>Parameter</th><th>Type</th><th>Notes</th></tr></thead>
          <tbody>
            <tr><td>limit</td><td>integer</td><td>Syllables default 50, examples default 5.</td></tr>
            <tr><td>useCanonical</td><td>boolean</td><td>Default false.</td></tr>
            <tr><td>sourceDictionary</td><td>string</td><td>Syllables only: ahd-5, century, etc.</td></tr>
            <tr><td>skip</td><td>integer</td><td>Examples only. Pagination offset, default 0.</td></tr>
            <tr><td>includeDuplicates</td><td>boolean</td><td>Examples only. Default false.</td></tr>
          </tbody>
        </table>

        <p class="small fw-semibold mb-1 mt-3">POS values</p>
        <p class="small text-muted lh-sm">noun, verb, adjective, adverb, interjection, pronoun, preposition, abbreviation, affix, article, auxiliary-verb, conjunction, definite-article, family-name, given-name, idiom, imperative, noun-phrase, phrasal-prefix, proper-noun, proper-noun-plural, proper-noun-posessive, suffix, verb-intransitive, verb-transitive</p>
      </div>

    </div>
  </main>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { fetchRandomWord, fetchDefinitions, fetchSyllables, fetchFrequency } from '@/services/wordnik.js'

const BASE = 'https://api.wordnik.com/v4'

const loading = ref(false)
const error   = ref('')
const word    = ref('')
const lastUrl = ref('')

const rawWord        = ref(null)
const rawDefinitions = ref(null)
const rawSyllables   = ref(null)
const rawFrequency   = ref(null)

const params = reactive({
  includePartOfSpeech: '',
  minLength: 4,
  maxLength: 10,
  minCorpusCount: 5000,
  hasDictionaryDef: true,
})

async function fetchWord() {
  loading.value     = true
  error.value       = ''
  word.value        = ''
  lastUrl.value     = ''
  rawWord.value     = null
  rawDefinitions.value = null
  rawSyllables.value   = null
  rawFrequency.value   = null

  try {
    const wordParams = {
      minLength: params.minLength,
      maxLength: params.maxLength,
      minCorpusCount: params.minCorpusCount,
      hasDictionaryDef: params.hasDictionaryDef ? 'true' : 'false',
    }
    if (params.includePartOfSpeech) wordParams.includePartOfSpeech = params.includePartOfSpeech

    // Build display URL (without the key)
    const displayParams = new URLSearchParams({ ...wordParams })
    lastUrl.value = `${BASE}/words.json/randomWord?${displayParams}&api_key=…`

    const wordResult = await fetchRandomWord(wordParams)
    rawWord.value    = wordResult
    word.value       = wordResult.word

    const [defs, sylls, freq] = await Promise.allSettled([
      fetchDefinitions(wordResult.word),
      fetchSyllables(wordResult.word),
      fetchFrequency(wordResult.word),
    ])

    if (defs.status  === 'fulfilled') rawDefinitions.value = defs.value
    if (sylls.status === 'fulfilled') rawSyllables.value   = sylls.value
    if (freq.status  === 'fulfilled') rawFrequency.value   = freq.value
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
  .word-info-layout { grid-template-columns: 1fr; }
}

.param-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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

.ref-table th { white-space: nowrap; }
.ref-table td:first-child { font-family: monospace; white-space: nowrap; }
</style>
