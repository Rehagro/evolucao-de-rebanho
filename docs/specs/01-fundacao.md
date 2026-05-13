# Spec — Onda 1: Fundação

> **Onda 1 do ROADMAP.md.** Estabelece o sistema visual unificado e a infraestrutura de rascunho. **Sem mudar comportamentos do motor, sem mudar cores das categorias do gráfico** (essas mudanças são Onda 2).
>
> **Pré-requisitos:** ler `CLAUDE.md`, `docs/DESIGN_SYSTEM.md`, `docs/UX_PRINCIPLES.md`, `docs/GLOSSARY.md`, `docs/ROADMAP.md`.

---

## 0. Resumo executivo

**O que entrega:**
1. Tema Tailwind 4 com paleta Rehagro + 3 fontes Google
2. Logo Rehagro substituindo o `MilkIcon` no header
3. Estado de rascunho único compartilhado entre sidebar e Tela Parâmetros
4. `<DraftFAB>` (Floating Action Bar) com Salvar / Enviar para comparativo / Descartar
5. Migração de `style={{}}` inline → Tailwind/shadcn nos 3 componentes mais sujos (`DashboardFazenda`, `SidebarParams`, `CardsResumo`)
6. Componentes utilitários novos: `InfoTooltip`, `Eyebrow`, `PageHead`, `Stepper`, `HelpBanner`, `KPI`, `Delta`, `Tag`, `Seg`
7. Limpeza do `App.css` (idealmente vazio ou só `@import "tailwindcss"`)

**O que NÃO entrega (fica pra ondas seguintes):**
- 4 KPIs novos no Dashboard (Onda 2)
- Remoção da Tabela Anual entre KPIs e gráfico (Onda 2)
- Cores novas das categorias do gráfico (Onda 2)
- Renomeação da aba "Parâmetros" e mudança da sidebar pra dark (Onda 2)
- Mudanças na `TelaUpload`, `TelaParametros`, `TelaCenarios` (ondas 3, 4, 5)

**Critério geral:** após a Onda 1, o app **continua funcionando exatamente como hoje** — só fica visualmente unificado e com a infraestrutura de rascunho/cenário pronta pra Onda 2 começar.

---

## 1. Sequência de execução

Ordem importa. Cada fase tem entrada estável (a anterior terminou) antes de começar.

```
Fase 1 — Tokens e fontes (config + index.html + index.css)
   ↓
Fase 2 — Logo Rehagro (assets + componente)
   ↓
Fase 3 — Componentes utilitários novos (ui/)
   ↓
Fase 4 — Estado de rascunho + DraftFAB (DashboardFazenda)
   ↓
Fase 5 — Migração SidebarParams (style → tokens)
   ↓
Fase 6 — Migração CardsResumo (style → tokens)
   ↓
Fase 7 — Migração DashboardFazenda (style → tokens + integração DraftFAB)
   ↓
Fase 8 — Limpeza do App.css
   ↓
Fase 9 — Validação final
```

Após cada fase, rodar `npm run dev` e conferir que não tem regressão visual antes de avançar.

---

## 2. Fase 1 — Tokens e fontes

### Objetivo
Configurar a paleta Rehagro e as 3 fontes (Plus Jakarta Sans, Instrument Serif, JetBrains Mono) como tokens nativos do Tailwind 4.

### Arquivos afetados
- `app/index.html` — adicionar `<link>` Google Fonts
- `app/src/index.css` — adicionar bloco `@theme inline` com tokens
- `app/tsconfig.json` — sem mudança (só conferir)

### Implementação

**`app/index.html`** — adicionar dentro do `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

**`app/src/index.css`** — bloco `@theme inline` (conforme §8 do `DESIGN_SYSTEM.md`):
```css
@import "tailwindcss";

