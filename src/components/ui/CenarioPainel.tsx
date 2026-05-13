import { useState } from 'react'
import { Trash2, Maximize2 } from 'lucide-react'
import { Card, CardContent } from './Card'
import { Button } from './Button'
import { Modal } from './Modal'
import { GraficoCenarioMini } from './GraficoCenarioMini'
import type { Cenario, ResultadoProjecao } from '@/types'
import type { CategoriaRebanho } from '@/lib/coresCategorias'

interface Props {
  slot: 'A' | 'B'
  snapshot?: Cenario | null
  projecao?: ResultadoProjecao | null
  horizonte: number
  categorias: Set<CategoriaRebanho>
  onLimpar: () => void
}

function fmtData(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function CenarioPainel({ slot, snapshot, projecao, horizonte, categorias, onLimpar }: Props) {
  const [fullscreenOpen, setFullscreenOpen] = useState(false)
  if (!snapshot) {
    return (
      <Card className="border-dashed border-line-2 bg-surface-2/40">
        <CardContent className="py-16 text-center">
          <p className="text-[11px] font-mono uppercase tracking-wider text-ink-4">Cenário {slot}</p>
          <p className="text-sm text-ink-3 mt-2">Vazio</p>
          <p className="text-xs text-ink-4 mt-1 max-w-xs mx-auto">
            Mexa em parâmetros e use o botão <strong>Enviar p/ comparativo</strong> no rascunho.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
    <Card>
      <div className="flex items-center justify-between p-4 border-b border-line">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-brand">
            Cenário {slot} {snapshot.nome && <span className="text-ink-3 normal-case font-sans"> · {snapshot.nome}</span>}
          </p>
          <p className="text-xs text-ink-3 mt-0.5 font-mono tabular-nums">
            Enviado em {fmtData(snapshot.criadoEm)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {projecao && (
            <Button variant="ghost" size="sm" onClick={() => setFullscreenOpen(true)} title="Expandir em tela cheia">
              <Maximize2 size={13} />
              Expandir
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onLimpar}>
            <Trash2 size={13} />
            Limpar
          </Button>
        </div>
      </div>
      <CardContent className="pt-4">
        {projecao ? (
          <GraficoCenarioMini
            projecao={projecao}
            horizonte={horizonte}
            categorias={categorias}
          />
        ) : (
          <p className="text-xs text-ink-4 text-center py-6">
            Projeção indisponível — snapshot pode ter sido salvo sem cálculo.
          </p>
        )}
      </CardContent>
    </Card>

    <Modal
      open={fullscreenOpen}
      onClose={() => setFullscreenOpen(false)}
      size="fullscreen"
      title={`Cenário ${slot}${snapshot.nome ? ` · ${snapshot.nome}` : ''}`}
    >
      {projecao && (
        <GraficoCenarioMini
          projecao={projecao}
          horizonte={horizonte}
          categorias={categorias}
          tall
        />
      )}
    </Modal>
    </>
  )
}
