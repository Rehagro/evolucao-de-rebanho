# Princípios de UX — Evolução de Rebanho

> Regras de comportamento da interface. Quando houver dúvida sobre como apresentar
> algo na UI, este documento desempata.

---

## 1. Usuário-alvo

**Técnico veterinário da Rehagro.**

Características que orientam o design:

- **Conhece os indicadores zootécnicos.** Não precisa de tutorial sobre o que é VL ou PEV.
- **Precisa relembrar com objetividade.** Trabalha em várias fazendas, troca de contexto o tempo todo. Não vai lembrar de cabeça que "Param!A37 é declínio mensal em L/dia".
- **Foco em ação.** Quer importar dados → conferir parâmetros → ver projeção. Não está procurando inspiração; está executando trabalho.
- **Pode ter pouca paciência com formulários longos.** A `TelaParametros` atual com ~30 inputs verticais é hostil a esse perfil.

**Implicação:** a interface deve ser **densa de informação útil** (não infantilizada), mas **clara em microcopy** (tooltips, exemplos, instruções curtas onde necessário).

---

## 2. Princípios

### 2.1 Clareza máxima em cada input

- Toda **label** acompanhada de:
  - **Unidade explícita** (%, meses, dias, kg/dia, L) ao lado ou como sufixo
  - **Tooltip** objetivo com a sigla expandida + fórmula se houver (fonte: `docs/GLOSSARY.md`)
- Campos vêm preenchidos com o **valor atual da fazenda** (não sugestões genéricas).
- Campos correlatos ficam **agrupados visualmente** (não dispersos numa lista vertical longa).
- Campos sensíveis (que mais afetam o resultado) têm **destaque visual leve** — borda mais grossa ou ícone "⚠ sensível" — pra orientar onde começar.

### 2.2 Instruções por contexto, visíveis

- Telas com fluxo (Upload, primeira vez em Parâmetros, Cenários) têm um **banner de instrução curto** no topo: 1-2 frases, em fundo neutro.
- A instrução **nunca** fica escondida em modal/popup que precise ser aberto.
- Se uma instrução secundária for útil mas longa, vira **collapse "Saber mais"** abaixo do banner.

### 2.3 Feedback imediato e específico

- **Loading** com texto explicando o que está sendo feito ("Processando arquivo...", não só spinner).
- **Sucesso** com cor verde + ícone + texto curto.
- **Erro** com cor vermelha + ícone + texto que diga **o que deu errado e como resolver** (não "Erro genérico").
- Após upload: **preview do que foi importado** (contagens, primeiras linhas, alertas de campos faltantes).

### 2.4 Hierarquia visual no Dashboard

Ordem de importância visual:

1. **Gráfico de evolução** (centro/destaque, ~50% da altura)
2. **4 KPIs no topo** (chamada de atenção rápida)
3. **Sidebar de Indicadores** (esquerda, edição rápida)
4. **Tabela anual / detalhes** (baixo ou tab secundária)

O técnico abre o app e a primeira coisa que vê é a evolução. Tudo o mais é suporte.

### 2.5 Nomenclatura consistente

| Termo no app | Significa |
|---|---|
| **Indicadores** | Sidebar lateral esquerda. **Playground reativo de alavancagem.** Mexer aqui recalcula o gráfico em tempo real. Loop curto (mexe → vê impacto → ajusta). |
| **Parâmetros** | Tela completa (aba dedicada). **Calibração de fundo** da fazenda: estado atual, reprodução detalhada, serviços IA, horizonte. Loop longo (calibra → salva → trabalha em cima). |
| **Cenário A / Cenário B** | Snapshots fixos pra comparar lado a lado. A = 1º envio, B = 2º. Não vivos — só atualizam se forem reenviados. |
| **Importar dados** | Upload de CSVs do Ideagri. Nunca "carregar arquivo" ou "subir". |
| **Projeção** | O resultado calculado. Nunca "simulação" no contexto principal (reservado para Cenários). |
| **Rascunho** | Edições em memória que ainda não foram salvas nem enviadas pro comparativo. Persiste durante a sessão, descartado ao fechar. |
| **Salvo** | O conjunto de parâmetros persistido no localStorage da fazenda. É a "verdade" da fazenda quando o app abre. |

