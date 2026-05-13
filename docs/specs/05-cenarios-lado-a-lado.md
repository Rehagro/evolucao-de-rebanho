# Spec — Onda 5: Cenários lado a lado

> **Onda 5 do ROADMAP.md.** Implementa o comparativo A vs B como visualização pura (snapshots fixos), sem edição inline. Toda edição acontece nas telas normais (sidebar + Tela Parâmetros); o envio é via DraftFAB que a Onda 1 deixou como stub.
>
> **Pré-requisitos:** Ondas 1, 2 e 4 concluídas. Ler `CLAUDE.md`, `docs/DESIGN_SYSTEM.md`, `docs/UX_PRINCIPLES.md`.

---

## 0. Resumo executivo

**O que entrega:**
1. Tipos novos: `CenarioSnapshot`, `Fazenda.cenarioA`, `Fazenda.cenarioB`
2. Persistência: snapshots salvos no localStorage da fazenda
3. Substituição do **stub** do botão "Enviar para comparativo" no `DraftFAB` (Onda 1) por implementação real
4. Componente de escolha **A ou B** (popover/modal disparado pelo botão)
5. Reescrita da `TelaCenarios.tsx`: dois painéis lado a lado **só com o gráfico**
6. Filtros (horizonte, categorias) **sincronizados** entre A e B
7. Cabeçalho de cada painel com timestamp e botão "Limpar"
8. Botão "Promover B → A" no topo
9. Estado vazio quando nenhum cenário foi enviado

**O que NÃO entrega:**
- Edição dos cenários inline na tela (snapshots são imutáveis — pra mudar, reenviar do rascunho)
- KPIs ou tabela na tela de Cenários
- Sidebar de Indicadores na tela de Cenários
- Diff de parâmetros entre A e B (pode entrar como melhoria depois)

**Critério geral:** o técnico edita parâmetros no Dashboard ou na Tela Parâmetros, clica "Enviar para comparativo" no DraftFAB, escolhe A ou B, e a aba Cenários passa a mostrar os dois gráficos lado a lado com filtros sincronizados.

---

## 1. Sequência de execução

```
Fase 1 — Tipos e storage (CenarioSnapshot, persistência)
   ↓
Fase 2 — Substituir stub do DraftFAB pelo envio real
   ↓
Fase 3 — Componente EscolhaSlot (popover A/B)
   ↓
Fase 4 — Reescrita da TelaCenarios (layout dual)
   ↓
Fase 5 — Painel individual (CenarioPainel com gráfico)
   ↓
Fase 6 — Filtros sincronizados
   ↓
Fase 7 — Ação "Promover B → A"
   ↓
Fase 8 — Estado vazio + edge cases
   ↓
Fase 9 — Validação final
```

---

## 2. Fase 1 — Tipos e storage

### Objetivo
Definir o `CenarioSnapshot` e adicionar campos no tipo `Fazenda`.

### Arquivos afetados
- `app/src/types/index.ts`
- `app/src/lib/storage.ts`
- `app/src/lib/defaults.ts` — adicionar `cenarioA: null`, `cenarioB: null` em `DEFAULT_FAZENDA` (se existir)

### Implementação

**`types/index.ts`** — adicionar:
```typescript
export interface CenarioSnapshot {
  // Snapshot fixo enviado do rascunho
  parametros: Parametros
  estadoAtual: EstadoAtualRebanho
  dataEnvio: string          // ISO timestamp
  nome?: string              // opcional, pode ser auto-gerado
}

export interface Fazenda {
  // ...campos existentes
  cenarioA?: CenarioSnapshot | null
  cenarioB?: CenarioSnapshot | null
}
```

**Verificar campo `cenarioB` existente** — pelo `DashboardFazenda.tsx`, já tem `f.cenarioB` em uso. Confirmar se o tipo bate; se não, harmonizar.

