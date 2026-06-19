<template>
  <main class="container py-5">
    <div class="row justify-content-center">
      <div class="col-md-6 text-center">
        <h1 class="mb-4">RPGordle</h1>

        <div class="counter-card p-4 mb-4">
          <p class="counter-label mb-1">Random Word</p>
          <span v-if="word" class="counter-value">{{ word }}</span>
          <span v-else class="display-6 text-muted">—</span>
          <p v-if="selectedCategory !== 'all'" class="category-badge mt-2 mb-0">
            {{ categoryLabel }}
          </p>
        </div>

        <div class="mb-3 text-start">
          <label for="categorySelect" class="form-label counter-label">Category</label>
          <select
            id="categorySelect"
            class="form-select gs-select"
            v-model="selectedCategory"
            :disabled="loadingCategories"
          >
            <option v-if="loadingCategories" value="">Loading…</option>
            <option
              v-for="cat in categories"
              :key="cat.value"
              :value="cat.value"
            >
              {{ cat.label }}
            </option>
          </select>
        </div>

        <button
          class="btn btn-press w-100 py-3"
          :disabled="loading || loadingCategories"
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
import { ref, computed, onMounted } from 'vue'

const word              = ref('')
const loading           = ref(false)
const loadingCategories = ref(true)
const error             = ref('')
const categories        = ref([])
const selectedCategory  = ref('all')

const categoryLabel = computed(() => {
  const match = categories.value.find(c => c.value === selectedCategory.value)
  return match ? match.label : ''
})

onMounted(async () => {
  try {
    const res = await fetch('/api/word/categories')
    categories.value = await res.json()
  } catch {
    categories.value = [{ value: 'all', label: 'All Categories' }]
  } finally {
    loadingCategories.value = false
  }
})

async function fetchWord() {
  loading.value = true
  error.value   = ''
  try {
    const res = await fetch(`/api/word/random?category=${selectedCategory.value}`)
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
