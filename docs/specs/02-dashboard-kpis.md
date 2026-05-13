# Spec — Onda 2: Dashboard novo

> **Onda 2 do ROADMAP.md.** Refaz o Dashboard com 4 KPIs novos, sidebar renomeada para "Indicadores" em fundo dark, gráfico em destaque, sem Tabela Anual.
>
> **Pré-requisitos:** Onda 1 concluída. Ler `CLAUDE.md`, `docs/DESIGN_SYSTEM.md`, `docs/UX_PRINCIPLES.md`, `docs/GLOSSARY.md`, `docs/ROADMAP.md`.

---

## 0. Resumo executivo

**O que entrega:**
1. 4 KPIs novos no topo do Dashboard (Variante A — borda colorida + serif na cor) substituindo os 5 atuais
2. KPIs calculados sobre o **período filtrado** do gráfico (12m / 24m / 36m)
3. Remoção da Tabela Anual entre KPIs e gráfico
4. Sidebar renomeada de "Parâmetros Zootécnicos" → **"Indicadores"**
5. Sidebar migra para **fundo dark** (`--color-side-bg`)
6. Aba/botão do header renomeado para "Parâmetros" (era "Indicadores")
7. EvolutionGrid (atual `GraficoRebanho.tsx`) re-estilizado com tokens novos
8. Cores das categorias do gráfico migradas para as do protótipo Rehagro
9. Remoção da linha %VL sobreposta ao gráfico e do filtro de %VL
10. Tooltip em cada KPI explicando a fórmula

**O que NÃO entrega:**
- Mudanças em `TelaUpload`, `TelaParametros`, `TelaCenarios` (ondas 3, 4, 5)
- Implementação do "Enviar para comparativo" real (Onda 5 — continua stub da Onda 1)
- Mudanças no motor matemático

**Critério geral:** o Dashboard fica visualmente refeito, o gráfico fica como protagonista, os KPIs refletem as definições do `CLAUDE.md` §7. Comportamento numérico do motor é idêntico ao da Onda 1.

---

## 1. Sequência de execução

```
Fase 1 — Cálculo dos 4 KPIs (lib + tipos)
   ↓
Fase 2 — Glossário (popular termos dos KPIs em glossary.ts)
   ↓
Fase 3 — Reescrita do CardsResumo (4 KPIs + sem Tabela Anual)
   ↓
Fase 4 — Sidebar dark + renomeação "Indicadores"
   ↓
Fase 5 — Renomeação da aba/botão "Parâmetros"
   ↓
Fase 6 — Migração de cores das categorias (5 categorias)
   ↓
Fase 7 — Remoção da linha %VL e do filtro
   ↓
Fase 8 — Re-estilização do EvolutionGrid (tokens cream)
   ↓
Fase 9 — Hierarquia visual + validação final
```

---

## 2. Fase 1 — Cálculo dos 4 KPIs

### Objetivo
Criar funções puras para calcular os 4 KPIs sobre um array de `MesProjetado` filtrado pelo horizonte.

### Arquivos afetados
- `app/src/lib/dashboardKpis.ts` — novo
- `app/src/types/index.ts` — adicionar `KpiPeriodo` se útil

### Implementação

**`src/lib/dashboardKpis.ts`:**
```typescript
import type { MesProjetado } from '@/types'

export interface KpisDashboard {
  pctVLMedio: number          // 0..1 — média de pctVL no período
  partosTotal: number
  partosVacas: number
  partosNovilhas: number
  vacasSobreRebanho: number   // 0..1 — no último mês do período
  crescimentoPct: number      // ex: 32.8 (já em %)
  vlInicio: number            // pra mostrar no sub do crescimento
  vlFim: number
}

export function calcularKpisDashboard(meses: MesProjetado[]): KpisDashboard {
  if (meses.length === 0) {
    return {
      pctVLMedio: 0, partosTotal: 0, partosVacas: 0, partosNovilhas: 0,
      vacasSobreRebanho: 0, crescimentoPct: 0, vlInicio: 0, vlFim: 0,
    }
  }

  // Card 1 — %VL médio
  const pctVLMedio = meses.reduce((s, m) => s + m.pctVL, 0) / meses.length

  // Card 2 — Partos totais / Partos vacas / Partos novilhas
  const partosVacas = meses.reduce((s, m) => s + m.partosVacas, 0)
  const partosNovilhas = meses.reduce((s, m) => s + m.partosNovilhas, 0)
  const partosTotal = partosVacas + partosNovilhas

  // Card 3 — Vacas totais / Rebanho total no último mês
  const ultimo = meses[meses.length - 1]
  const vacasTotais = ultimo.vacasLactacao + ultimo.vacasSecas
  const rebanhoTotal = vacasTotais
    + (ultimo.bezerras0_12m ?? 0)
    + (ultimo.novilhas12_24m ?? 0)
    + (ultimo.novilhasPrenhas ?? 0)
  const vacasSobreRebanho = rebanhoTotal > 0 ? vacasTotais / rebanhoTotal : 0

  // Card 4 — % crescimento
  const primeiro = meses[0]
  const vlInicio = primeiro.vacasLactacao + primeiro.vacasSecas
  const vlFim = vacasTotais
  const crescimentoPct = vlInicio > 0 ? ((vlFim - vlInicio) / vlInicio) * 100 : 0

  return {
    pctVLMedio, partosTotal, partosVacas, partosNovilhas,
    vacasSobreRebanho, crescimentoPct, vlInicio, vlFim,
  }
}
```

