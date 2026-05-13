# Spec — Onda 3: Upload guiado

> **Onda 3 do ROADMAP.md.** Refaz a `TelaUpload` em fluxo auto-explicativo: 3 slots fixos pra cada relatório Ideagri, nome da fazenda em destaque, instruções claras de campos obrigatórios.
>
> **Pré-requisitos:** Onda 1 concluída. Ler `CLAUDE.md`, `docs/UX_PRINCIPLES.md`, `docs/specs/03-upload-guiado.md`.

---

## ⚠ Pendência crítica antes de executar

Esta spec tem um placeholder importante: **os 3 nomes exatos dos relatórios no Ideagri + campos obrigatórios**. Você precisa preencher antes do Claude Code começar a Fase 2. Veja `RELATORIOS_IDEAGRI` na §3.

Se você executar sem preencher, o app vai funcionar mas com nomes "TODO" visíveis ao usuário.

---

## 0. Resumo executivo

**O que entrega:**
1. Cabeçalho da tela com **nome da fazenda em destaque**
2. **Checklist visual** com 3 slots fixos: Secagem · Agenda de Partos · Animais em Crescimento
3. Cada slot mostra: nome do relatório no Ideagri, lista de campos obrigatórios, status visual
4. Dropzone único que distribui automaticamente nos slots por detecção de tipo
5. Preview enriquecido após sucesso (contagens, badges)
6. Orientação técnica de baixo nível ("encoding latin-1", "ponto-vírgula") movida pra collapse "Detalhes técnicos"
7. Estados claros por slot: vazio / detectado / parseado com sucesso / com erro

**O que NÃO entrega:**
- Mudanças no parser (`csvParser.ts` continua igual)
- Mudanças no que o upload grava no localStorage
- Mudanças em outras telas

**Critério geral:** o técnico abre a tela e em 3 segundos sabe quais arquivos precisa importar, de onde no Ideagri, e o que precisa estar dentro.

---

## 1. Sequência de execução

```
Fase 1 — Constantes de relatórios (lib + i18n)
   ↓
Fase 2 — Preencher dados reais dos 3 relatórios Ideagri  ← REQUER INPUT DO USUÁRIO
   ↓
Fase 3 — Componente UploadSlot (slot individual)
   ↓
Fase 4 — Reescrita do TelaUpload (3 slots fixos)
   ↓
Fase 5 — Preview enriquecido após parse
   ↓
Fase 6 — Collapse "Detalhes técnicos"
   ↓
Fase 7 — Validação final
```

---

## 2. Fase 1 — Constantes de relatórios

### Objetivo
Centralizar metadados dos 3 relatórios num módulo, evitando hardcode espalhado.

### Arquivos afetados
- `app/src/lib/relatoriosIdeagri.ts` — novo

### Implementação

**`src/lib/relatoriosIdeagri.ts`:**
```typescript
export type CSVTipo = 'secagem' | 'agenda' | 'crescimento'

export interface RelatorioIdeagri {
  tipo: CSVTipo
  rotulo: string             // ex: "Secagem"
  nomeIdeagri: string        // ex: "Relatório de Previsão de Secagem" (preencher)
  camposObrigatorios: string[]  // colunas esperadas no CSV
  detectKeywords: string[]   // pra detectar pelo nome do arquivo / conteúdo
  notaExtra?: string         // opcional, ex: "encoding latin-1, separador ;"
}

export const RELATORIOS_IDEAGRI: Record<CSVTipo, RelatorioIdeagri> = {
  secagem: {
    tipo: 'secagem',
    rotulo: 'Secagem',
    nomeIdeagri: '[TODO — confirmar com usuário]',  // ver Fase 2
    camposObrigatorios: [
      'N° Animal',
      'Dt. sec. prev.',
      'Últ. CL',
      'Dt. últ. leite',
      'Sit. Rep.',
    ],
    detectKeywords: ['secag', 'Dt. sec. prev.'],
  },
  agenda: {
    tipo: 'agenda',
    rotulo: 'Agenda de Partos',
    nomeIdeagri: '[TODO — confirmar com usuário]',
    camposObrigatorios: [
      'N° Animal',
      'Parto previsto',
      'Parto simples',
    ],
    detectKeywords: ['agenda', 'parto', 'Parto previsto', 'Parto simples'],
  },
  crescimento: {
    tipo: 'crescimento',
    rotulo: 'Animais em Crescimento',
    nomeIdeagri: '[TODO — confirmar com usuário]',
    camposObrigatorios: [
      'N° Animal',
      'Idade (dias)',
      'Categoria',
    ],
    detectKeywords: ['crescimento', 'animal', 'Idade (dias)'],
  },
}

export const TIPO_ORDER: CSVTipo[] = ['secagem', 'agenda', 'crescimento']
```