@theme inline {
  /* Brand */
  --color-brand:        #1A7F3C;
  --color-brand-2:      #14682F;
  --color-brand-3:      #0E5224;
  --color-brand-soft:   #C9DEC6;
  --color-brand-tint:   #DDE9D5;
  --color-brand-tint-2: #E8EFE0;

  /* Surfaces */
  --color-bg:           #EFE9DA;
  --color-bg-elev:      #F2ECDE;
  --color-surface:      #F8F4E8;
  --color-surface-2:    #ECE5D2;
  --color-surface-inset:#E2DAC2;
  --color-surface-pure: #FBF8EE;

  /* Sidebar */
  --color-side-bg:      #1F2A23;
  --color-side-bg-2:    #283530;
  --color-side-ink:     #E8E2D0;
  --color-side-ink-2:   #B8B0A0;
  --color-side-ink-3:   #8A8474;
  --color-side-line:    #34403A;

  /* Ink */
  --color-ink:          #1B2620;
  --color-ink-2:        #364039;
  --color-ink-3:        #6E7269;
  --color-ink-4:        #93958A;

  /* Status */
  --color-status-bad:   #B94834;
  --color-status-warn:  #C77A2F;
  --color-status-mid:   #DBB04A;
  --color-status-ok:    #5B9F49;
  --color-status-top:   #1A7F3C;

  /* Lines */
  --color-line:         #D8CFB5;
  --color-line-2:       #C5BB9D;
  --color-line-3:       #A89E7E;

  /* Fonts */
  --font-sans:    "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Instrument Serif", "Plus Jakarta Sans", serif;
  --font-mono:    "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;

  /* Radii */
  --radius-1: 4px;
  --radius-2: 6px;
  --radius-3: 8px;
  --radius-4: 12px;
}

html, body { margin: 0; padding: 0; }
body {
  font-family: var(--font-sans);
  color: var(--color-ink);
  background: var(--color-bg);
  font-size: 15px;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
}
```

### Critério de aceite
- Em qualquer componente, usar `className="bg-brand text-surface"` renderiza fundo verde Rehagro com texto cream.
- `className="font-display"` aplica Instrument Serif.
- `npm run dev` carrega sem erro de console.
- Inspecionar o body no devtools: `font-family` = Plus Jakarta Sans, `background` cream `#EFE9DA`.

---

## 3. Fase 2 — Logo Rehagro

### Objetivo
Substituir o `MilkIcon` (lucide) pelo logo da Rehagro nos dois headers (Lista de Fazendas e Dashboard).

### Arquivos afetados
- `app/src/assets/` — adicionar `logo-rehagro.jpg` (versão verde, fundo branco) e `logo-rehagro-branca.png` (versão branca, fundo escuro)
- `app/src/components/ui/RehagroLogo.tsx` — criar componente
- `app/src/pages/ListaFazendas.tsx` — substituir `MilkIcon` no header
- `app/src/pages/DashboardFazenda.tsx` — substituir `MilkIcon` no header

### Implementação

**`src/components/ui/RehagroLogo.tsx`:**
```tsx
import logoDark from '@/assets/logo-rehagro.jpg'
import logoLight from '@/assets/logo-rehagro-branca.png'

interface Props {
  variant?: 'dark' | 'light'
  className?: string
}

export function RehagroLogo({ variant = 'dark', className = '' }: Props) {
  return (
    <img
      src={variant === 'dark' ? logoDark : logoLight}
      alt="Rehagro"
      className={className}
    />
  )
}
```

**Onde usar:** substituir o ícone `<MilkIcon size={16} className="text-white" />` por `<RehagroLogo variant="light" className="h-5" />` (ou similar). Manter dimensões parecidas com o que existia.

### Critério de aceite
- Logo Rehagro aparece no header da `ListaFazendas`.
- Logo Rehagro aparece no header do `DashboardFazenda`.
- Logo não distorce em telas de aspecto diferente (usar `object-contain` se necessário).

---

## 4. Fase 3 — Componentes utilitários novos

### Objetivo
Criar os componentes reutilizáveis previstos no `DESIGN_SYSTEM.md` §7 e §9. Nesta onda: criar esqueletos funcionais; refinamentos visuais granulares ficam pra cada onda que usar.

