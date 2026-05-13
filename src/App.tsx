import { Component, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Login } from '@/pages/Login'
import { EsqueciSenha } from '@/pages/EsqueciSenha'
import { RedefinirSenha } from '@/pages/RedefinirSenha'
import { ListaFazendas } from '@/pages/ListaFazendas'
import { DashboardFazenda } from '@/pages/DashboardFazenda'
import { AdminPainel } from '@/pages/AdminPainel'
import { RehagroLogo } from '@/components/ui/RehagroLogo'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center">
          <p className="text-lg font-semibold text-red-600">Erro ao carregar a fazenda</p>
          <pre className="text-xs text-slate-500 bg-slate-100 rounded p-4 max-w-xl overflow-auto text-left">
            {(this.state.error as Error).message}
          </pre>
          <button
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg"
            onClick={() => this.setState({ error: null })}
          >
            Voltar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function TelaCarregando() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-3">
      <RehagroLogo variant="dark" className="h-12 w-auto opacity-90" />
      <p className="text-xs text-ink-3 font-mono">Carregando…</p>
    </div>
  )
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <TelaCarregando />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <TelaCarregando />
  if (!user) return <Navigate to="/login" replace />
  if (profile?.perfil !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

function DashboardWrapper() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  if (!id) return <Navigate to="/" replace />
  return (
    <DashboardFazenda
      fazendaId={id}
      onVoltar={() => navigate('/')}
    />
  )
}

function ListaWrapper() {
  const navigate = useNavigate()
  return <ListaFazendas onAbrir={(id) => navigate(`/fazenda/${id}`)} />
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <div className="min-h-screen bg-slate-50">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/esqueci-senha" element={<EsqueciSenha />} />
              <Route path="/redefinir-senha" element={<RedefinirSenha />} />
              <Route path="/" element={<RequireAuth><ListaWrapper /></RequireAuth>} />
              <Route path="/fazenda/:id" element={<RequireAuth><DashboardWrapper /></RequireAuth>} />
              <Route path="/admin" element={<RequireAdmin><AdminPainel /></RequireAdmin>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
