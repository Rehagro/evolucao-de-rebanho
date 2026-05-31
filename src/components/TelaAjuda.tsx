import { useEffect, useMemo, useState } from 'react'
import { clsx } from 'clsx'
import {
  HelpCircle, Search, ChevronDown, MessageCircle, SlidersHorizontal, Settings2, CircleCheck,
} from 'lucide-react'
import { Tag } from './ui/Tag'
import {
  FAQ, CAMINHO_META, TAGS_CANONICAS, type FaqCaminho, type FaqPergunta,
} from '@/lib/faqData'

/** Texto pesquisável de uma pergunta (pergunta + corpo + tags). */
function blobDe(p: FaqPergunta): string {
  return [p.pergunta, p.respostaCurta, p.mecanica, ...p.oQueChecar, ...p.tags]
    .join(' ')
    .toLowerCase()
}

interface SecaoAgrupada {
  secao: string
  itens: FaqPergunta[]
}

/** Agrupa por seção preservando a ordem de aparição em FAQ. */
function agruparPorSecao(itens: FaqPergunta[]): SecaoAgrupada[] {
  const grupos: SecaoAgrupada[] = []
  for (const item of itens) {
    let g = grupos.find(x => x.secao === item.secao)
    if (!g) {
      g = { secao: item.secao, itens: [] }
      grupos.push(g)
    }
    g.itens.push(item)
  }
  return grupos
}

