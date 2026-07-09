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
