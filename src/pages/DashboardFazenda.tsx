import { useState, useEffect, useMemo, useCallback } from 'react'
import { ChevronLeft, Upload, Settings, AlertTriangle } from 'lucide-react'
import { getFazenda, saveFazenda } from '@/lib/storage'
import { calcularProjecao } from '@/engine/projecao'
import { exportCSV } from '@/lib/exportCSV'
import { DEFAULT_PARAMETROS } from '@/lib/defaults'
import type {
  Fazenda,
  ResultadoProjecao,
  Parametros,
  EstadoAtualRebanho,
  Cenario,
} from '@/types'
import { CardsResumo } from '@/components/CardsResumo'
import { GraficoRebanho } from '@/components/GraficoRebanho'
import { SidebarParams } from '@/components/SidebarParams'
import { TabelaMensal } from '@/components/TabelaMensal'
import { TelaParametros } from '@/components/TelaParametros'
import { TelaUpload } from '@/components/TelaUpload'
import { TelaSecagem } from '@/components/TelaSecagem'
import { TelaForragem } from '@/components/TelaForragem'
import { TelaCenarios } from '@/components/TelaCenarios'
import { TelaPrevistoRealizado } from '@/components/TelaPrevistoRealizado'
import { TelaMetaInseminacao } from '@/components/TelaMetaInseminacao'
import { RehagroLogo } from '@/components/ui/RehagroLogo'
import { DraftFAB } from '@/components/ui/DraftFAB'
import { Stepper, type StepperStep } from '@/components/ui/Stepper'
import { Tag } from '@/components/ui/Tag'

type Aba = 'dashboard' | 'tabela' | 'secagem' | 'forragem' | 'meta-ia' | 'cenarios' | 'previsto' | 'parametros' | 'upload'

const TABS: { id: Aba; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'tabela',    label: 'Tabela Mensal' },
  { id: 'secagem',   label: 'Secagem' },
  { id: 'forragem',  label: 'Forragem' },
  { id: 'meta-ia',   label: 'Meta de IA' },
  { id: 'cenarios',  label: 'Cenários' },
  { id: 'previsto',  label: 'Previsto × Realizado' },
  { id: 'parametros', label: 'Parâmetros' },
]

