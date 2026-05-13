# Spec — Onda 4: Parâmetros reestruturada

> **Onda 4 do ROADMAP.md.** Reorganiza a `TelaParametros` (hoje 8 cards em scroll vertical longo) em uma estrutura por contexto: **Estado Atual** (sempre visível) + **Vacas / Novilhas / Manejo** (tabs).
>
> **Pré-requisitos:** Onda 1 concluída. Ler `CLAUDE.md`, `docs/DESIGN_SYSTEM.md`, `docs/UX_PRINCIPLES.md`, `docs/GLOSSARY.md`.

---

## ⚠ Lembrete crítico — escopo disjunto

**Sidebar "Indicadores"** e **Tela "Parâmetros"** têm escopos diferentes (`CLAUDE.md` §5.4). Esta onda NÃO move parâmetros entre as duas. A sidebar continua com seus 13 campos crônicos (Mortalidade, Descarte, Idade ao Parto, Manejo); esta tela tem os ~30 campos de calibração específica.

Itens que estão **na sidebar** e **não devem aparecer aqui**:
- Mortalidade jovem por faixa (0-3, 3-6, 6-9, 9-12, 12-26m)
- Mortalidade adulta anual
- Descarte involuntário anual
- Descarte voluntário VL
- % saindo lactação (0-8m, 8m+)
- Idade ao parto
- Aborto/natimortos
- % fêmeas nascidas

---

## 0. Resumo executivo

**O que entrega:**
1. **Seção "Estado Atual do Rebanho"** sempre visível no topo (14 inputs do estado inicial)
2. **3 tabs/seções principais**: Vacas · Novilhas · Manejo
3. Cada campo: label com `<InfoTooltip>` + unidade visível + validação leve
4. Campos vêm preenchidos com o valor atual da fazenda (sem placeholders sugestivos)
5. Componente `<ParametroField>` reutilizável agrupando os 4 requisitos acima
6. Indicador "X de Y parâmetros preenchidos" no topo da tela
7. Banner de instrução curto
8. Popular `glossary.ts` com todos os termos usados aqui

**O que NÃO entrega:**
- Mudanças nos parâmetros que estão na sidebar
- Mudanças no que o motor calcula
- Mudanças na lógica de salvamento (continua via `DraftFAB` da Onda 1)

**Critério geral:** o técnico abre a tela e identifica em 3 segundos onde achar o que quer mexer. Cada campo tem ajuda contextual.

---

## 1. Estrutura proposta (decisão a validar antes da execução)

### Seção topo (sempre visível, fora das tabs)

**Estado Atual do Rebanho** (14 inputs em grid 3-4 colunas):
- Vacas em lactação
- Vacas secas
- Vacas vazias aptas
- Vacas atrasadas (em IA)
- Vacas inseminadas < 25d
- Vacas inseminadas > 25d
- Novilhas vazias aptas
- Novilhas atrasadas
- Novilhas inseminadas < 25d
- Novilhas inseminadas > 25d
- Bezerras < 180 dias
- Bezerras/novilhas 180d–aptas
- Partos últimos 30 dias
- Partos 31–60 dias atrás

### Tab "Vacas"

**Subseção: Reprodução**
- PEV (período de espera voluntária) — Select 30/60
- % vacas aptas após o parto
- Manutenção de prenhez/mês (E7)
- % prenhas no toque (DG)
- % prenhezes sem parto efetivo
- TS por mês do ano (12 inputs)
- TC por mês do ano (12 inputs)

**Subseção: Perdas de Prenhez por Mês do Parto**
- 9 inputs (Mês 1 a Mês 9)

**Subseção: Serviços de IA Realizados**
- Perda prenhez total — Vaca
- Array dinâmico de períodos: (nServiços, TC, datas calculadas, partos estimados)
- Botões + Adicionar período / − Remover último

### Tab "Novilhas"

**Subseção: Reprodução**
- Idade de liberação (meses)
- Idade ao 1° parto (Select 24/26/28/30/32/36)
- Manutenção de prenhez/mês (E6)
- % prenhas no toque (DG)
- % prenhezes sem parto efetivo
- TS por mês do ano (12 inputs)
- TC por mês do ano (12 inputs)

**Subseção: Liberação**
- Componente `TabelaLiberacaoNovilhas` (já existe — manter)