### Critério de aceite
- `npx tsc --noEmit` exit 0
- Função pura testada manualmente com dados de Bela Vista: comparar resultado contra cálculo manual
- Quando `meses` vazio, retorna zeros sem crash

---

## 3. Fase 2 — Glossário (entradas dos 4 KPIs)

### Objetivo
Adicionar entradas no `glossary.ts` para os 4 KPIs do Dashboard, com fórmulas. Vão alimentar o tooltip em cada KPI.

### Arquivos afetados
- `app/src/lib/glossary.ts` — adicionar entradas
- `app/docs/GLOSSARY.md` — já existe (`Indicadores do Dashboard`); confirmar sincronia

### Implementação

Adicionar em `glossary.ts`:
```typescript
PCT_VL_MEDIO: {
  nome: '%VL médio',
  curta: 'Média mensal de VL / (VL + VS) no período filtrado.',
},
PARTOS_TOTAL: {
  nome: 'Partos totais',
  curta: 'Σ (partos de vacas + partos de novilhas) no período. Sub-info separa as duas origens.',
},
VACAS_SOBRE_REBANHO: {
  nome: 'Vacas / Rebanho',
  curta: '(VL + VS) ÷ (VL + VS + bezerras 0–12 + bezerras 12–23 + novilhas prenhas) no último mês.',
},
CRESCIMENTO: {
  nome: '% crescimento',
  curta: '(VL+VS último − VL+VS primeiro) ÷ VL+VS primeiro × 100, no período filtrado.',
},
```

### Critério de aceite
- 4 entradas existem em `glossary.ts`
- Cada definição corresponde exatamente à fórmula em `lib/dashboardKpis.ts`

---

## 4. Fase 3 — Reescrita do CardsResumo

### Objetivo
Substituir os 5 KPIs antigos pelos 4 novos com Variante A. Remover a Tabela Anual (componente sai do Dashboard nesta onda).

### Arquivos afetados
- `app/src/components/CardsResumo.tsx` — reescrita

### Implementação

```tsx
import { InfoTooltip } from './ui/InfoTooltip'
import { KPI } from './ui/KPI'
import { calcularKpisDashboard } from '@/lib/dashboardKpis'
import type { ResultadoProjecao } from '@/types'

interface Props {
  projecao: ResultadoProjecao
  hz: number
}

const CORES_KPI = {
  pctVL:        '#1A7F3C',  // brand verde
  partos:       '#A864D4',  // roxo
  vacasRebanho: '#2D6BC8',  // azul
  crescimento:  '#5BA84F',  // verde claro
}

function pctStr(n: number, d = 1) { return (n * 100).toFixed(d).replace('.', ',') + '%' }
function num(n: number) { return Math.round(n).toLocaleString('pt-BR') }

export function CardsResumo({ projecao, hz }: Props) {
  const meses = projecao.meses.slice(0, hz)
  const k = calcularKpisDashboard(meses)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      <KPI
        label={<InfoTooltip term="PCT_VL_MEDIO">%VL médio</InfoTooltip>}
        value={pctStr(k.pctVLMedio)}
        sub={`média de ${hz} meses`}
        color={CORES_KPI.pctVL}
      />
      <KPI
        label={<InfoTooltip term="PARTOS_TOTAL">Partos</InfoTooltip>}
        value={num(k.partosTotal)}
        sub={`${num(k.partosVacas)} vacas · ${num(k.partosNovilhas)} novilhas`}
        color={CORES_KPI.partos}
      />
      <KPI
        label={<InfoTooltip term="VACAS_SOBRE_REBANHO">Vacas / Rebanho</InfoTooltip>}
        value={pctStr(k.vacasSobreRebanho)}
        sub="composição no último mês"
        color={CORES_KPI.vacasRebanho}
      />
      <KPI
        label={<InfoTooltip term="CRESCIMENTO">Crescimento</InfoTooltip>}
        value={`${k.crescimentoPct >= 0 ? '+' : ''}${k.crescimentoPct.toFixed(1).replace('.', ',')}%`}
        sub={`${num(k.vlInicio)} → ${num(k.vlFim)} VL+VS`}
        color={CORES_KPI.crescimento}
      />
    </div>
  )
}
```

