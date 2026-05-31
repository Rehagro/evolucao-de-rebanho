import { useMemo, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Modal } from './ui/Modal'
import { Seg } from './ui/Seg'
import { ParametroField, ParametroFieldPct } from './ui/ParametroField'
import { InfoTooltip } from './ui/InfoTooltip'
import { DEFAULT_PARAMETROS } from '@/lib/defaults'
import { resolverMesInicio } from '@/lib/dataProjecao'
import { preverLiberacaoNovilhas } from '@/engine/projecao'
import type {
  Fazenda, Parametros, EstadoAtualRebanho, TaxaConcepcaoMensal,
} from '@/types'

interface Props {
  fazenda: Fazenda
  parametros: Parametros
  estado: EstadoAtualRebanho
  onParamChange: <K extends keyof Parametros>(key: K, value: Parametros[K]) => void
  onEstadoChange: <K extends keyof EstadoAtualRebanho>(key: K, value: EstadoAtualRebanho[K]) => void
  /** Reset completo dos parâmetros para `DEFAULT_PARAMETROS`. */
  onRestaurarParametros: () => void
}

type Tab = 'vacas' | 'novilhas' | 'manejo'

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MESES_KEY = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'] as const
type MesKey = typeof MESES_KEY[number]

type TaxaKey = 'taxaServicoCacas' | 'taxaConcepcaoVacas' | 'taxaServico_Novilhas' | 'taxaConcepcao_Novilhas'

/**
 * Calcula o período de cada bloco de serviços históricos (Param!B26-C27 / B32-C33).
 *
 * Planilha: B27 (fim do período 1) = `J9 − 280`, onde J9 = Evolução!K14 = último dia do
 * mês 9 da projeção (= mês 1 + 8 meses; EOMONTH(mês1, 8)). Vacas e novilhas usam AS
 * MESMAS datas — B32/B33 referenciam B26/B27.
 *
 * Convenção do motor (projecao.ts:326): i=0 (= mês 1 da projeção) = MÊS de
 * `dataReferencia`. Logo, mês 9 = `dataReferencia.month + 8` (0-idx).
 *
 * Bela Vista: ref = 30/04/2026 → mês 1 = abr/26 → mês 9 = dez/26 → K14 = 31/12/2026
 * → ate1 = 31/12 − 280 = 26/03/2026.
 *
 * @param dataRef Data de referência (último upload do Ideagri; mês = 1º mês projetado)
 * @param idx     Índice do período (0 = 1º bloco, 1 = 2º bloco, ...)
 */
function calcularDatasServicoHelper(dataRef: Date | undefined | null, idx: number) {
  if (!dataRef) return null
  const ref = new Date(dataRef)
  // K14 = EOMONTH(mês 1 + 8 meses). Mês 1 = ref.getMonth() (0-idx). Em JS,
  // new Date(y, m, 0) = último dia do mês (m-1) em base 0-idx = mês m em 1-idx.
  // Queremos último dia do mês (ref.month + 8) em 0-idx = mês (ref.month + 9) em 1-idx.
  const k14 = new Date(ref.getFullYear(), ref.getMonth() + 9, 0)
  let ateDate = new Date(k14.getTime() - 280 * 86400000)
  let deDate = new Date(ateDate.getTime() - 30 * 86400000)
  for (let k = 0; k < idx; k++) {
    deDate = new Date(ateDate.getTime() + 86400000)
    ateDate = new Date(deDate.getTime() + 30 * 86400000)
  }
  const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  return { de: fmt(deDate), ate: fmt(ateDate) }
}