**Subseção: Perdas de Prenhez por Mês do Parto**
- 9 inputs (Mês 1 a Mês 9)

### Tab "Manejo"

**Subseção: Secagem**
- Período seco (Select 30/45/60/75/90)
- Declínio de produção (L/mês)
- Limite produção para secagem (kg/dia)
- Data referência secagem por produção
- Fator correção secagem (× VL)

**Subseção: Produção de Leite**
- Meta de produção (L/vaca/dia)
- Consumo bezerros (L/bezerra/dia)

**Subseção: Caso especial — Mês 1 da Projeção**
- Banner explicativo curto sobre por que esses 2 campos são diferentes
- Mortalidade adulta — mês 1 (% a.a.)
- Descarte involuntário — mês 1 (% a.a.)

**Subseção: Horizonte de Projeção**
- Meses a projetar (Select 12/24/36/48/60/84)

---

## 2. Decisão a validar antes da Fase 1

Apresentar a estrutura acima ao usuário antes de implementar. Perguntar:

1. **A estrutura "Estado Atual sempre visível + 3 tabs (Vacas/Novilhas/Manejo)"** está OK ou prefere accordion/collapse sem tabs?
2. **Estado Atual** é a primeira coisa que o técnico edita ao calibrar, ou ele vem da importação do Ideagri e raramente é tocado? (Se for raramente tocado, talvez seja melhor colocá-lo numa tab "Calibração inicial" também, em vez de sempre visível.)
3. **Horizonte de Projeção** fica em Manejo ou vira uma seção isolada (estilo "Configuração de saída")?

---

## 3. Sequência de execução

```
Fase 0 — Validar estrutura proposta com o usuário
   ↓
Fase 1 — Componente ParametroField (Input + Tooltip + Unidade)
   ↓
Fase 2 — Estrutura de Tabs e Seção "Estado Atual"
   ↓
Fase 3 — Conteúdo da tab "Vacas"
   ↓
Fase 4 — Conteúdo da tab "Novilhas"
   ↓
Fase 5 — Conteúdo da tab "Manejo"
   ↓
Fase 6 — Indicador "X de Y" + Banner + Botão Restaurar padrões
   ↓
Fase 7 — Popular glossary.ts com todos os termos
   ↓
Fase 8 — Validação final
```

---

## 4. Fase 1 — Componente ParametroField

### Objetivo
Encapsular o padrão "label + tooltip + input numérico + unidade + validação leve" num componente único.

### Arquivos afetados
- `app/src/components/ui/ParametroField.tsx` — novo

### Implementação

```tsx
import { InfoTooltip } from './InfoTooltip'

interface Props {
  label: string
  term?: string          // chave no glossary; se ausente, sem tooltip
  value: number
  onChange: (v: number) => void
  unidade?: string       // ex: '%', 'dias', 'kg/d', 'L/d'
  step?: number
  min?: number
  max?: number
  // Validação leve: se valor sai da faixa, mostra warning amarelo (mas não bloqueia)
  faixaSugerida?: { min: number; max: number }
}

export function ParametroField({ label, term, value, onChange, unidade, step = 0.01, min, max, faixaSugerida }: Props) {
  const foraFaixa = faixaSugerida
    && (value < faixaSugerida.min || value > faixaSugerida.max)

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-ink-2">
        {term ? <InfoTooltip term={term}>{label}</InfoTooltip> : label}
      </label>
      <div className="flex items-center gap-2 bg-surface border border-line rounded-md px-3 py-1.5 focus-within:border-brand">
        <input
          type="number"
          value={value}
          step={step}
          min={min}
          max={max}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          onFocus={e => e.target.select()}
          className="flex-1 bg-transparent outline-none font-mono tabular-nums text-sm text-ink"
        />
        {unidade && <span className="text-xs text-ink-3">{unidade}</span>}
      </div>
      {foraFaixa && (
        <p className="text-xs text-status-warn">
          Fora da faixa típica ({faixaSugerida!.min}–{faixaSugerida!.max} {unidade ?? ''})
        </p>
      )}
    </div>
  )
}
```