### Arquivos afetados
- `app/src/components/ui/Eyebrow.tsx` — novo
- `app/src/components/ui/PageHead.tsx` — novo
- `app/src/components/ui/InfoTooltip.tsx` — novo
- `app/src/components/ui/Stepper.tsx` — novo
- `app/src/components/ui/HelpBanner.tsx` — novo
- `app/src/components/ui/KPI.tsx` — novo (Variante A — `DESIGN_SYSTEM.md` §7.4)
- `app/src/components/ui/Delta.tsx` — novo
- `app/src/components/ui/Tag.tsx` — novo
- `app/src/components/ui/Seg.tsx` — novo
- `app/src/components/ui/DraftFAB.tsx` — novo (esqueleto; integração na Fase 4)
- `app/src/lib/glossary.ts` — novo, faz parse do `docs/GLOSSARY.md` em runtime (ou export de objeto JS — ver implementação)

### Implementação — InfoTooltip

**Decisão:** o `GLOSSARY.md` é referência humana. Pra UI, faz mais sentido manter um **TS literal espelhando** o glossário, atualizado manualmente. Evita parsing em runtime.

**`src/lib/glossary.ts`:**
```typescript
// Mantenha sincronizado com docs/GLOSSARY.md.
// Cada entrada: definição curta (tooltip) + opcional extensa (modal).

export interface GlossaryEntry {
  nome: string
  curta: string
  extensa?: string
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  VL: { nome: 'VL', curta: 'Vacas em lactação.' },
  VS: { nome: 'VS', curta: 'Vacas secas — no período seco antes do próximo parto.' },
  PCT_VL: {
    nome: '%VL',
    curta: 'VL / (VL + VS). Indicador-chave de eficiência reprodutiva.',
  },
  PEV: {
    nome: 'PEV',
    curta: 'Período de espera voluntário. Dias após o parto antes de liberar pra inseminação.',
  },
  TC: {
    nome: 'TC',
    curta: 'Taxa de concepção. Prenhezes confirmadas ÷ inseminações realizadas.',
  },
  TS: {
    nome: 'TS',
    curta: 'Taxa de serviço. Fração mensal de aptas que recebem ao menos um serviço.',
  },
  META_IA: {
    nome: 'Meta IA',
    curta: 'aptas × TS × (30/21). Projeção de inseminações no mês.',
  },
  MANUTENCAO_PRENHEZ: {
    nome: 'Manutenção de prenhez',
    curta: 'Fração mensal de gestações que se mantêm. As que perdem voltam ao pool de aptas.',
    extensa: 'Aplicada como decay sobre o estoque de prenhas a cada mês. Referência planilha: E7 (vacas), E6 (novilhas). Distinta da "perda de prenhez total" (B14/B15), que é fator único aplicado a serviços históricos.',
  },
  // ... popular com o resto durante a Fase 3 conforme GLOSSARY.md
}
```

**`src/components/ui/InfoTooltip.tsx`:**
```tsx
import { useState } from 'react'
import { Info } from 'lucide-react'
import { GLOSSARY } from '@/lib/glossary'

interface Props {
  term: keyof typeof GLOSSARY | string
  children?: React.ReactNode  // se quiser wrappar uma label
}

export function InfoTooltip({ term, children }: Props) {
  const [show, setShow] = useState(false)
  const entry = GLOSSARY[term]

  if (!entry) {
    // Em dev: log de termo não cadastrado pra cobrir
    if (import.meta.env.DEV) console.warn(`InfoTooltip: termo "${term}" não está em GLOSSARY`)
    return <>{children}</>
  }

  return (
    <span className="inline-flex items-center gap-1 relative">
      {children}
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-ink-4 hover:text-brand transition-colors"
        aria-label={`Sobre ${entry.nome}`}
      >
        <Info size={12} />
      </button>
      {show && (
        <span
          role="tooltip"
          className="absolute z-50 left-0 top-full mt-1 max-w-xs px-3 py-2 bg-ink text-surface text-xs rounded-md shadow-md"
        >
          <strong className="font-medium">{entry.nome}.</strong> {entry.curta}
        </span>
      )}
    </span>
  )
}
```

**Demonstração obrigatória (critério de aceite da Onda 1):** usar `<InfoTooltip term="VL">` em **pelo menos 3 lugares** — uma label de cada um destes: KPI no `CardsResumo`, label na `SidebarParams`, label na `TelaParametros`. Não precisa popular todos os termos do glossário nesta onda.

