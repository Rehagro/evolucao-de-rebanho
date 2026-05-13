import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { RehagroLogo } from '@/components/ui/RehagroLogo'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Página de callback do reset de senha. O Supabase envia um e-mail com link que
 * redireciona para esta URL. O AuthContext já cuida da sessão temporária no detect.
 */
export function RedefinirSenha() {
  const navigate = useNavigate()
  const { updatePassword, user } = useAuth()
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  useEffect(() => {
    // Se chegou aqui sem ter recebido o link via e-mail (sessão recovery),
    // o user pode estar logado normalmente — ainda assim deixamos atualizar.
  }, [])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (senha !== confirmar) {
      setErro('As senhas não coincidem.')
      return
    }
    setErro(null)
    setLoading(true)
    try {
      const { error } = await updatePassword(senha)
      if (error) {
        setErro(`Erro: ${error.message}`)
        return
      }
      setOk(true)
      setTimeout(() => navigate('/', { replace: true }), 1500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <RehagroLogo variant="dark" className="h-14 w-auto mb-4" />
          <h1 className="font-display text-[22px] leading-tight text-ink">Nova senha</h1>
        </div>

        {ok ? (
          <div className="bg-surface-pure border border-line rounded-2xl shadow-sm p-6 text-center">
            <CheckCircle2 size={36} className="text-status-good mx-auto mb-3" />
            <p className="text-sm text-ink-2">Senha atualizada. Redirecionando…</p>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="bg-surface-pure border border-line rounded-2xl shadow-sm p-6 space-y-4"
          >
            {!user && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-status-warn/10 border border-status-warn/30">
                <AlertCircle size={14} className="text-status-warn shrink-0 mt-0.5" />
                <p className="text-xs text-status-warn">
                  Você não está autenticado. Abra o link mais recente no seu e-mail.
                </p>
              </div>
            )}

            <p className="text-xs text-ink-3">
              Defina sua nova senha. Mínimo 6 caracteres.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-2">Nova senha</label>
              <div className="flex items-center gap-2 bg-surface-pure border border-line rounded-md px-3 py-2 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/30 transition-colors">
                <Lock size={14} className="text-ink-4 shrink-0" />
                <input
                  type="password"
                  autoComplete="new-password"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  disabled={loading}
                  className="flex-1 bg-transparent outline-none text-sm text-ink min-w-0"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-2">Confirmar senha</label>
              <div className="flex items-center gap-2 bg-surface-pure border border-line rounded-md px-3 py-2 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/30 transition-colors">
                <Lock size={14} className="text-ink-4 shrink-0" />
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmar}
                  onChange={e => setConfirmar(e.target.value)}
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

            <Button type="submit" disabled={loading || senha.length < 6} className="w-full">
              {loading ? 'Atualizando…' : 'Salvar nova senha'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