const MESES_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function fmtDataRef(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${MESES_PT[d.getMonth()]}/${d.getFullYear()}`
}

/** Comparação rasa-profunda via JSON. Suficiente pra rascunho (objetos simples). */
function deepEqual<T>(a: T, b: T): boolean {
  if (a === b) return true
  try { return JSON.stringify(a) === JSON.stringify(b) } catch { return false }
}

interface Props {
  fazendaId: string
  onVoltar: () => void
}

type CvMap = { lac: Record<number, number>; sec: Record<number, number>; nov: Record<number, number> }

export function DashboardFazenda({ fazendaId, onVoltar }: Props) {
  const [fazenda, setFazenda] = useState<Fazenda | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [aba, setAba] = useState<Aba>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [hz, setHz] = useState(24)

  // ─── Rascunho único ───────────────────────────────────────────────
  // null = rascunho == salvo (sem alterações pendentes)
  // não-null = há alteração pendente naquele campo
  const [parametrosRascunho, setParametrosRascunho] = useState<Parametros | null>(null)
  const [estadoRascunho, setEstadoRascunho] = useState<EstadoAtualRebanho | null>(null)
  const [discOvrRascunho, setDiscOvrRascunho] = useState<Record<number, number> | null>(null)
  const [cvRascunho, setCvRascunho] = useState<CvMap | null>(null)

  // Ao trocar de fazenda, carrega async + zera rascunho
  useEffect(() => {
    let alive = true
    setCarregando(true)
    getFazenda(fazendaId).then(f => {
      if (!alive) return
      setFazenda(f)
      setParametrosRascunho(null)
      setEstadoRascunho(null)
      setDiscOvrRascunho(null)
      setCvRascunho(null)
      setCarregando(false)
    }).catch(() => {
      if (!alive) return
      setFazenda(null)
      setCarregando(false)
    })
    return () => { alive = false }
  }, [fazendaId])

  const parametrosEfetivos = parametrosRascunho ?? fazenda?.parametros ?? null
  const estadoEfetivo = estadoRascunho ?? fazenda?.estadoAtual ?? null
  const discOvr = discOvrRascunho ?? {}
  const cv: CvMap = cvRascunho ?? { lac: {}, sec: {}, nov: {} }

  const projecao = useMemo<ResultadoProjecao | null>(() => {
    if (!fazenda || !parametrosEfetivos || !estadoEfetivo) return null
    if (estadoEfetivo.vacasLactacao === 0) return null
    const dataRef = fazenda.dataUltimoUpload ? new Date(fazenda.dataUltimoUpload) : new Date()
    // Projeta no máximo entre o param da fazenda e o toggle escolhido — sem poluir rascunho.
    const meses = Math.max(parametrosEfetivos.horizonteMeses, hz) as Parametros['horizonteMeses']
    const paramsFull: Parametros = { ...parametrosEfetivos, horizonteMeses: meses }
    return calcularProjecao(paramsFull, estadoEfetivo, fazenda.rebanhoAtual, dataRef, discOvr, cv)
  }, [fazenda, parametrosEfetivos, estadoEfetivo, discOvrRascunho, cvRascunho, hz])

  const temRascunho = useMemo(() => {
    if (!fazenda) return false
    if (parametrosRascunho && !deepEqual(parametrosRascunho, fazenda.parametros)) return true
    if (estadoRascunho && !deepEqual(estadoRascunho, fazenda.estadoAtual)) return true
    if (discOvrRascunho && Object.keys(discOvrRascunho).length > 0) return true
    if (cvRascunho && (Object.keys(cvRascunho.lac).length || Object.keys(cvRascunho.sec).length || Object.keys(cvRascunho.nov).length)) return true
    return false
  }, [fazenda, parametrosRascunho, estadoRascunho, discOvrRascunho, cvRascunho])


  // ─── Handlers de rascunho ─────────────────────────────────────────
  const handleParamChange = useCallback(<K extends keyof Parametros>(key: K, value: Parametros[K]) => {
    if (!fazenda) return
    setParametrosRascunho(p => ({ ...(p ?? fazenda.parametros), [key]: value }))
  }, [fazenda])

  const handleEstadoChange = useCallback(<K extends keyof EstadoAtualRebanho>(key: K, value: EstadoAtualRebanho[K]) => {
    if (!fazenda) return
    setEstadoRascunho(e => ({ ...(e ?? fazenda.estadoAtual), [key]: value }))
  }, [fazenda])

  const restaurarParametros = useCallback(() => {
    setParametrosRascunho({ ...DEFAULT_PARAMETROS })
  }, [])

  // setDiscOvr e setCv aceitam tanto valor quanto callback (React.SetStateAction).
  // O GraficoRebanho usa callback (ex: setDiscOvr(d => ({ ...d, [i]: v }))).
  const handleDiscOvrChange: React.Dispatch<React.SetStateAction<Record<number, number>>> = useCallback((action) => {
    setDiscOvrRascunho(prev => {
      const base = prev ?? {}
      return typeof action === 'function' ? (action as (p: Record<number, number>) => Record<number, number>)(base) : action
    })
  }, [])

  const handleCvChange: React.Dispatch<React.SetStateAction<CvMap>> = useCallback((action) => {
    setCvRascunho(prev => {
      const base: CvMap = prev ?? { lac: {}, sec: {}, nov: {} }
      return typeof action === 'function' ? (action as (p: CvMap) => CvMap)(base) : action
    })
  }, [])

  const salvarRascunho = useCallback(() => {
    if (!fazenda) return
    const novaFazenda: Fazenda = {
      ...fazenda,
      parametros: parametrosRascunho ?? fazenda.parametros,
      estadoAtual: estadoRascunho ?? fazenda.estadoAtual,
    }
    setFazenda(novaFazenda)
    saveFazenda(novaFazenda).catch(err => console.error('Erro ao salvar fazenda:', err))
    setParametrosRascunho(null)
    setEstadoRascunho(null)
    setDiscOvrRascunho(null)
    setCvRascunho(null)
  }, [fazenda, parametrosRascunho, estadoRascunho])

  const descartarRascunho = useCallback(() => {
    setParametrosRascunho(null)
    setEstadoRascunho(null)
    setDiscOvrRascunho(null)
    setCvRascunho(null)
  }, [])

  const enviarSlot = useCallback((slot: 'A' | 'B') => {
    if (!fazenda) return
    const agora = new Date()
    const nome = `${String(agora.getDate()).padStart(2, '0')}/${String(agora.getMonth() + 1).padStart(2, '0')} ${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`
    const snapshot: Cenario = {
      id: crypto.randomUUID(),
      nome,
      parametros: parametrosEfetivos ?? fazenda.parametros,
      estadoAtual: estadoEfetivo ?? fazenda.estadoAtual,
      discOvr: { ...discOvr },
      cv: { lac: { ...cv.lac }, sec: { ...cv.sec }, nov: { ...cv.nov } },
      projecao: projecao ?? undefined,
      criadoEm: agora.toISOString(),
    }
    const novaFazenda: Fazenda = {
      ...fazenda,
      cenarioA: slot === 'A' ? snapshot : fazenda.cenarioA ?? null,
      cenarioB: slot === 'B' ? snapshot : fazenda.cenarioB,
    }
    setFazenda(novaFazenda)
    saveFazenda(novaFazenda).catch(err => console.error('Erro ao enviar cenário:', err))
    // Rascunho persiste (spec UX §2.5.2 ponto 5)
  }, [fazenda, parametrosEfetivos, estadoEfetivo, discOvr, cv, projecao])

  // ─── Salvar Fazenda do "fora" (Upload, Tela Parâmetros, Cenários) ───
  // Mantemos compat com componentes filhos que ainda chamam `atualizarFazenda`.
  // Esta função salva no localStorage SEM passar pelo rascunho.
  const atualizarFazenda = useCallback((f: Fazenda) => {
    setFazenda(f)
    saveFazenda(f).catch(err => console.error('Erro ao atualizar fazenda:', err))
  }, [])

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-ink-4 text-sm font-mono">Carregando fazenda…</p>
      </div>
    )
  }
  if (!fazenda) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <p className="text-ink-4 text-sm">Fazenda não encontrada.</p>
        <button onClick={onVoltar} className="text-xs text-brand hover:underline">← Voltar para a lista</button>
      </div>
    )
  }

  const estadoMostra = estadoEfetivo ?? fazenda.estadoAtual
  const paramMostra = parametrosEfetivos ?? fazenda.parametros
  const semDados = estadoMostra.vacasLactacao === 0
  const pctVL = (estadoMostra.vacasLactacao + estadoMostra.vacasSecas) > 0
    ? estadoMostra.vacasLactacao / (estadoMostra.vacasLactacao + estadoMostra.vacasSecas)
    : null
  const pctVLBadgeKind: 'green' | 'amber' | 'red' | 'neutral' =
    pctVL === null ? 'neutral'
    : pctVL >= 0.85 ? 'green'
    : pctVL >= 0.80 ? 'amber'
    : 'red'
  const inicial = fazenda.nome.charAt(0).toUpperCase()

  const showSidebar = sidebarOpen && aba !== 'upload' && aba !== 'parametros'

  const renderConteudo = () => {
    if (aba === 'parametros') {
      return (
        <div className="pb-10">
          <TelaParametros
            fazenda={fazenda}
            parametros={paramMostra}
            estado={estadoMostra}
            onParamChange={handleParamChange}
            onEstadoChange={handleEstadoChange}
            onRestaurarParametros={restaurarParametros}
          />
        </div>
      )
    }
    if (aba === 'upload') {
      return <TelaUpload fazenda={fazenda} onSalvar={atualizarFazenda} onConcluir={() => setAba('dashboard')} />
    }

    if (semDados) {
      const steps: StepperStep[] = [
        { label: 'Criar fazenda', state: 'done' },
        { label: 'Importar dados do Ideagri', state: 'active' },
        { label: 'Conferir parâmetros', state: 'todo' },
        { label: 'Ver projeção', state: 'todo' },
      ]
      return (
        <div className="flex flex-col items-center justify-center px-5 py-20 text-center max-w-2xl mx-auto">
          <div className="w-14 h-14 bg-brand-tint rounded-2xl flex items-center justify-center mb-4">
            <AlertTriangle size={22} className="text-brand" />
          </div>
          <h3 className="text-base font-semibold text-ink mb-1.5">Configure o rebanho inicial</h3>
          <p className="text-sm text-ink-3 mb-6 max-w-md">
            Para gerar projeções, importe os dados do Ideagri ou preencha o estado atual do rebanho.
          </p>

          <div className="bg-surface border border-line rounded-md px-5 py-4 mb-6 w-full max-w-sm text-left">
            <Stepper steps={steps} />
          </div>

          <div className="flex gap-2.5">
            <button onClick={() => setAba('upload')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-brand text-white text-sm font-semibold hover:bg-brand-2 transition-colors">
              <Upload size={14} /> Importar dados
            </button>
            <button onClick={() => setAba('parametros')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-line bg-surface text-ink text-sm font-semibold hover:bg-surface-2 transition-colors">
              <Settings size={14} /> Preencher parâmetros
            </button>
          </div>
        </div>
      )
    }

    switch (aba) {
      case 'dashboard':
        return projecao ? (
          <div className="flex flex-col gap-3.5">
            <CardsResumo projecao={projecao} hz={hz} />
            <GraficoRebanho
              projecao={projecao}
              params={paramMostra}
              hz={hz}
              setHz={setHz}
              discOvr={discOvr}
              setDiscOvr={handleDiscOvrChange}
              cv={cv}
              setCv={handleCvChange}
              onExport={() => exportCSV(projecao, paramMostra)}
              fazenda={fazenda}
            />
            <div className="h-2" />
          </div>
        ) : null
      case 'tabela':
        return projecao ? <TabelaMensal projecao={projecao} parametros={paramMostra} /> : null
      case 'secagem':
        return <TelaSecagem fazenda={fazenda} projecao={projecao} onSalvar={atualizarFazenda} />
      case 'forragem':
        return projecao ? <TelaForragem projecao={projecao} fazenda={fazenda} onSalvar={atualizarFazenda} /> : null
      case 'meta-ia':
        return projecao ? <TelaMetaInseminacao projecao={projecao} /> : null
      case 'cenarios':
        return <TelaCenarios fazenda={fazenda} onSalvar={atualizarFazenda} />
      case 'previsto':
        return projecao ? <TelaPrevistoRealizado fazenda={fazenda} projecao={projecao} onSalvar={atualizarFazenda} /> : null
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg">

      {/* Header */}
      <header className="bg-bg-elev border-b border-line shrink-0 z-10">
        <div className="px-5 flex items-center gap-3 h-14">
          <button
            onClick={onVoltar}
            className="flex items-center p-1.5 -ml-1.5 rounded-md text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
            aria-label="Voltar para lista de fazendas"
          >
            <ChevronLeft size={18} />
          </button>

          <RehagroLogo variant="dark" className="h-9 w-auto shrink-0" />

          <div className="h-7 w-px bg-line shrink-0" />

          <div className="w-7 h-7 bg-brand-tint rounded-md flex items-center justify-center text-[12px] font-semibold text-brand-3 shrink-0">
            {inicial}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-ink truncate">{fazenda.nome}</div>
            <div className="text-[10.5px] text-ink-3 flex items-center gap-1.5 font-mono">
              <span>Ref: {fmtDataRef(fazenda.dataUltimoUpload)}</span>
              {estadoMostra.vacasLactacao > 0 && (
                <span>· {Math.round(estadoMostra.vacasLactacao)} VL</span>
              )}
              {pctVL !== null && (
                <Tag kind={pctVLBadgeKind} className="ml-1 font-sans">
                  %VL {(pctVL * 100).toFixed(1)}%
                </Tag>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {fazenda.cenarioA && <Tag kind="brand" className="font-mono">A</Tag>}
            {fazenda.cenarioB && <Tag kind="brand" className="font-mono">B</Tag>}
            <button
              onClick={() => setAba('upload')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[12px] font-semibold transition-colors ${
                aba === 'upload'
                  ? 'border-brand text-brand bg-brand-tint-2'
                  : 'border-line bg-surface text-ink hover:bg-surface-2'
              }`}
            >
              <Upload size={13} /> Upload
            </button>
            <button
              onClick={() => setSidebarOpen(s => !s)}
              disabled={aba === 'upload' || aba === 'parametros'}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[12px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                showSidebar
                  ? 'border-brand text-brand bg-brand-tint-2'
                  : 'border-line bg-surface text-ink hover:bg-surface-2'
              }`}
            >
              <Settings size={13} /> Indicadores
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto pl-1 border-t border-line">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setAba(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[12.5px] font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                aba === t.id
                  ? 'border-brand text-brand font-bold'
                  : 'border-transparent text-ink-3 hover:text-ink-2 hover:border-line-2'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* %VL alert */}
      {pctVL !== null && pctVL < 0.80 && (
        <div className="bg-[var(--color-inf25)] border-b border-[var(--color-inf25-fg)]/30 px-5 py-1.5 shrink-0">
          <span className="text-[12px] text-[var(--color-inf25-fg)] flex items-center gap-1.5 font-medium">
            <AlertTriangle size={12} /> %VL abaixo de 80% — atenção ao desempenho reprodutivo.
          </span>
        </div>
      )}

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && (
          <SidebarParams
            params={paramMostra}
            onChange={handleParamChange}
            onVerTodos={() => setAba('parametros')}
            onEnviarSlot={enviarSlot}
            cenarioAOcupado={!!fazenda.cenarioA}
            cenarioBOcupado={!!fazenda.cenarioB}
            cenarioATimestamp={fazenda.cenarioA?.criadoEm}
            cenarioBTimestamp={fazenda.cenarioB?.criadoEm}
          />
        )}
        <main className="flex-1 overflow-y-auto px-5 py-4">
          {renderConteudo()}
        </main>
      </div>

      {/* Floating Action Bar de rascunho */}
      <DraftFAB
        visible={temRascunho}
        onSalvar={salvarRascunho}
        onEnviarSlot={enviarSlot}
        onDescartar={descartarRascunho}
        cenarioAOcupado={!!fazenda.cenarioA}
        cenarioBOcupado={!!fazenda.cenarioB}
        cenarioATimestamp={fazenda.cenarioA?.criadoEm}
        cenarioBTimestamp={fazenda.cenarioB?.criadoEm}
      />
    </div>
  )
}