### Implementação — KPI (Variante A)

**`src/components/ui/KPI.tsx`:**
```tsx
interface Props {
  label: string
  value: string | number
  sub?: string
  color: string  // hex; usa em borda + cor do label + cor do valor
  className?: string
}

export function KPI({ label, value, sub, color, className = '' }: Props) {
  return (
    <div
      className={`bg-surface border border-line rounded-md p-4 pt-3.5 ${className}`}
      style={{ borderTopWidth: 3, borderTopColor: color }}
    >
      <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color }}>
        {label}
      </div>
      <div
        className="font-display tabular-nums leading-none tracking-tight"
        style={{ color, fontSize: 44, fontWeight: 400 }}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-ink-3 mt-2.5">{sub}</div>}
    </div>
  )
}
```

### Implementação — DraftFAB (esqueleto)

**`src/components/ui/DraftFAB.tsx`:**
```tsx
interface Props {
  visible: boolean
  onSalvar: () => void
  onEnviarComparativo: (slot: 'A' | 'B') => void
  onDescartar: () => void
}

export function DraftFAB({ visible, onSalvar, onEnviarComparativo, onDescartar }: Props) {
  if (!visible) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 bg-surface-pure border border-line-2 rounded-lg shadow-lg p-3 pr-4 animate-in fade-in duration-200">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="w-2 h-2 rounded-full bg-status-ok" />
        <span className="text-sm font-medium text-ink">Alterações não salvas</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onDescartar}
          className="text-xs text-status-bad hover:underline px-2 py-1"
        >
          Descartar
        </button>
        <button
          onClick={() => onEnviarComparativo('A')}
          className="text-xs px-3 py-1.5 border border-line rounded-md hover:bg-surface-2"
        >
          Enviar p/ comparativo
        </button>
        <button
          onClick={onSalvar}
          className="text-xs px-3 py-1.5 bg-brand text-white rounded-md hover:bg-brand-2 font-medium"
        >
          Salvar alterações
        </button>
      </div>
    </div>
  )
}
```

**Nota:** o dropdown "A ou B" do botão "Enviar p/ comparativo" pode ser implementado nesta fase como modal/popover simples, ou simplificado nesta onda (apenas envia pro próximo slot vazio entre A e B) — refinamento na Onda 5. Decidir durante execução com base no esforço.

### Os outros (Eyebrow, PageHead, Stepper, HelpBanner, Delta, Tag, Seg)

Implementação direta seguindo `DESIGN_SYSTEM.md` §7. **Esqueletos funcionais nesta fase**; podem ser refinados nas ondas que os consomem. Cada componente:
- TypeScript com props tipadas
- Apenas classes Tailwind nos tokens novos
- Sem `style={{}}` inline (exceto cores dinâmicas)
- Exportado nominalmente

### Critério de aceite da Fase 3
- Os 10 componentes existem em `src/components/ui/`
- TypeScript compila (`npx tsc --noEmit`)
- Pelo menos um demo de cada renderiza sem erro

---

## 5. Fase 4 — Estado de rascunho + DraftFAB

### Objetivo
Implementar o modelo de rascunho conforme `UX_PRINCIPLES.md` §2.5.2: edições em sidebar e Tela Parâmetros alimentam um **mesmo rascunho** em memória. Quando o rascunho diverge do Salvo, o `DraftFAB` aparece com 3 ações.

### Arquivos afetados
- `app/src/pages/DashboardFazenda.tsx` — refatoração estrutural

### Implementação

No `DashboardFazenda`, **substituir o padrão atual** (que persiste cada `handleParamChange` direto no localStorage) pelo modelo de rascunho:

```tsx
// Antes (atual):
const handleParamChange = (key, value) => {
  if (!fazenda) return
  atualizarFazenda({ ...fazenda, parametros: { ...fazenda.parametros, [key]: value } })
}

// Depois (Onda 1):
const [parametrosRascunho, setParametrosRascunho] = useState<Parametros | null>(null)
const [estadoRascunho, setEstadoRascunho] = useState<EstadoAtualRebanho | null>(null)

// Quando fazenda muda (abrir nova fazenda), zerar rascunho
useEffect(() => {
  setParametrosRascunho(null)
  setEstadoRascunho(null)
}, [fazendaId])

// Parâmetros efetivos: rascunho (se houver) ou Salvo
const parametrosEfetivos = parametrosRascunho ?? fazenda.parametros
const estadoEfetivo = estadoRascunho ?? fazenda.estadoAtual

const handleParamChange = (key, value) => {
  setParametrosRascunho(p => ({ ...(p ?? fazenda.parametros), [key]: value }))
}

const handleEstadoChange = (key, value) => {
  setEstadoRascunho(e => ({ ...(e ?? fazenda.estadoAtual), [key]: value }))
}

const temRascunho =
  parametrosRascunho !== null && !objsIguais(parametrosRascunho, fazenda.parametros) ||
  estadoRascunho !== null && !objsIguais(estadoRascunho, fazenda.estadoAtual)

const salvarRascunho = () => {
  saveFazenda({
    ...fazenda,
    parametros: parametrosRascunho ?? fazenda.parametros,
    estadoAtual: estadoRascunho ?? fazenda.estadoAtual,
  })
  setParametrosRascunho(null)
  setEstadoRascunho(null)
  setFazenda(getFazenda(fazendaId))
}

const descartarRascunho = () => {
  setParametrosRascunho(null)
  setEstadoRascunho(null)
}

const enviarComparativo = (slot: 'A' | 'B') => {
  // Onda 1: stub que apenas console.log. Implementação real na Onda 5.
  console.log(`[Onda 5] Enviar rascunho para Cenário ${slot}`)
}
```

**A `projecao` (useMemo) recalcula automaticamente** porque depende de `parametrosEfetivos`. Sem mais lógica de recálculo necessária.

**Renderizar o DraftFAB:**
```tsx
return (
  <>
    {/* ... resto da tela ... */}
    <DraftFAB
      visible={temRascunho}
      onSalvar={salvarRascunho}
      onEnviarComparativo={enviarComparativo}
      onDescartar={descartarRascunho}
    />
  </>
)
```

**Função utilitária:** `objsIguais(a, b)` — comparação rasa profunda. Pode ser `JSON.stringify(a) === JSON.stringify(b)` (suficiente pra Onda 1).

### Critério de aceite
- Ao abrir uma fazenda, `DraftFAB` está oculto.
- Mudar um campo na `SidebarParams` faz o `DraftFAB` aparecer.
- Clicar "Salvar alterações" no FAB grava no localStorage e o FAB some.
- Clicar "Descartar" no FAB reverte o rascunho e o FAB some.
- Clicar "Enviar para comparativo" loga no console (stub).
- Gráficos e KPIs recalculam em tempo real ao mexer no rascunho.

---

## 6. Fase 5 — Migração SidebarParams (style → tokens)

### Objetivo
Eliminar 100% dos `style={{}}` inline do componente. Aplicar tokens cream/dark do Design System. **Nesta onda manter o nome "Parâmetros Zootécnicos"** — a renomeação pra "Indicadores" é Onda 2.

### Arquivos afetados
- `app/src/components/SidebarParams.tsx` — reescrita

### Implementação

O componente atual usa `style={{}}` inline em todos os elementos. Substituir por classes Tailwind nos tokens novos:

| Atual | Novo |
|---|---|
| `style={{ width: 240, background: 'white', borderRight: '1px solid #e2e8f0' }}` | `className="w-60 bg-side-bg border-r border-side-line"` |
| `style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}` (header) | `className="bg-side-bg-2 border-b border-side-line"` |
| Cores de texto `#475569`, `#94a3b8` | `text-side-ink-2`, `text-side-ink-3` |
| `style={{ color: '#1e3a5f' }}` (título) | `text-side-ink` |
| Inputs `style={{}}` | classes Tailwind ou classe utilitária dedicada (`.param-input`) |
| Botão CTA `style={{}}` inline | `className="w-full bg-brand text-white hover:bg-brand-2 ..."` |

