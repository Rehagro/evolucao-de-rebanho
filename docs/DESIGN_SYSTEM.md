# Design System — Evolução de Rebanho

> Fonte canônica do visual do app. Extraído do protótipo Claude Design (paleta "pasture").
> Toda nova UI segue este documento. Mudanças aqui exigem atualização proporcional do `tailwind.config` e dos componentes em `src/components/ui/`.

---

## 1. Filosofia visual

Três princípios que diferenciam o app de um dashboard SaaS genérico:

1. **Papel agronômico, não tela.** Fundo cream (`#EFE9DA`), nunca branco puro. Reforça a sensação de planejamento e cuidado — o app é uma ferramenta de campo, não um app de fintech.
2. **Tipografia editorial nos números.** KPIs e títulos de página usam Instrument Serif em tamanho grande. Dá peso visual ao dado sem precisar de cor forte ou ícone.
3. **Contraste forte entre estrutura e conteúdo.** Sidebar escura (verde-tinta `#1F2A23`) versus main cream. A sidebar é "ferramenta", o main é "trabalho".

---

## 2. Paleta

### 2.1 Brand (Rehagro)

| Token | Hex | Uso |
|---|---|---|
| `--brand` | `#1A7F3C` | Cor principal — CTAs, links, eyebrows, ativos |
| `--brand-2` | `#14682F` | Hover do brand |
| `--brand-3` | `#0E5224` | Texto em fundos `brand-tint` |
| `--brand-soft` | `#C9DEC6` | Fills muito leves |
| `--brand-tint` | `#DDE9D5` | Backgrounds de pills, badges, alerts brand |
| `--brand-tint-2` | `#E8EFE0` | Fill ainda mais sutil |

### 2.2 Surfaces (fundo cream)

| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#EFE9DA` | Background da página |
| `--bg-elev` | `#F2ECDE` | Topbar |
| `--surface` | `#F8F4E8` | Cards padrão |
| `--surface-2` | `#ECE5D2` | Hover de linha, cabeçalho de tabela |
| `--surface-inset` | `#E2DAC2` | Fundo de segmented controls, ranges |
| `--surface-pure` | `#FBF8EE` | Card destacado, fundo de gráfico |

### 2.3 Sidebar (dark)

| Token | Hex | Uso |
|---|---|---|
| `--side-bg` | `#1F2A23` | Sidebar principal |
| `--side-bg-2` | `#283530` | Card interno na sidebar |
| `--side-ink` | `#E8E2D0` | Texto principal sidebar (cream sobre dark) |
| `--side-ink-2` | `#B8B0A0` | Texto secundário |
| `--side-ink-3` | `#8A8474` | Texto terciário, labels |
| `--side-line` | `#34403A` | Linhas divisoras dentro da sidebar |

### 2.4 Ink (texto no cream)

| Token | Hex | Uso |
|---|---|---|
| `--ink` | `#1B2620` | Texto principal |
| `--ink-2` | `#364039` | Subtítulos, dados |
| `--ink-3` | `#6E7269` | Labels, captions |
| `--ink-4` | `#93958A` | Texto mais fraco, placeholders |
| `--ink-disabled` | `#B8B8AB` | Desabilitado |

### 2.5 Status (gradiente contínuo)

| Token | Hex | Significado |
|---|---|---|
| `--status-bad` | `#B94834` | Crítico |
| `--status-warn` | `#C77A2F` | Atenção |
| `--status-mid` | `#DBB04A` | Mediano |
| `--status-ok` | `#5B9F49` | Bom |
| `--status-top` | `#1A7F3C` | Ótimo (= brand) |

Aliases legados (manter por compatibilidade): `--alert` = `--status-bad`, `--warn` = `--status-warn`, `--ok` = `--status-top`.

### 2.6 Soft fills para pills/tags

