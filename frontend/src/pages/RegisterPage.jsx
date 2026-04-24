import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Film, User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate      = useNavigate()
  const [form, set]   = useState({ username: '', email: '', password: '' })
  const [show, setShow]     = useState(false)
  const [loading, setLoading] = useState(false)

  const handle = e => set(p => ({ ...p, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      await register(form.username, form.email, form.password)
      toast.success('Account created! Pick your favourite genres 🎬')
      navigate('/genres')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Film className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-2xl text-white">CineAI</span>
        </div>

        <h2 className="font-display text-3xl text-white mb-2">Create account</h2>
        <p className="text-surface-300 text-sm mb-8">Start your personalised cinema journey</p>

        <form onSubmit={submit} className="space-y-4">
          {[
            { name: 'username', label: 'Username',      type: 'text',  icon: User,  placeholder: 'cinephile42' },
            { name: 'email',    label: 'Email',         type: 'email', icon: Mail,  placeholder: 'you@example.com' },
          ].map(({ name, label, type, icon: Icon, placeholder }) => (
            <div key={name}>
              <label className="block text-xs text-surface-300 mb-1.5 uppercase tracking-wide">{label}</label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  name={name} type={type} value={form[name]} onChange={handle} required
                  placeholder={placeholder}
                  className="w-full bg-surface-700 border border-surface-500 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-surface-400 input-glow transition-all"
                />
              </div>
            </div>
          ))}

          <div>
            <label className="block text-xs text-surface-300 mb-1.5 uppercase tracking-wide">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                name="password" type={show ? 'text' : 'password'} value={form.password} onChange={handle} required minLength={6}
                placeholder="At least 6 characters"
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
              <> Create Account <ArrowRight className="w-4 h-4" /> </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-surface-300 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