**Variante percentual:** wrappar pra converter entre 0-1 e 0-100:
```tsx
interface PctProps extends Omit<Props, 'value' | 'onChange' | 'unidade' | 'step'> {
  value: number           // 0-1 (interno)
  onChange: (v: number) => void
}

export function ParametroFieldPct({ value, onChange, ...rest }: PctProps) {
  return (
    <ParametroField
      {...rest}
      value={+(value * 100).toFixed(2)}
      onChange={v => onChange(v / 100)}
      unidade="%"
      step={0.1}
      min={0}
      max={100}
    />
  )
}
```

### Critério de aceite
- Componente renderiza com label, tooltip (se term informado), input, unidade
- Aviso amarelo aparece se valor fora da faixa sugerida
- Não bloqueia entrada — apenas avisa

---

## 5. Fase 2 — Estrutura de Tabs e Seção "Estado Atual"

### Objetivo
Reescrever o esqueleto da `TelaParametros.tsx`. Tabs no topo, seção "Estado Atual" abaixo.

### Arquivos afetados
- `app/src/components/TelaParametros.tsx` — reescrita parcial

### Implementação

```tsx
import { useState } from 'react'
import { ParametroField } from './ui/ParametroField'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Seg } from './ui/Seg'
import type { Fazenda } from '@/types'

type Tab = 'vacas' | 'novilhas' | 'manejo'

interface Props {
  fazenda: Fazenda
  // Onda 1: handlers passados pelo DashboardFazenda. Aqui usamos eles
  // pra alimentar o rascunho unificado.
  onParamChange: (key, value) => void
  onEstadoChange: (key, value) => void
  parametros: Parametros   // = rascunho efetivo
  estado: EstadoAtualRebanho  // = rascunho efetivo
}

export function TelaParametros({ fazenda, parametros, estado, onParamChange, onEstadoChange }: Props) {
  const [tab, setTab] = useState<Tab>('vacas')

  return (
    <div className="space-y-6 pb-10 max-w-5xl mx-auto">
      {/* Banner de instrução */}
      <div className="bg-brand-tint-2 border border-brand-soft rounded-md p-3 text-sm text-brand-3">
        Esses parâmetros calibram o motor à realidade da sua fazenda. Os campos vêm preenchidos com a configuração atual da {fazenda.nome}.
      </div>

      {/* Header com indicador X de Y preenchidos */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-ink-3">Parâmetros</p>
          <h1 className="font-display text-2xl text-ink">{fazenda.nome}</h1>
        </div>
        {/* Indicador X / Y */}
        {/* implementar contagem em Fase 6 */}
      </div>

      {/* Seção Estado Atual sempre visível */}
      <Card>
        <CardHeader><CardTitle>Estado Atual do Rebanho</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <ParametroField label="Vacas em lactação" value={estado.vacasLactacao} onChange={v => onEstadoChange('vacasLactacao', v)} step={1} min={0} />
            <ParametroField label="Vacas secas" value={estado.vacasSecas} onChange={v => onEstadoChange('vacasSecas', v)} step={1} min={0} />
            <ParametroField label="Vacas vazias aptas" term="APTA" value={estado.vacasVaziasAptas} onChange={v => onEstadoChange('vacasVaziasAptas', v)} step={1} min={0} />
            <ParametroField label="Vacas atrasadas" term="ATRASADA" value={estado.vacasAtrasadas} onChange={v => onEstadoChange('vacasAtrasadas', v)} step={1} min={0} />
            <ParametroField label="Vacas inseminadas < 25d" value={estado.vacasInseminadas_lt25} onChange={v => onEstadoChange('vacasInseminadas_lt25', v)} step={1} min={0} />
            <ParametroField label="Vacas inseminadas > 25d" value={estado.vacasInseminadas_gt25} onChange={v => onEstadoChange('vacasInseminadas_gt25', v)} step={1} min={0} />
            <ParametroField label="Novilhas vazias aptas" value={estado.novilhasVaziasAptas} onChange={v => onEstadoChange('novilhasVaziasAptas', v)} step={1} min={0} />
            <ParametroField label="Novilhas atrasadas" value={estado.novilhasAtrasadas} onChange={v => onEstadoChange('novilhasAtrasadas', v)} step={1} min={0} />
            <ParametroField label="Novilhas inseminadas < 25d" value={estado.novilhasInseminadas_lt25} onChange={v => onEstadoChange('novilhasInseminadas_lt25', v)} step={1} min={0} />
            <ParametroField label="Novilhas inseminadas > 25d" value={estado.novilhasInseminadas_gt25} onChange={v => onEstadoChange('novilhasInseminadas_gt25', v)} step={1} min={0} />
            <ParametroField label="Bezerras < 180 dias" value={estado.bezerrasMenores180d} onChange={v => onEstadoChange('bezerrasMenores180d', v)} step={1} min={0} />
            <ParametroField label="Bezerras/novilhas 180d–aptas" value={estado.bezerrasNovilhas180dAteAptas} onChange={v => onEstadoChange('bezerrasNovilhas180dAteAptas', v)} step={1} min={0} />
            <ParametroField label="Partos últimos 30 dias" value={estado.partosUltimos30d} onChange={v => onEstadoChange('partosUltimos30d', v)} step={1} min={0} />
            <ParametroField label="Partos 31–60 dias atrás" value={estado.partos31a60d} onChange={v => onEstadoChange('partos31a60d', v)} step={1} min={0} />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-line">
        <Seg
          value={tab}
          onChange={(v: Tab) => setTab(v)}
          options={[
            { value: 'vacas', label: 'Vacas' },
            { value: 'novilhas', label: 'Novilhas' },
            { value: 'manejo', label: 'Manejo' },
          ]}
        />
      </div>

      {/* Conteúdo da tab */}
      {tab === 'vacas' && <TabVacas parametros={parametros} onChange={onParamChange} />}
      {tab === 'novilhas' && <TabNovilhas parametros={parametros} onChange={onParamChange} fazenda={fazenda} />}
      {tab === 'manejo' && <TabManejo parametros={parametros} onChange={onParamChange} />}

      {/* Botão Restaurar padrões */}
      {/* implementar em Fase 6 */}
    </div>
  )
}
```

