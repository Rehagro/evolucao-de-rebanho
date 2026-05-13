import { useEffect, useState } from 'react'
import { InfoTooltip } from './InfoTooltip'
import type { GlossaryTerm } from '@/lib/glossary'

interface BaseProps {
  label: string
  /** Chave em `lib/glossary.ts` para mostrar tooltip. */
  term?: GlossaryTerm
  unidade?: string
  step?: number
  min?: number
  max?: number
  /** Validação leve — aviso quando valor sai da faixa típica. Não bloqueia. */
  faixaSugerida?: { min: number; max: number }
  /** Tipo de input (default 'number'). */
  type?: 'number' | 'date'
  disabled?: boolean
}

interface NumProps extends BaseProps {
  value: number
  onChange: (v: number) => void
}

/**
 * Campo de parâmetro padrão da TelaParametros.
 *
 * Comportamento de digitação:
 * - O estado externo (`value`) é a verdade. O input tem state local de string
 *   apenas para permitir edição livre (digitar "13" sem o clamp atrapalhar
 *   no estado intermediário "1").
 * - Clamp por `min`/`max` só acontece em onBlur — não a cada keystroke.
 * - Se o usuário apagar tudo e sair do campo, volta para `min` (ou 0).
 */
export function ParametroField({
  label, term, value, onChange, unidade, step = 0.01,
  min, max, faixaSugerida, type = 'number', disabled,
}: NumProps) {
  const [text, setText] = useState<string>(() => formatValue(value, step))

  // Sincroniza string local quando o valor externo muda (ex: outro lugar atualiza)
  useEffect(() => {
    setText(prev => {
      const parsed = parseFloat(prev)
      // Se a string atual já representa o mesmo valor, mantém pra não interromper edição
      if (!Number.isNaN(parsed) && Math.abs(parsed - value) < 1e-9) return prev
      return formatValue(value, step)
    })
  }, [value, step])

  const commit = () => {
    const parsed = parseFloat(text)
    let v = Number.isNaN(parsed) ? (min ?? 0) : parsed
    if (max !== undefined && v > max) v = max
    if (min !== undefined && v < min) v = min
    onChange(v)
    setText(formatValue(v, step))
  }

  const foraFaixa =
    faixaSugerida && (value < faixaSugerida.min || value > faixaSugerida.max)

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-ink-2 leading-tight flex items-center gap-1.5">
        {label}
        {term && <InfoTooltip term={term} iconSize={11} placement="top" />}
      </label>
      <div className={`flex items-center gap-2 bg-surface-pure border rounded-md px-3 py-1.5 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/30 transition-colors ${
        foraFaixa ? 'border-status-warn/50' : 'border-line'
      } ${disabled ? 'opacity-60' : ''}`}>
        <input
          type={type}
          value={text}
          step={step}
          min={min}
          max={max}
          disabled={disabled}
          onChange={e => setText(e.target.value)}
          onBlur={commit}
          onFocus={e => e.target.select()}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur()
            }
          }}
          className="flex-1 bg-transparent outline-none font-mono tabular-nums text-sm text-ink min-w-0"
        />
        {unidade && <span className="text-xs text-ink-3 shrink-0">{unidade}</span>}
      </div>
      {foraFaixa && (
        <p className="text-[11px] text-status-warn">
          Fora da faixa típica ({faixaSugerida.min}–{faixaSugerida.max} {unidade ?? ''})
        </p>
      )}
    </div>
  )
}

function formatValue(v: number, step: number): string {
  if (!Number.isFinite(v)) return ''
  // Ajusta casas decimais conforme o step
  if (step >= 1) return String(Math.round(v))
  if (step >= 0.1) return (Math.round(v * 10) / 10).toString()
  return (Math.round(v * 100) / 100).toString()
}

interface PctProps extends Omit<BaseProps, 'unidade' | 'step' | 'min' | 'max'> {
  /** Valor 0..1 (formato interno). UI converte pra 0..100. */
  value: number
  onChange: (v: number) => void
  faixaSugerida?: { min: number; max: number } // 0–100 já
}

export function ParametroFieldPct({ value, onChange, faixaSugerida, ...rest }: PctProps) {
  return (
    <ParametroField
      {...rest}
      value={+(value * 100).toFixed(2)}
      onChange={v => onChange(v / 100)}
      unidade="%"
      step={0.1}
      min={0}
      max={100}
      faixaSugerida={faixaSugerida}
    />
  )
}
