import { useMemo, useState } from 'react'
import { ArrowLeftRight, GitCompare } from 'lucide-react'
import { Button } from './ui/Button'
import { Card, CardContent } from './ui/Card'
import { Modal } from './ui/Modal'
import { Seg } from './ui/Seg'
import { CenarioPainel } from './ui/CenarioPainel'
import { calcularProjecao } from '@/engine/projecao'
import { resolverMesInicio } from '@/lib/dataProjecao'
import { clearCenario, promoverBparaA, getFazenda } from '@/lib/storage'
import { CORES_CATEGORIAS, LABELS_CATEGORIAS, ORDEM_CATEGORIAS, type CategoriaRebanho } from '@/lib/coresCategorias'
import type { Fazenda, Cenario, ResultadoProjecao, Parametros } from '@/types'

type Horizonte = 12 | 24 | 36 | 48 | 60 | 84

interface Props {
  fazenda: Fazenda
  onSalvar: (f: Fazenda) => void
}

function projetar(snapshot: Cenario, fazenda: Fazenda, horizonteMinimo: number): ResultadoProjecao | null {
  // Cache vale se cobrir o horizonte filtrado.
  if (snapshot.projecao && snapshot.projecao.meses.length >= horizonteMinimo) {
    return snapshot.projecao
  }
  if (!snapshot.estadoAtual) return null
  if (snapshot.estadoAtual.vacasLactacao === 0) return null
  // Cache não cobre — recalcula com horizonteMeses suficiente.
  const horizonteAjustado = Math.max(snapshot.parametros.horizonteMeses, horizonteMinimo) as Parametros['horizonteMeses']
  const params: Parametros = { ...snapshot.parametros, horizonteMeses: horizonteAjustado }
  const dataRef = resolverMesInicio(params, fazenda)
  return calcularProjecao(
    params,
    snapshot.estadoAtual,
    fazenda.rebanhoAtual,
    dataRef,
    snapshot.discOvr ?? {},
    snapshot.cv ?? { lac: {}, sec: {}, nov: {} },
  )
}

export function TelaCenarios({ fazenda, onSalvar }: Props) {
  const [horizonte, setHorizonte] = useState<Horizonte>(24)
  const [modo, setModo] = useState<'mensal' | 'anual'>('mensal')
  const [categorias, setCategorias] = useState<Set<CategoriaRebanho>>(
    new Set(ORDEM_CATEGORIAS),
  )
  const [confirmacao, setConfirmacao] = useState<null | { tipo: 'limpar'; slot: 'A' | 'B' } | { tipo: 'promover' }>(null)

  const projecaoA = useMemo(
    () => fazenda.cenarioA ? projetar(fazenda.cenarioA, fazenda, horizonte) : null,
    [fazenda.cenarioA, fazenda.rebanhoAtual, fazenda.dataUltimoUpload, horizonte],
  )
  const projecaoB = useMemo(
    () => fazenda.cenarioB ? projetar(fazenda.cenarioB, fazenda, horizonte) : null,
    [fazenda.cenarioB, fazenda.rebanhoAtual, fazenda.dataUltimoUpload, horizonte],
  )

  const semCenarios = !fazenda.cenarioA && !fazenda.cenarioB
  const ambosPreenchidos = !!fazenda.cenarioA && !!fazenda.cenarioB

  const toggleCategoria = (k: CategoriaRebanho) => {
    setCategorias(prev => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  }

  const executarConfirmacao = async () => {
    if (!confirmacao) return
    try {
      if (confirmacao.tipo === 'limpar') {
        await clearCenario(fazenda.id, confirmacao.slot)
      } else {
        await promoverBparaA(fazenda.id)
      }
      const refresh = await getFazenda(fazenda.id)
      if (refresh) onSalvar(refresh)
    } catch (e) {
      console.error('Erro ao executar ação no cenário:', e)
    } finally {
      setConfirmacao(null)
    }
  }

  const tituloConfirmacao =
    confirmacao?.tipo === 'limpar' ? `Limpar Cenário ${confirmacao.slot}` :
    confirmacao?.tipo === 'promover' ? 'Promover B → A' :
    ''

  const textoConfirmacao =
    confirmacao?.tipo === 'limpar'
      ? `O snapshot do Cenário ${confirmacao.slot} será removido. O outro slot e o rascunho atual não são afetados.`
      : confirmacao?.tipo === 'promover'
      ? 'O conteúdo de B será copiado para A, substituindo o atual. B permanece intacto.'
      : ''

  if (semCenarios) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <GitCompare size={32} className="text-ink-4 mx-auto mb-3" />
          <p className="text-sm font-semibold text-ink mb-1">Nenhum cenário enviado ainda</p>
          <p className="text-xs text-ink-3 max-w-md mx-auto">
            No Dashboard ou na Tela Parâmetros, mexa em parâmetros e use o botão
            flutuante <strong>"Enviar p/ comparativo"</strong> para fixar um snapshot
            como Cenário A ou B.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtros sincronizados */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <Seg
            value={horizonte}
            onChange={v => setHorizonte(v)}
            options={[
              { value: 12, label: '12m' },
              { value: 24, label: '24m' },
              { value: 36, label: '36m' },
              { value: 48, label: '48m' },
              { value: 60, label: '60m' },
              { value: 84, label: '84m' },
            ]}
            size="sm"
          />
          <Seg
            value={modo}
            onChange={v => setModo(v)}
            options={[
              { value: 'mensal', label: 'Mensal' },
              { value: 'anual',  label: 'Anual'  },
            ]}
            size="sm"
          />
          <div className="flex items-center gap-1.5 flex-wrap">
            {ORDEM_CATEGORIAS.map(k => {
              const on = categorias.has(k)
              const cor = CORES_CATEGORIAS[k]
              return (
                <button
                  key={k}
                  onClick={() => toggleCategoria(k)}
                  className="cat-pill"
                  style={{
                    borderColor: on ? cor : 'var(--color-line)',
                    background: on ? cor + '18' : 'var(--color-surface-2)',
                    color: on ? cor : 'var(--color-ink-4)',
                  }}
                >
                  <div
                    className="w-[7px] h-[7px] rounded-[2px] shrink-0"
                    style={{ background: on ? cor : 'var(--color-line-2)' }}
                  />
                  {LABELS_CATEGORIAS[k]}
                </button>
              )
            })}
          </div>
        </div>
        {ambosPreenchidos && (
          <Button variant="outline" size="sm" onClick={() => setConfirmacao({ tipo: 'promover' })}>
            <ArrowLeftRight size={13} />
            Promover B → A
          </Button>
        )}
      </div>

      {/* Painéis empilhados (A em cima, B embaixo) com gap pequeno pra comparação mês a mês */}
      <div className="grid grid-cols-1 gap-2">
        <CenarioPainel
          slot="A"
          snapshot={fazenda.cenarioA}
          projecao={projecaoA}
          horizonte={horizonte}
          categorias={categorias}
          modo={modo}
          onLimpar={() => setConfirmacao({ tipo: 'limpar', slot: 'A' })}
        />
        <CenarioPainel
          slot="B"
          snapshot={fazenda.cenarioB}
          projecao={projecaoB}
          horizonte={horizonte}
          categorias={categorias}
          modo={modo}
          onLimpar={() => setConfirmacao({ tipo: 'limpar', slot: 'B' })}
        />
      </div>

      <Modal
        open={confirmacao !== null}
        onClose={() => setConfirmacao(null)}
        title={tituloConfirmacao}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-2">{textoConfirmacao}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmacao(null)}>Cancelar</Button>
            <Button onClick={executarConfirmacao}>Confirmar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
