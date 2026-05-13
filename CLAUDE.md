# Evolução de Rebanho — Briefing para Claude Code

> Este arquivo é lido automaticamente em toda sessão do Claude Code.
> É o cérebro permanente do projeto. Atualize quando regras mudarem.

---

## 1. O que é o projeto

Aplicativo web para projeção de evolução de rebanho leiteiro, usado por **técnicos veterinários** da Rehagro. O técnico importa dados do Ideagri (secagem, agenda de partos, animais em crescimento), preenche parâmetros zootécnicos da fazenda e visualiza projeções mensais de VL, VS, partos, secagens, coortes jovens, forragem e receita por 12 a 84 meses.

**Estado atual:** motor matemático calibrado e idêntico à planilha de referência (Bela Vista — erro máx 0.02 pp em 48 meses). Foco atual é **UX / UI**.

---

## 2. Stack

```
Bundler:    Vite 8
Runtime:    React 19 + TypeScript
Estilo:     Tailwind CSS 4 + shadcn/ui (componentes em src/components/ui/)
Ícones:     lucide-react
Gráficos:   recharts
CSV parse:  papaparse
IDs:        uuid
Storage:    localStorage (JSON serializado)
Roteamento: state-based no App.tsx (sem react-router)
```

Sem backend. Tudo client-side.

---

## 3. Estrutura do repo (em `app/`)

```
src/
  App.tsx                       ← roteamento via state
  App.css                       ← LEGADO em remoção (Onda 1)
  main.tsx
  engine/
    projecao.ts                 ← motor TypeScript (produção)
  lib/
    defaults.ts                 ← parâmetros padrão
    csvParser.ts                ← parser CSVs Ideagri
    storage.ts                  ← getFazenda, saveFazenda, etc.
    exportCSV.ts
  types/
    index.ts                    ← Parametros, Fazenda, ResultadoProjecao, etc.
  components/
    ui/                         ← shadcn (Button, Card, Badge, Modal, Input, ...)
    CardsResumo.tsx
    GraficoEvolucao.tsx
    GraficoRebanho.tsx
    SidebarParams.tsx
    TabelaMensal.tsx
    TelaCenarios.tsx            ← placeholder
    TelaForragem.tsx
    TelaMetaInseminacao.tsx
    TelaParametros.tsx          ← 28 KB — alvo de reestruturação (Onda 4)
    TelaPrevistoRealizado.tsx   ← placeholder
    TelaSecagem.tsx
    TelaUpload.tsx
  pages/
    ListaFazendas.tsx
    DashboardFazenda.tsx        ← dentro dele: tabs + sidebar + body
```

Fora de `app/`:

```
simular.py                      ← motor Python de calibração (uso interno)
_compare.py, _categorias.py,    ← scripts de validação motor vs planilha
_pool_aptas.py, _sec_detalhe.py
Evolucao planilha/              ← planilha referência + CSVs Ideagri
docs/                           ← roadmap, design system, ux, glossário, specs
```

---

## 4. Como trabalhar neste projeto

**Antes de qualquer tarefa:**

1. Releia este arquivo.
2. Leia `docs/ROADMAP.md` pra saber em qual onda estamos.
3. Leia o spec da onda em `docs/specs/0X-*.md`.
4. **Apresente um plano de execução antes de editar arquivos** e aguarde aprovação humana.

**Princípios de execução:**

- Mudanças no motor (`engine/projecao.ts`) exigem sincronização com `simular.py`. Sempre.
- Antes de mexer em fórmulas, ler a planilha real com `openpyxl(data_only=False)`. Nunca inventar cálculo de memória.
- Bela Vista é a fazenda de calibração. Rodar `python _compare.py` valida o motor contra a planilha.
- Trabalho em ondas (ver ROADMAP). Não pular ondas. Não misturar ondas no mesmo PR/sessão.

---

## 5. Regras de ouro