**Importante — integração com Onda 1:** o componente passa a receber `parametros`, `estado`, `onParamChange`, `onEstadoChange` via props, vindos do estado de rascunho do `DashboardFazenda`. Não mais `fazenda + onSalvar` direto (porque o salvar agora é via DraftFAB).

Isso muda a interface — atualizar a chamada em `DashboardFazenda.tsx`:
```tsx
// Antes:
<TelaParametros fazenda={fazenda} onSalvar={atualizarFazenda} />

// Depois:
<TelaParametros
  fazenda={fazenda}
  parametros={parametrosEfetivos}
  estado={estadoEfetivo}
  onParamChange={handleParamChange}
  onEstadoChange={handleEstadoChange}
/>
```

### Critério de aceite
- Tabs renderizam (Vacas | Novilhas | Manejo)
- Estado Atual sempre visível acima das tabs
- Mexer em campo do Estado Atual aciona `DraftFAB` (cruza com Onda 1)
- Componente já não tem botões "Salvar"/"Restaurar" próprios (movidos pro DraftFAB / posição global)

---

## 6. Fase 3 — Conteúdo da tab "Vacas"

### Objetivo
Implementar 3 subseções dentro de `<TabVacas>`: Reprodução, Perdas de Prenhez, Serviços de IA.

### Arquivos afetados
- Dentro de `TelaParametros.tsx` (componente local) ou arquivo separado `src/components/TelaParametros/TabVacas.tsx`

### Implementação