| Token | BG | FG | Uso |
|---|---|---|---|
| `--top25` | `#D7E5C8` | `#2E6B25` | Top 25% / ótimo |
| `--median` | `#EFE0BC` | `#8C6620` | Mediano |
| `--worsemed` | `#F0D8B7` | `#9A5520` | Pior que mediano |
| `--inf25` | `#ECC8B9` | `#8B3B27` | Inferior 25% / ruim |

### 2.7 Linhas

| Token | Hex |
|---|---|
| `--line` | `#D8CFB5` |
| `--line-2` | `#C5BB9D` |
| `--line-3` | `#A89E7E` |

### 2.8 Categorias de dados (gráfico)

| Token | Hex | Categoria |
|---|---|---|
| `--data-1` | `#1A7F3C` | Verde profundo (= brand) — destaque principal |
| `--data-2` | `#C77A2F` | Âmbar — projetado |
| `--data-3` | `#6B8A4A` | Verde oliva — novilhas |
| `--data-4` | `#8B5A3C` | Terra — vacas |
| `--data-5` | `#3F6671` | Azul-ardósia — touros (futuro) |
| `--data-6` | `#B89570` | Bege — bois magros (futuro) |
| `--data-7` | `#9F5A4B` | Terracota — bezerros |

**Cores específicas do gráfico de rebanho** (categorias do projeto atual):

| Categoria | Cor | Uso |
|---|---|---|
| Vacas Lactação (VL) | `#2D6BC8` | Azul produtivo |
| Vacas Secas (VS) | `#9CA09C` | Cinza neutro |
| Bezerras 0–12m | `#4FA85C` | Verde claro |
| Bezerras 12–23m | `#9E5AC8` | Roxo |
| Novilhas Prenhas | `#28A89A` | Teal |

> **Decisão confirmada:** estas são as 5 cores oficiais das categorias do gráfico (vêm do protótipo Rehagro). Substituem as cores do projeto atual (`#2563eb`, `#94a3b8`, `#16a34a`, `#7c3aed`, `#0891b2`) na Onda 2.

### 2.9 Cores dos KPIs do Dashboard

Os 4 KPIs do topo do Dashboard usam **Variante A** (borda superior 3px na cor + valor em serif na cor):

| KPI | Cor | Significado |
|---|---|---|
| %VL médio | `#1A7F3C` | Brand Rehagro — indicador-chave alinhado ao brand |
| Partos | `#A864D4` | Roxo — categoria reprodutiva |
| Vacas / Rebanho | `#2D6BC8` | Azul — coerente com cor de VL |
| Crescimento | `#5BA84F` | Verde claro — indicador positivo |

---

## 3. Tipografia

### 3.1 Famílias

```css
--font-sans:    "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
--font-display: "Instrument Serif", "Plus Jakarta Sans", serif;
--font-mono:    "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;
```

**Quando usar cada uma:**

- **Sans (Plus Jakarta Sans):** UI em geral — labels, parágrafos, botões, navegação. É o default.
- **Display (Instrument Serif):** números grandes (KPIs, page titles), citações no rodapé da sidebar. Cria contraste e personalidade.
- **Mono (JetBrains Mono):** **todo número tabular** (tabelas, KPIs pequenos no topbar, eyebrows com data). `font-feature-settings: "tnum", "zero"` aplicado via classe `.mono` ou `.tnum`.

### 3.2 Escala

> **Decisão:** tamanhos um pouco maiores que os do protótipo original — o técnico em campo precisa ler rápido.

| Token | px | Uso |
|---|---|---|
| Display XL | 44 | KPI values (Variante A) |
| Display L | 38 | Page titles |
| Display M | 32 | Variant "sans" do KPI value |
| Heading L | 18 | Brand name na sidebar |
| Heading M | 16 | Card titles do gráfico evolução |
| Heading S | 15 | Card titles padrão |
| Body | 15 | Default (`<body>`) |
| Body M | 14 | Tabelas, brand subname, drawer body |
| Body S | 13 | Crumb pills, sidebar items |
| Body XS | 12.5 | KPI labels, card sub, badges |
| Caption | 12 | Tooltips, suffix de inputs |
| Eyebrow / Tiny | 11 | Eyebrows, table headers, mono micro |

