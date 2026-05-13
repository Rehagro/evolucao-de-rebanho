import { Check } from 'lucide-react'

export interface StepperStep {
  label: string
  state: 'done' | 'active' | 'todo'
}

interface Props {
  steps: StepperStep[]
  /** Orientação. Default vertical. */
  orientation?: 'vertical' | 'horizontal'
  className?: string
}

/**
 * Stepper para empty states e fluxos guiados (Importar → Conferir → Projetar).
 */
export function Stepper({ steps, orientation = 'vertical', className = '' }: Props) {
  if (orientation === 'horizontal') {
    return (
      <ol className={`flex items-center gap-2 ${className}`}>
        {steps.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            <StepDot state={s.state} index={i + 1} />
            <span className={`text-[13px] ${s.state === 'active' ? 'text-brand font-semibold' : s.state === 'done' ? 'text-ink-3' : 'text-ink-4'}`}>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span className="w-6 h-px border-t border-dashed border-line-2 mx-1" />
            )}
          </li>
        ))}
      </ol>
    )
  }

  return (
    <ol className={`flex flex-col gap-1 ${className}`}>
      {steps.map((s, i) => (
        <li key={i} className="flex items-start gap-3">
          <div className="flex flex-col items-center pt-0.5">
            <StepDot state={s.state} index={i + 1} />
            {i < steps.length - 1 && (
              <span className="w-px h-5 border-l border-dashed border-line-2 mt-1" />
            )}
          </div>
          <span className={`text-[13px] pb-3 ${s.state === 'active' ? 'text-brand font-semibold' : s.state === 'done' ? 'text-ink-3' : 'text-ink-4'}`}>
            {s.label}
          </span>
        </li>
      ))}
    </ol>
  )
}

function StepDot({ state, index }: { state: StepperStep['state']; index: number }) {
  const cls = state === 'done'
    ? 'bg-brand text-surface-pure border-brand'
    : state === 'active'
    ? 'bg-brand-tint text-brand-3 border-brand'
    : 'bg-surface text-ink-4 border-line-2'

  return (
    <span className={`flex items-center justify-center w-6 h-6 rounded-full border text-[11px] font-semibold ${cls}`}>
      {state === 'done' ? <Check size={12} strokeWidth={3} /> : index}
    </span>
  )
}
