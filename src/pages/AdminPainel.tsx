import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Users, Building2, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { RehagroLogo } from '@/components/ui/RehagroLogo'

interface TecnicoLinha {
  id: string
  nome: string
  email: string
  criado_em: string
  qtde_fazendas: number
}

interface FazendaResumo {
  id: string
  nome: string
  tecnico_id: string
  tecnico_nome: string
  criado_em: string
}

export function AdminPainel() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const [tecnicos, setTecnicos] = useState<TecnicoLinha[]>([])
  const [fazendas, setFazendas] = useState<FazendaResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [filtroTecnico, setFiltroTecnico] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setCarregando(true)
    Promise.all([
      supabase.from('profiles').select('id, nome, email, perfil, criado_em').eq('perfil', 'tecnico'),
      supabase.from('fazendas').select('id, nome, tecnico_id, criado_em'),
    ]).then(([{ data: profs, error: e1 }, { data: fazs, error: e2 }]) => {
      if (!alive) return
      if (e1 || e2) {
        setErro(e1?.message ?? e2?.message ?? 'Erro desconhecido')
        return
      }
      const profsList = profs ?? []
      const fazsList = fazs ?? []
      const profMap = new Map(profsList.map(p => [p.id, p.nome]))

      setTecnicos(profsList.map(p => ({
        id: p.id,
        nome: p.nome,
        email: p.email,
        criado_em: p.criado_em,
        qtde_fazendas: fazsList.filter(f => f.tecnico_id === p.id).length,
      })))

      setFazendas(fazsList.map(f => ({
        id: f.id,
        nome: f.nome,
        tecnico_id: f.tecnico_id,
        tecnico_nome: profMap.get(f.tecnico_id) ?? '(desconhecido)',
        criado_em: f.criado_em,
      })))
    }).catch(e => {
      if (alive) setErro(e instanceof Error ? e.message : String(e))
    }).finally(() => {
      if (alive) setCarregando(false)
    })
    return () => { alive = false }
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const fazendasFiltradas = filtroTecnico
    ? fazendas.filter(f => f.tecnico_id === filtroTecnico)
    : fazendas

  const fmtData = (iso: string) => new Date(iso).toLocaleDateString('pt-BR')

  return (
    <div className="min-h-screen bg-bg">
      <header className="bg-bg-elev border-b border-line sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-1.5 -ml-1.5 rounded-md text-ink-3 hover:text-ink hover:bg-surface-2"
              aria-label="Voltar"
            >
              <ChevronLeft size={18} />
            </button>
            <RehagroLogo variant="dark" className="h-10 w-auto" />
            <div className="border-l border-line pl-4">
              <h1 className="text-sm font-semibold text-ink">Painel Administrativo</h1>
              <p className="text-xs text-ink-3">
                {profile?.nome ? `${profile.nome} · admin` : 'admin'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} title="Sair">
            <LogOut size={14} />
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {erro && (
          <div className="px-4 py-2.5 rounded-md bg-status-bad/10 border border-status-bad/30 text-status-bad text-sm">
            {erro}
          </div>
        )}

        {carregando ? (
          <p className="text-sm text-ink-4 font-mono py-12 text-center">Carregando…</p>
        ) : (
          <>
            {/* Resumo */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="py-4 flex items-center gap-3">
                  <Users className="text-brand" size={20} />
                  <div>
                    <p className="text-[11px] text-ink-3 uppercase font-mono">Técnicos</p>
                    <p className="text-xl font-display text-ink">{tecnicos.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 flex items-center gap-3">
                  <Building2 className="text-brand" size={20} />
                  <div>
                    <p className="text-[11px] text-ink-3 uppercase font-mono">Fazendas (total)</p>
                    <p className="text-xl font-display text-ink">{fazendas.length}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Técnicos */}
            <section>
              <h2 className="text-sm font-semibold text-ink mb-3">Técnicos</h2>
              <div className="grid gap-2">
                {tecnicos.length === 0 && (
                  <p className="text-xs text-ink-4 italic">Nenhum técnico cadastrado ainda.</p>
                )}
                {tecnicos.map(t => (
                  <Card key={t.id} className={filtroTecnico === t.id ? 'border-brand' : ''}>
                    <CardContent className="py-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-brand-tint flex items-center justify-center text-brand-3 font-semibold text-sm shrink-0">
                        {t.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">{t.nome}</p>
                        <p className="text-xs text-ink-3 truncate">{t.email}</p>
                      </div>
                      <Badge variant="muted" className="font-mono">
                        {t.qtde_fazendas} fazenda{t.qtde_fazendas !== 1 ? 's' : ''}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFiltroTecnico(filtroTecnico === t.id ? null : t.id)}
                      >
                        {filtroTecnico === t.id ? 'Limpar filtro' : 'Filtrar'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Fazendas */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-ink">
                  Fazendas {filtroTecnico ? '(filtro ativo)' : `(${fazendas.length})`}
                </h2>
                {filtroTecnico && (
                  <Button variant="ghost" size="sm" onClick={() => setFiltroTecnico(null)}>
                    Mostrar todas
                  </Button>
                )}
              </div>
              <div className="grid gap-2">
                {fazendasFiltradas.length === 0 && (
                  <p className="text-xs text-ink-4 italic">
                    {filtroTecnico ? 'Esse técnico não tem fazendas.' : 'Nenhuma fazenda cadastrada.'}
                  </p>
                )}
                {fazendasFiltradas.map(f => (
                  <Card key={f.id}>
                    <CardContent className="py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">{f.nome}</p>
                        <p className="text-xs text-ink-3">
                          Técnico: <span className="text-ink-2">{f.tecnico_nome}</span>
                          {' · '}
                          Criada em {fmtData(f.criado_em)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/fazenda/${f.id}`)}
                      >
                        Abrir (só leitura)
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <p className="text-[11px] text-ink-4 text-center pt-4">
              Modo somente-leitura. Criação de novos técnicos via painel do Supabase.
            </p>
          </>
        )}
      </main>
    </div>
  )
}