**`lib/storage.ts`** — adicionar funções:
```typescript
export function saveCenario(fazendaId: string, slot: 'A' | 'B', snapshot: CenarioSnapshot): void {
  const f = getFazenda(fazendaId)
  if (!f) return
  const key = slot === 'A' ? 'cenarioA' : 'cenarioB'
  saveFazenda({ ...f, [key]: snapshot })
}

export function clearCenario(fazendaId: string, slot: 'A' | 'B'): void {
  const f = getFazenda(fazendaId)
  if (!f) return
  const key = slot === 'A' ? 'cenarioA' : 'cenarioB'
  saveFazenda({ ...f, [key]: null })
}

export function promoverBparaA(fazendaId: string): void {
  const f = getFazenda(fazendaId)
  if (!f || !f.cenarioB) return
  saveFazenda({ ...f, cenarioA: f.cenarioB })
  // cenarioB permanece intacto
}
```

**Compatibilidade retroativa:** fazendas antigas sem `cenarioA/B` no localStorage continuam funcionando — campos opcionais com `?`.

### Critério de aceite
- `npx tsc --noEmit` exit 0
- `saveCenario`, `clearCenario`, `promoverBparaA` testados manualmente via console
- Fazendas existentes carregam sem erro

---

## 3. Fase 2 — Substituir stub do DraftFAB

### Objetivo
Trocar o `console.log` da Onda 1 pela implementação real de envio.

### Arquivos afetados
- `app/src/pages/DashboardFazenda.tsx`
- `app/src/components/ui/DraftFAB.tsx` — refinar interface se necessário

### Implementação

**Na `DashboardFazenda`:**

```tsx
const enviarParaComparativo = (slot: 'A' | 'B') => {
  const snapshot: CenarioSnapshot = {
    parametros: parametrosRascunho ?? fazenda.parametros,
    estadoAtual: estadoRascunho ?? fazenda.estadoAtual,
    dataEnvio: new Date().toISOString(),
  }
  saveCenario(fazendaId, slot, snapshot)
  setFazenda(getFazenda(fazendaId))  // refresh
  // Rascunho NÃO é descartado — persiste (conforme UX_PRINCIPLES §2.5.2)
  // Sem redirect — Cenários fica como aba normal (§2.5.3)
}
```

**No `DraftFAB`:** o botão "Enviar para comparativo" abre o componente `<EscolhaSlot>` (Fase 3). Por enquanto, refatorar a prop:

```tsx
interface Props {
  visible: boolean
  cenarios: { A: boolean; B: boolean }  // se cada slot está ocupado
  onSalvar: () => void
  onEnviarSlot: (slot: 'A' | 'B') => void
  onDescartar: () => void
}
```

### Critério de aceite
- Mexer em campo → DraftFAB aparece
- Clicar "Enviar p/ comparativo" → mostra opções A e B
- Escolher slot → snapshot é gravado
- Rascunho permanece (DraftFAB continua visível)
- Voltar à aba Cenários — snapshot lá

---

## 4. Fase 3 — Componente EscolhaSlot

### Objetivo
Popover/modal pequeno que aparece quando o usuário clica "Enviar para comparativo". Mostra opções A e B com info do que está ocupado.

### Arquivos afetados
- `app/src/components/ui/EscolhaSlot.tsx` — novo

### Implementação

```tsx
import type { CenarioSnapshot } from '@/types'

interface Props {
  open: boolean
  cenarioA?: CenarioSnapshot | null
  cenarioB?: CenarioSnapshot | null
  onEscolher: (slot: 'A' | 'B') => void
  onCancelar: () => void
}

function fmtData(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function EscolhaSlot({ open, cenarioA, cenarioB, onEscolher, onCancelar }: Props) {
  if (!open) return null

  return (
    <div className="absolute bottom-full right-0 mb-2 bg-surface-pure border border-line rounded-md shadow-lg p-3 w-64 z-50">
      <p className="text-xs text-ink-3 mb-2">Enviar rascunho como:</p>
      <button
        onClick={() => onEscolher('A')}
        className="w-full text-left p-2.5 rounded-md hover:bg-surface-2 group"
      >
        <div className="flex items-center justify-between">
          <span className="font-medium text-ink">Cenário A</span>
          {cenarioA && <span className="text-xs text-status-warn">substituir</span>}
        </div>
        {cenarioA && (
          <p className="text-xs text-ink-4 mt-1">atual: {fmtData(cenarioA.dataEnvio)}</p>
        )}
      </button>
      <button
        onClick={() => onEscolher('B')}
        className="w-full text-left p-2.5 rounded-md hover:bg-surface-2 mt-1"
      >
        <div className="flex items-center justify-between">
          <span className="font-medium text-ink">Cenário B</span>
          {cenarioB && <span className="text-xs text-status-warn">substituir</span>}
        </div>
        {cenarioB && (
          <p className="text-xs text-ink-4 mt-1">atual: {fmtData(cenarioB.dataEnvio)}</p>
        )}
      </button>
      <button
        onClick={onCancelar}
        className="w-full text-xs text-ink-4 mt-2 hover:text-ink"
      >
        Cancelar
      </button>
    </div>
  )
}
```

