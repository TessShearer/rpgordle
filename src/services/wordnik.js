const BASE = '/api/wordnik'

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
