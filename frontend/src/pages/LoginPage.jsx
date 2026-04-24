import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Film, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login }    = useAuth()
  const navigate     = useNavigate()
  const [form, set]  = useState({ email: '', password: '' })
  const [show, setShow]  = useState(false)
  const [loading, setLoading] = useState(false)

  const handle = e => set(p => ({ ...p, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/30 via-black to-black" />
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&q=80)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-3xl text-white">CineAI</span>
          </div>
          <h1 className="font-display text-5xl text-white leading-tight mb-4">
            Your personal<br />
            <span className="italic text-brand-400">movie curator</span>
          </h1>
          <p className="text-surface-300 text-lg leading-relaxed max-w-sm">
            Powered by hybrid AI — content filtering + collaborative intelligence.
            Discover films you'll actually love.
          </p>
          <div className="mt-12 flex gap-6">
            {['87K+ Movies', 'Hybrid AI', 'Instant Recs'].map(t => (
              <div key={t} className="text-center">
                <div className="text-brand-400 font-semibold text-sm">{t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <Film className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-2xl text-white">CineAI</span>
          </div>

          <h2 className="font-display text-3xl text-white mb-2">Welcome back</h2>
          <p className="text-surface-300 text-sm mb-8">Sign in to your account</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs text-surface-300 mb-1.5 uppercase tracking-wide">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  name="email" type="email" value={form.email} onChange={handle} required
                  placeholder="you@example.com"
                  className="w-full bg-surface-700 border border-surface-500 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-surface-400 input-glow transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-surface-300 mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  name="password" type={show ? 'text' : 'password'} value={form.password} onChange={handle} required
                  placeholder="••••••••"
                  className="w-full bg-surface-700 border border-surface-500 rounded-lg pl-10 pr-10 py-3 text-sm text-white placeholder-surface-400 input-glow transition-all"
                />
                <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <> Sign In <ArrowRight className="w-4 h-4" /> </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-surface-300 mt-6">
            No account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">
              Create one free
            </Link>
          </p>

          {/* Demo hint */}
          <div className="mt-8 p-3 bg-surface-700 rounded-lg border border-surface-500">
            <p className="text-xs text-surface-300 text-center">
              Demo: register any account to explore AI recommendations
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
