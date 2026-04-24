import { useState, useEffect } from 'react'
import { User, Clock, Edit2, Check, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { recsApi } from '../services/api'
import MovieCard from '../components/ui/MovieCard'
import { GenreTag, Spinner, EmptyState } from '../components/ui/Common'
import toast from 'react-hot-toast'

const ALL_GENRES = [
  'Action','Adventure','Animation','Children','Comedy','Crime',
  'Documentary','Drama','Fantasy','Film-Noir','Horror','IMAX',
  'Musical','Mystery','Romance','Sci-Fi','Thriller','War','Western',
]

export default function ProfilePage() {
  const { user, updateGenres }   = useAuth()
  const [history,  setHistory]   = useState([])
  const [hLoading, setHLoading]  = useState(true)
  const [editing,  setEditing]   = useState(false)
  const [selected, setSelected]  = useState(user?.favoriteGenres || [])
  const [saving,   setSaving]    = useState(false)

  useEffect(() => {
    recsApi.history(12).then(r => setHistory(r.data.history || []))
      .finally(() => setHLoading(false))
  }, [])

  const toggle = g =>
    setSelected(s => s.includes(g) ? s.filter(x => x !== g) : [...s, g])

  const saveGenres = async () => {
    setSaving(true)
    try {
      await updateGenres(selected)
      toast.success('Preferences updated!')
      setEditing(false)
    } catch {
      toast.error('Update failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen px-6 lg:px-10 py-8 page-enter">
      <h1 className="font-display text-4xl text-white mb-8">Profile</h1>

      {/* User card */}
      <div className="bg-surface-700 border border-surface-500 rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-2xl font-bold text-white">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{user?.username}</h2>
            <p className="text-surface-300 text-sm">{user?.email}</p>
          </div>
        </div>

        {/* Favourite genres */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-white">Favourite Genres</p>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300">
                <Edit2 className="w-3 h-3" /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={saveGenres} disabled={saving} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300">
                  {saving ? <Spinner size="sm" /> : <Check className="w-3 h-3" />} Save
                </button>
                <button onClick={() => { setEditing(false); setSelected(user?.favoriteGenres || []) }} className="flex items-center gap-1 text-xs text-surface-400 hover:text-white">
                  <X className="w-3 h-3" /> Cancel
                </button>
              </div>
            )}
          </div>

          {editing ? (
            <div className="flex flex-wrap gap-2">
              {ALL_GENRES.map(g => (
                <GenreTag key={g} genre={g} selected={selected.includes(g)} onClick={() => toggle(g)} />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(user?.favoriteGenres || []).length > 0
                ? user.favoriteGenres.map(g => (
                    <span key={g} className="px-3 py-1.5 bg-brand-500/15 border border-brand-500/30 rounded-full text-xs text-brand-300">
                      {g}
                    </span>
                  ))
                : <p className="text-sm text-surface-400">No genres selected yet.</p>
              }
            </div>
          )}
        </div>
      </div>

      {/* Watch history */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <Clock className="w-5 h-5 text-surface-400" />
          <h2 className="font-display text-2xl text-white">Watch History</h2>
        </div>

        {hLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : history.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {history.map(m => <MovieCard key={m.movieId} movie={m} />)}
          </div>
        ) : (
          <EmptyState
            icon={Clock}
            title="No watch history yet"
            desc="Rate a movie to track what you've watched."
          />
        )}
      </div>
    </div>
  )
}