```tsx
function TabVacas({ parametros, onChange }: { parametros: Parametros; onChange: (k, v) => void }) {
  return (
    <div className="space-y-6">
      {/* Subseção: Reprodução */}
      <Card>
        <CardHeader><CardTitle>Reprodução</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <SelectField label="PEV (período de espera)" term="PEV" value={parametros.pev} ... />
            <ParametroFieldPct label="% vacas aptas após o parto" value={parametros.pctVacasAptasAposParto} ... />
            <ParametroFieldPct label="Manutenção de prenhez/mês" term="MANUTENCAO_PRENHEZ" value={parametros.manutencaoPrenhez_Vacas} ... />
            <ParametroFieldPct label="% prenhas no toque" value={parametros.pctPrenhesToque_Vacas} ... />
            <ParametroFieldPct label="% prenhezes sem parto efetivo" value={parametros.pctPrenhesSemPartoEfetivo_Vacas} ... />
          </div>

          {/* TS mensal */}
          <div>
            <p className="text-xs font-medium text-ink-2 mb-2">
              <InfoTooltip term="TS">Taxa de serviço por mês do ano</InfoTooltip>
            </p>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
              {MESES_KEY.map((mes, i) => (
                <ParametroFieldPct
                  key={mes}
                  label={MESES_LABEL[i]}
                  value={parametros.taxaServicoCacas[mes] ?? 0}
                  onChange={v => onChange('taxaServicoCacas', { ...parametros.taxaServicoCacas, [mes]: v })}
                />
              ))}
            </div>
            <p className="text-xs text-ink-4 mt-1">
              Média anual: {(Object.values(parametros.taxaServicoCacas).reduce((a, b) => a + b, 0) / 12 * 100).toFixed(1)}%
            </p>
          </div>

          {/* TC mensal — análogo */}
          {/* ... */}
        </CardContent>
      </Card>

      {/* Subseção: Perdas de Prenhez por Mês do Parto */}
      <Card>
        <CardHeader>
          <CardTitle>
            <InfoTooltip term="PERDAS_PRENHEZ">Perdas de prenhez por mês do parto</InfoTooltip>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-ink-3 mb-3">
            % de animais que não gerarão partos efetivos, indexado pelo mês do parto previsto.
            Mês 1 = parto iminente (perda mínima); Mês 9 = início da gestação (perda máxima).
          </p>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
            {(parametros.perdasPrenhez_Vaca ?? []).map((v, i) => (
              <ParametroFieldPct
                key={i}
                label={`Mês ${i + 1}`}
                value={v}
                onChange={novo => {
                  const arr = [...(parametros.perdasPrenhez_Vaca ?? [])]
                  arr[i] = novo
                  onChange('perdasPrenhez_Vaca', arr)
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subseção: Serviços de IA Realizados */}
      <Card>
        <CardHeader><CardTitle>Serviços de IA realizados</CardTitle></CardHeader>
        <CardContent>
          {/* Reaproveitar a UI atual de ServicosIA (cards expansíveis com nServ/TC/datas/partos estimados) */}
          {/* Migrar de style inline para tokens */}
        </CardContent>
      </Card>
    </div>
  )
}
```

### Critério de aceite
- Todos os campos da TelaParametros atual relativos a Vacas estão nesta tab
- Cada label tem tooltip onde aplicável
- Mexer em campo aciona DraftFAB

---

## 7. Fase 4 — Conteúdo da tab "Novilhas"

Análogo à Fase 3, com 3 subseções: Reprodução, Liberação, Perdas de Prenhez.

A subseção "Liberação" reutiliza o componente `TabelaLiberacaoNovilhas` existente — manter como está, só substituir hex hardcoded por tokens (`border-amber-400 bg-amber-50` → `border-status-warn bg-status-warn/10`, etc.).

### Critério de aceite
- 3 subseções renderizam
- `TabelaLiberacaoNovilhas` continua funcional
- Tooltips em pelo menos: Manutenção de prenhez (E6), Idade de liberação, Idade ao parto

---

## 8. Fase 5 — Conteúdo da tab "Manejo"

Implementar 4 subseções: Secagem, Produção de Leite, Caso especial Mês 1, Horizonte.

Caso especial Mês 1 — usar banner explicativo:
```tsx
<Card>
  <CardHeader><CardTitle>Mês 1 da Projeção — Caso especial</CardTitle></CardHeader>
  <CardContent>
    <div className="bg-status-warn/10 border border-status-warn/30 rounded-md p-3 text-xs text-ink-2 mb-4">
      O 1° mês projetado reflete o que já ocorreu no período atual. A planilha usa valores distintos
      para este mês (Evolução Rebanho C12 e C75) antes de adotar as taxas anuais crônicas.
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <ParametroFieldPct label="Mortalidade adulta — mês 1 (% a.a.)" value={parametros.mortalidadeAdultaAnualMes1} ... />
      <ParametroFieldPct label="Descarte involuntário — mês 1 (% a.a.)" value={parametros.descarteInvoluntarioAnualMes1} ... />
    </div>
  </CardContent>
</Card>
```

### Critério de aceite
- 4 subseções de Manejo renderizam
- Banner do caso especial Mês 1 é visível e claro

---

## 9. Fase 6 — Indicador "X de Y" + Restaurar padrões

### Objetivo
Mostrar progresso de preenchimento no topo da tela e oferecer botão de reset por seção.