**Importante:** o componente `<KPI>` da Onda 1 precisa aceitar `ReactNode` no prop `label` (não só `string`) pra acomodar o `<InfoTooltip>` wrapando o texto. Ajustar se necessário.

A **Tabela Anual** atual no `CardsResumo` é **removida** — deletar o JSX correspondente. Não precisa mover pra outro lugar nesta onda; a Tabela Mensal já existe na aba dedicada.

### Critério de aceite
- 4 KPIs renderizam com estética Variante A e cores corretas
- Cada KPI tem tooltip funcional explicando a fórmula
- Tabela Anual não aparece mais no Dashboard
- Mexer no `hz` (horizonte do gráfico) recalcula os KPIs automaticamente

---

## 5. Fase 4 — Sidebar dark + renomeação "Indicadores"

### Objetivo
Migrar `SidebarParams` para o fundo dark (`--color-side-bg`), renomear título de "Parâmetros Zootécnicos" para **"Indicadores"**, manter os 13 campos atuais.

### Arquivos afetados
- `app/src/components/SidebarParams.tsx` — atualizar
- Considerar renomear arquivo para `SidebarIndicadores.tsx` (decisão a tomar no momento; afeta imports)

### Implementação

Substituir o título do header da sidebar:
```tsx
// Antes:
<span>Parâmetros Zootécnicos</span>

// Depois:
<span>Indicadores</span>
```

Aplicar tokens dark:
- Container: `bg-side-bg` (já era branco)
- Header interno: `bg-side-bg-2`
- Textos primários: `text-side-ink`
- Textos secundários: `text-side-ink-2`
- Labels de seção (uppercase): `text-side-ink-3`
- Bordas internas: `border-side-line`
- Inputs: fundo `bg-side-bg-2` (ou rgba transparente), texto `text-side-ink`, border `border-side-line`, focus `border-brand`

O **botão CTA** no rodapé da sidebar (atual "Indicadores →") muda de significado: agora leva à TelaParametros completa. Renomear pra "**Parâmetros**" pra coerência com a nova nomenclatura:
```tsx
<button onClick={onVerTodos} className="...">
  Parâmetros
  <ChevronRight size={13} />
</button>
```

### Critério de aceite
- Sidebar renderiza em fundo dark cream-on-green
- Título mostra "Indicadores"
- Botão do rodapé mostra "Parâmetros" e leva à `TelaParametros`
- Os 13 campos continuam editáveis e funcionais
- Mexer em qualquer campo aparece o `DraftFAB` (cruzando com Onda 1)
- Zero `style={{}}` inline

---

## 6. Fase 5 — Renomeação da aba/botão "Parâmetros"

### Objetivo
No header do `DashboardFazenda`, o botão atual escrito "Indicadores" leva à `TelaParametros`. Renomear pra **"Parâmetros"** pra ficar consistente com a nova nomenclatura.

### Arquivos afetados
- `app/src/pages/DashboardFazenda.tsx`

### Implementação

Localizar no header do Dashboard o botão que abre a `TelaParametros` (atualmente com texto "Indicadores"). Trocar texto pra "Parâmetros".

```tsx
// Antes:
<button onClick={() => setSidebarOpen(s => !s)}>
  <Settings size={13} /> Indicadores
</button>

// Depois:
<button onClick={() => setSidebarOpen(s => !s)}>
  <Settings size={13} /> Parâmetros
</button>
```