**Nota sobre cores das fontes:** preferir tons escuros. Body text padrão usa `var(--ink)` (`#1B2620`) ao invés de `var(--ink-2)`. Labels de seção também tendem ao escuro (`--ink-2` no mínimo). Os tons `--ink-3` e `--ink-4` ficam reservados para metadados, captions e estados "secundários". Isso facilita leitura em condições variáveis (campo, luz forte).

### 3.3 Modo "sans-only"

O protótipo permite override `data-typeset="sans"` que substitui Instrument Serif por Plus Jakarta. **Manter esse toggle no produto final** — alguns usuários preferem sans em telas com muitos números.

### 3.4 Eyebrow (label decorativa)

```css
.eyebrow {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-3);
  font-weight: 600;
}
```

Variante `.page-eyebrow` (no main):
- Cor `var(--brand)` em vez de `ink-3`
- Acompanhada de uma linha horizontal de 18px à esquerda (`::before`)

---

## 4. Espaçamento e raios

### 4.1 Raios

| Token | px |
|---|---|
| `--r-1` | 4 (inputs pequenos, badges) |
| `--r-2` | 6 (botões, segmented) |
| `--r-3` | 8 (cards, drawers) |
| `--r-4` | 12 (cards maiores, modais) |

### 4.2 Espaçamento

Sem escala dedicada — usar a do Tailwind (4px base). Padrões consagrados no protótipo:

- **Card padding:** `16px 18px` (head) + `0 18px 18px` (body) ou `18px` (card-pad)
- **Main padding:** `28px 32px 80px`
- **Topbar height:** 60px
- **Sidebar width:** 248px
- **Gap padrão grid de cards:** 16px
- **Gap entre seções verticais:** 24px

### 4.3 Sombras

```css
--shadow-1: 0 1px 0 rgba(27,38,32,0.04), 0 1px 2px rgba(27,38,32,0.04);
--shadow-2: 0 2px 8px rgba(27,38,32,0.06), 0 1px 2px rgba(27,38,32,0.05);
```

Cards usam **borda** por padrão, não sombra. Sombra fica para elementos elevados (drawer, modal, dropdown).

---

## 5. Densidade

```css
--density-row: 44px  /* comfortable, default */
[data-density="compact"]    --density-row: 36px
[data-density="cozy"]       --density-row: 52px
```

**Onde aplicar:** linhas de tabela (`.tbl tbody td`), linhas de listas longas. Não aplicar em headers ou cards.

Toggle de densidade fica disponível em configurações (não exposto no MVP — manter `comfortable` como default).

---

## 6. Layout do app

### 6.1 Shell

```
┌─────────┬─────────────────────────────┐
│         │  Topbar (60px)              │
│ Sidebar ├─────────────────────────────┤
│ (248px) │                             │
│  dark   │  Main (cream)               │
│         │  padding: 28px 32px 80px    │
│         │                             │
└─────────┴─────────────────────────────┘
```

CSS:
```css
.app {
  display: grid;
  grid-template-columns: 248px 1fr;
  grid-template-rows: 60px 1fr;
  grid-template-areas: "side topbar" "side main";
  min-height: 100vh;
}
```

### 6.2 Comportamento

- Sidebar: `position: sticky; top: 0; height: 100vh; overflow-y: auto`.
- Main: `overflow: auto`.
- Em telas estreitas (< 1024px): sidebar colapsa pra ícones ou hamburger (definir na Onda 1).

---

## 7. Componentes-chave

### 7.1 Topbar

Composição padrão:

```
[ crumb-pill: fazenda + ref ] · [ topbar-kpi: VL ] · [ topbar-kpi: %VL ]   …   [btn] [btn-primary]
```