### Implementação

**Contador "X de Y preenchidos":**
- Definir o que conta como "preenchido" — pra inputs numéricos: valor != 0 ou != default
- Pode ser cálculo simples ou requerir flag por campo

Sugestão simples: comparar contra `DEFAULT_PARAMETROS` — campos que diferem do default = "preenchido pelo usuário".

```tsx
function contarPreenchidos(parametros: Parametros, defaults: Parametros): { preenchidos: number; total: number } {
  // navegação pelas keys e comparação
}
```

**Botão Restaurar padrões por seção:**
- Em cada Card de subseção, botão pequeno no canto superior direito: `Restaurar`
- Reseta apenas os campos daquela subseção

### Critério de aceite
- "X de Y" aparece no header da tela
- Atualiza ao mudar campo
- Restaurar reseta a seção correspondente

---

## 10. Fase 7 — Popular glossary.ts

### Objetivo
Garantir que todos os termos usados nos tooltips desta tela existem em `glossary.ts`.

### Lista de termos a garantir
- PEV (Onda 1 já adicionou)
- TC (Onda 1)
- TS (Onda 1)
- MANUTENCAO_PRENHEZ (Onda 1)
- META_IA (Onda 1)
- APTA — novo
- ATRASADA — novo
- PERDAS_PRENHEZ — novo (= perdas de prenhez por mês do parto)
- PERDA_PRENHEZ_TOTAL — novo
- ABORTO_NATIMORTOS — novo
- PCT_VACAS_APTAS_POS_PARTO — novo
- PCT_PRENHES_TOQUE — novo
- PCT_PRENHES_SEM_PARTO — novo
- IDADE_PARTO — novo
- IDADE_LIBERACAO — novo
- PERIODO_SECO — novo
- DECLINIO_PROD — novo
- LIMITE_PROD_SECAGEM — novo
- FATOR_CORRECAO_SECAGEM — novo
- META_PRODUCAO — novo
- CONSUMO_BEZERROS — novo
- HORIZONTE_PROJECAO — novo

Tom: objetivo, conforme `GLOSSARY.md` reescrito (sigla + fórmula se houver + 1-2 linhas só pra conceitos complexos).

### Critério de aceite
- Em dev, console **não loga** "termo X não está em GLOSSARY" pra nenhum tooltip da tela
- Cada definição é objetiva, não didática

---

## 11. Fase 8 — Validação final

### Checks
- [ ] `npm run build` passa
- [ ] `npx tsc --noEmit` exit 0
- [ ] Estado Atual sempre visível no topo
- [ ] 3 tabs funcionais (Vacas, Novilhas, Manejo)
- [ ] Todas as labels têm tooltip (onde o conceito é não-trivial)
- [ ] Unidades visíveis em todos os campos (%, m, d, kg/d, L/d)
- [ ] Mexer em qualquer campo aciona DraftFAB
- [ ] Console sem warnings de termos faltando no glossary
- [ ] Contador "X de Y" atualiza ao editar
- [ ] Restaurar por seção funciona
- [ ] Comportamento do motor inalterado (mesmos valores antes/depois)

---

## 12. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| A interface da `TelaParametros` muda muito (passa a receber rascunho via props) — quebra integrações | Conferir todos os imports de `TelaParametros` antes de mexer; refatorar `DashboardFazenda` em conjunto |
| `TabelaLiberacaoNovilhas` quebra ao migrar | Manter como está, só trocar hex hardcoded — mínima intrusão |
| Reset por seção causa perda de dados não intencional | Modal de confirmação antes de resetar uma seção |
| Tooltips ficam densos demais e atrapalham leitura | Manter tom objetivo do GLOSSARY; preferir links pra modal "Saber mais" pros conceitos complexos |

---

## 13. Como rodar e testar

```powershell
npm run dev
```

Roteiro:
1. Abrir Bela Vista → Parâmetros
2. Estado Atual visível no topo, mexer num campo, ver DraftFAB
3. Tab Vacas: conferir 3 subseções, tooltips funcionando
4. Tab Novilhas: conferir TabelaLiberacaoNovilhas funcional
5. Tab Manejo: conferir banner do caso especial Mês 1
6. Mexer em vários campos, depois Descartar no DraftFAB → tudo volta ao salvo
7. Mexer e Salvar → grava no localStorage