**Cuidado com a confusão semântica:** verificar **o que** esse botão hoje faz exatamente.

- Pela leitura atual: ele alterna a sidebar de Indicadores aberta/fechada (`setSidebarOpen`). Se for isso, **renomear pra "Indicadores"** (mostrar/ocultar a sidebar de mesmo nome) — coerente.
- Se outro botão leva à `TelaParametros`, esse outro vira "Parâmetros".

**Antes de implementar**, confirmar visualmente qual botão faz o quê e ajustar nomes pra ficar:
- 1 botão "Indicadores" (toggle da sidebar)
- 1 botão (ou aba) "Parâmetros" (abre tela completa de calibração)

### Critério de aceite
- Header tem distinção clara entre "Indicadores" (sidebar) e "Parâmetros" (tela completa)
- Comportamento dos botões corresponde ao rótulo
- Sem ambiguidade visual ou semântica

---

## 7. Fase 6 — Migração de cores das categorias

### Objetivo
Substituir as 5 cores antigas das categorias do gráfico pelas cores do protótipo Rehagro, em **todo lugar** que apareçam.

### Mapeamento
| Categoria | Antes | Depois |
|---|---|---|
| Vacas Lactação (VL) | `#2563eb` | `#2D6BC8` |
| Vacas Secas (VS) | `#94a3b8` | `#9CA09C` |
| Bezerras 0–12m | `#16a34a` | `#4FA85C` |
| Bezerras 12–23m / Novilhas 12–24m | `#7c3aed` | `#9E5AC8` |
| Novilhas Prenhas | `#0891b2` | `#28A89A` |

### Arquivos afetados
Buscar com `grep -rn` cada hex antigo no `src/`:
- `app/src/components/GraficoRebanho.tsx` (objeto `CAT`)
- `app/src/components/GraficoEvolucao.tsx` (objeto `CORES`)
- `app/src/components/TabelaMensal.tsx` (talvez)
- `app/src/components/TelaMetaInseminacao.tsx` (talvez)
- `app/src/components/TelaSecagem.tsx` (talvez)
- Qualquer outro hit do grep

### Implementação

Idealmente, **centralizar as cores** num módulo `src/lib/coresCategorias.ts`:
```typescript
export const CORES_CATEGORIAS = {
  vacasLactacao:   '#2D6BC8',
  vacasSecas:      '#9CA09C',
  bezerras0_12m:   '#4FA85C',
  bezerras12_23m:  '#9E5AC8',
  novilhasPrenhas: '#28A89A',
} as const
```

E importar em cada componente que usa. Reduz risco de divergência futura.

### Critério de aceite
- `grep "#2563eb\|#94a3b8\|#16a34a\|#7c3aed\|#0891b2" src/` retorna apenas falsos positivos (ex: cores em outros contextos não-categoria)
- Visual do gráfico usa as 5 novas cores
- Aparência menos saturada, mais harmônica com cream

---

## 8. Fase 7 — Remoção da linha %VL e do filtro

### Objetivo
Tirar a linha %VL sobreposta ao gráfico em `GraficoRebanho.tsx` e o filtro/pílula "%VL" das opções de toggle.

### Arquivos afetados
- `app/src/components/GraficoRebanho.tsx`

### Implementação

No `GraficoRebanho`:

1. Remover o `useState<boolean>` `showPct` e todos os usos
2. Remover a pílula de toggle "%VL" da row de category pills
3. Manter a linha de dados "%VL" abaixo do gráfico (na tabela) — só remove o overlay e o filtro

A SVG/path da linha `pctVLPath` também sai. Conferir que `meses[i].pctVL` continua sendo lido para preencher a linha de dados.

### Critério de aceite
- Pílula "%VL" não aparece mais nas categorias filtráveis
- Gráfico não tem mais linha vermelha tracejada sobreposta
- A linha de dados "%VL" continua aparecendo na tabela embaixo do gráfico

---

## 9. Fase 8 — Re-estilização do EvolutionGrid

### Objetivo
Aplicar tokens cream do Design System ao `GraficoRebanho.tsx`. **Sem mudar estrutura** — apenas tokens.

### Arquivos afetados
- `app/src/components/GraficoRebanho.tsx`
- `app/src/styles/charts.css` — se existir (Onda 1 isolou classes específicas de gráficos), atualizar lá

### Implementação

