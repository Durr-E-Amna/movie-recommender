import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Film, ArrowRight, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const ALL_GENRES = [
  'Action','Adventure','Animation','Children','Comedy','Crime',
  'Documentary','Drama','Fantasy','Film-Noir','Horror','IMAX',
  'Musical','Mystery','Romance','Sci-Fi','Thriller','War','Western',
]

export default function GenrePage() {
  const { updateGenres } = useAuth()
  const navigate          = useNavigate()
  const [selected, setSelected] = useState([])
  const [loading,  setLoading]  = useState(false)

  const toggle = g =>
    setSelected(s => s.includes(g) ? s.filter(x => x !== g) : [...s, g])

  const submit = async () => {
    if (selected.length < 3) return toast.error('Please select at least 3 genres')
    setLoading(true)
    try {
      await updateGenres(selected)
      toast.success('Preferences saved!')
      navigate('/')
    } catch {
      toast.error('Failed to save preferences')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 mb-10 justify-center">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Film className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-2xl text-white">CineAI</span>
        </div>

        <h2 className="font-display text-4xl text-white text-center mb-2">What do you love?</h2>
        <p className="text-surface-300 text-center mb-2 text-sm">
          Pick at least 3 genres to calibrate your recommendations
        </p>
        <p className="text-surface-400 text-center text-xs mb-10">
          {selected.length} selected
        </p>

        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {ALL_GENRES.map(g => {
            const on = selected.includes(g)
            return (
              <button
                key={g}
                onClick={() => toggle(g)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150
                  ${on
                    ? 'bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/25'
                    : 'bg-surface-700 border-surface-500 text-surface-300 hover:border-brand-400 hover:text-white'
                  }`}
              >
                {on && <Check className="w-3 h-3" />}
                {g}
              </button>
            )
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-3 rounded-lg border border-surface-500 text-surface-300 text-sm hover:bg-surface-700 transition-colors"
          >
            Skip for now
          </button>
          <button
            onClick={submit}
            disabled={loading || selected.length < 3}
            className="flex-1 py-3 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <> Continue <ArrowRight className="w-4 h-4" /> </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
