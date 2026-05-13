import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { RehagroLogo } from '@/components/ui/RehagroLogo'
import { useAuth } from '@/contexts/AuthContext'

export function EsqueciSenha() {
  const navigate = useNavigate()
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setErro(null)
    setLoading(true)
    try {
      const { error } = await resetPassword(email.trim())
      if (error) {
        setErro(`Erro: ${error.message}`)
        return
      }
      setEnviado(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <RehagroLogo variant="dark" className="h-14 w-auto mb-4" />
          <h1 className="font-display text-[22px] leading-tight text-ink">Recuperar senha</h1>
        </div>

        {enviado ? (
          <div className="bg-surface-pure border border-line rounded-2xl shadow-sm p-6 space-y-4 text-center">
            <CheckCircle2 size={36} className="text-status-good mx-auto" />
            <p className="text-sm text-ink-2">
              Se houver uma conta com esse e-mail, você receberá um link para redefinir a senha em poucos minutos.
            </p>
            <p className="text-xs text-ink-3">
              Cheque também a caixa de spam.
            </p>
            <Button onClick={() => navigate('/login')} className="w-full" variant="outline">
              Voltar ao login
            </Button>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="bg-surface-pure border border-line rounded-2xl shadow-sm p-6 space-y-4"
          >
            <p className="text-xs text-ink-3">
              Informe o e-mail cadastrado. Enviaremos um link para você criar uma nova senha.
            </p>

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

            {erro && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-status-bad/10 border border-status-bad/30">
                <AlertCircle size={14} className="text-status-bad shrink-0 mt-0.5" />
                <p className="text-xs text-status-bad">{erro}</p>
              </div>
            )}

            <Button type="submit" disabled={loading || !email.trim()} className="w-full">
              {loading ? 'Enviando…' : 'Enviar link de recuperação'}
            </Button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-ink-3 hover:text-ink-2"
            >
              <ArrowLeft size={12} />
              Voltar ao login
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