**Manter:** estrutura de grupos (Mortalidade, Descarte, Idade ao Parto, Manejo), os 13 campos, comportamento de input numérico.

**Adicionar:** `<InfoTooltip>` em pelo menos 1 label desta sidebar (ex: "Adulta (anual)" → `<InfoTooltip term="MORTALIDADE_ADULTA">`). Adicionar a entrada correspondente em `glossary.ts`.

### Critério de aceite
- Zero `style={{}}` no arquivo (exceto se necessário em case dinâmico justificado).
- Sidebar renderiza com fundo dark (`--color-side-bg`), texto cream (`--color-side-ink`).
- Os 13 campos funcionam igual a hoje (escrever número → muda valor → recalcula projeção).
- Após mudar campo, `DraftFAB` aparece (verificação cruzada com Fase 4).

---

## 7. Fase 6 — Migração CardsResumo (style → tokens)

### Objetivo
Eliminar 100% dos `style={{}}` inline. **Manter os 5 KPIs antigos e a Tabela Anual nesta onda** (a substituição pelos 4 novos e a remoção da tabela são Onda 2). Re-estilizar usando o componente `<KPI>` da Fase 3.

### Arquivos afetados
- `app/src/components/CardsResumo.tsx` — reescrita

### Implementação

Trocar a função interna `KPI()` pelo componente `<KPI>` importado de `ui/`. Os 5 KPIs continuam sendo: VL Atual, VL Médio (24m), Crescimento (24m), Partos (24m), Secagens (24m).

A **Tabela Anual** (resumoAnual) continua existindo — só re-estilizar com classes Tailwind:
- `bg-surface` no fundo do card
- `border-line` nas bordas
- `text-ink-3` nos labels do header
- `font-mono tabular-nums` nas células numéricas
- Cores dos números nas categorias **continuam as antigas** (`#2563eb`, etc.) nesta onda — Onda 2 migra

### Critério de aceite
- Zero `style={{}}` no arquivo.
- 5 KPIs renderizam com estética Variante A (borda colorida + serif na cor).
- Tabela Anual renderiza com tokens cream.
- Comportamento idêntico a hoje (cálculos, cores das categorias).

---

## 8. Fase 7 — Migração DashboardFazenda (style → tokens + integração DraftFAB)

### Objetivo
Eliminar 100% dos `style={{}}` inline. Manter a estrutura atual (sidebar branca de Indicadores Zootécnicos, tabs horizontais, header com fazenda e botões, alerta de %VL). Mudanças visuais maiores (sidebar dark, renomeação, gráfico em destaque) são Onda 2.

### Arquivos afetados
- `app/src/pages/DashboardFazenda.tsx`

### Implementação

Substituir blocos inline grandes por classes Tailwind nos tokens novos. Áreas afetadas:

- **Header** (`<header>` com fazenda + botões Upload/Indicadores) — usar `bg-bg-elev`, `border-line`, etc.
- **Tabs horizontais** — usar `border-line`, `text-ink-3`, `text-brand` no ativo
- **Alert %VL baixo** — usar `bg-status-bad/10 border-status-bad text-status-bad`
- **Body wrapper** — usar tokens cream
- **Empty state "sem dados"** — usar tokens; aproveitar componente `<Stepper>` da Fase 3 pra fluxo Importar → Conferir → Projetar

**Renderizar o DraftFAB** ao final do componente (já implementado na Fase 4).

### Critério de aceite
- Zero `style={{}}` no arquivo (exceto cores dinâmicas como `pctVLColor` — usar `var(--color-status-...)`).
- App roda sem regressão visual.
- DraftFAB aparece/desaparece conforme rascunho.

---

## 9. Fase 8 — Limpeza do App.css

### Objetivo
Reduzir `App.css` ao mínimo. Idealmente vazio (ou só `@import "tailwindcss"` se houver razão).

### Arquivos afetados
- `app/src/App.css` — limpeza

### Implementação