**Nome da fazenda sempre visível** quando o usuário está dentro de uma fazenda. Em fonte maior que metadados.

### 2.5.1 Indicadores vs Parâmetros — escopos disjuntos

Importante: Indicadores e Parâmetros **não são "subset rápido + tela completa"** — são escopos **diferentes**, não sobrepostos:

- **Indicadores (sidebar)** tem: mortalidade jovem por faixa, mortalidade adulta, descarte involuntário/voluntário, % saindo lactação, idade ao parto, aborto/natimortos, % fêmeas nascidas. ~13 campos de alta alavancagem.
- **Parâmetros (tela)** tem: estado atual do rebanho, reprodução detalhada (PEV, taxas mensais TS/TC), perdas de prenhez por mês, manejo (período seco, secagem, etc.), serviços de IA realizados, produção de leite, horizonte. ~30 campos de calibração específica.

Nenhum dos dois é redundante. O usuário usa cada um pra propósitos diferentes.

### 2.5.2 Modelo de rascunho e salvamento

**Princípio:** o técnico explora cenários sem medo de "estragar" a fazenda. Toda edição é rascunho até ele decidir o que fazer com ela.

**Comportamento:**
1. Ao abrir uma fazenda, o rascunho = o Salvo (sem indicação visual).
2. Qualquer edição (sidebar **ou** Tela Parâmetros) entra no **mesmo rascunho único**. Gráficos e KPIs recalculam em tempo real conforme o rascunho muda.
3. Quando o rascunho diverge do Salvo, aparece um **FAB (botão flutuante inferior direito)** com 3 ações:
   - **Salvar** — grava o rascunho no localStorage (vira o novo Salvo)
   - **Enviar para comparativo** — abre escolha "A ou B" e grava como snapshot de Cenário
   - **Descartar** — volta o rascunho ao Salvo
4. **Enviar pro comparativo não salva no localStorage** — Salvar e Enviar são caminhos independentes.
5. **Após enviar, o rascunho persiste** — o técnico continua iterando sem perder o trabalho.
6. Fechar o app sem Salvar nem Enviar → rascunho é descartado, próxima abertura mostra o Salvo.

**Indicador visual de rascunho ativo:** um badge discreto ("Não salvo" ou similar) próximo ao nome da fazenda ou na topbar. Não invasivo.

### 2.5.3 Cenários comparativos — desenho

- A fazenda tem **2 slots fixos**: Cenário A e Cenário B. Sem mais, sem menos.
- **Snapshot fixo:** cada cenário é uma cópia congelada dos parâmetros no momento do envio. Mudar o rascunho depois não altera o cenário.
- Tela "Cenários" é **aba normal** (sem redirect automático após envio). Técnico abre quando quiser.
- **Tela "Cenários" mostra apenas o gráfico lado a lado** com os filtros (horizonte, categorias). Sem KPIs, sem tabela anual, sem sidebar de Indicadores.
- Ações disponíveis em Cenários: limpar A, limpar B, promover B → A (substitui A com o snapshot de B).

### 2.6 Empty states com fluxo

Quando uma tela está vazia (sem dados ainda):

- **Mensagem curta** dizendo o que falta
- **CTA claro** com o próximo passo
- Quando há sequência (Upload → Parâmetros → Dashboard), mostrar **stepper visual** com os 3 passos e qual está pendente.

Exemplo bom (Dashboard sem dados):

```
[Stepper: ✓ Criar fazenda → ⏵ Importar dados → ○ Conferir parâmetros → ○ Ver projeção]

Para gerar projeções, importe os dados do Ideagri.

[Importar dados]  [Preencher manualmente]
```