### Critério de aceite
- Arquivo existe, tipa corretamente
- Constantes exportadas e importáveis

---

## 3. Fase 2 — Preencher dados reais dos relatórios

### ⚠ Esta fase requer input do usuário

**Pergunta direta:** quais são os nomes exatos no menu do Ideagri pros 3 relatórios, e que campos obrigatórios cada um precisa ter pra o app funcionar?

Sugestão de mensagem a enviar ao usuário antes de começar:

> Antes da Fase 2, preciso de você:
>
> 1. **Relatório de Secagem** — qual é o nome exato no menu do Ideagri? Quais colunas precisam estar marcadas?
> 2. **Agenda de Partos** — qual o nome no menu? Quais colunas?
> 3. **Animais em Crescimento** — qual o nome no menu? Quais colunas?
>
> Sem isso, a tela vai funcionar mas exibir `[TODO]` no lugar dos nomes pro técnico.

Substituir os `[TODO]` em `lib/relatoriosIdeagri.ts` pelos nomes reais.

### Critério de aceite
- Nenhum `[TODO]` em `relatoriosIdeagri.ts`
- Nomes batem com o que o técnico vê no menu do Ideagri

---

## 4. Fase 3 — Componente UploadSlot

### Objetivo
Criar componente reutilizável para cada um dos 3 slots da checklist.

### Arquivos afetados
- `app/src/components/ui/UploadSlot.tsx` — novo

### Implementação

**Estados do slot:**
- `vazio` — aguardando arquivo, mostra nome do relatório + campos obrigatórios
- `detectado` — arquivo arrastado, mostra spinner "Processando..."
- `sucesso` — parse OK, mostra preview enriquecido
- `erro` — parse falhou, mostra qual problema + sugestão

**Visual sugerido:**
```
┌──────────────────────────────────────────────┐
│ ○ Secagem                                    │  ← status dot (cinza/verde/amber/vermelho)
│   Relatório de Previsão de Secagem (Ideagri) │
│   Campos: N° Animal, Dt. sec. prev.,         │
│   Últ. CL, Dt. últ. leite, Sit. Rep.         │
│                                              │
│   [vazio: "Arraste o arquivo aqui"]          │
│   [sucesso: "326 vacas · 3 sem dt sec."]     │
│   [erro: "❌ Coluna 'X' não encontrada"]      │
└──────────────────────────────────────────────┘
```