export function TelaAjuda() {
  const [caminho, setCaminho] = useState<FaqCaminho>('justificativa')
  const [termo, setTermo] = useState('')
  const [abertas, setAbertas] = useState<Set<string>>(new Set())

  const termoLimpo = termo.trim().toLowerCase()

  // Quando há busca, varre os dois caminhos; senão, filtra pelo caminho ativo.
  const visiveis = useMemo(() => {
    if (termoLimpo) return FAQ.filter(p => blobDe(p).includes(termoLimpo))
    return FAQ.filter(p => p.caminho === caminho)
  }, [termoLimpo, caminho])

  const grupos = useMemo(() => agruparPorSecao(visiveis), [visiveis])

  // Abre a primeira pergunta visível como amostra; reseta ao navegar/buscar.
  useEffect(() => {
    setAbertas(visiveis.length ? new Set([visiveis[0].id]) : new Set())
  }, [caminho, termoLimpo]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: string) =>
    setAbertas(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div>
        <p className="text-[11px] font-mono uppercase tracking-wider text-brand mb-1.5">
          Ajuda
        </p>
        <h1 className="font-display text-[30px] leading-tight text-ink flex items-center gap-2.5">
          <HelpCircle size={26} className="text-brand shrink-0" />
          Perguntas frequentes
        </h1>
        <p className="text-sm text-ink-3 mt-2">
          Entenda o que cada campo faz e como justificar o que o gráfico mostra.
        </p>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
        <input
          type="text"
          value={termo}
          onChange={e => setTermo(e.target.value)}
          placeholder="Buscar: secagem, prenhez, vacas em lactação..."
          aria-label="Buscar nas perguntas frequentes"
          className="w-full h-11 pl-11 pr-4 rounded-lg border border-line bg-surface-pure text-sm text-ink placeholder:text-ink-4 outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
        />
      </div>

      {/* Dois caminhos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(['justificativa', 'preenchimento'] as FaqCaminho[]).map(c => {
          const meta = CAMINHO_META[c]
          const ativo = !termoLimpo && caminho === c
          const Icone = c === 'justificativa' ? MessageCircle : SlidersHorizontal
          return (
            <button
              key={c}
              type="button"
              onClick={() => { setCaminho(c); setTermo('') }}
              aria-pressed={ativo}
              className={clsx(
                'text-left p-4 rounded-xl bg-white transition-colors',
                ativo
                  ? 'border-2 border-brand'
                  : 'border border-line hover:border-brand-soft',
              )}
            >
              <Icone size={20} className={ativo ? 'text-brand' : 'text-ink-3'} />
              <div className="text-[15px] font-semibold text-ink mt-2">{meta.titulo}</div>
              <div className="text-[12.5px] text-ink-3 mt-1 leading-snug">{meta.descricao}</div>
            </button>
          )
        })}
      </div>

      {/* Atalhos de tags */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11.5px] text-ink-3 mr-1">Atalhos:</span>
        {TAGS_CANONICAS.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTermo(t)}
            className="rounded-full bg-surface-inset text-ink-2 hover:text-ink hover:bg-surface-2 text-[12px] font-medium px-3 py-1 transition-colors"
          >
            #{t}
          </button>
        ))}
      </div>

      {/* Rótulo da seção / contexto */}
      <div className="text-[12px] font-mono uppercase tracking-wider text-ink-3 pt-1">
        {termoLimpo
          ? `Resultados para "${termo.trim()}" · ${visiveis.length} ${visiveis.length === 1 ? 'pergunta' : 'perguntas'}`
          : CAMINHO_META[caminho].sublabel}
      </div>

      {/* Lista */}
      {visiveis.length === 0 ? (
        <div className="text-sm text-ink-3 py-8 text-center">
          Nenhuma pergunta encontrada para <span className="text-ink">"{termo.trim()}"</span>.
        </div>
      ) : (
        <div className="space-y-7">
          {grupos.map(grupo => (
            <section key={grupo.secao} className="space-y-2.5">
              <h2 className="text-[12.5px] font-semibold text-ink-2">{grupo.secao}</h2>
              <div className="space-y-2.5">
                {grupo.itens.map(p => (
                  <PerguntaCard
                    key={p.id}
                    pergunta={p}
                    aberta={abertas.has(p.id)}
                    onToggle={() => toggle(p.id)}
                    onTag={t => setTermo(t)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

interface CardProps {
  pergunta: FaqPergunta
  aberta: boolean
  onToggle: () => void
  onTag: (slug: string) => void
}

function PerguntaCard({ pergunta: p, aberta, onToggle, onTag }: CardProps) {
  const bodyId = `faq-body-${p.id}`
  return (
    <div className={clsx('rounded-xl bg-white border', aberta ? 'border-brand-soft' : 'border-line')}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={aberta}
        aria-controls={bodyId}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className="text-[14.5px] font-medium text-ink flex-1">{p.pergunta}</span>
        <ChevronDown
          size={18}
          className={clsx('text-ink-3 shrink-0 transition-transform', aberta && 'rotate-180 text-brand')}
        />
      </button>

      {aberta && (
        <div id={bodyId} className="px-4 pb-4 space-y-4">
          {/* Bloco 1 — resposta curta (para falar ao produtor) */}
          <div className="rounded-md bg-brand-tint-2 border-l-[3px] border-brand px-4 py-3">
            <div className="text-[10.5px] font-semibold uppercase tracking-wide text-brand mb-1">
              Resposta curta — para falar ao produtor
            </div>
            <div className="text-[13.5px] text-ink leading-relaxed">{p.respostaCurta}</div>
          </div>

          {/* Bloco 2 — mecânica */}
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-2 mb-1.5">
              <Settings2 size={13} className="text-ink-3" />
              Por que acontece
            </div>
            <p className="text-[13px] text-ink-2 leading-relaxed">{p.mecanica}</p>
          </div>

          {/* Bloco 3 — o que checar */}
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-2 mb-1.5">
              <CircleCheck size={13} className="text-ink-3" />
              O que checar na ferramenta
            </div>
            <ul className="space-y-1.5">
              {p.oQueChecar.map((item, i) => (
                <li key={i} className="flex gap-2 text-[13px] text-ink-2 leading-relaxed">
                  <span className="text-ink-4 mt-1.5 text-[7px] shrink-0">●</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {p.tags.map(t => (
              <button key={t} type="button" onClick={() => onTag(t)} aria-label={`Filtrar por ${t}`}>
                <Tag kind="brand">#{t}</Tag>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