- **crumb-pill:** pílula clara com dot verde + nome da fazenda + data de referência
- **topbar-kpi:** pílula `brand-tint` com número em mono (ex: `318 VL`)
- **btn / btn-primary:** ações principais à direita

### 7.2 Page header

```jsx
<div className="page-head">
  <div>
    <div className="page-eyebrow">DASHBOARD · ABR/2026 → ABR/2027</div>
    <h1 className="page-title">Evolução do <em>rebanho</em></h1>
    <p className="page-sub">12 meses de projeção. Veja o que muda quando os parâmetros mudam.</p>
  </div>
  <div className="page-actions">...</div>
</div>
```

- `.page-title`: 38px Instrument Serif, com suporte a `<em>` (itálico + brand) e `<b>` (brand sem peso extra)
- `.page-sub`: 13.5px, max-width 640px

### 7.3 Card

Variantes:
- `.card` — padrão (surface cream)
- `.card-pure` — surface mais clara (destaque)
- `.card-accent` — borda esquerda brand 3px

```jsx
<Card title="Evolução" sub="VL projetado para 12 meses" action={<Button>...</Button>}>
  ...
</Card>
```

### 7.4 KPI (Variante A — confirmado)

Estética definitiva: borda superior 3px na cor + label uppercase pequena na mesma cor + valor 44px Instrument Serif na mesma cor.

Anatomia:
```
[border-top 3px na cor]
[label 12.5px uppercase letter-spacing 0.04em — na cor do KPI]
[value 44px Instrument Serif — na cor do KPI]
[sub 12.5px ink-3]
```

```jsx
<div className="kpi" style={{ borderTopColor: cor }}>
  <div className="kpi-label" style={{ color: cor }}>%VL médio</div>
  <div className="kpi-value" style={{ color: cor }}>87,3%</div>
  <div className="kpi-sub">média 24m</div>
</div>
```

CSS class: `.kpi` + filhos `.kpi-label`, `.kpi-value`, `.kpi-sub`.

**As 4 cores oficiais dos KPIs do Dashboard estão em §2.9.**

**Sem fundo colorido:** o card mantém `bg-surface` cream — a cor entra só na borda superior e nos textos. Isso evita ruído visual quando 4 KPIs aparecem lado a lado.

### 7.5 Delta pill

```jsx
<span className="delta up">▲ 12,3%</span>
<span className="delta dn">▼ 4,1%</span>
<span className="delta flat">—</span>
```

- `up` → fundo `--top25-bg`, texto `--top25-fg`
- `dn` → fundo `--inf25-bg`, texto `--inf25-fg`
- `flat` → fundo `--surface-inset`, texto `--ink-3`

### 7.6 Tag / pill

```jsx
<Tag kind="green">Top 25%</Tag>
<Tag kind="amber">Mediano</Tag>
<Tag kind="red">Atenção</Tag>
<Tag kind="brand">Dados reais</Tag>
```

### 7.7 Botão

| Variante | Background | Border | Color |
|---|---|---|---|
| `.btn` | surface | line | ink |
| `.btn-primary` | brand | brand | white |
| `.btn-ghost` | transparent | transparent | ink |
| `.btn-outline` | transparent | line | ink |

Padding: `6px 12px`, radius 6px, font 12px peso 500.

### 7.8 Segmented control

Background `surface-inset`, item ativo com fundo `surface-pure` + sombra suave.

```jsx
<Seg value={horizonte} onChange={setHorizonte} options={[
  { value: 12, label: "12m" }, { value: 24, label: "24m" }, ...
]}/>
```

### 7.9 Tabela

- Header sticky com fundo `surface-2`, texto eyebrow (10px mono uppercase, color `ink-4`)
- Linhas com `min-height: var(--density-row)` (44px default)
- Hover: fundo `surface-2`
- Selected: fundo `brand-tint`
- Coluna numérica: `.tbl-num` (mono + tabular-nums + align right)

