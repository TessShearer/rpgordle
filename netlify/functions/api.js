const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: JSON_HEADERS }
  }

  const path   = event.path
  const params = event.queryStringParameters || {}

  // GET /api/health
  if (path === '/api/health') {
    return ok({ status: 'ok' })
  }

  // GET /api/word/categories
  if (path === '/api/word/categories') {
    return ok([
      { value: 'all',                   label: 'All Categories' },
      { value: 'wordle',                label: 'Wordle' },
      { value: 'brainrot',              label: 'Brainrot' },
      { value: 'countries',             label: 'Countries' },
      { value: 'capitals_of_countries', label: 'Capitals of Countries' },
      { value: 'sports',                label: 'Sports' },
      { value: 'animals',               label: 'Animals' },
      { value: 'birds',                 label: 'Birds' },
      { value: 'softwares',             label: 'Software' },
      { value: 'programming_languages', label: 'Programming Languages' },
      { value: 'games',                 label: 'Games (All)' },
      { value: 'pc_games',              label: 'Games (PC)' },
      { value: 'mobile_games',          label: 'Games (Mobile)' },
      { value: 'console_games',         label: 'Games (Console)' },
      { value: 'companies',             label: 'Companies' },
    ])
  }

  // GET /api/word/random?length=N&pos=n|v|adj|adv
  if (path === '/api/word/random') {
    const allowedPos = ['n', 'v', 'adj', 'adv']
    let pos = params.pos || ''
    if (!allowedPos.includes(pos)) pos = ''

    const requested = parseInt(params.length || '0', 10)
    const length    = (requested >= 3 && requested <= 12) ? requested : Math.floor(Math.random() * 5) + 4
    const pattern   = '?'.repeat(length)

    let res, words
    try {
      res   = await fetch(`https://api.datamuse.com/words?sp=${pattern}&max=200&md=dpfs`)
      words = await res.json()
    } catch (err) {
      return error(502, 'Failed to reach Datamuse API', err.message)
    }

    if (!Array.isArray(words) || words.length === 0) {
      return error(502, 'No words returned from Datamuse')
    }

    // Filter to words with frequency >= 0.1 per million
    words = words.filter(w =>
      (w.tags || []).some(t => t.startsWith('f:') && parseFloat(t.slice(2)) >= 0.1)
    )

    if (pos) {
      words = words.filter(w => (w.tags || []).includes(pos))
    }

    if (words.length === 0) {
      return error(502, 'No words found matching the selected filters')
    }

    return ok(words[Math.floor(Math.random() * words.length)])
  }

  // GET /api/word/validate?word=hello
  if (path === '/api/word/validate') {
    const word = (params.word || '').trim().toLowerCase()
    if (!word || !/^[a-z]+$/.test(word)) {
      return error(400, 'word parameter must be non-empty letters only')
    }

    try {
      const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
      return ok({ word, valid: r.status === 200 })
    } catch {
      return ok({ word, valid: false })
    }
  }

  return error(404, 'Not found')
}

function ok(data) {
  return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify(data) }
}

function error(statusCode, message, detail) {
  const body = detail ? { error: message, detail } : { error: message }
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) }
}
