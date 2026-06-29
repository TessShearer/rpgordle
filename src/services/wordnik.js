const BASE = '/api/wordnik'

const GAME_EXCLUDED_POS = 'given-name,family-name,proper-noun,proper-noun-plural,proper-noun-posessive,interjection,idiom,abbreviation,affix'

/**
 * Fetch a single game word from Wordnik with the standard game constraints.
 * Returns the word in lowercase.
 * Optional: override minLength / maxLength (e.g. for Annoying Kid same-length guess).
 */
export async function fetchGameWord({ minLength = 3, maxLength = 5 } = {}) {
  let lastError
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const result = await fetchRandomWord({
        minLength,
        maxLength,
        minCorpusCount: 5000,
        hasDictionaryDef: 'true',
        excludePartOfSpeech: GAME_EXCLUDED_POS,
      })
      return result.word
    } catch (e) {
      lastError = e
      if (attempt < 7) await new Promise(r => setTimeout(r, 400 * (attempt + 1)))
    }
  }
  throw lastError
}

export async function fetchRandomWord(params = {}) {
  const q = new URLSearchParams(params)
  const res = await fetch(`${BASE}/random?${q}`)
  if (!res.ok) throw new Error(`wordnik/random: HTTP ${res.status}`)
  return res.json()
}

export async function fetchDefinitions(word, params = {}) {
  const q = new URLSearchParams({ word, limit: 10, ...params })
  const res = await fetch(`${BASE}/definitions?${q}`)
  if (!res.ok) throw new Error(`wordnik/definitions: HTTP ${res.status}`)
  return res.json()
}

export async function fetchSyllables(word) {
  const res = await fetch(`${BASE}/syllables?word=${encodeURIComponent(word)}`)
  if (!res.ok) throw new Error(`wordnik/syllables: HTTP ${res.status}`)
  return res.json()
}

export async function fetchFrequency(word) {
  const res = await fetch(`${BASE}/frequency?word=${encodeURIComponent(word)}`)
  if (!res.ok) throw new Error(`wordnik/frequency: HTTP ${res.status}`)
  return res.json()
}

export async function fetchExamples(word, params = {}) {
  const q = new URLSearchParams({ word, limit: 5, ...params })
  const res = await fetch(`${BASE}/examples?${q}`)
  if (!res.ok) throw new Error(`wordnik/examples: HTTP ${res.status}`)
  return res.json()
}