### 7.10 Bench (barra de benchmark)

Barra horizontal 8px com gradiente vermelho → verde, com pin marcando posição atual.

```jsx
<div className="bench">
  <div className="bench-pin" style={{ left: "72%" }}>
    <div className="bench-pin-label">88,4%</div>
  </div>
</div>
<div className="bench-marks">
  <div className="bench-mark">Mín <span className="mono">75%</span></div>
  <div className="bench-mark">Médio <span className="mono">85%</span></div>
  <div className="bench-mark">Top <span className="mono">92%</span></div>
</div>
```

Uso recomendado: visualizar onde a fazenda está em comparação com benchmark (Top 25 / Mediana / Inferior 25%).

### 7.11 Alert row (lista de alertas)

```
[ bar 3px colorido ] [ título + sub + meta ] [ ação ]
```

`.alert-bar` cores: vermelho (status-bad), âmbar (warn), verde (top), brand.

### 7.12 Drawer

Largura 540px, slide-in da direita, backdrop semi-transparente. Para detalhes contextuais sem sair da tela.

### 7.13 Sidebar params (atual)

Já implementado no protótipo:
- Header com ícone ⚙ e título
- Grupos collapse: Mortalidade · Descarte · Idade ao Parto · Manejo
- `.param-line` = grid 1fr × 70px (label + input)
- Inputs no fundo escuro com `rgba(255,255,255,0.05)`, focus muda pra `0.08` + border brand

**⚠️ Renomear "Parâmetros Zootécnicos" → "Indicadores" na migração (Onda 2).**

### 7.14 Stepper (método 1-6)

Lista vertical numerada com linha tracejada conectando os passos:

```
①─ Carregar dados      [ done ]
│
②─ Conferir parâmetros [ active ]
│
③─ Ver projeção        [ todo ]
```

Estados: `default`, `active` (brand), `done` (brand-3).

### 7.15 EvolutionGrid (protagonista do Dashboard)

Grid unificado tabela-gráfico que ocupa o centro do Dashboard. **Já existe no projeto atual como `GraficoRebanho.tsx`** — na Onda 2 apenas re-estilizar com tokens novos.

**Anatomia (linhas de cima pra baixo):**

```
┌──── Indicador / Mês ────┬─── Mai ─── Jun ─── Jul ─── ... ──┐
│                         │                                    │
│  Descarte Mensal        │  [3,2%][3,2%][3,2%][3,2%][3,2%]   │  ← input editável (override do anual)
│  (editável por mês)     │                                    │
├─────────────────────────┼────────────────────────────────────┤
│                         │  ▌ ▌ ▌ ▌ ▌                         │
│  [Y axis]               │  ▌ ▌ ▌ ▌ ▌  ← BARRAS POR CATEGORIA│  ← gráfico de barras agrupadas
│  300 ─                  │  ▌ ▌ ▌ ▌ ▌                         │     (5 categorias visíveis por toggle)
│  200 ─                  │  ▌ ▌ ▌ ▌ ▌                         │
│  100 ─                  │  ▌ ▌ ▌ ▌ ▌                         │
│    0 ─                  │                                    │
├─────────────────────────┼────────────────────────────────────┤
│  Mai/26  Jun/26  …      │  ← labels do mês                   │
├─────────────────────────┼────────────────────────────────────┤
│  %VL                    │  91,2  91,5  91,3  ...             │  ← dados linha (todas read-only,
│  Descartes              │   12    13    11  ...              │     exceto Mortes que é input)
│  Mortes (editável)      │   [4]  [5]  [4]  ...               │
│  Partos — Novilhas      │   3     4     2  ...               │
│  Partos — Vacas         │  18    19    15  ...               │
│  Secagens               │  20    21    19  ...               │
├─────────────────────────┼────────────────────────────────────┤
│  AQUISIÇÕES E VENDAS    │                                    │  ← separador uppercase
├─────────────────────────┼────────────────────────────────────┤
│  Vaca Lactação          │   [0]  [0]  [+5]  ...              │  ← inputs editáveis
│  Vaca Seca              │   [0]  [0]  [0]   ...              │     (positivo = compra,
│  Novilhas               │   [0]  [-3] [0]   ...              │      negativo = venda)
└─────────────────────────┴────────────────────────────────────┘
```

