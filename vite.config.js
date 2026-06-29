import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import https from 'https'

export default defineConfig(({ mode }) => {
  // loadEnv with '' prefix loads ALL vars, not just VITE_ ones
  // This keeps WORDNIK_API_KEY out of the browser bundle entirely
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      vue(),
      wordnikDevProxy(env.WORDNIK_API_KEY),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:8001',
          changeOrigin: true,
        },
      },
    },
  }
})

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (upstream) => {
      let body = ''
      upstream.on('data', chunk => { body += chunk })
      upstream.on('end', () => resolve({ status: upstream.statusCode, body }))
    }).on('error', reject)
  })
}

function wordnikDevProxy(apiKey) {
  const BASE = 'https://api.wordnik.com/v4'

  return {
    name: 'wordnik-dev-proxy',
    configureServer(server) {
      // Runs BEFORE the /api proxy so wordnik routes are handled here,
      // not forwarded to the PHP backend
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/wordnik/')) return next()

        const url     = new URL(req.url, 'http://localhost')
        const params  = url.searchParams
        const segment = url.pathname.slice('/api/wordnik/'.length)

        let upstreamUrl

        if (segment === 'random') {
          params.set('api_key', apiKey)
          upstreamUrl = `${BASE}/words.json/randomWord?${params}`
        } else if (segment === 'definitions') {
          const word = params.get('word') || ''
          params.delete('word')
          params.set('api_key', apiKey)
          upstreamUrl = `${BASE}/word.json/${encodeURIComponent(word)}/definitions?${params}`
        } else if (segment === 'syllables') {
          const word = params.get('word') || ''
          params.set('api_key', apiKey)
          upstreamUrl = `${BASE}/word.json/${encodeURIComponent(word)}/syllables?${params}`
        } else if (segment === 'frequency') {
          const word = params.get('word') || ''
          params.set('api_key', apiKey)
          upstreamUrl = `${BASE}/word.json/${encodeURIComponent(word)}/frequency?${params}`
        } else {
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: `Unknown wordnik endpoint: ${segment}` }))
          return
        }

        httpsGet(upstreamUrl).then(({ status, body }) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(body)
        }).catch(e => {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: e.message }))
        })
      })
    },
  }
}