1. Mapear cada classe ainda usada no `App.css` (provavelmente `.tab-btn`, `.p-input`, `.cv-input`, `.cat-pill`, `.hz-btn`, `.disc-input`).
2. Para cada classe:
   - Se for usada apenas em código que vai mudar na Onda 2 (gráfico) — **manter por enquanto** num arquivo separado `src/styles/charts.css` importado só onde necessário.
   - Se já não é usada — apagar.
3. Migrar classes utilitárias que viraram componentes (`.tab-btn` agora é classe Tailwind direta).

### Critério de aceite
- `App.css` ≤ 50 linhas (idealmente vazio).
- Classes de gráfico isoladas em `src/styles/charts.css` se permanecerem.
- App roda sem regressão visual.

---

## 10. Fase 9 — Validação final

### Checks obrigatórios
- [ ] `npm run build` passa sem erros
- [ ] `npm run dev` carrega o app sem erros de console
- [ ] `npx tsc --noEmit` exit 0
- [ ] Lista de Fazendas renderiza com logo Rehagro e tokens cream
- [ ] Dashboard de uma fazenda renderiza, com KPIs antigos (Variante A re-estilizada) e gráfico funcional
- [ ] Sidebar (ainda "Parâmetros Zootécnicos") renderiza com tokens dark
- [ ] Mexer em qualquer campo: `DraftFAB` aparece com 3 botões
- [ ] Botão "Salvar" do FAB grava no localStorage e some o FAB
- [ ] Botão "Descartar" reverte
- [ ] Botão "Enviar para comparativo" loga no console (stub Onda 5)
- [ ] Fazendas existentes no localStorage continuam abrindo normalmente
- [ ] `<InfoTooltip>` funciona em pelo menos 3 lugares do app
- [ ] Tooltip lê do `glossary.ts`

### Regressões a evitar
- Cálculos do motor não devem mudar — mesmo valor de VL/VS/partos antes e depois da Onda 1.
- Comportamento dos uploads (TelaUpload) não muda.
- Comportamento da TelaParametros não muda.
- localStorage de fazendas pré-existentes continua válido (campos novos no `Fazenda` apenas se necessário).

---

## 11. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Fontes Google bloqueadas em ambiente do cliente | Fallback configurado em `--font-sans/display/mono` para ui-sans-serif e ui-monospace |
| Tailwind 4 `@theme inline` não reconhecido | Conferir versão `@tailwindcss/vite` ≥ 4.2 (já está em `package.json` 4.2.4) |
| Componente `<KPI>` quebra estética quando colocado nos 5 KPIs antigos (cores diferentes) | As cores dos 5 KPIs antigos viram `color` prop — funciona com qualquer hex |
| `DraftFAB` aparece toda vez que o usuário abre uma fazenda existente (porque rascunho seria criado por engano) | Inicializar com `null` e fazer comparação rasa antes de marcar como "tem rascunho" |
| Migração da sidebar quebra o layout do `DashboardFazenda` | Cada migração rodar com `npm run dev` ativo, verificar visualmente antes da próxima |

---

## 12. Como rodar e testar

```powershell
cd "C:\Users\rasaf\Desktop\Evolução de Rebanho - IA\app"
npm install
npm run dev
```

Acessar `http://localhost:5173` (ou porta indicada). Testar:
1. Criar nova fazenda
2. Importar dados de Bela Vista (CSVs no `Evolucao planilha/`)
3. Mexer em campos da sidebar → ver FAB aparecer
4. Salvar / Descartar / Enviar para comparativo
5. Verificar inspector que não há `style="..."` inline nos 3 componentes migrados (Sidebar, CardsResumo, DashboardFazenda)

---

## 13. Glossário interno desta spec

- **Rascunho:** estado de parâmetros em memória que não está salvo no localStorage (`UX_PRINCIPLES.md` §2.5.2).
- **Salvo:** estado de parâmetros persistido no localStorage da fazenda atual.
- **DraftFAB:** Floating Action Bar inferior direito (`DESIGN_SYSTEM.md` §7.17).
- **Tokens:** variáveis CSS expostas via `@theme inline` (`DESIGN_SYSTEM.md` §8).
- **Onda 1:** esta spec — fundação visual + infraestrutura de rascunho.
- **Onda 2+:** ondas posteriores (`ROADMAP.md`).