**Mudanças vs versão atual do `GraficoRebanho.tsx`:**
- **Remover** a linha %VL sobreposta ao gráfico (era dashed vermelha) e o filtro de %VL nas pílulas
- Aplicar paleta cream + cores das categorias do protótipo
- Tipografia: labels Plus Jakarta, valores numéricos JetBrains Mono
- Dimensões mantidas: `LBLW=180px` (label column), `HDR_H=38px`, `CH=300px` (chart), `ROW_H=32px`

**Filtros (acima do grid):**
- Pílulas de toggle por categoria (5 categorias, cada uma com sua cor)
- Toggle de horizonte: 12m / 24m / 36m

**Comportamento:**
- Descarte Mensal: input que sobrescreve o valor anual da sidebar para aquele mês específico. Double-click resta o padrão.
- Aquisições e Vendas: inputs que adicionam/removem cabeças no mês

### 7.16 CompareChart (Tela Cenários — Onda 5)

Visualização do comparativo A vs B. **Apenas o gráfico, sem KPIs, sem tabela, sem sidebar.**

**Layout:**

```
┌─────────────── Cenário A ────────┬─── Cenário B ──────┐
│  [Snapshot 13/05 14:32]  [Limpar]│  [Snapshot 13/05 15:10] [Limpar]
│                                  │                    │
│  ▌▌▌▌▌  ← barras                 │  ▌▌▌▌▌            │
│  ▌▌▌▌▌                           │  ▌▌▌▌▌            │
│  Mai Jun Jul Ago …               │  Mai Jun Jul Ago … │
└──────────────────────────────────┴────────────────────┘

Filtros sincronizados:  [12m | 24m | 36m]  [● VL] [● VS] [● Bezerras 0-12] ...
```

**Componentes reutilizados:**
- `<GroupedBarChart>` do protótipo (em `charts.jsx`) — base SVG
- Cores das categorias da §2.8

**Comportamento:**
- Filtros (horizonte, categorias visíveis) **sincronizados** entre A e B
- Ações no topo: "Promover B → A" (substitui A com snapshot de B)
- Quando um dos slots está vazio: card placeholder "Envie um rascunho do Dashboard"

### 7.17 DraftFAB (Floating Action Bar de rascunho)

Botão flutuante inferior direito que aparece quando o rascunho diverge do Salvo.

**Anatomia:**

```
                                    ┌─────────────────────────────────┐
                                    │ ● Alterações não salvas         │
                                    │                                 │
                                    │ [Descartar] [Enviar p/ comp.]   │
                                    │            [Salvar alterações]  │
                                    └─────────────────────────────────┘
```

**Estilo:**
- Posição: `fixed; bottom: 20px; right: 20px`
- Fundo `--surface-pure` com borda `--line-2`
- Sombra `--shadow-2`
- Radius `--r-3`
- Dot pulsante verde indicando rascunho ativo
- Botão "Salvar alterações" em `btn-primary` (verde brand)
- Botão "Enviar para comparativo" em `btn-outline` — ao clicar, abre dropdown "Cenário A ou B"
- Botão "Descartar" em `btn-ghost` (texto vermelho discreto)

**Comportamento:**
- Aparece com fade-in (200ms) quando rascunho fica diferente do Salvo
- Desaparece quando rascunho == Salvo (sem alterações pendentes)
- **Persiste após "Enviar para comparativo"** — o rascunho continua ativo, técnico segue editando
- Some apenas quando o técnico Salva ou Descarta