### Critério de aceite
- Popover aparece sobre o DraftFAB ao clicar "Enviar p/ comparativo"
- Mostra status A e B (vazio ou ocupado com timestamp)
- Escolher slot dispara `onEscolher` e fecha popover
- Cancelar fecha sem alterar nada

---

## 5. Fase 4 — Reescrita da TelaCenarios

### Objetivo
Substituir o placeholder atual (`TelaCenarios.tsx` com mensagem "em desenvolvimento") pela tela real.

### Arquivos afetados
- `app/src/components/TelaCenarios.tsx` — reescrita completa

### Implementação (esqueleto)

```tsx
import { useState } from 'react'
import { Button } from './ui/Button'
import { Card, CardContent } from './ui/Card'
import { CenarioPainel } from './ui/CenarioPainel'
import { calcularProjecao } from '@/engine/projecao'
import { clearCenario, promoverBparaA } from '@/lib/storage'
import type { Fazenda } from '@/types'

interface Props {
  fazenda: Fazenda
  onSalvar: (f: Fazenda) => void   // pra refresh após operações
}

export function TelaCenarios({ fazenda, onSalvar }: Props) {
  // Filtros sincronizados
  const [horizonte, setHorizonte] = useState(24)
  const [categorias, setCategorias] = useState<Set<string>>(
    new Set(['vacasLactacao', 'vacasSecas', 'bezerras0_12m', 'novilhas12_24m', 'novilhasPrenhas'])
  )

  const dataRef = fazenda.dataUltimoUpload ? new Date(fazenda.dataUltimoUpload) : new Date()

  // Recalcular projeção para cada cenário (em useMemo pra cachear)
  const projecaoA = useMemo(() => {
    if (!fazenda.cenarioA) return null
    return calcularProjecao(fazenda.cenarioA.parametros, fazenda.cenarioA.estadoAtual, fazenda.rebanhoAtual, dataRef)
  }, [fazenda.cenarioA, fazenda.rebanhoAtual])

  const projecaoB = useMemo(() => {
    if (!fazenda.cenarioB) return null
    return calcularProjecao(fazenda.cenarioB.parametros, fazenda.cenarioB.estadoAtual, fazenda.rebanhoAtual, dataRef)
  }, [fazenda.cenarioB, fazenda.rebanhoAtual])

  const semCenarios = !fazenda.cenarioA && !fazenda.cenarioB

  if (semCenarios) {
    return <CenariosVazio />
  }

  const handlePromover = () => {
    if (confirm('Substituir Cenário A com snapshot atual de B?')) {
      promoverBparaA(fazenda.id)
      onSalvar(/* refresh */)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header com filtros sincronizados */}
      <div className="flex items-center justify-between">
        <FiltrosSincronizados
          horizonte={horizonte} setHorizonte={setHorizonte}
          categorias={categorias} setCategorias={setCategorias}
        />
        {fazenda.cenarioA && fazenda.cenarioB && (
          <Button variant="outline" size="sm" onClick={handlePromover}>
            Promover B → A
          </Button>
        )}
      </div>

      {/* Painéis lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CenarioPainel
          slot="A"
          snapshot={fazenda.cenarioA}
          projecao={projecaoA}
          horizonte={horizonte}
          categorias={categorias}
          onLimpar={() => {
            if (confirm('Limpar Cenário A?')) {
              clearCenario(fazenda.id, 'A')
              onSalvar(/* refresh */)
            }
          }}
        />
        <CenarioPainel
          slot="B"
          snapshot={fazenda.cenarioB}
          projecao={projecaoB}
          horizonte={horizonte}
          categorias={categorias}
          onLimpar={() => {
            if (confirm('Limpar Cenário B?')) {
              clearCenario(fazenda.id, 'B')
              onSalvar(/* refresh */)
            }
          }}
        />
      </div>
    </div>
  )
}

function CenariosVazio() {
  return (
    <Card>
      <CardContent className="py-16 text-center">
        <p className="text-sm text-ink-3">
          Envie um rascunho do Dashboard para comparar cenários lado a lado.
        </p>
        <p className="text-xs text-ink-4 mt-2">
          No Dashboard ou na Tela Parâmetros, mexa em parâmetros e use o botão flutuante "Enviar para comparativo".
        </p>
      </CardContent>
    </Card>
  )
}
```

