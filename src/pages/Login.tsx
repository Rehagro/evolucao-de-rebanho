import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { RehagroLogo } from '@/components/ui/RehagroLogo'
import { useAuth } from '@/contexts/AuthContext'

export function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !senha) return
    setErro(null)
    setLoading(true)
    try {
      const { error } = await signIn(email.trim(), senha)
      if (error) {
        setErro(traduzirErro(error.message))
        return
      }
      navigate('/', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <RehagroLogo variant="dark" className="h-14 w-auto mb-4" />
          <h1 className="font-display text-[26px] leading-tight text-ink">Evolução de Rebanho</h1>
          <p className="text-sm text-ink-3 mt-1">Planejamento leiteiro</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-surface-pure border border-line rounded-2xl shadow-sm p-6 space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-2">E-mail</label>
            <div className="flex items-center gap-2 bg-surface-pure border border-line rounded-md px-3 py-2 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/30 transition-colors">
              <Mail size={14} className="text-ink-4 shrink-0" />
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                disabled={loading}
                className="flex-1 bg-transparent outline-none text-sm text-ink min-w-0"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-2">Senha</label>
            <div className="flex items-center gap-2 bg-surface-pure border border-line rounded-md px-3 py-2 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/30 transition-colors">
              <Lock size={14} className="text-ink-4 shrink-0" />
              <input
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="sua senha"
                disabled={loading}
                className="flex-1 bg-transparent outline-none text-sm text-ink min-w-0"
              />
            </div>
          </div>

          {erro && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-status-bad/10 border border-status-bad/30">
              <AlertCircle size={14} className="text-status-bad shrink-0 mt-0.5" />
              <p className="text-xs text-status-bad">{erro}</p>
            </div>
          )}

          <Button type="submit" disabled={loading || !email.trim() || !senha} className="w-full">
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => navigate('/esqueci-senha')}
              className="text-xs text-brand hover:text-brand-2 underline-offset-2 hover:underline"
            >
              Esqueci minha senha
            </button>
          </div>
        </form>

        <p className="text-center text-[11px] text-ink-4 mt-6">
          Acesso restrito a técnicos cadastrados. Solicite acesso ao administrador.
        </p>
      </div>
    </div>
  )
}

function traduzirErro(mensagem: string): string {
  if (/invalid login credentials/i.test(mensagem)) return 'E-mail ou senha incorretos.'
  if (/email not confirmed/i.test(mensagem)) return 'E-mail ainda não confirmado. Contate o administrador.'
  if (/network|fetch/i.test(mensagem)) return 'Sem conexão. Verifique sua internet.'
  return `Erro ao entrar: ${mensagem}`
}
