/**
 * tmdb.js — TMDB poster fetcher with full error diagnostics
 */

const API_KEY   = import.meta.env.VITE_TMDB_API_KEY ?? ''
const BASE_URL  = 'https://api.themoviedb.org/3'
const IMG_W500  = 'https://image.tmdb.org/t/p/w500'
const IMG_W1280 = 'https://image.tmdb.org/t/p/w1280'

// ── Startup diagnostics ───────────────────────────────────────────────────────
console.log('[TMDB] module loaded')
console.log('[TMDB] API_KEY:', API_KEY ? `"${API_KEY.slice(0,8)}…" (${API_KEY.length} chars)` : '⚠️  MISSING — check frontend/.env')

// In-memory cache and in-flight deduplication
const cache    = new Map()
const inflight = new Map()

// ── Rate limiter: max 30 requests per 10 seconds (TMDB limit is 40/10s) ──────
const queue    = []
let   active   = 0
const MAX_CONCURRENT = 4   // process at most 4 at once

function processQueue() {
  while (active < MAX_CONCURRENT && queue.length > 0) {
    const { id, resolve } = queue.shift()
    active++
    _doFetch(id).then(info => {
      resolve(info)
      active--
      processQueue()
    })
  }
}

function enqueue(id) {
  return new Promise(resolve => {
    queue.push({ id, resolve })
    processQueue()
  })
}

async function _doFetch(id) {
  const url = `${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=en-US`
  try {
    // AbortSignal.timeout may not exist in older browsers — use manual timeout
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10000)

    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)

    if (!res.ok) {
      if (res.status === 401) {
        console.error('[TMDB] ❌ 401 Unauthorized — your API key is invalid or expired')
        console.error('[TMDB]    Key used:', API_KEY)
      } else if (res.status === 404) {
        // silently skip — not every MovieLens ID maps to TMDB
      } else if (res.status === 429) {
        console.warn('[TMDB] ⚠️  429 Rate limited — too many requests')
      } else {
        console.warn(`[TMDB] HTTP ${res.status} for id=${id}`)
      }
      cache.set(id, null)
      return null
    }

    const data = await res.json()
    const info = {
      posterUrl:   data.poster_path   ? `${IMG_W500}${data.poster_path}`    : null,
      backdropUrl: data.backdrop_path ? `${IMG_W1280}${data.backdrop_path}` : null,
      overview:    data.overview    ?? '',
      releaseYear: data.release_date  ? data.release_date.slice(0, 4) : '',
      rating:      data.vote_average  ? Number(data.vote_average).toFixed(1) : '',
      runtime:     data.runtime       ?? null,
      tmdbTitle:   data.title         ?? '',
    }

    if (!info.posterUrl) {
      console.warn(`[TMDB] No poster_path for id=${id} (title: ${data.title})`)
    }

    cache.set(id, info)
    return info

  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn(`[TMDB] Timeout for id=${id}`)
    } else {
      console.error(`[TMDB] Fetch error for id=${id}:`, err.message)
    }
    cache.set(id, null)
    return null
  } finally {
    inflight.delete(id)
  }
}

export async function fetchPoster(tmdbId) {
  const id = Number(tmdbId)
  if (!id || !Number.isFinite(id) || id <= 0) return null

  if (!API_KEY) {
    // Only warn once, not per card
    if (!fetchPoster._warned) {
      console.warn('[TMDB] fetchPoster called but API_KEY is empty — returning null for all posters')
      fetchPoster._warned = true
    }
    return null
  }

  if (cache.has(id))    return cache.get(id)
  if (inflight.has(id)) return inflight.get(id)

  const promise = enqueue(id)
  inflight.set(id, promise)
  return promise
}
fetchPoster._warned = false

/**
 * Deterministic gradient fallback.
 */
export function gradientPoster(seed = 0) {
  const n   = Math.abs(Number(seed) || 0)
  const hue = (n * 137.508) % 360
  return `linear-gradient(135deg,
    hsl(${hue.toFixed(0)}, 60%, 18%) 0%,
    hsl(${((hue + 45) % 360).toFixed(0)}, 50%, 28%) 100%)`
}
