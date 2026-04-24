import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, Film, Sparkles, Clock, Tag } from 'lucide-react'
import { moviesApi } from '../services/api'
import { fetchPoster, gradientPoster } from '../services/tmdb'
import StarRating from '../components/ui/StarRating'
import MovieCard from '../components/ui/MovieCard'
import { Spinner, SectionHeader } from '../components/ui/Common'
import toast from 'react-hot-toast'

export default function MoviePage() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const movieId      = parseInt(id)

  const [movie,   setMovie]   = useState(null)
  const [similar, setSimilar] = useState([])
  const [poster,  setPoster]  = useState(null)
  const [tmdbInfo, setTmdb]   = useState(null)
  const [rating,  setRating]  = useState(0)
  const [loading, setLoading] = useState(true)
  const [rating_loading, setRatingLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      moviesApi.detail(movieId),
      moviesApi.similar(movieId),
    ]).then(([mRes, sRes]) => {
      setMovie(mRes.data)
      setSimilar(sRes.data.similar || [])
    }).catch(() => toast.error('Could not load movie'))
      .finally(() => setLoading(false))
  }, [movieId])

  useEffect(() => {
    const id = Number(movie?.tmdbId)
    if (!id || id <= 0) return
    fetchPoster(id).then(info => {
      if (info) {
        setTmdb(info)
        if (info.posterUrl) setPoster(info.posterUrl)
      }
    })
  }, [movie?.tmdbId])

  const handleRate = async (val) => {
    setRating(val)
    setRatingLoading(true)
    try {
      await moviesApi.rate(movieId, val)
      toast.success(`Rated ${val} ★`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Rating failed')
    } finally {
      setRatingLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )

  if (!movie) return (
    <div className="min-h-screen flex items-center justify-center text-surface-300">
      Movie not found.
    </div>
  )

  const genres = (movie.genres || '').split(/[\s|]+/).filter(Boolean)
  const year   = tmdbInfo?.releaseYear || ''

  return (
    <div className="min-h-screen page-enter">
      {/* Backdrop */}
      {tmdbInfo?.backdropUrl && (
        <div className="absolute inset-x-0 top-0 h-80 lg:h-96 overflow-hidden -z-0">
          <img
            src={tmdbInfo.backdropUrl}
            alt=""
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface-900/80 to-surface-900" />
        </div>
      )}

      <div className="relative z-10 px-6 lg:px-10 py-8">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-surface-300 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Hero */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Poster */}
          <div className="flex-shrink-0 w-48 lg:w-56 mx-auto md:mx-0">
            <div className="rounded-2xl overflow-hidden shadow-2xl aspect-[2/3]">
              {poster ? (
                <img src={poster} alt={movie.title} className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-end p-4"
                  style={{ background: gradientPoster(movieId) }}
                >
                  <span className="text-white/80 font-medium text-sm">{movie.title}</span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-start gap-3 mb-3">
              {year && (
                <span className="px-2 py-0.5 bg-surface-700 border border-surface-500 rounded text-xs text-surface-300">
                  {year}
                </span>
              )}
              {tmdbInfo?.runtime && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-surface-700 border border-surface-500 rounded text-xs text-surface-300">
                  <Clock className="w-3 h-3" /> {tmdbInfo.runtime} min
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl lg:text-4xl text-white mb-4">{movie.title}</h1>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-5">
              {genres.map(g => (
                <span key={g} className="px-3 py-1 bg-surface-700 border border-surface-500 rounded-full text-xs text-surface-200">
                  {g}
                </span>
              ))}
            </div>

            {/* Overview */}
            {tmdbInfo?.overview && (
              <p className="text-surface-300 text-sm leading-relaxed mb-6 max-w-xl">
                {tmdbInfo.overview}
              </p>
            )}

            {/* TMDB rating */}
            {tmdbInfo?.rating && (
              <div className="flex items-center gap-2 mb-5">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-yellow-300 font-semibold">{tmdbInfo.rating}</span>
                <span className="text-surface-400 text-sm">/ 10 on TMDB</span>
              </div>
            )}

            {/* Community rating from DB */}
            {movie.avgRating && (
              <div className="flex items-center gap-2 mb-5">
                <Film className="w-4 h-4 text-brand-400" />
                <span className="text-brand-300 font-semibold">{movie.avgRating}</span>
                <span className="text-surface-400 text-sm">/ 5 community rating ({movie.ratingCount} votes)</span>
              </div>
            )}

            {/* Rate this movie */}
            <div className="bg-surface-700 border border-surface-500 rounded-xl p-4 inline-block">
              <p className="text-xs text-surface-300 uppercase tracking-wide mb-2">Rate this movie</p>
              <div className="flex items-center gap-3">
                <StarRating value={rating} onChange={handleRate} size="lg" />
                {rating_loading && <Spinner size="sm" />}
              </div>
            </div>
          </div>
        </div>

        {/* Similar movies */}
        {similar.length > 0 && (
          <section>
            <SectionHeader
              title="Similar Movies"
              subtitle="Content-based recommendations"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {similar.slice(0, 12).map(m => (
                <MovieCard key={m.movieId} movie={m} showReason />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