### Critério de aceite
- Sem cenários: mostra estado vazio explicando como enviar
- Com 1 cenário: mostra só o painel correspondente (outro slot vazio com placeholder)
- Com 2 cenários: mostra os dois lado a lado
- Filtros sincronizados afetam os dois painéis
- "Promover B → A" só aparece quando ambos preenchidos

---

## 6. Fase 5 — Painel individual (CenarioPainel)

### Objetivo
Componente que renderiza um cenário: header com info + gráfico.

### Arquivos afetados
- `app/src/components/ui/CenarioPainel.tsx` — novo

### Implementação

```tsx
import type { CenarioSnapshot, ResultadoProjecao } from '@/types'
import { Card, CardContent } from './Card'
import { Button } from './Button'
import { GraficoCenario } from './GraficoCenario'   // ver Fase 5b

interface Props {
  slot: 'A' | 'B'
  snapshot?: CenarioSnapshot | null
  projecao?: ResultadoProjecao | null
  horizonte: number
  categorias: Set<string>
  onLimpar: () => void
}

function fmtData(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function CenarioPainel({ slot, snapshot, projecao, horizonte, categorias, onLimpar }: Props) {
  if (!snapshot) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <p className="text-xs uppercase tracking-wider text-ink-3">Cenário {slot}</p>
          <p className="text-sm text-ink-4 mt-2">Vazio. Envie um rascunho para este slot.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center justify-between p-4 border-b border-line">
        <div>
          <p className="text-xs uppercase tracking-wider text-brand font-mono">Cenário {slot}</p>
          <p className="text-xs text-ink-3 mt-0.5">Enviado em {fmtData(snapshot.dataEnvio)}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onLimpar}>
          Limpar
        </Button>
      </div>
      <CardContent>
        {projecao && (
          <GraficoCenario
            projecao={projecao}
            horizonte={horizonte}
            categorias={categorias}
          />
        )}
      </CardContent>
    </Card>
  )
}
```

### Fase 5b — Componente GraficoCenario

Pode ser uma **versão simplificada do GraficoRebanho** (sem Descarte Mensal editável, sem Aquisições e Vendas) — só o gráfico de barras + labels de mês.

**Recomendação:** começar reutilizando o `GroupedBarChart` do protótipo (visto em `charts.jsx`) ou simplificar o atual `GraficoRebanho` em modo "read-only".

Decidir durante execução qual abordagem dá menos retrabalho.

### Critério de aceite
- Painel vazio: card com borda tracejada, mensagem clara
- Painel preenchido: header com slot + timestamp + botão Limpar; gráfico abaixo
- Gráfico responde aos filtros sincronizados

---

## 7. Fase 6 — Filtros sincronizados

### Objetivo
Um único conjunto de controles no topo da TelaCenarios afeta os dois painéis.

### Implementação

Componente `<FiltrosSincronizados>`:
```tsx
interface Props {
  horizonte: number
  setHorizonte: (n: number) => void
  categorias: Set<string>
  setCategorias: (s: Set<string>) => void
}

export function FiltrosSincronizados({ horizonte, setHorizonte, categorias, setCategorias }: Props) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1 bg-surface-inset rounded-full p-0.5">
        {[12, 24, 36].map(h => (
          <button
            key={h}
            onClick={() => setHorizonte(h)}
            className={[
              'px-3 py-1 text-xs rounded-full',
              horizonte === h ? 'bg-brand text-white' : 'text-ink-3 hover:text-ink',
            ].join(' ')}
          >
            {h}m
          </button>
        ))}
      </div>
      {/* Pílulas de categoria — reutilizar do GraficoRebanho */}
    </div>
  )
}
```