**Estados:**
| Situação | FAB visível? |
|---|---|
| Acabou de abrir a fazenda, sem mexer | Não |
| Mexeu na sidebar | Sim |
| Mexeu na Tela Parâmetros | Sim |
| Clicou Salvar com sucesso | Não (rascunho == Salvo) |
| Clicou Enviar p/ comparativo | Sim ainda (rascunho persiste) |
| Clicou Descartar | Não |

---

## 8. Mapeamento para Tailwind 4

Tailwind 4 usa `@theme` inline no CSS pra tokens custom. Sugestão de `src/index.css`:

```css
@import "tailwindcss";

@theme inline {
  /* === Brand === */
  --color-brand:        #1A7F3C;
  --color-brand-2:      #14682F;
  --color-brand-3:      #0E5224;
  --color-brand-soft:   #C9DEC6;
  --color-brand-tint:   #DDE9D5;
  --color-brand-tint-2: #E8EFE0;

  /* === Surfaces === */
  --color-bg:           #EFE9DA;
  --color-bg-elev:      #F2ECDE;
  --color-surface:      #F8F4E8;
  --color-surface-2:    #ECE5D2;
  --color-surface-inset:#E2DAC2;
  --color-surface-pure: #FBF8EE;

  /* === Sidebar === */
  --color-side-bg:      #1F2A23;
  --color-side-bg-2:    #283530;
  --color-side-ink:     #E8E2D0;
  --color-side-ink-2:   #B8B0A0;
  --color-side-ink-3:   #8A8474;
  --color-side-line:    #34403A;

  /* === Ink === */
  --color-ink:          #1B2620;
  --color-ink-2:        #364039;
  --color-ink-3:        #6E7269;
  --color-ink-4:        #93958A;

  /* === Status === */
  --color-status-bad:   #B94834;
  --color-status-warn:  #C77A2F;
  --color-status-mid:   #DBB04A;
  --color-status-ok:    #5B9F49;
  --color-status-top:   #1A7F3C;

  /* === Lines === */
  --color-line:         #D8CFB5;
  --color-line-2:       #C5BB9D;
  --color-line-3:       #A89E7E;

  /* === Fonts === */
  --font-sans:    "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Instrument Serif", "Plus Jakarta Sans", serif;
  --font-mono:    "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;

  /* === Radii === */
  --radius-1: 4px;
  --radius-2: 6px;
  --radius-3: 8px;
  --radius-4: 12px;
}
```

**Em `index.html`:**

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

**Uso nas classes:**

```jsx
<div className="bg-bg text-ink font-sans">
  <h1 className="font-display text-[38px] leading-none">Evolução</h1>
  <span className="font-mono tabular-nums">318</span>
</div>
```

---

## 9. Componentes shadcn a criar/atualizar

Em `src/components/ui/` — verificar o que já existe e completar:

| Componente | Status | Ação |
|---|---|---|
| `Button` | ✅ existe | Atualizar variantes para `default | primary | ghost | outline | destructive` |
| `Card`, `CardContent`, `CardHeader`, `CardTitle` | ✅ existe | Adicionar variantes `pure`, `accent` |
| `Badge` | ✅ existe | Mapear `kind` para os softs (top25, median, worsemed, inf25, brand) |
| `Input` | ✅ existe | Verificar suporte a `suffix` e `prefix` |
| `Modal` | ✅ existe | Adicionar `Drawer` separado (slide-in lateral) |
| `Select` | ✅ existe | Confirmar uso de fonte sans |
| `Seg` (segmented) | 🆕 criar | Conforme §7.8 |
| `Tag` / `Pill` | 🆕 criar | Conforme §7.6 — pode ser variante de Badge |
| `KPI` | 🆕 criar | Conforme §7.4 (Variante A) — substitui o componente custom em `CardsResumo` |
| `Delta` | 🆕 criar | Conforme §7.5 |
| `Bench` | 🆕 criar | Conforme §7.10 |
| `Stepper` | 🆕 criar | Conforme §7.14 — usado no empty state do Dashboard |
| `InfoTooltip` | 🆕 criar | Lê do `docs/GLOSSARY.md` |
| `EmptyState` | 🆕 criar | Padrão pra telas sem dados |
| `Eyebrow` | 🆕 criar | Texto + linha conforme §3.4 |
| `PageHead` | 🆕 criar | Cabeçalho de página conforme §7.2 |
| `DraftFAB` | 🆕 criar | **Onda 1.** Floating Action Bar de rascunho (§7.17) |
| `CompareChart` | 🆕 criar | **Onda 5.** Comparativo A vs B (§7.16) |

