import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

import Layout        from './components/layout/Layout'
import LoginPage     from './pages/LoginPage'
import RegisterPage  from './pages/RegisterPage'
import GenrePage     from './pages/GenrePage'
import HomePage      from './pages/HomePage'
import SearchPage    from './pages/SearchPage'
import MoviePage     from './pages/MoviePage'
import RecsPage      from './pages/RecsPage'
import ProfilePage   from './pages/ProfilePage'
import MetricsPage   from './pages/MetricsPage'
import TMDBTestPage  from './pages/TMDBTestPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-900">
      <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return !user ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid #333',
              fontFamily: 'DM Sans, sans-serif',
            },
            success: { iconTheme: { primary: '#f83d31', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* Protected */}
          <Route path="/genres" element={<ProtectedRoute><GenrePage /></ProtectedRoute>} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/"           element={<HomePage />} />
            <Route path="/search"     element={<SearchPage />} />
            <Route path="/movie/:id"  element={<MoviePage />} />
            <Route path="/recs"       element={<RecsPage />} />
            <Route path="/profile"    element={<ProfilePage />} />
            <Route path="/metrics"    element={<MetricsPage />} />
          </Route>

          <Route path="/tmdb-test" element={<TMDBTestPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