```tsx
import { CheckCircle, AlertTriangle, FileText, Loader } from 'lucide-react'
import { Badge } from './Badge'
import type { RelatorioIdeagri } from '@/lib/relatoriosIdeagri'

interface Props {
  relatorio: RelatorioIdeagri
  estado: 'vazio' | 'detectado' | 'sucesso' | 'erro'
  nomeArquivo?: string
  resumo?: React.ReactNode  // contagem, badges
  erros?: string[]
  avisos?: string[]
  onRemover?: () => void
}

export function UploadSlot({ relatorio, estado, nomeArquivo, resumo, erros, avisos, onRemover }: Props) {
  const iconePorEstado = {
    vazio: <span className="w-2 h-2 rounded-full bg-ink-4" />,
    detectado: <Loader size={14} className="animate-spin text-brand" />,
    sucesso: <CheckCircle size={16} className="text-status-ok" />,
    erro: <AlertTriangle size={16} className="text-status-bad" />,
  }

  return (
    <div className={[
      'bg-surface border border-line rounded-md p-4 transition-colors',
      estado === 'sucesso' && 'border-status-ok/30',
      estado === 'erro' && 'border-status-bad/30',
    ].filter(Boolean).join(' ')}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{iconePorEstado[estado]}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-ink">{relatorio.rotulo}</div>
          <div className="text-xs text-ink-3 mt-0.5">
            Relatório <span className="font-medium">{relatorio.nomeIdeagri}</span> do Ideagri
          </div>
          <div className="text-xs text-ink-3 mt-1.5">
            Campos: {relatorio.camposObrigatorios.join(', ')}
          </div>

          {nomeArquivo && (
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="muted">
                <FileText size={10} className="mr-1" />
                {nomeArquivo}
              </Badge>
              {onRemover && (
                <button onClick={onRemover} className="text-xs text-ink-4 hover:text-status-bad">
                  remover
                </button>
              )}
            </div>
          )}

          {resumo && <div className="mt-2">{resumo}</div>}

          {erros?.map((e, i) => (
            <p key={i} className="text-xs text-status-bad mt-1.5">{e}</p>
          ))}
          {avisos?.map((a, i) => (
            <p key={i} className="text-xs text-status-warn mt-1.5">{a}</p>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### Critério de aceite
- Componente renderiza corretamente em todos os 4 estados
- Pode ser usado standalone ou na lista de 3 slots

---

## 5. Fase 4 — Reescrita do TelaUpload

### Objetivo
Reorganizar a tela mantendo a lógica de parse atual, mas com o novo layout: nome da fazenda em destaque + 3 slots fixos + dropzone que distribui.

### Arquivos afetados
- `app/src/components/TelaUpload.tsx` — reescrita

### Implementação (esqueleto)

```tsx
import { useState, useRef } from 'react'
import { Upload, CheckCircle } from 'lucide-react'
import { Button } from './ui/Button'
import { UploadSlot } from './ui/UploadSlot'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Badge } from './ui/Badge'
import { parseSecagem, parseAgendaParto, parseCrescimento, summarizeSecagem, summarizeAgenda, summarizeCrescimento } from '@/lib/csvParser'
import { RELATORIOS_IDEAGRI, TIPO_ORDER, type CSVTipo } from '@/lib/relatoriosIdeagri'
import type { Fazenda, VacaSecagem, PartoPrevisto, AnimalCrescimento } from '@/types'

interface Props {
  fazenda: Fazenda
  onSalvar: (f: Fazenda) => void
  onConcluir: () => void
}

interface SlotState {
  estado: 'vazio' | 'detectado' | 'sucesso' | 'erro'
  nomeArquivo?: string
  data?: VacaSecagem[] | PartoPrevisto[] | AnimalCrescimento[]
  erros?: string[]
  avisos?: string[]
}

const SLOT_INICIAL: SlotState = { estado: 'vazio' }