### 2.7 Termos técnicos sempre explicáveis

- Toda primeira aparição de termo técnico na tela tem ícone `(?)` ao lado.
- Clique/hover → tooltip com definição curta.
- Definição extensa (modal "saber mais") opcional, para conceitos densos como "manutenção de prenhez" ou "secagem por baixa produção".
- **Fonte única:** `docs/GLOSSARY.md`. Componente `<InfoTooltip term="VL">` lê de lá.

### 2.8 Densidade e ritmo

- **Telas de input** (Parâmetros, Upload): podem ser densas; o técnico quer ver tudo de uma vez.
- **Telas de leitura** (Dashboard, gráficos, tabelas): respiração maior; menos ruído visual.
- Em tabelas longas (TabelaMensal, Forragem, MetaInseminação): linhas alternadas, sticky header, sem zebra agressiva.

### 2.9 Validações leves, não imposições

- Cada fazenda tem seus próprios padrões — **não usar "valores típicos" pré-preenchidos nem placeholders sugerindo números**. Quando o usuário criar uma fazenda nova, os campos vêm com os valores default do sistema (que ele substitui pela realidade da fazenda dele).
- Validações de faixa são **avisos**, não bloqueios. Se o técnico digitar 200% de mortalidade, mostrar aviso amarelo mas deixar passar — pode ser teste/exploração.
- Em cada seção de input, manter botão **Restaurar padrões** disponível.

### 2.10 Voltar e desfazer sem medo

- Toda edição é rascunho até o técnico clicar Salvar ou Enviar para comparativo. Fechar o app descarta o rascunho.
- O botão **Descartar** no FAB de rascunho ativo sempre devolve ao Salvo.
- Em Cenários: "Limpar B" e "Limpar A" sempre disponíveis.
- Em qualquer tela de input, possibilidade de **Restaurar padrões** numa seção (`Defaults` de cada grupo).

---

## 3. Padrões de microcopy

### 3.1 Tom
- Direto, profissional, sem condescendência.
- Português brasileiro neutro (não regional).
- Sem emojis em copy de UI (exceto checks ✓ em estados).

### 3.2 Verbos por contexto

| Ação | Verbo preferido | Evitar |
|---|---|---|
| Importar CSV | "Importar dados" | "Carregar", "Subir", "Upload" como CTA |
| Salvar parâmetros | "Salvar" | "Confirmar", "Aplicar" |
| Comparar cenários | "Comparar" | "Simular" |
| Recalcular projeção | "Atualizar projeção" | "Rodar", "Calcular" |

### 3.3 Mensagens de erro

Estrutura padrão: **[o que aconteceu] + [como resolver]**.

- ✗ "Erro ao processar arquivo."
- ✓ "Arquivo de Secagem sem coluna `Dt. sec. prev.`. Reexporte do Ideagri incluindo essa coluna."

### 3.4 Estados vazios

- "Nenhuma fazenda cadastrada" → CTA "Criar primeira fazenda"
- "Importe os dados para ver a projeção" → CTA "Importar dados"

---

## 4. Acessibilidade mínima

- Todos os botões têm texto (não só ícone) ou `aria-label` claro.
- Contraste mínimo AA em texto sobre fundo.
- Inputs com `<label>` associado por `htmlFor`.
- Ordem de tab navegável.

(Não é prioridade nesta fase, mas não introduzir regressões.)

---

## 5. O que **não** fazer

- ❌ Esconder informação crítica em hover apenas (deve ter ícone visível indicando que tem mais info).
- ❌ Usar emoji como ícone funcional (use `lucide-react`).
- ❌ Modais para tarefas longas (Parâmetros nunca em modal).
- ❌ Mensagens genéricas tipo "Algo deu errado".
- ❌ Animar transições maiores que 200ms — o técnico quer velocidade.
- ❌ Esconder o nome da fazenda quando dentro dela.
- ❌ Usar "Parâmetros Zootécnicos" como label do sidebar — agora é "Indicadores".
