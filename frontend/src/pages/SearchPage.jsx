import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { moviesApi } from '../services/api'
import MovieCard from '../components/ui/MovieCard'
import { GenreTag, Spinner, EmptyState, SkeletonGrid } from '../components/ui/Common'
import { useSearchParams } from 'react-router-dom'

const GENRES = [
  'Action','Adventure','Animation','Comedy','Crime','Documentary',
  'Drama','Fantasy','Horror','Romance','Sci-Fi','Thriller','Western',
]

export default function SearchPage() {
  const [params, setParams]     = useSearchParams()
  const [query,  setQuery]      = useState(params.get('q') || '')
  const [genre,  setGenre]      = useState('')
  const [movies, setMovies]     = useState([])
  const [page,   setPage]       = useState(1)
  const [total,  setTotal]      = useState(0)
  const [pages,  setPages]      = useState(1)
  const [loading, setLoading]   = useState(false)
  const [searched, setSearched] = useState(false)
  const debounce = useRef(null)

  const LIMIT = 24

  const doSearch = useCallback(async (q, g, p = 1) => {
    setLoading(true)
    setSearched(true)
    try {
      if (q.trim()) {
        const r = await moviesApi.search(q)
        setMovies(r.data.results || [])
        setTotal(r.data.count || 0)
        setPages(1)
      } else {
        const r = await moviesApi.list(p, LIMIT, g)
        setMovies(r.data.movies || [])
        setTotal(r.data.total || 0)
        setPages(r.data.pages || 1)
      }
    } catch {
      setMovies([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Load on mount
  useEffect(() => { doSearch(query, genre, page) }, [])

  // Debounce query
  useEffect(() => {
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => {
      setPage(1)
      doSearch(query, genre, 1)
    }, 350)
    return () => clearTimeout(debounce.current)
  }, [query, genre])

  const changePage = (p) => {
    setPage(p)
    doSearch(query, genre, p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen px-6 lg:px-10 py-8 page-enter">
      <h1 className="font-display text-4xl text-white mb-6">Discover</h1>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search movies by title…"
          className="w-full bg-surface-700 border border-surface-500 rounded-xl pl-12 pr-10 py-3.5 text-white placeholder-surface-400 input-glow transition-all text-sm"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Genre filters */}
      {!query && (
        <div className="flex flex-wrap gap-2 mb-8">
          <GenreTag genre="All" selected={!genre} onClick={() => setGenre('')} />
          {GENRES.map(g => (
            <GenreTag key={g} genre={g} selected={genre === g} onClick={() => setGenre(genre === g ? '' : g)} />
          ))}
        </div>
      )}

      {/* Results count */}
      {searched && !loading && (
        <p className="text-sm text-surface-400 mb-4">
          {total > 0 ? `${total.toLocaleString()} movies found` : 'No results'}
          {genre && ` in ${genre}`}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <SkeletonGrid count={LIMIT} />
      ) : movies.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {movies.map(m => <MovieCard key={m.movieId} movie={m} />)}
          </div>

          {/* Pagination */}
          {pages > 1 && !query && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => changePage(page - 1)}
                disabled={page === 1}
                className="p-2 rounded-lg bg-surface-700 disabled:opacity-30 hover:bg-surface-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: Math.min(7, pages) }, (_, i) => {
                const p = page <= 4 ? i + 1 : page - 3 + i
                if (p < 1 || p > pages) return null
                return (
                  <button
                    key={p}
                    onClick={() => changePage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors
                      ${p === page ? 'bg-brand-500 text-white' : 'bg-surface-700 text-surface-300 hover:bg-surface-600'}`}
                  >
                    {p}
                  </button>
                )
              })}

              <button
                onClick={() => changePage(page + 1)}
                disabled={page === pages}
                className="p-2 rounded-lg bg-surface-700 disabled:opacity-30 hover:bg-surface-600 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      ) : searched ? (
        <EmptyState
          icon={Search}
          title="No movies found"
          desc={query ? `No results for "${query}"` : 'Try a different genre filter'}
        />
      ) : null}
    </div>
  )
}