### 5.1 Sistema visual
- **shadcn + Tailwind é o sistema.** Zero `style={{}}` inline em código novo.
- Toda cor sai de tokens Tailwind (paleta Rehagro definida em `docs/DESIGN_SYSTEM.md`). Sem hex hardcoded.
- Toda tipografia usa as três famílias do projeto: **Plus Jakarta Sans** (UI), **Instrument Serif** (números display nos KPIs), **JetBrains Mono** (dados tabulares).
- Quando encontrar `style={{}}` legado, migre na hora se for trivial; se for grande, abra item no spec da onda atual.

### 5.2 Motor matemático
- **Excel é a base da verdade.** A planilha Bela Vista é a fonte. Motor copia, não inventa.
- Inputs do usuário (células cinza no Excel) viram campos editáveis na UI.
- Refs circulares no Excel (`mort`, `desc`, `sec` dependem de `VL` que depende delas) são resolvidas com iteração interna (até 8 iters, tolerância 0.001).

### 5.3 UX para técnico veterinário
- Usuário-alvo: técnico que **conhece** os indicadores zootécnicos mas precisa **relembrar com objetividade** o que cada campo significa.
- Todo termo técnico (VL, VS, %VL, PEV, TS, TC, IA, manutenção de prenhez, etc.) tem **tooltip objetivo** com a sigla expandida + fórmula quando relevante. Fonte canônica: `docs/GLOSSARY.md`.
- Para conceitos complexos (manutenção de prenhez, perda de prenhez, secagem por baixa produção), o tooltip pode levar a um modal "Saber mais" com explicação completa.
- **Sem valores padrão de referência** (tipo "típico Bela Vista = X") nos placeholders — cada fazenda tem seus próprios padrões.
- Toda tela com input tem **instrução de uso** visível (banner curto, não escondida em modal).
- Nome da fazenda **sempre visível** quando dentro de uma fazenda.

### 5.4 Nomenclatura (importante — não confundir)
- **"Indicadores"** = sidebar esquerda no Dashboard. **Playground reativo de alavancagem.** O técnico mexe e vê o gráfico recalcular em tempo real. Loop curto (mexe → vê → ajusta).
- **"Parâmetros"** = tela completa (atual `TelaParametros.tsx`). **Calibração de fundo** da fazenda: estado atual do rebanho, reprodução mês a mês (TS/TC), perdas de prenhez, serviços de IA, horizonte. Loop longo (calibra → salva → trabalha em cima).
- Sidebar e Tela Parâmetros têm **escopos disjuntos** — não é "subset rápido + tela completa". Sidebar tem mortalidade jovem/adulta, descarte, idade ao parto, manejo simples. Tela Parâmetros tem reprodução detalhada, serviços IA, etc.
- Nada de "Parâmetros Zootécnicos" no sidebar (vai mudar na Onda 2).

### 5.5 Modelo de rascunho e salvamento
- Toda edição (sidebar + Tela Parâmetros) alimenta **um rascunho único** em memória da sessão.
- Gráficos e KPIs recalculam em tempo real conforme o rascunho muda.
- Quando há rascunho ativo, um **FAB (botão flutuante inferior direito)** aparece com 3 ações: **Salvar** (grava no localStorage), **Enviar para comparativo** (vira Cenário A ou B), **Descartar** (volta ao salvo).
- Rascunho **persiste após envio** pro comparativo — o técnico continua iterando.
- Se o técnico fechar o app sem salvar nem enviar, o rascunho é descartado.

### 5.6 Cenários comparativos
- A fazenda tem 2 slots fixos: **Cenário A** e **Cenário B**. Não mais.
- Regra: A = 1º envio do rascunho, B = 2º envio. Sem vínculo automático com o "Salvo".
- Cada cenário é um **snapshot** do conjunto de parâmetros no momento do envio. Não atualiza sozinho. Pra refrescar, reenvia.
- Tela "Cenários" é **aba normal** — não há redirect automático após envio.
- Tela "Cenários" mostra **apenas o gráfico** lado a lado com filtros (horizonte, categorias). Sem KPIs, sem tabela, sem sidebar de Indicadores nessa tela.