Substituir hex hardcoded:
- `#e2e8f0` (borders) → `border-line`
- `#f8fafc` (backgrounds suaves) → `bg-surface-2`
- `#0f172a` (texto forte) → `text-ink`
- `#64748b` (texto label) → `text-ink-3`
- `white` (card) → `bg-surface`
- `#fffbeb` (fundo descarte mensal) → manter ou trocar por `bg-status-warn/10`
- `#fde047` (border de descarte) → `border-status-warn`
- `#f0f9ff` (header aquisições) → `bg-brand-tint-2`
- `#0369a1` (texto header aquisições) → `text-brand-3`

Fontes:
- Header de meses, labels: `font-sans`
- Valores numéricos: `font-mono tabular-nums`

### Critério de aceite
- `GraficoRebanho` renderiza visualmente coerente com a paleta cream
- Header dos meses fica legível (texto escuro sobre cream)
- Descarte Mensal mantém destaque visual (cor de warning)
- Aquisições e Vendas mantém destaque visual (cor brand-tint)
- Comportamento (edição de descarte, edição de cv) inalterado

---

## 10. Fase 9 — Hierarquia visual + validação final

### Objetivo
Garantir que o gráfico ocupa o destaque visual do Dashboard, conforme `UX_PRINCIPLES.md` §2.4.

### Implementação

No `DashboardFazenda`, body do Dashboard (aba `dashboard`):
- Order vertical: **4 KPIs** → **EvolutionGrid**
- KPIs em altura compacta (~110px cada)
- EvolutionGrid ocupa o resto da viewport vertical (mínimo 50% da altura útil)
- Sem cards intermediários, sem Tabela Anual

### Checks obrigatórios
- [ ] `npm run build` passa sem erros
- [ ] `npx tsc --noEmit` exit 0
- [ ] 4 KPIs aparecem com Variante A e cores corretas
- [ ] Cada KPI tem tooltip funcional explicando a fórmula
- [ ] Tabela Anual não aparece no Dashboard
- [ ] Sidebar dark com título "Indicadores" e botão "Parâmetros" no rodapé
- [ ] Header tem botão coerente ("Indicadores" toggle / "Parâmetros" abre tela)
- [ ] 5 categorias do gráfico estão nas cores novas
- [ ] Linha %VL e filtro %VL foram removidos
- [ ] Gráfico ocupa >= 50% da altura visível do body
- [ ] Filtro de horizonte (12m / 24m / 36m) ainda funciona, e KPIs respondem
- [ ] Comportamento do motor inalterado (mesmo cálculo de VL, VS, partos)

---

## 11. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Tipos de `MesProjetado` não têm campos `bezerras0_12m`, `novilhas12_24m`, `novilhasPrenhas` esperados pelo Card 3 | Conferir `types/index.ts` antes da Fase 1. Se nomes diferem, ajustar os nomes na função `calcularKpisDashboard`. |
| Componente `<KPI>` da Onda 1 não aceita ReactNode no label | Atualizar prop em `src/components/ui/KPI.tsx` (mudança de 1 linha) |
| Cores antigas reaparecem em algum componente menos óbvio | grep recursivo dos 5 hex antigos antes de fechar a fase 6 |
| Renomeação do botão quebra fluxo lógico (ex: o botão fazia 2 coisas) | Validar fluxo de navegação visualmente antes de renomear |
| Linha %VL sobreposta era usada por algum teste/feature dependente | Buscar referências a `showPct` antes de remover |

---

## 12. Como rodar e testar

```powershell
cd "C:\Users\rasaf\Desktop\Evolução de Rebanho - IA\app"
npm run dev
```

Roteiro de teste manual:
1. Abrir fazenda Bela Vista
2. No Dashboard, conferir 4 KPIs no topo com cores e fórmulas corretas
3. Mudar horizonte (12m → 24m → 36m) e ver KPIs atualizando
4. Passar mouse sobre cada KPI: tooltip aparece com fórmula
5. Conferir que **não há Tabela Anual** entre KPIs e gráfico
6. Sidebar esquerda: título "Indicadores", fundo dark, botão "Parâmetros" no rodapé
7. Header: botão "Parâmetros" abre tela completa
8. Gráfico de barras: 5 cores novas (mais sóbrias)
9. Sem linha vermelha tracejada sobreposta
10. Mexer em campo da sidebar: `DraftFAB` aparece (cruza com Onda 1)
