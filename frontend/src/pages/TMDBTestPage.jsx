/**
 * TMDBTestPage — visit /tmdb-test to diagnose poster fetching
 * Remove this page once posters are working.
 */
import { useState } from 'react'
import { fetchPoster } from '../services/tmdb'

// Known TMDB IDs for popular movies
const TEST_MOVIES = [
  { title: 'Toy Story',    tmdbId: 862   },
  { title: 'The Matrix',   tmdbId: 603   },
  { title: 'To Die For',   tmdbId: 577   },
  { title: 'Big Green',    tmdbId: 26441 },
  { title: 'Jumanji',      tmdbId: 8844  },
]

export default function TMDBTestPage() {
  const [results, setResults] = useState([])
  const [running, setRunning] = useState(false)
  const apiKey = import.meta.env.VITE_TMDB_API_KEY

  const runTest = async () => {
    setRunning(true)
    setResults([])
    for (const m of TEST_MOVIES) {
      const start = Date.now()
      const info  = await fetchPoster(m.tmdbId)
      setResults(r => [...r, {
        ...m,
        status:    info ? '✅ OK' : '❌ Failed',
        poster:    info?.posterUrl ?? null,
        ms:        Date.now() - start,
        overview:  info?.overview?.slice(0, 80) ?? '—',
      }])
    }
    setRunning(false)
  }

  return (
    <div className="min-h-screen bg-surface-900 p-8 text-white">
      <h1 className="text-2xl font-bold mb-2">TMDB Poster Diagnostic</h1>

      <div className="bg-surface-700 border border-surface-500 rounded-xl p-4 mb-6 font-mono text-sm">
        <p>VITE_TMDB_API_KEY = {apiKey
          ? <span className="text-green-400">"{apiKey.slice(0,8)}…" ({apiKey.length} chars) ✅</span>
          : <span className="text-red-400">MISSING ❌ — add to frontend/.env and restart Vite</span>
        }</p>
      </div>

      <button
        onClick={runTest}
        disabled={running}
        className="mb-8 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 rounded-lg font-semibold text-sm"
      >
        {running ? 'Testing…' : 'Run Poster Test'}
      </button>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {TEST_MOVIES.map(m => {
          const r = results.find(x => x.tmdbId === m.tmdbId)
          return (
            <div key={m.tmdbId} className="bg-surface-700 rounded-xl overflow-hidden">
              <div className="aspect-[2/3] bg-surface-600 relative">
                {r?.poster
                  ? <img src={r.poster} alt={m.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-surface-400 text-xs text-center p-2">
                      {r ? (r.status.includes('✅') ? 'No poster URL' : 'Fetch failed') : 'Not tested yet'}
                    </div>
                }
              </div>
              <div className="p-2">
                <p className="text-xs font-semibold truncate">{m.title}</p>
                <p className="text-xs text-surface-400">tmdbId: {m.tmdbId}</p>
                {r && <p className="text-xs mt-1">{r.status} ({r.ms}ms)</p>}
              </div>
            </div>
          )
        })}
      </div>

      {results.length > 0 && (
        <div className="mt-8 bg-surface-700 border border-surface-500 rounded-xl p-4">
          <h2 className="font-semibold mb-3">Results</h2>
          {results.map(r => (
            <div key={r.tmdbId} className="text-sm mb-2 font-mono">
              <span className="text-surface-400">tmdbId={r.tmdbId}</span>{' '}
              <span>{r.status}</span>{' '}
              <span className="text-surface-400">{r.ms}ms</span>{' '}
              {r.poster && <a href={r.poster} target="_blank" rel="noreferrer" className="text-blue-400 ml-2">poster link ↗</a>}
            </div>
          ))}
        </div>
      )}

      <p className="mt-8 text-surface-400 text-sm">
        Check your browser console (F12) for <code className="bg-surface-700 px-1 rounded">[TMDB]</code> log lines.
      </p>
    </div>
  )
}