### 5.7 Idioma
- Todo texto de UI em português brasileiro.
- Código (variáveis, funções, comentários internos) em português ou inglês conforme já estiver no projeto — não trocar idioma de código existente sem motivo.

---

## 6. Conceitos críticos do domínio (resumo)

Glossário completo em `docs/GLOSSARY.md`. Aqui o mínimo pra navegar o código:

| Sigla | Significado |
|---|---|
| VL | Vacas em Lactação |
| VS | Vacas Secas (período seco antes do parto) |
| %VL | VL / (VL + VS) — indicador-chave de eficiência |
| PEV | Período de Espera Voluntário (dias após parto até liberar pra IA) |
| TC | Taxa de Concepção |
| TS | Taxa de Serviço (de inseminação) |
| Aptas | Vacas/novilhas vazias prontas para IA |
| Atrasadas | Passaram do PEV sem confirmar prenhez |
| Coortes | Grupos por idade em meses (1m, 2m, ..., 28m) |

**Mapeamento de tempo:**
- Motor `i=0` = abril/2026 (primeiro mês de projeção pra Bela Vista)
- `i=0..7` = agenda Ideagri (8 meses)
- `i=8,9` = serviços históricos
- `i=10+` = meta IA (vacas aptas projetadas)

---

## 7. Cards do Dashboard (Onda 2)

Os 4 KPIs no topo do Dashboard exibem o seguinte, **calculados sobre o horizonte filtrado (`hz` meses)**:

1. **%VL médio** — `média(VL_i / (VL_i + VS_i))` para i no período
2. **Partos totais / Partos vacas** — total = `Σ (partosV_i + partosN_i)`, sub = `Σ partosV_i` e `Σ partosN_i`
3. **Vacas totais / Rebanho total** — `(VL + VS) / (VL + VS + bezerras + novilhas_crescimento + novilhas_prenhas)` no último mês do período, em %
4. **% crescimento** — `(VL+VS no último mês − VL+VS no primeiro mês) / VL+VS no primeiro mês` × 100

**Estética (Variante A confirmada):** borda superior 3px na cor do KPI + label uppercase pequena na mesma cor + valor grande em Instrument Serif (42–44px) na mesma cor + sub-info em ink-3.

**Cores dos KPIs:**

| KPI | Cor |
|---|---|
| %VL médio | `#1A7F3C` (brand Rehagro — indicador-chave alinhado ao brand) |
| Partos | `#A864D4` (roxo, categoria reprodutiva) |
| Vacas / Rebanho | `#2D6BC8` (azul, mesma família de VL — coerência visual) |
| Crescimento | `#5BA84F` (verde claro, indicador positivo) |

**Observações:**
- Os 4 KPIs **não usam fundo colorido**, só borda superior. Os tons ficam por conta do valor numérico em si.
- **Sem Tabela Anual** entre KPIs e gráfico. O Dashboard novo é: KPIs → EvolutionGrid. Direto.

---

## 8. Documentos de referência

- `docs/ROADMAP.md` — ondas, status, dependências
- `docs/DESIGN_SYSTEM.md` — tokens, paleta Rehagro, tipografia, componentes base
- `docs/UX_PRINCIPLES.md` — princípios pro técnico veterinário, padrões de microcopy
- `docs/GLOSSARY.md` — fonte canônica dos tooltips na UI
- `docs/specs/0X-*.md` — especificação de cada onda

---

## 9. Como ajudar o humano a revisar seu trabalho

- Sempre apresentar plano antes de editar.
- Editar um arquivo por vez quando possível; agrupar mudanças correlatas.
- Após terminar, listar o que foi alterado e por quê.
- Sugerir o comando de teste (`npm run dev`, `python _compare.py`) quando aplicável.
- Não inicializar git, não commitar, não criar PR sem pedido explícito.
