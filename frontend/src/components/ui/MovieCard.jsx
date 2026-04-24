import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Info, Sparkles } from 'lucide-react'
import { fetchPoster, gradientPoster } from '../../services/tmdb'

export default function MovieCard({ movie, showReason = false }) {
  const navigate             = useNavigate()
  const [poster,  setPoster] = useState(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError,  setImgError]  = useState(false)
  const mountedRef = useRef(true)

  // Genre display: handle both "Action|Adventure" and "Action Adventure" formats
  const genreText = (movie.genres || '')
    .replace(/\|/g, ' · ')
    .replace(/  +/g, ' ')
    .trim()
    .split(' · ')
    .slice(0, 3)
    .join(' · ')

  useEffect(() => {
    mountedRef.current = true
    setPoster(null)
    setImgLoaded(false)
    setImgError(false)

    const id = Number(movie.tmdbId)
    if (!id || id <= 0) return

    fetchPoster(id).then(info => {
      if (!mountedRef.current) return   // component unmounted — ignore
      if (info?.posterUrl) {
        setPoster(info.posterUrl)
      }
    })

    return () => { mountedRef.current = false }
  }, [movie.tmdbId])   // re-run if tmdbId changes (e.g. list updates)

  const bgStyle = { background: gradientPoster(movie.movieId) }

  return (
    <div
      onClick={() => navigate(`/movie/${movie.movieId}`)}
      className="card-hover cursor-pointer rounded-xl overflow-hidden bg-surface-700 relative group"
    >
      {/* ── Poster area ─────────────────────────────────────────────────── */}
      <div className="aspect-[2/3] relative overflow-hidden">

        {/* Gradient placeholder — always rendered underneath */}
        <div className="absolute inset-0" style={bgStyle}>
          <span className="absolute bottom-2 left-2 right-2 text-white/70 text-[11px] font-medium line-clamp-2 leading-tight">
            {movie.title}
          </span>
        </div>

        {/* TMDB poster — layered on top once loaded */}
        {poster && !imgError && (
          <img
            src={poster}
            alt={movie.title}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500
              ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        )}

        {/* Skeleton shimmer while poster is loading but not yet painted */}
        {poster && !imgLoaded && !imgError && (
          <div className="absolute inset-0 skeleton" />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent
          opacity-0 group-hover:opacity-100 transition-opacity duration-200
          flex flex-col justify-end p-3 z-10">
          <div className="flex items-center gap-1 mb-1">
            <Info className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-xs text-brand-400 font-medium">View Details</span>
          </div>
          {movie.score > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-xs text-yellow-300">{Number(movie.score).toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Info panel ──────────────────────────────────────────────────── */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-white line-clamp-1 mb-1">
          {movie.title}
        </h3>
        <p className="text-xs text-surface-300 line-clamp-1">{genreText}</p>

        {/* AI reason badge */}
        {showReason && movie.reason && (
          <div className="mt-2 flex items-start gap-1.5 bg-brand-500/10 border border-brand-500/20 rounded-lg px-2 py-1.5">
            <Sparkles className="w-3 h-3 text-brand-400 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-brand-300 leading-tight">{movie.reason}</p>
          </div>
        )}
      </div>
    </div>
  )
}