**Componentes que já existem em `src/components/` (não em `ui/`) e precisam re-estilizar:**

| Componente | Ação |
|---|---|
| `GraficoRebanho.tsx` | Onda 2: re-estilizar para tokens novos, remover linha %VL sobreposta, aplicar cores do protótipo (§2.8) |
| `SidebarParams.tsx` | Onda 1+2: renomear pra "Indicadores", aplicar fundo dark sidebar |
| `CardsResumo.tsx` | Onda 2: substituir os 5 KPIs antigos pelos 4 novos com Variante A; remover Tabela Anual |

---

## 10. Migração: o que apagar / mover

### 10.1 `App.css`
- **Hoje:** 5 KB com CSS solto (classes `.tab-btn`, possivelmente `.p-input`, `.cv-input` do GraficoRebanho)
- **Ação:** após Onda 1, o arquivo deve ficar essencialmente vazio (ou só com `@import "tailwindcss"`)
- **Exceção controlada:** classes muito específicas de gráficos custom (ex: `.cv-input` do GraficoRebanho) podem migrar pra um `src/styles/charts.css` separado, importado só onde necessário

### 10.2 `style={{}}` inline
- **Hoje:** principalmente em `DashboardFazenda.tsx`, `SidebarParams.tsx`, `CardsResumo.tsx`
- **Ação:** substituir 100% por classes Tailwind nos tokens novos. **Exceção válida:** cores dinâmicas calculadas (ex: `style={{ color: pctVLColor }}` onde a cor depende do valor) — manter inline, mas usando variável CSS (`style={{ color: 'var(--status-warn)' }}`)

### 10.3 Hex hardcoded em componentes existentes
- Substituir em todo lugar:
  - `#2563eb` (azul VL antigo) → `#2D6BC8` na Onda 2 (cor oficial nova — §2.8)
  - `#94a3b8` (cinza VS antigo) → `#9CA09C` na Onda 2 (cor oficial nova — §2.8) ou `text-ink-4` se for texto
  - `#16a34a` (verde Bezerras antigo) → `#4FA85C` na Onda 2
  - `#7c3aed` (roxo Novilhas antigo) → `#9E5AC8` na Onda 2
  - `#0891b2` (teal antigo) → `#28A89A` na Onda 2
  - `#0f172a` → `text-ink`
  - `#64748b` → `text-ink-3`
  - `#f1f5f9` → `bg-surface-2` ou `border-line`
  - Etc.

---

## 11. Coisas que **não** vão do protótipo pro produto

- **TweaksPanel:** o painel de ajuste de paleta/densidade/tipografia em tempo real é só ferramenta de design. Não vai pro app final.
- **Mock data (`HERD_DATA`):** o motor real é `engine/projecao.ts`.
- **Babel standalone + React UMD via CDN:** o app é Vite + React 19 nativo.

---

## 12. Refs visuais

Logo Rehagro:
- **Versão verde sobre fundo branco** (`logo-rehagro.jpg`) — usar no header do main (topbar) e na página de listagem
- **Versão branca sobre fundo escuro** (`Logo-Rehagro-chapada-branca-1-01.png`) — usar na sidebar dark

Salvar ambas em `src/assets/`. Componente sugerido: `<RehagroLogo variant="dark|light"/>`.
