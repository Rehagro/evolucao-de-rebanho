import { Sliders } from 'lucide-react'
import type { Parametros } from '@/types'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { EnviarComparativoButton } from '@/components/ui/EnviarComparativoButton'
import type { GlossaryTerm } from '@/lib/glossary'

interface PRProps {
  label: string
  value: number
  onChange: (v: number) => void
  suffix?: string
  step?: number
  min?: number
  max?: number
  /** Termo do glossário para tooltip de ajuda. */
  term?: GlossaryTerm
}

function PR({ label, value, onChange, suffix = '%', step = 1, min = 0, max = 100, term }: PRProps) {
  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b border-side-line/60 last:border-b-0">
      <span className="text-[13px] text-side-ink-2 leading-tight flex items-center gap-1.5">
        {label}
        {term && <InfoTooltip term={term} iconSize={12} placement="top" />}
      </span>
      <div className="flex items-center gap-1 shrink-0">
        <input
          type="number"
          className="w-[68px] px-2 py-1 text-right text-[13.5px] font-mono tabular-nums font-semibold text-side-ink bg-side-bg-2 border border-side-line rounded outline-none focus:border-brand focus:bg-side-bg-2/80 focus:ring-1 focus:ring-brand transition-colors"
          step={step}
          min={min}
          max={max}
          value={value}
          onFocus={e => e.target.select()}
          onChange={e => {
            const parsed = parseFloat(e.target.value)
            onChange(isNaN(parsed) ? 0 : parsed)
          }}
        />
        <span className="text-[12px] text-side-ink-3 w-4 text-center">{suffix}</span>
      </div>
    </div>
  )
}

function SH({ title }: { title: string }) {
  return (
    <div className="font-mono text-[11.5px] font-semibold tracking-wider text-side-ink-3 uppercase pt-3.5 pb-1.5">
      {title}
    </div>
  )
}

interface Props {
  params: Parametros
  onChange: (key: keyof Parametros, value: Parametros[keyof Parametros]) => void
  onVerTodos: () => void
  /** Envia snapshot atual da fazenda para slot escolhido. */
  onEnviarSlot: (slot: 'A' | 'B') => void
  cenarioAOcupado: boolean
  cenarioBOcupado: boolean
  cenarioATimestamp?: string | null
  cenarioBTimestamp?: string | null
}

export function SidebarParams({
  params, onChange, onVerTodos,
  onEnviarSlot, cenarioAOcupado, cenarioBOcupado, cenarioATimestamp, cenarioBTimestamp,
}: Props) {
  const pct = (v: number) => +((v * 100).toFixed(1))
  const setPct = (key: keyof Parametros) => (v: number) => onChange(key, v / 100)

  return (
    <aside className="w-[276px] bg-side-bg border-r border-side-line shrink-0 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-side-line flex items-center gap-2 bg-side-bg-2/40">
        <div className="w-7 h-7 rounded-md bg-brand-tint/10 flex items-center justify-center text-brand">
          <Sliders size={15} />
        </div>
        <span className="text-[14px] font-semibold tracking-wide text-side-ink">
          Indicadores
        </span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-5">

        <SH title="Mortalidade" />
        <PR label="0–3 meses"      value={pct(params.mortalidade_0_3m)}    onChange={setPct('mortalidade_0_3m')}    term="MORTALIDADE_JOVEM" />
        <PR label="3–6 meses"      value={pct(params.mortalidade_3_6m)}    onChange={setPct('mortalidade_3_6m')} />
        <PR label="6–9 meses"      value={pct(params.mortalidade_6_9m)}    onChange={setPct('mortalidade_6_9m')} />
        <PR label="9–12 meses"     value={pct(params.mortalidade_9_12m)}   onChange={setPct('mortalidade_9_12m')} />
        <PR label="12–26 meses"    value={pct(params.mortalidade_12_26m)}  onChange={setPct('mortalidade_12_26m')} />
        <PR label="Adulta (anual)" value={pct(params.mortalidadeAdultaAnual)} onChange={setPct('mortalidadeAdultaAnual')} term="MORTALIDADE_ADULTA" />

        <SH title="Descarte" />
        <PR label="Involuntário (anual)"  value={pct(params.descarteInvoluntarioAnual)} onChange={setPct('descarteInvoluntarioAnual')} term="DESCARTE_INV" />
        <PR label="Voluntário VL (anual)" value={pct(params.descarteVoluntarioVL)}      onChange={setPct('descarteVoluntarioVL')}      term="DESCARTE_VOL" />
        <PR label="% saindo 0–8m"         value={pct(params.pctDescarteMorteSaindoLactacao_8meses)} onChange={setPct('pctDescarteMorteSaindoLactacao_8meses')} term="PCT_SAINDO_LACTACAO" />
        <PR label="% saindo 8m+"          value={pct(params.pctDescarteMorteSaindoLactacao_apos8m)} onChange={setPct('pctDescarteMorteSaindoLactacao_apos8m')} />

        <SH title="Idade ao Parto" />
        <PR
          label="Novilhas"
          value={params.idadeAoParto}
          onChange={v => onChange('idadeAoParto', Math.round(v) as typeof params.idadeAoParto)}
          suffix="m"
          step={2}
          min={22}
          max={36}
          term="IDADE_AO_PARTO"
        />

        <SH title="Manejo" />
        <PR label="Aborto/natimortos" value={pct(params.taxaAbortoNatimortos)} onChange={setPct('taxaAbortoNatimortos')} term="ABORTO_NATIMORTO" />
        <PR label="% fêmeas nascidas" value={pct(params.pctFemeasNascidas)}    onChange={setPct('pctFemeasNascidas')} />

        <button
          onClick={onVerTodos}
          className="mt-4 w-full py-2 px-3 rounded-md border border-side-line bg-side-bg-2 text-[13.5px] font-semibold text-side-ink hover:bg-side-bg-2/70 hover:border-brand/50 transition-colors"
        >
          Parâmetros →
        </button>

        <div className="mt-2 [&>div]:w-full [&>div>button]:w-full [&>div>button]:justify-center">
          <EnviarComparativoButton
            onEnviarSlot={onEnviarSlot}
            cenarioAOcupado={cenarioAOcupado}
            cenarioBOcupado={cenarioBOcupado}
            cenarioATimestamp={cenarioATimestamp}
            cenarioBTimestamp={cenarioBTimestamp}
            variant="primary"
            size="sm"
            label="Enviar p/ comparativo"
          />
        </div>
      </div>
    </aside>
  )
}
