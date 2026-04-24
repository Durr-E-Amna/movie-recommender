// ── GenreTag ──────────────────────────────────────────────────────────────────
export function GenreTag({ genre, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150
        ${selected
          ? 'bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/20'
          : 'bg-surface-700 border-surface-500 text-surface-300 hover:border-brand-500 hover:text-white'
        }`}
    >
      {genre}
    </button>
  )
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h2 className="font-display text-2xl text-white">{title}</h2>
        {subtitle && <p className="text-sm text-surface-300 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size]
  return (
    <div className={`${s} border-2 border-brand-500 border-t-transparent rounded-full animate-spin`} />
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {Icon && <Icon className="w-12 h-12 text-surface-500 mb-4" />}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {desc  && <p className="text-sm text-surface-300 mb-5 max-w-xs">{desc}</p>}
      {action}
    </div>
  )
}

// ── MetricCard ────────────────────────────────────────────────────────────────
export function MetricCard({ label, value, sub, color = 'brand' }) {
  const colors = {
    brand:  'from-brand-500/20 to-brand-600/5 border-brand-500/30 text-brand-400',
    green:  'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 text-emerald-400',
    blue:   'from-blue-500/20 to-blue-600/5 border-blue-500/30 text-blue-400',
    yellow: 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/30 text-yellow-400',
  }
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-5`}>
      <p className="text-xs text-surface-300 uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-3xl font-display ${colors[color].split(' ').pop()}`}>{value}</p>
      {sub && <p className="text-xs text-surface-400 mt-1">{sub}</p>}
    </div>
  )
}

// ── SkeletonGrid ──────────────────────────────────────────────────────────────
export function SkeletonGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden">
          <div className="aspect-[2/3] skeleton rounded-xl" />
          <div className="p-3 space-y-2">
            <div className="h-3 skeleton rounded w-3/4" />
            <div className="h-2.5 skeleton rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
