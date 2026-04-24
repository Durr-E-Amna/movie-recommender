import { useState, useEffect } from 'react'
import { Sparkles, RefreshCw, Info } from 'lucide-react'
import { recsApi } from '../services/api'
import MovieCard from '../components/ui/MovieCard'
import { Spinner, EmptyState, SkeletonGrid } from '../components/ui/Common'
import toast from 'react-hot-toast'

export default function RecsPage() {
  const [recs,    setRecs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [count,   setCount]   = useState(12)

  const load = async (n = count) => {
    setLoading(true)
    try {
      const r = await recsApi.get(n)
      setRecs(r.data.recommendations || [])
    } catch {
      toast.error('Could not load recommendations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const refresh = () => load(count)
  const loadMore = () => {
    const n = count + 12
    setCount(n)
    load(n)
  }

  return (
    <div className="min-h-screen px-6 lg:px-10 py-8 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-brand-400" />
            <span className="text-brand-400 text-sm font-medium uppercase tracking-widest">AI Curated</span>
          </div>
          <h1 className="font-display text-4xl text-white">Recommended for You</h1>
          <p className="text-surface-300 text-sm mt-1">
            Hybrid model — collaborative filtering + content similarity
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-surface-700 border border-surface-500 rounded-lg text-sm text-surface-300 hover:bg-surface-600 hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* How it works banner */}
      <div className="flex items-start gap-3 bg-surface-700/50 border border-surface-500 rounded-xl p-4 mb-8">
        <Info className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm text-white font-medium mb-0.5">How recommendations work</p>
          <p className="text-xs text-surface-300 leading-relaxed">
            If you have rating history, we use <span className="text-brand-400">collaborative filtering</span> — finding
            users with similar tastes. For new users we use <span className="text-brand-400">content-based filtering</span>,
            matching genres and tags to what you've watched. Each card shows the AI's reason for recommending it.
          </p>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <SkeletonGrid count={count} />
      ) : recs.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {recs.map(m => (
              <MovieCard key={m.movieId} movie={m} showReason />
            ))}
          </div>

          <div className="text-center mt-10">
            <button
              onClick={loadMore}
              className="px-8 py-3 bg-surface-700 border border-surface-500 rounded-xl text-sm text-surface-300 hover:bg-surface-600 hover:text-white transition-colors"
            >
              Load more recommendations
            </button>
          </div>
        </>
      ) : (
        <EmptyState
          icon={Sparkles}
          title="No recommendations yet"
          desc="Rate some movies and we'll personalise your feed right away."
        />
      )}
    </div>
  )
}