### Critério de aceite
- Mudar horizonte: ambos os painéis atualizam
- Toggle categoria: ambos os painéis ocultam/mostram a barra

---

## 8. Fase 7 — Promover B → A

Já contemplado na Fase 4. **Comportamento:**
- Clicar botão "Promover B → A" no topo
- Confirmação modal: "Substituir Cenário A com snapshot atual de B?"
- Se OK: chama `promoverBparaA(fazendaId)`; A vira cópia de B; B permanece intacto

### Critério de aceite
- Botão só visível quando ambos preenchidos
- Confirmação aparece
- Após promoção: A = snapshot que era B; B continua igual

---

## 9. Fase 8 — Estado vazio e edge cases

### Edge cases a tratar

| Cenário | Esperado |
|---|---|
| Fazenda nunca enviou nada | Estado vazio com instrução de como enviar |
| Só A preenchido | Painel A com gráfico; painel B vazio com placeholder |
| Só B preenchido | Painel B com gráfico; painel A vazio (caso raro — pode acontecer após limpar A) |
| Limpar A: confirmação | Modal nativo `confirm()` ou Modal próprio |
| Limpar B: confirmação | idem |
| Promover B → A: confirmação | idem |
| Fazenda sem `rebanhoAtual` (sem upload) | Estado vazio dizendo "Importe dados primeiro" |
| `cenarioA.parametros` corrompido (campos antigos) | Merge com `DEFAULT_PARAMETROS` antes de calcular — evitar crash |

### Critério de aceite
- Cada cenário acima testado manualmente
- Sem erros de console

---

## 10. Fase 9 — Validação final

### Checks
- [ ] `npm run build` passa
- [ ] `npx tsc --noEmit` exit 0
- [ ] Mexer no Dashboard, enviar pra Cenário A: snapshot grava
- [ ] Mexer mais, enviar pra Cenário B: 2 snapshots
- [ ] Ir pra aba Cenários: 2 painéis lado a lado com gráficos
- [ ] Filtros sincronizados funcionam
- [ ] Limpar A: A fica vazio, B intacto
- [ ] Limpar B: idem
- [ ] Promover B → A: A vira cópia de B
- [ ] Reabrir o app: cenários persistem (estão no localStorage)
- [ ] Fazenda nova/sem cenário: tela mostra empty state
- [ ] Comportamento de outras telas inalterado

---

## 11. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Campos antigos do tipo `Fazenda.cenarioB` (que existe no código atual mas pode ter shape diferente) entrarem em conflito | Auditoria antes da Fase 1; se shape antigo for diferente, migrar ou ignorar |
| Recalcular projeção pra A e B simultaneamente fica lento | `useMemo` com chaves estáveis; calculo é < 100ms por projeção, deve ser aceitável |
| Filtros sincronizados afetam só um painel por dessincronia de estado | Centralizar estado no `TelaCenarios`, passar via props pros painéis (não ter estado interno em cada painel) |
| GraficoCenario duplicar lógica do GraficoRebanho | Refatorar em um componente base se houver overlap; mas só refatorar se valer a pena (avaliar na hora) |
| Modal nativo `confirm()` quebra a estética | Substituir por componente Modal próprio (já existe em `ui/Modal`) |

---

## 12. Como rodar e testar

```powershell
npm run dev
```

Roteiro:
1. Abrir Bela Vista
2. Aba Cenários — empty state ("Envie um rascunho...")
3. Voltar pro Dashboard, mexer na sidebar (ex: mortalidade adulta = 0.10)
4. DraftFAB aparece. Clicar "Enviar p/ comparativo" → escolher A
5. Aba Cenários: painel A com gráfico; painel B placeholder
6. Voltar pro Dashboard, mexer mais (ex: TC vacas média alta)
7. DraftFAB ainda visível. Enviar → escolher B
8. Aba Cenários: A e B lado a lado, diferentes
9. Mudar horizonte 24m → 36m: ambos atualizam
10. Toggle categoria: ambos ocultam
11. Promover B → A: A vira igual ao B
12. Limpar B → B placeholder; A continua
13. Fechar app, reabrir: cenários persistem
