import { useState, useEffect } from 'react'
import { BarChart2, Cpu, Database, Clock, AlertCircle } from 'lucide-react'
import { recsApi } from '../services/api'
import { MetricCard, Spinner } from '../components/ui/Common'

export default function MetricsPage() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    recsApi.metrics()
      .then(r => setMetrics(r.data))
      .catch(err => setError(err.response?.data?.detail || 'Could not load metrics'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen px-6 lg:px-10 py-8">
      <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-5 mt-8">
        <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
        <div>
          <p className="text-white font-medium mb-1">Metrics not available</p>
          <p className="text-sm text-surface-300">{error}</p>
          <p className="text-xs text-surface-400 mt-2">Run <code className="bg-surface-700 px-1 rounded">python backend/ml/train_model.py</code> to generate metrics.</p>
        </div>
      </div>
    </div>
  )

  const collab  = metrics?.collaborative || {}
  const content = metrics?.content || {}
  const ds      = metrics?.dataset_size || {}

  return (
    <div className="min-h-screen px-6 lg:px-10 py-8 page-enter">
      <div className="flex items-center gap-3 mb-2">
        <BarChart2 className="w-6 h-6 text-brand-400" />
        <h1 className="font-display text-4xl text-white">AI Model Metrics</h1>
      </div>
      <p className="text-surface-300 text-sm mb-8">
        Evaluation results from the last training run ·{' '}
        {metrics?.trained_at && (
          <span className="text-surface-400">{new Date(metrics.trained_at).toLocaleString()}</span>
        )}
      </p>

      {/* Dataset stats */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-4">Dataset</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard
            label="Movies"
            value={ds.movies?.toLocaleString() || '–'}
            sub="Total in catalogue"
            color="blue"
          />
          <MetricCard
            label="Training Ratings"
            value={ds.ratings?.toLocaleString() || '–'}
            sub="Synthetic from tags"
            color="yellow"
          />
        </div>
      </section>

      {/* Collaborative metrics */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="w-4 h-4 text-brand-400" />
          <h2 className="text-lg font-semibold text-white">Collaborative Filtering (KNN)</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            label="RMSE"
            value={collab.rmse ?? '–'}
            sub="Root Mean Squared Error (lower = better)"
            color="brand"
          />
          <MetricCard
            label="Precision@10"
            value={collab.precision_at_10 !== undefined ? `${(collab.precision_at_10 * 100).toFixed(1)}%` : '–'}
            sub="Top-10 recommendations are relevant"
            color="green"
          />
          <MetricCard
            label="Recall@10"
            value={collab.recall_at_10 !== undefined ? `${(collab.recall_at_10 * 100).toFixed(1)}%` : '–'}
            sub="Relevant items found in top-10"
            color="blue"
          />
        </div>

        {/* Metric explanations */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'RMSE', desc: 'Measures how far off predicted ratings are from actual ratings. Lower values indicate better accuracy.' },
            { label: 'Precision@10', desc: 'Of the top 10 movies recommended, what fraction were actually relevant to the user.' },
            { label: 'Recall@10',    desc: 'Of all relevant movies, what fraction appeared in the top 10 recommendations.' },
          ].map(({ label, desc }) => (
            <div key={label} className="bg-surface-700/50 border border-surface-500 rounded-lg p-3">
              <p className="text-xs font-semibold text-brand-400 mb-1">{label}</p>
              <p className="text-xs text-surface-300 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Content-based metrics */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Content-Based Filtering (TF-IDF)</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MetricCard
            label="Avg Cosine Similarity (Top 5)"
            value={content.avg_cosine_similarity_top5 ?? '–'}
            sub="Higher = more coherent genre/tag clustering"
            color="yellow"
          />
        </div>
        <div className="mt-4 bg-surface-700/50 border border-surface-500 rounded-lg p-3 max-w-md">
          <p className="text-xs font-semibold text-yellow-400 mb-1">Cosine Similarity</p>
          <p className="text-xs text-surface-300 leading-relaxed">
            Measures how similar two movie feature vectors are. A score near 1.0 means the
            recommended movies share very similar genres and tags with the seed movie.
          </p>
        </div>
      </section>

      {/* Architecture overview */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Model Architecture</h2>
        <div className="bg-surface-700 border border-surface-500 rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Content-Based',
                badge: 'TF-IDF + Cosine',
                color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
                points: ['Movie genres as features', 'User tags aggregated per film', '10,000-feature TF-IDF matrix', 'Cosine similarity lookup'],
              },
              {
                title: 'Collaborative',
                badge: 'KNN User-Based',
                color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
                points: ['User-movie rating matrix', '20 nearest neighbours', 'Cosine distance metric', 'Weighted score aggregation'],
              },
              {
                title: 'Hybrid Engine',
                badge: 'Cold-Start Aware',
                color: 'text-brand-400 bg-brand-500/10 border-brand-500/30',
                points: ['≥3 ratings → collaborative', 'New user → content-based', 'Explanation per movie', 'Watch history logged to DB'],
              },
            ].map(({ title, badge, color, points }) => (
              <div key={title}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${color}`}>{badge}</span>
                </div>
                <h3 className="text-white font-semibold mb-2">{title}</h3>
                <ul className="space-y-1">
                  {points.map(p => (
                    <li key={p} className="text-xs text-surface-300 flex items-start gap-1.5">
                      <span className="text-brand-500 mt-0.5">▸</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