export function TelaParametros({
  fazenda, parametros, estado, onParamChange, onEstadoChange, onRestaurarParametros,
}: Props) {
  const [tab, setTab] = useState<Tab>('vacas')
  const [confirmRestaurar, setConfirmRestaurar] = useState(false)

  const setMensal = (key: TaxaKey, mes: MesKey, valuePct100: number) => {
    onParamChange(key, { ...parametros[key], [mes]: valuePct100 / 100 } as TaxaConcepcaoMensal)
  }

  const setMensalAll = (key: TaxaKey, valuePct100: number) => {
    const frac = valuePct100 / 100
    const novo = MESES_KEY.reduce(
      (acc, mes) => ({ ...acc, [mes]: frac }),
      {} as TaxaConcepcaoMensal,
    )
    onParamChange(key, novo)
  }

  return (
    <div className="space-y-6 pb-10 max-w-5xl mx-auto">
      {/* Banner de instrução */}
      <div className="bg-brand-tint-2 border border-brand-soft rounded-md p-3 text-sm text-brand-3">
        Calibre o motor à realidade da sua fazenda. Os campos vêm preenchidos com a
        configuração atual de <strong>{fazenda.nome}</strong>. Alterações entram no
        rascunho — salve ou envie pelo botão flutuante na base da tela.
      </div>

      {/* Header */}
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-brand mb-1">
            Parâmetros
          </p>
          <h1 className="font-display text-[26px] leading-tight text-ink">{fazenda.nome}</h1>
        </div>
        <div className="flex items-end gap-3 flex-wrap">
          <MesInicioProjecaoField
            value={parametros.mesInicioProjecao}
            fallback={resolverMesInicio(parametros, fazenda)}
            onChange={v => onParamChange('mesInicioProjecao', v)}
          />
          <Button variant="outline" size="sm" onClick={() => setConfirmRestaurar(true)}>
            <RotateCcw size={14} />
            Restaurar padrões
          </Button>
        </div>
      </div>

      {/* Estado Atual — sempre visível */}
      <Card>
        <CardHeader><CardTitle>Estado Atual do Rebanho</CardTitle></CardHeader>
        <CardContent>
          {(() => {
            const renderCampo = ([key, label, term]: readonly [string, string, string | undefined]) => (
              <ParametroField
                key={key}
                label={label}
                term={term as Parameters<typeof InfoTooltip>[0]['term'] | undefined}
                value={estado[key as keyof EstadoAtualRebanho] ?? 0}
                onChange={v => onEstadoChange(key as keyof EstadoAtualRebanho, Math.max(0, Math.round(v)))}
                step={1}
                min={0}
              />
            )
            const camposVacas = [
              ['vacasLactacao', 'Vacas em lactação', undefined],
              ['vacasSecas', 'Vacas secas', undefined],
              ['vacasVaziasAptas', 'Vacas vazias aptas', 'APTA'],
              ['vacasAtrasadas', 'Vacas atrasadas (em IA)', 'ATRASADA'],
              ['vacasInseminadas_lt25', 'Vacas inseminadas < 25d', undefined],
              ['vacasInseminadas_gt25', 'Vacas inseminadas > 25d', undefined],
              ['partosUltimos30d', 'Partos últimos 30 dias', undefined],
              ['partos31a60d', 'Partos 31–60 dias atrás', undefined],
            ] as const
            const camposNovilhas = [
              ['novilhasVaziasAptas', 'Novilhas vazias aptas', undefined],
              ['novilhasAtrasadas', 'Novilhas atrasadas', undefined],
              ['novilhasInseminadas_lt25', 'Novilhas inseminadas < 25d', undefined],
              ['novilhasInseminadas_gt25', 'Novilhas inseminadas > 25d', undefined],
              ['bezerrasMenores180d', 'Bezerras < 180 dias', undefined],
              ['bezerrasNovilhas180dAteAptas', 'Bezerras/novilhas 180d–aptas', undefined],
            ] as const
            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x lg:divide-line">
                <div className="lg:pr-8 pb-6 lg:pb-0">
                  <p className="text-[11px] font-mono uppercase tracking-wider text-brand mb-3">Vacas</p>
                  <div className="grid grid-cols-2 gap-4">
                    {camposVacas.map(renderCampo)}
                  </div>
                </div>
                <div className="lg:pl-8 pt-6 lg:pt-0 border-t lg:border-t-0 border-line">
                  <p className="text-[11px] font-mono uppercase tracking-wider text-brand mb-3">Novilhas</p>
                  <div className="grid grid-cols-2 gap-4">
                    {camposNovilhas.map(renderCampo)}
                  </div>
                </div>
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-line pb-px">
        <Seg
          value={tab}
          onChange={v => setTab(v)}
          options={[
            { value: 'vacas',    label: 'Vacas' },
            { value: 'novilhas', label: 'Novilhas' },
            { value: 'manejo',   label: 'Manejo' },
          ]}
        />
      </div>

      {tab === 'vacas' && (
        <TabVacas parametros={parametros} onParamChange={onParamChange} setMensal={setMensal} setMensalAll={setMensalAll} fazenda={fazenda} />
      )}
      {tab === 'novilhas' && (
        <TabNovilhas parametros={parametros} onParamChange={onParamChange} setMensal={setMensal} setMensalAll={setMensalAll} fazenda={fazenda} estado={estado} />
      )}
      {tab === 'manejo' && (
        <TabManejo parametros={parametros} onParamChange={onParamChange} />
      )}

      <Modal
        open={confirmRestaurar}
        onClose={() => setConfirmRestaurar(false)}
        title="Restaurar parâmetros padrão"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-2">
            Todos os parâmetros serão substituídos pelos valores padrão. O
            <strong> Estado Atual</strong> não é afetado. Esta ação é revertível pelo
            botão "Descartar" do rascunho flutuante, desde que você não tenha salvo ainda.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmRestaurar(false)}>Cancelar</Button>
            <Button onClick={() => { onRestaurarParametros(); setConfirmRestaurar(false) }}>
              Restaurar padrões
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── TAB: Vacas ───────────────────────────────────────────────────────────────

interface TabVacasProps {
  parametros: Parametros
  onParamChange: <K extends keyof Parametros>(key: K, value: Parametros[K]) => void
  setMensal: (key: TaxaKey, mes: MesKey, valuePct100: number) => void
  setMensalAll: (key: TaxaKey, valuePct100: number) => void
  fazenda: Fazenda
}

function TabVacas({ parametros, onParamChange, setMensal, setMensalAll, fazenda }: TabVacasProps) {
  const setServico = (idx: number, field: 'nServicos' | 'txConcepcao', value: number) => {
    const arr = [...(parametros.servicosRealizados_Vacas ?? [])]
    arr[idx] = { ...arr[idx], [field]: value }
    onParamChange('servicosRealizados_Vacas', arr)
  }
  const addServico = () => {
    onParamChange('servicosRealizados_Vacas', [
      ...(parametros.servicosRealizados_Vacas ?? []),
      { nServicos: 0, txConcepcao: 0.40 },
    ])
  }
  const removeServico = () => {
    const arr = parametros.servicosRealizados_Vacas ?? []
    if (arr.length <= 1) return
    onParamChange('servicosRealizados_Vacas', arr.slice(0, -1))
  }
  const setPerda = (idx: number, valuePct100: number) => {
    const arr = [...parametros.perdasPrenhez_Vaca]
    arr[idx] = valuePct100 / 100
    onParamChange('perdasPrenhez_Vaca', arr)
  }
  const dataInicio = resolverMesInicio(parametros, fazenda)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Reprodução</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <PevField value={parametros.pev} onChange={v => onParamChange('pev', v)} />
            <ParametroFieldPct
              label="% vacas aptas após o parto"
              term="PCT_VACAS_APTAS_POS_PARTO"
              value={parametros.pctVacasAptasAposParto}
              onChange={v => onParamChange('pctVacasAptasAposParto', v)}
            />
            <ParametroFieldPct
              label="Manutenção de prenhez/mês"
              term="MANUTENCAO_PRENHEZ"
              value={parametros.manutencaoPrenhez_Vacas}
              onChange={v => onParamChange('manutencaoPrenhez_Vacas', v)}
            />
            <ParametroFieldPct
              label="% prenhas no toque (DG)"
              term="PCT_PRENHES_TOQUE"
              value={parametros.pctPrenhesToque_Vacas}
              onChange={v => onParamChange('pctPrenhesToque_Vacas', v)}
            />
            <ParametroFieldPct
              label="% prenhezes sem parto efetivo"
              term="PCT_PRENHES_SEM_PARTO"
              value={parametros.pctPrenhesSemPartoEfetivo_Vacas}
              onChange={v => onParamChange('pctPrenhesSemPartoEfetivo_Vacas', v)}
            />
          </div>

          <TaxaMensalGrid
            label="Taxa de serviço por mês do ano"
            term="TS"
            data={parametros.taxaServicoCacas}
            onChangeMes={(mes, pct100) => setMensal('taxaServicoCacas', mes, pct100)}
            onApplyAll={pct100 => setMensalAll('taxaServicoCacas', pct100)}
          />
          <TaxaMensalGrid
            label="Taxa de concepção por mês do ano"
            term="TC"
            data={parametros.taxaConcepcaoVacas}
            onChangeMes={(mes, pct100) => setMensal('taxaConcepcaoVacas', mes, pct100)}
            onApplyAll={pct100 => setMensalAll('taxaConcepcaoVacas', pct100)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <InfoTooltip term="PERDAS_PRENHEZ_MES_PARTO">Perdas de prenhez por mês do parto</InfoTooltip>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-ink-3 mb-3">
            % de animais que não gerarão partos efetivos, indexado pelo mês do parto previsto.
            Mês 1 = parto iminente (perda mínima); Mês 9 = início da gestação (perda máxima).
          </p>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
            {parametros.perdasPrenhez_Vaca.map((v, i) => (
              <ParametroFieldPct
                key={i}
                label={`Mês ${i + 1}`}
                value={v}
                onChange={pct => setPerda(i, pct * 100)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Serviços de IA realizados</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-ink-3">
            Inseminações realizadas nos períodos sem previsão confirmada de parto.
            Datas são calculadas automaticamente: <strong>parto previsto (= último dia do 9° mês projetado) − 280 dias de gestação</strong>.
            Cada período cobre 30 dias.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-md">
            <ParametroFieldPct
              label="Perda prenhez total — Vaca"
              term="PERDA_PRENHEZ_TOTAL"
              value={parametros.perdaPrenhez_Total_Vaca}
              onChange={v => onParamChange('perdaPrenhez_Total_Vaca', v)}
            />
          </div>

          <div className="space-y-3">
            {(parametros.servicosRealizados_Vacas ?? []).map((s, idx) => {
              const datas = calcularDatasServicoHelper(dataInicio, idx)
              const partosEstimados = Math.round(
                s.nServicos * s.txConcepcao * (1 - (parametros.perdaPrenhez_Total_Vaca ?? 0.20)),
              )
              return (
                <div
                  key={idx}
                  className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end p-3 bg-surface-2 rounded-md border border-line"
                >
                  <div>
                    <p className="text-xs font-medium text-ink-3 mb-1">Período {idx + 1}</p>
                    {datas
                      ? <p className="text-xs text-ink-2 font-mono tabular-nums">{datas.de} → {datas.ate}</p>
                      : <p className="text-xs text-ink-4 italic">Faça upload para calcular datas</p>}
                  </div>
                  <ParametroField
                    label="N° de serviços"
                    value={s.nServicos}
                    onChange={v => setServico(idx, 'nServicos', Math.max(0, Math.round(v)))}
                    step={1}
                    min={0}
                  />
                  <ParametroFieldPct
                    label="TC estimada"
                    value={s.txConcepcao}
                    onChange={v => setServico(idx, 'txConcepcao', v)}
                  />
                  <div className="pb-1">
                    <p className="text-xs text-ink-3 mb-1">Partos estimados</p>
                    <p className="text-sm font-semibold text-ink font-mono tabular-nums">{partosEstimados}</p>
                  </div>
                </div>
              )
            })}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={addServico}>+ Adicionar período</Button>
              {(parametros.servicosRealizados_Vacas ?? []).length > 1 && (
                <Button variant="outline" size="sm" onClick={removeServico}>− Remover último</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── TAB: Novilhas ────────────────────────────────────────────────────────────

interface TabNovilhasProps {
  parametros: Parametros
  estado: EstadoAtualRebanho
  onParamChange: <K extends keyof Parametros>(key: K, value: Parametros[K]) => void
  setMensal: (key: TaxaKey, mes: MesKey, valuePct100: number) => void
  setMensalAll: (key: TaxaKey, valuePct100: number) => void
  fazenda: Fazenda
}

function TabNovilhas({ parametros, estado, onParamChange, setMensal, setMensalAll, fazenda }: TabNovilhasProps) {
  const setPerda = (idx: number, valuePct100: number) => {
    const arr = [...parametros.perdasPrenhez_Novilha]
    arr[idx] = valuePct100 / 100
    onParamChange('perdasPrenhez_Novilha', arr)
  }

  const setServico = (idx: number, field: 'nServicos' | 'txConcepcao', value: number) => {
    const arr = [...(parametros.servicosRealizados_Novilhas ?? [])]
    arr[idx] = { ...arr[idx], [field]: value }
    onParamChange('servicosRealizados_Novilhas', arr)
  }
  const addServico = () => {
    onParamChange('servicosRealizados_Novilhas', [
      ...(parametros.servicosRealizados_Novilhas ?? []),
      { nServicos: 0, txConcepcao: 0.50 },
    ])
  }
  const removeServico = () => {
    const arr = parametros.servicosRealizados_Novilhas ?? []
    if (arr.length <= 1) return
    onParamChange('servicosRealizados_Novilhas', arr.slice(0, -1))
  }
  const dataInicio = resolverMesInicio(parametros, fazenda)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Reprodução</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <ParametroField
              label="Idade de liberação"
              term="IDADE_LIBERACAO"
              value={parametros.idadeLiberacao}
              onChange={v => onParamChange('idadeLiberacao', Math.max(3, Math.min(parametros.idadeAoParto - 1, Math.round(v))))}
              unidade="m"
              step={1}
              min={3}
              max={parametros.idadeAoParto - 1}
            />
            <IdadeAoPartoField
              value={parametros.idadeAoParto}
              onChange={v => onParamChange('idadeAoParto', v)}
            />
            <ParametroFieldPct
              label="Manutenção de prenhez/mês"
              term="MANUTENCAO_PRENHEZ"
              value={parametros.manutencaoPrenhez_Novilhas}
              onChange={v => onParamChange('manutencaoPrenhez_Novilhas', v)}
            />
            <ParametroFieldPct
              label="% prenhas no toque (DG)"
              term="PCT_PRENHES_TOQUE"
              value={parametros.pctPrenhesToque_Novilhas}
              onChange={v => onParamChange('pctPrenhesToque_Novilhas', v)}
            />
            <ParametroFieldPct
              label="% prenhezes sem parto efetivo"
              term="PCT_PRENHES_SEM_PARTO"
              value={parametros.pctPrenhesSemPartoEfetivo_Novilhas}
              onChange={v => onParamChange('pctPrenhesSemPartoEfetivo_Novilhas', v)}
            />
          </div>
          <p className="text-xs text-ink-3">
            Animais "Em crescimento" acima da idade de liberação são incluídos 50% no mês +1 e 50% no mês +2.
            Animais categorizados como "Novilha" no CSV entram imediatamente no pool reprodutivo.
          </p>

          <TaxaMensalGrid
            label="Taxa de serviço por mês do ano"
            term="TS"
            data={parametros.taxaServico_Novilhas}
            onChangeMes={(mes, pct100) => setMensal('taxaServico_Novilhas', mes, pct100)}
            onApplyAll={pct100 => setMensalAll('taxaServico_Novilhas', pct100)}
          />
          <TaxaMensalGrid
            label="Taxa de concepção por mês do ano"
            term="TC"
            data={parametros.taxaConcepcao_Novilhas}
            onChangeMes={(mes, pct100) => setMensal('taxaConcepcao_Novilhas', mes, pct100)}
            onApplyAll={pct100 => setMensalAll('taxaConcepcao_Novilhas', pct100)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Liberação</CardTitle></CardHeader>
        <CardContent>
          <TabelaLiberacaoNovilhas
            fazenda={fazenda}
            estado={estado}
            parametros={parametros}
            onParamChange={onParamChange}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <InfoTooltip term="PERDAS_PRENHEZ_MES_PARTO">Perdas de prenhez por mês do parto</InfoTooltip>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-ink-3 mb-3">
            Mesma definição das vacas, com perdas tipicamente menores em novilhas (gestações iniciais).
          </p>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
            {parametros.perdasPrenhez_Novilha.map((v, i) => (
              <ParametroFieldPct
                key={i}
                label={`Mês ${i + 1}`}
                value={v}
                onChange={pct => setPerda(i, pct * 100)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Serviços de IA realizados — Novilhas</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-ink-3">
            Inseminações realizadas em novilhas nos períodos sem previsão confirmada de parto.
            Equivalente à aba Parâmetros da planilha (B28/C28). Datas calculadas a partir do
            <strong> parto previsto (= último dia do 9° mês projetado) − 280 dias de gestação</strong>.
            Cada período cobre 30 dias.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-md">
            <ParametroFieldPct
              label="Perda prenhez total — Novilha"
              term="PERDA_PRENHEZ_TOTAL"
              value={parametros.perdaPrenhez_Total_Novilha}
              onChange={v => onParamChange('perdaPrenhez_Total_Novilha', v)}
            />
          </div>

          <div className="space-y-3">
            {(parametros.servicosRealizados_Novilhas ?? []).map((s, idx) => {
              const datas = calcularDatasServicoHelper(dataInicio, idx)
              const partosEstimados = Math.round(
                s.nServicos * s.txConcepcao * (1 - (parametros.perdaPrenhez_Total_Novilha ?? 0.10)),
              )
              return (
                <div
                  key={idx}
                  className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end p-3 bg-surface-2 rounded-md border border-line"
                >
                  <div>
                    <p className="text-xs font-medium text-ink-3 mb-1">Período {idx + 1}</p>
                    {datas
                      ? <p className="text-xs text-ink-2 font-mono tabular-nums">{datas.de} → {datas.ate}</p>
                      : <p className="text-xs text-ink-4 italic">Faça upload para calcular datas</p>}
                  </div>
                  <ParametroField
                    label="N° de serviços"
                    value={s.nServicos}
                    onChange={v => setServico(idx, 'nServicos', Math.max(0, Math.round(v)))}
                    step={1}
                    min={0}
                  />
                  <ParametroFieldPct
                    label="TC estimada"
                    value={s.txConcepcao}
                    onChange={v => setServico(idx, 'txConcepcao', v)}
                  />
                  <div className="pb-1">
                    <p className="text-xs text-ink-3 mb-1">Partos estimados</p>
                    <p className="text-sm font-semibold text-ink font-mono tabular-nums">{partosEstimados}</p>
                  </div>
                </div>
              )
            })}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={addServico}>+ Adicionar período</Button>
              {(parametros.servicosRealizados_Novilhas ?? []).length > 1 && (
                <Button variant="outline" size="sm" onClick={removeServico}>− Remover último</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── TAB: Manejo ──────────────────────────────────────────────────────────────

interface TabManejoProps {
  parametros: Parametros
  onParamChange: <K extends keyof Parametros>(key: K, value: Parametros[K]) => void
}

function TabManejo({ parametros, onParamChange }: TabManejoProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Secagem</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <PeriodoSecoField value={parametros.periodoSeco} onChange={v => onParamChange('periodoSeco', v)} />
            <ParametroField
              label="Declínio de produção"
              term="DECLINIO_PRODUCAO"
              value={parametros.declinioProdMensal}
              onChange={v => onParamChange('declinioProdMensal', v)}
              unidade="L/mês"
              step={0.1}
              min={0}
            />
            <ParametroField
              label="Limite produção para secagem"
              term="LIMITE_SECAGEM"
              value={parametros.limiteProducaoSecagem}
              onChange={v => onParamChange('limiteProducaoSecagem', v)}
              unidade="kg/d"
              step={0.5}
              min={0}
            />
            <DataField
              label="Data referência (secagem por produção)"
              value={parametros.dataReferenciaSecagem}
              onChange={d => onParamChange('dataReferenciaSecagem', d)}
            />
            <ParametroField
              label="Fator correção secagem"
              term="FATOR_CORRECAO_SECAGEM"
              value={parametros.fatorCorrecaoSecagem}
              onChange={v => onParamChange('fatorCorrecaoSecagem', v)}
              unidade="× VL"
              step={0.0001}
              min={0}
              max={0.05}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Produção de leite</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <ParametroField
              label="Meta de produção"
              term="META_PRODUCAO"
              value={parametros.metaProducaoLDia}
              onChange={v => onParamChange('metaProducaoLDia', v)}
              unidade="L/vaca/dia"
              step={0.5}
              min={0}
            />
            <ParametroField
              label="Consumo bezerros"
              term="CONSUMO_BEZERROS"
              value={parametros.consumoLeiteBezerros}
              onChange={v => onParamChange('consumoLeiteBezerros', v)}
              unidade="L/dia"
              step={0.5}
              min={0}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Mês 1 da Projeção — Caso especial</CardTitle></CardHeader>
        <CardContent>
          <div className="bg-[var(--color-median)] border border-[var(--color-median-fg)]/30 rounded-md p-3 text-xs text-[var(--color-median-fg)] mb-4">
            O 1° mês projetado reflete o que já ocorreu no período atual. A planilha usa
            valores distintos para este mês (Evolução Rebanho C11 e C12) antes de adotar
            as taxas anuais crônicas dos meses seguintes.
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <ParametroFieldPct
              label="Mortalidade adulta — mês 1 (% a.a.)"
              value={parametros.mortalidadeAdultaAnualMes1}
              onChange={v => onParamChange('mortalidadeAdultaAnualMes1', v)}
            />
            <ParametroFieldPct
              label="Descarte involuntário — mês 1 (% a.a.)"
              value={parametros.descarteInvoluntarioAnualMes1}
              onChange={v => onParamChange('descarteInvoluntarioAnualMes1', v)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Componentes auxiliares ────────────────────────────────────────────────────

function TaxaMensalGrid({
  label, term, data, onChangeMes, onApplyAll,
}: {
  label: string
  term?: 'TS' | 'TC'
  data: TaxaConcepcaoMensal
  onChangeMes: (mes: MesKey, pct100: number) => void
  onApplyAll: (pct100: number) => void
}) {
  const mediaPct = Object.values(data).reduce((a, b) => a + b, 0) / 12 * 100
  const [bulkText, setBulkText] = useState('')

  const applyAll = () => {
    if (bulkText.trim() === '') return
    const raw = bulkText.replace(',', '.')
    const pct = parseFloat(raw)
    if (Number.isNaN(pct)) { setBulkText(''); return }
    const clamped = Math.max(0, Math.min(100, pct))
    onApplyAll(clamped)
    setBulkText('')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
        <p className="text-xs font-medium text-ink-2 flex items-center gap-1.5">
          {label}
          {term && <InfoTooltip term={term} iconSize={11} placement="top" />}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-ink-3">Aplicar a todos os meses:</span>
          <div className="flex items-center bg-surface-pure border border-line rounded-md px-2 py-1 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/30">
            <input
              type="number"
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              onBlur={applyAll}
              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
              placeholder="—"
              min={0} max={100} step={0.1}
              className="w-14 bg-transparent outline-none text-xs font-mono tabular-nums text-ink"
            />
            <span className="text-[11px] text-ink-3 shrink-0">%</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
        {MESES_KEY.map((mes, i) => (
          <ParametroFieldPct
            key={mes}
            label={MESES_LABEL[i]}
            value={data[mes] ?? 0}
            onChange={pct => onChangeMes(mes, pct * 100)}
          />
        ))}
      </div>
      <p className="text-[11px] text-ink-4 mt-1.5 font-mono tabular-nums">
        Média anual: {mediaPct.toFixed(1).replace('.', ',')}%
      </p>
    </div>
  )
}

const MES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function MesInicioProjecaoField({
  value, fallback, onChange,
}: {
  value: string | undefined
  fallback: Date
  onChange: (v: string) => void
}) {
  // Mês e ano efetivos exibidos (preenche com fallback quando ainda não há valor explícito).
  const efetivo = value && /^\d{4}-\d{2}$/.test(value)
    ? { ano: Number(value.slice(0, 4)), mes: Number(value.slice(5, 7)) }
    : { ano: fallback.getFullYear(), mes: fallback.getMonth() + 1 }

  const anoBase = new Date().getFullYear()
  const anos = [anoBase - 1, anoBase, anoBase + 1, anoBase + 2, anoBase + 3, anoBase + 4]
  if (!anos.includes(efetivo.ano)) anos.push(efetivo.ano)
  anos.sort((a, b) => a - b)

  const emit = (mes: number, ano: number) => {
    onChange(`${ano}-${String(mes).padStart(2, '0')}`)
  }

  const selectCls = "bg-surface-pure border border-line rounded-md px-2 py-1.5 text-sm text-ink font-mono tabular-nums outline-none focus:border-brand focus:ring-1 focus:ring-brand/30"

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-ink-2">
        Mês de início da projeção
      </label>
      <div className="flex items-center gap-2">
        <select
          aria-label="Mês"
          value={efetivo.mes}
          onChange={e => emit(parseInt(e.target.value), efetivo.ano)}
          className={selectCls}
        >
          {MES_NOMES.map((nome, i) => (
            <option key={i + 1} value={i + 1}>{nome}</option>
          ))}
        </select>
        <select
          aria-label="Ano"
          value={efetivo.ano}
          onChange={e => emit(efetivo.mes, parseInt(e.target.value))}
          className={selectCls}
        >
          {anos.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
    </div>
  )
}

function PevField({ value, onChange }: { value: 30 | 60; onChange: (v: 30 | 60) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-ink-2 flex items-center gap-1.5">
        PEV (período de espera) <InfoTooltip term="PEV" iconSize={11} placement="top" />
      </label>
      <select
        value={value}
        onChange={e => onChange(parseInt(e.target.value) as 30 | 60)}
        className="bg-surface-pure border border-line rounded-md px-3 py-2 text-sm text-ink font-mono tabular-nums outline-none focus:border-brand focus:ring-1 focus:ring-brand/30"
      >
        <option value={30}>30 dias</option>
        <option value={60}>60 dias</option>
      </select>
    </div>
  )
}

function IdadeAoPartoField({
  value, onChange,
}: { value: 24 | 26 | 28 | 30 | 32 | 36; onChange: (v: 24 | 26 | 28 | 30 | 32 | 36) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-ink-2 flex items-center gap-1.5">
        Idade ao 1° parto <InfoTooltip term="IDADE_AO_PARTO" iconSize={11} placement="top" />
      </label>
      <select
        value={value}
        onChange={e => onChange(parseInt(e.target.value) as 24 | 26 | 28 | 30 | 32 | 36)}
        className="bg-surface-pure border border-line rounded-md px-3 py-2 text-sm text-ink font-mono tabular-nums outline-none focus:border-brand focus:ring-1 focus:ring-brand/30"
      >
        {([24, 26, 28, 30, 32, 36] as const).map(v => (
          <option key={v} value={v}>{v} meses</option>
        ))}
      </select>
    </div>
  )
}

function PeriodoSecoField({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-ink-2 flex items-center gap-1.5">
        Período seco <InfoTooltip term="PERIODO_SECO" iconSize={11} placement="top" />
      </label>
      <select
        value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="bg-surface-pure border border-line rounded-md px-3 py-2 text-sm text-ink font-mono tabular-nums outline-none focus:border-brand focus:ring-1 focus:ring-brand/30"
      >
        {[30, 45, 60, 75, 90].map(v => (
          <option key={v} value={v}>{v} dias</option>
        ))}
      </select>
    </div>
  )
}

function DataField({
  label, value, onChange,
}: { label: string; value: Date | undefined; onChange: (d: Date | undefined) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-ink-2">{label}</label>
      <input
        type="date"
        value={value ? new Date(value).toISOString().slice(0, 10) : ''}
        onChange={e => onChange(e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined)}
        className="bg-surface-pure border border-line rounded-md px-3 py-2 text-sm text-ink font-mono tabular-nums outline-none focus:border-brand focus:ring-1 focus:ring-brand/30"
      />
    </div>
  )
}

// ─── Tabela de previsão de liberação de novilhas (preservada da versão anterior) ──

function TabelaLiberacaoNovilhas({
  fazenda, estado, parametros, onParamChange,
}: {
  fazenda: Fazenda
  estado: EstadoAtualRebanho
  parametros: Parametros
  onParamChange: <K extends keyof Parametros>(key: K, value: Parametros[K]) => void
}) {
  const calculado = useMemo<number[]>(() => {
    if (!fazenda.rebanhoAtual) return Array(11).fill(0)
    return preverLiberacaoNovilhas(fazenda.rebanhoAtual, estado, parametros)
  }, [fazenda.rebanhoAtual, estado, parametros])

  const override = parametros.liberacaoNovilhasOverride ?? {}

  const setOverride = (idx: number, valor: number | null) => {
    const novo = { ...override }
    if (valor === null || Number.isNaN(valor)) delete novo[idx]
    else novo[idx] = Math.max(0, Math.round(valor))
    onParamChange('liberacaoNovilhasOverride', novo)
  }

  const resetarTodos = () => onParamChange('liberacaoNovilhasOverride', {})
  const temOverrides = Object.keys(override).length > 0

  if (!fazenda.rebanhoAtual) {
    return (
      <div className="text-xs text-ink-4 border border-dashed border-line rounded-md p-3">
        Suba o relatório de animais em crescimento para ver a previsão de liberação.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-3">
          Calculado a partir do CSV + idade à liberação. Edite o "valor usado" se quiser sobrescrever.
        </p>
        {temOverrides && (
          <Button variant="ghost" size="sm" onClick={resetarTodos}>
            <RotateCcw className="h-3 w-3 mr-1" /> Resetar todos
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-ink-3">
            <tr>
              <th className="text-left py-1 pr-2">Quando</th>
              {Array.from({ length: 11 }, (_, i) => (
                <th key={i} className="text-center py-1 px-1 font-mono">+{(i + 1) * 30}d</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-line">
              <td className="py-1 pr-2 text-ink-3">Motor</td>
              {calculado.map((v, i) => (
                <td key={i} className="text-center py-1 px-1 text-ink-3 font-mono tabular-nums">{v}</td>
              ))}
            </tr>
            <tr className="border-t border-line">
              <td className="py-1 pr-2 font-medium text-ink-2">Usado</td>
              {calculado.map((c, i) => {
                const v = override[i] ?? c
                const editado = override[i] !== undefined
                return (
                  <td key={i} className="text-center py-1 px-1">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={v}
                      onChange={e => {
                        const novo = parseInt(e.target.value, 10)
                        if (novo === c) setOverride(i, null)
                        else setOverride(i, novo)
                      }}
                      className={`w-12 text-center font-mono tabular-nums rounded border outline-none ${
                        editado
                          ? 'border-status-warn bg-[var(--color-median)] font-semibold text-[var(--color-median-fg)]'
                          : 'border-line bg-surface-pure text-ink'
                      }`}
                      title={editado ? `Editado (motor calculou ${c})` : ''}
                    />
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {temOverrides && (
        <p className="text-xs text-[var(--color-median-fg)] bg-[var(--color-median)] px-2 py-1 rounded">
          {Object.keys(override).length} mês(es) com override manual ativo.
        </p>
      )}
    </div>
  )
}

// Re-export for compat
export { DEFAULT_PARAMETROS }
