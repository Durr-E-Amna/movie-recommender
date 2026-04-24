import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, TrendingUp, Clock, Star, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { moviesApi, recsApi } from '../services/api'
import MovieCard from '../components/ui/MovieCard'
import { SectionHeader, Spinner, SkeletonGrid } from '../components/ui/Common'

function Section({ title, subtitle, icon: Icon, movies, showReason = false, loading, linkTo }) {
  return (
    <section className="mb-12">
      <SectionHeader
        title={title}
        subtitle={subtitle}
        action={linkTo && (
          <Link to={linkTo} className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
            See all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      />
      {loading ? (
        <SkeletonGrid count={6} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {movies.map(m => (
            <MovieCard key={m.movieId} movie={m} showReason={showReason} />
          ))}
        </div>
      )}
    </section>
  )
}

export default function HomePage() {
  const { user } = useAuth()
  const [recs,    setRecs]    = useState([])
  const [topRated, setTop]   = useState([])
  const [recent,  setRecent] = useState([])
  const [loading, setLoading] = useState({ recs: true, top: true, recent: true })

  useEffect(() => {
    recsApi.get(8).then(r => {
      setRecs(r.data.recommendations)
      setLoading(l => ({ ...l, recs: false }))
    }).catch(() => setLoading(l => ({ ...l, recs: false })))

    moviesApi.topRated(8).then(r => {
      setTop(r.data.movies)
      setLoading(l => ({ ...l, top: false }))
    }).catch(() => setLoading(l => ({ ...l, top: false })))

    recsApi.history(8).then(r => {
      setRecent(r.data.history)
      setLoading(l => ({ ...l, recent: false }))
    }).catch(() => setLoading(l => ({ ...l, recent: false })))
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="min-h-screen px-6 lg:px-10 py-8 page-enter">
      {/* Hero greeting */}
      <div className="mb-10">
        <p className="text-surface-300 text-sm mb-1">{greeting},</p>
        <h1 className="font-display text-4xl lg:text-5xl text-white">
          {user?.username || 'there'} <span className="italic text-brand-400">👋</span>
        </h1>
        {user?.favoriteGenres?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {user.favoriteGenres.map(g => (
              <span key={g} className="px-2 py-0.5 bg-surface-700 border border-surface-500 rounded-full text-xs text-surface-300">
                {g}
              </span>
            ))}
          </div>
        )}
      </div>

      <Section
        title="Recommended for You"
        subtitle="Powered by hybrid AI – personalised just for you"
        icon={Sparkles}
        movies={recs}
        showReason
        loading={loading.recs}
        linkTo="/recs"
      />

      <Section
        title="Top Rated"
        subtitle="Highest community ratings"
        icon={Star}
        movies={topRated}
        loading={loading.top}
      />

      {recent.length > 0 && (
        <Section
          title="Recently Watched"
          subtitle="Continue where you left off"
          icon={Clock}
          movies={recent}
          loading={loading.recent}
        />
      )}

      {/* CTA banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600/30 via-surface-700 to-surface-700 border border-brand-500/20 p-8 mt-4">
        <div className="absolute inset-0 bg-gradient-radial from-brand-500/5 to-transparent" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl text-white mb-1">Explore the full catalogue</h3>
            <p className="text-surface-300 text-sm">Search across 87,000+ movies with AI-powered recommendations</p>
          </div>
          <Link
            to="/search"
            className="flex-shrink-0 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors text-sm"
          >
            Start Exploring <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
