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

  // GET /api/word/validate?word=hello
  if (path === '/api/word/validate') {
    const word = (params.word || '').trim().toLowerCase()
    if (!word || !/^[a-z]+$/.test(word)) {
      return error(400, 'word parameter must be non-empty letters only')
    }

    try {
      const r = await fetch(`https://api.datamuse.com/words?sp=${word}&max=1`)
      const results = await r.json()
      const valid = Array.isArray(results) && results.length > 0 && results[0].word === word
      return ok({ word, valid })
    } catch {
      return ok({ word, valid: true })
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
