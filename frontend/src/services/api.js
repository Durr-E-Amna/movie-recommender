import axios from 'axios'

const _base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/$/, '')
const baseURL = _base.endsWith('/api') ? _base : _base + '/api'

const api = axios.create({
  baseURL,
  timeout: 15000,
})

// Auto-attach token on every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Global error handling
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ─── Named helpers ────────────────────────────────────────────────────────────
export const moviesApi = {
  list:    (page = 1, limit = 20, genre = '') =>
    api.get('/movies', { params: { page, limit, genre } }),
  search:  (q) => api.get('/movies/search', { params: { q } }),
  detail:  (id) => api.get(`/movies/${id}`),
  similar: (id) => api.get(`/movies/${id}/similar`),
  rate:    (id, rating) => api.post(`/movies/${id}/rate`, { rating }),
  topRated: (limit = 20) => api.get('/movies/top-rated', { params: { limit } }),
}

export const recsApi = {
  get:     (limit = 12) => api.get('/recommendations', { params: { limit } }),
  history: (limit = 10) => api.get('/recommendations/history', { params: { limit } }),
  metrics: () => api.get('/recommendations/metrics'),
}