export function TelaUpload({ fazenda, onSalvar, onConcluir }: Props) {
  const [slots, setSlots] = useState<Record<CSVTipo, SlotState>>({
    secagem: SLOT_INICIAL,
    agenda: SLOT_INICIAL,
    crescimento: SLOT_INICIAL,
  })
  const inputRef = useRef<HTMLInputElement>(null)

  // ... detecção, parse, atribuição a slot

  const algumSucesso = Object.values(slots).some(s => s.estado === 'sucesso')

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header com nome da fazenda destacado */}
      <div>
        <p className="text-xs uppercase tracking-wider text-ink-3 mb-1">Importar dados</p>
        <h1 className="font-display text-3xl text-ink">
          Importando para <span className="text-brand">{fazenda.nome}</span>
        </h1>
        <p className="text-sm text-ink-3 mt-2">
          Importe os 3 relatórios do Ideagri abaixo. O arquivo será detectado automaticamente.
        </p>
      </div>

      {/* Dropzone único */}
      <Card>
        <CardContent>
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault()
              if (e.dataTransfer.files.length > 0) processarArquivos(e.dataTransfer.files)
            }}
            className="border-2 border-dashed border-line rounded-md p-8 text-center cursor-pointer hover:border-brand hover:bg-brand-tint-2 transition-colors"
          >
            <Upload size={24} className="text-ink-3 mx-auto mb-2" />
            <p className="text-sm font-medium text-ink">Clique ou arraste os arquivos CSV aqui</p>
            <p className="text-xs text-ink-3 mt-1">
              O sistema detecta automaticamente qual relatório é cada arquivo
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".csv"
              className="hidden"
              onChange={e => e.target.files && processarArquivos(e.target.files)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 3 Slots fixos */}
      <div className="space-y-3">
        {TIPO_ORDER.map(tipo => (
          <UploadSlot
            key={tipo}
            relatorio={RELATORIOS_IDEAGRI[tipo]}
            estado={slots[tipo].estado}
            nomeArquivo={slots[tipo].nomeArquivo}
            resumo={renderResumo(tipo, slots[tipo])}
            erros={slots[tipo].erros}
            avisos={slots[tipo].avisos}
            onRemover={
              slots[tipo].estado !== 'vazio'
                ? () => setSlots(s => ({ ...s, [tipo]: SLOT_INICIAL }))
                : undefined
            }
          />
        ))}
      </div>

      {/* Botão Confirmar + Detalhes técnicos */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMostrarDetalhes(s => !s)}
          className="text-xs text-ink-3 hover:text-ink"
        >
          {mostrarDetalhes ? '▾' : '▸'} Detalhes técnicos
        </button>
        <Button onClick={confirmarImportacao} disabled={!algumSucesso}>
          <CheckCircle size={16} />
          Confirmar importação
        </Button>
      </div>

      {mostrarDetalhes && (
        <div className="text-xs text-ink-4 bg-surface-2 rounded-md p-3 space-y-1">
          <p>Encoding aceito: ISO-8859-1 (latin-1)</p>
          <p>Separador de colunas: ponto-e-vírgula (;)</p>
          <p>Linhas vazias no início são ignoradas</p>
        </div>
      )}
    </div>
  )
}
```

### Critério de aceite
- Nome da fazenda em destaque (font-display) no topo
- 3 slots aparecem **sempre** (mesmo antes de qualquer upload)
- Dropzone aceita 1 ou mais arquivos e distribui corretamente nos slots
- Cada arquivo errado/duplicado mostra erro no slot certo
- Botão "Confirmar importação" só habilita se pelo menos 1 slot tem sucesso
- Caminhos antigos com "encoding latin-1" sumiram da view principal

---

## 6. Fase 5 — Preview enriquecido após parse

### Objetivo
Mostrar resumo útil pra cada arquivo: contagens, badges, alertas de dados faltantes.

### Implementação

Função `renderResumo(tipo, slotState)` no `TelaUpload`:

```tsx
function renderResumo(tipo: CSVTipo, slot: SlotState): React.ReactNode {
  if (slot.estado !== 'sucesso' || !slot.data) return null

  if (tipo === 'secagem') {
    const s = summarizeSecagem(slot.data as VacaSecagem[])
    return (
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="info">{s.total} vacas</Badge>
        {Object.entries(s.porSitRep).map(([k, v]) => (
          <Badge key={k} variant="default">{k}: {v}</Badge>
        ))}
        {s.semDtSecPrev > 0 && (
          <Badge variant="warning">{s.semDtSecPrev} sem data sec.</Badge>
        )}
      </div>
    )
  }

  if (tipo === 'agenda') {
    const s = summarizeAgenda(slot.data as PartoPrevisto[])
    return (
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="info">{s.total} partos</Badge>
        <Badge variant="default">{s.vacas} vacas</Badge>
        <Badge variant="default">{s.novilhas} novilhas</Badge>
        {s.jaOcorridos > 0 && <Badge variant="warning">{s.jaOcorridos} já ocorridos</Badge>}
      </div>
    )
  }

  if (tipo === 'crescimento') {
    const s = summarizeCrescimento(slot.data as AnimalCrescimento[])
    return (
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="info">{s.total} animais</Badge>
        {Object.entries(s.porFaixa).map(([k, v]) => (
          <Badge key={k} variant="default">{k}: {v}</Badge>
        ))}
      </div>
    )
  }

  return null
}
```

Os `summarize*` já existem em `csvParser.ts` — só reutilizar.

### Critério de aceite
- Após upload, cada slot com sucesso mostra resumo
- Resumo está sempre visualmente harmônico (badges, mesma estética)

---

## 7. Fase 6 — Collapse "Detalhes técnicos"

### Objetivo
Esconder por padrão a informação técnica (encoding, separador). Disponível em collapse pra quem precisar.

### Implementação

Já contemplado na Fase 4 (snippet acima). Variável `mostrarDetalhes` controla.

### Critério de aceite
- Por padrão, "Encoding ISO-8859-1" e "separador ;" não aparecem
- Clicando em "Detalhes técnicos" os textos aparecem em um bloco discreto
- Não atrapalha o fluxo principal

---

## 8. Fase 7 — Validação final

### Checks obrigatórios
- [ ] `npm run build` passa
- [ ] `npx tsc --noEmit` exit 0
- [ ] Tela renderiza com nome da fazenda em destaque (display serif)
- [ ] 3 slots aparecem sempre (vazios, com indicação clara de campos obrigatórios)
- [ ] Arrastar um CSV de secagem preenche o slot de Secagem (não os outros)
- [ ] Arrastar um CSV inválido mostra erro no slot adequado
- [ ] Mensagem de erro inclui o nome do campo que faltou (ex: "Coluna `Dt. sec. prev.` não encontrada")
- [ ] Preview com badges aparece após sucesso
- [ ] "Detalhes técnicos" colapsado por padrão
- [ ] Confirmar importação grava no localStorage e leva pro Dashboard
- [ ] Fazendas existentes (com upload anterior) continuam funcionando

---

## 9. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Nomes Ideagri ficam como `[TODO]` na produção | Fase 2 explicitamente bloqueia avanço sem input do usuário |
| `csvParser` retorna `errors` com texto técnico que vaza pra UI | Manter `errors` exibido mas garantir que cada erro tenha mensagem "Coluna X faltando" — UX-friendly |
| Detecção de tipo erra (CSV de agenda detectado como secagem) | Reforçar heurística: tentar nome do arquivo primeiro, conteúdo depois; se ambíguo, deixar usuário escolher manualmente |
| Componente `Badge` da Onda 1 não tem todas as variantes usadas | Conferir; se faltar `info`, `warning`, `muted`, adicionar |

---

## 10. Como rodar e testar

```powershell
npm run dev
```

Roteiro:
1. Criar fazenda nova "Teste Upload"
2. Ir pra aba Upload — conferir nome no display serif
3. Conferir 3 slots: ícones cinza, nomes Ideagri, campos obrigatórios listados
4. Arrastar `Relatorio_previsao_secagem.csv` (de Bela Vista) — vai para slot Secagem
5. Arrastar `agenda de parto.csv` — vai para Agenda
6. Arrastar `Animais crescimento v2.csv` — vai para Crescimento
7. Cada slot fica verde, com badges de resumo
8. Clicar "Confirmar importação"
9. Voltar pro Dashboard — gráfico carregado com dados reais
