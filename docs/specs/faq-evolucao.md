# Spec — Aba de Perguntas Frequentes (FAQ) da Evolução de Rebanho

> **Tipo:** especificação de feature para implementação no Claude Code.
> **Leia antes de implementar:** `CLAUDE.md` (regras de ouro), `docs/GLOSSARY.md` (fonte canônica dos termos), `docs/DESIGN_SYSTEM.md` (tokens/tipografia), `src/engine/projecao.ts` (mecânica real do motor — fonte da verdade para as explicações).
> **Apresente um plano de execução antes de editar arquivos e aguarde aprovação humana** (conforme `CLAUDE.md` §4).

---

## 1. Objetivo

Criar uma nova aba **"Ajuda"** (FAQ) dentro do Dashboard da fazenda. A aba existe para:

1. **Orientar o preenchimento** — explicar o que cada Indicador (sidebar) e cada Parâmetro (tela) faz na projeção.
2. **Ajudar a justificar resultados** — dar ao técnico a explicação do *porquê* de um comportamento da curva (queda de VL, poucos partos de novilha, efeito de perda de prenhez, mortalidade etc.), em linguagem que ele possa repassar ao produtor rural.

O público são os três usos combinados: consulta rápida em campo, onboarding de novos técnicos e apoio na conversa com o produtor. O usuário-alvo **conhece** os conceitos zootécnicos, mas precisa **relembrar com objetividade** e **traduzir o impacto** ao produtor (mesma premissa de `CLAUDE.md` §5.3).

### Não-objetivos
- Não é um glossário (isso já vive nos tooltips, fonte `docs/GLOSSARY.md`). O FAQ **referencia** os termos, não os redefine de forma divergente.
- Não substitui a documentação técnica do motor.
- Não menciona "planilha", "Excel" nem células (D31, A61 etc.). O técnico opera a ferramenta, não a planilha. A linguagem é sempre a da interface.

---

## 2. Princípio central da arquitetura de informação

O técnico chega ao FAQ em um de dois estados mentais:

- **Modo preenchimento** — "estou configurando a fazenda e não sei o que este campo faz."
- **Modo justificativa** — "o gráfico mostrou algo e preciso explicar ao produtor."

A entrada principal NÃO é um índice de categorias técnicas (o técnico não deve precisar saber em que "categoria" o assunto mora). A entrada é **busca em tempo real** + **dois caminhos de alto nível**:

1. **"Como preencho?"** → conteúdo organizado pelos lugares reais da ferramenta: **Indicadores** (sidebar reativa) e **Parâmetros** (tela de calibração). Respeitar a distinção disjunta de `CLAUDE.md` §5.4 — não tratar um como subconjunto do outro.
2. **"Como explico esse resultado?"** → conteúdo organizado por **sintoma de leitura** ("VL caiu num mês", "poucos partos de novilha", "%VL alto demais", "salto/queda na reposição").

Transversal aos dois caminhos: **busca** (filtra todas as perguntas) e **tags** clicáveis (`#vacas-lactação`, `#secagem`, `#prenhez`, `#novilhas`, `#mortalidade`, `#reprodução`, `#forragem`) para navegação cruzada, já que o mesmo assunto serve preenchimento e justificativa.

---

## 3. Estrutura fixa de cada resposta (padrão de 3 blocos)

**Toda** pergunta segue o mesmo padrão. Essa repetição é o que torna o FAQ intuitivo — o técnico aprende a forma uma vez e lê todas iguais.

1. **Resposta curta — "para falar ao produtor"** (destacada, cor de info)
   Uma a duas frases que o técnico possa dizer em voz alta. Sem jargão de motor. É o que resolve a consulta rápida e a conversa com o produtor.

2. **Por que acontece — a mecânica** (corpo)
   A lógica real do motor (`projecao.ts`), traduzida para linguagem de campo. Pode usar "fórmula em palavras" quando ajudar (ex.: "entram = vacas que pariram + novilhas de 1º parto; saem = secagens + mortes + descartes"). **Nunca** cita planilha/célula. **Nunca** inventa cálculo — se houver dúvida sobre a mecânica, o Claude Code deve reler `projecao.ts` antes de escrever.

3. **O que checar na ferramenta** (lista curta + ações)
   Onde o técnico olha para confirmar: qual Indicador, qual Parâmetro, qual coluna da tabela mensal, qual aba. Inclui tags do assunto.

> Regra de conteúdo (de `CLAUDE.md` §5.3): as respostas falam em **padrões** ("quando os partos do mês são poucos…"), nunca em valores fixos de uma fazenda específica ("em nov/2027 cai porque…"). O exemplo ensina a **ler o padrão**, não decora um caso. Sem "valor típico = X" em lugar nenhum.

---

## 4. Onde a aba se encaixa

- Nova aba no Dashboard da fazenda, junto às demais (Indicadores/gráfico, Tabela mensal, Secagem, Forragem, Cenários, Previsto×Realizado).
- Nome sugerido da aba: **"Ajuda"** (ícone de interrogação/`help`). Avaliar consistência com o padrão de nomes das abas existentes — o Claude Code decide o rótulo final que melhor se encaixa no conjunto.
- Nome da fazenda permanece sempre visível (regra `CLAUDE.md` §5.3).
- A aba é **estática/local** — não depende de rede, não chama o motor, não lê dados da fazenda. É conteúdo de referência. (Numa evolução futura pode receber deep-links a partir de tooltips; ver §8.)

---

## 5. Contrato visual e técnico

**Seguir o sistema visual existente — não inventar um novo.** O Claude Code deve extrair os valores reais do repositório, não deste documento:

- **Tokens/cores:** usar a paleta Rehagro de `docs/DESIGN_SYSTEM.md` e os tokens Tailwind do projeto. Zero hex hardcoded, zero `style={{}}` inline em código novo (`CLAUDE.md` §5.1).
- **Tipografia:** as três famílias do projeto — **Plus Jakarta Sans** (UI), **Instrument Serif** (números display, se houver algum destaque numérico), **JetBrains Mono** (qualquer trecho de "fórmula em palavras" ou dado tabular). Confirmar nomes/uso em `docs/DESIGN_SYSTEM.md`.
- **Componentes:** reaproveitar os componentes shadcn/ui já existentes em `src/components/ui/` (Card, Badge, Input, Accordion/Collapsible se houver, etc.). Não recriar primitivos.
- **Consistência de termos:** todo termo técnico (VL, VS, %VL, PEV, TS, TC, IA, manutenção de prenhez, secagem por baixa produção, aptas, atrasadas, coortes) deve usar a definição de `docs/GLOSSARY.md`. Se o FAQ precisar explicar um termo, ele **aponta para** / reusa a definição canônica, não cria uma versão concorrente.
- **Idioma:** português brasileiro em toda a UI (`CLAUDE.md` §5.7).
- **i18n/escala:** estruturar o conteúdo de forma que adicionar/editar perguntas não exija mexer em layout (ver §6).

---

## 6. Estrutura de conteúdo no código

**Decisão de implementação delegada ao Claude Code** (estруturar dados vs. inline, formato do arquivo, tipo do componente). Requisito inegociável: **o conteúdo das perguntas deve ser editável sem tocar no layout** — uma pessoa não-técnica deve conseguir corrigir um texto de resposta achando o conteúdo num lugar previsível e legível.

O conteúdo canônico já redigido está em **`docs/faq-conteudo.md`** (parte deste pacote). O Claude Code deve transcrevê-lo para a estrutura de dados/código que escolher, preservando:

- o agrupamento por caminho (preenchimento / justificativa) e por seção;
- os 3 blocos de cada resposta (resposta curta / mecânica / o que checar);
- as tags de cada pergunta;
- a ordem das perguntas dentro de cada seção.

Cada pergunta tem, no mínimo: `id`, `caminho` ("preenchimento" | "justificativa"), `secao`, `pergunta`, `respostaCurta`, `mecanica`, `oQueChecar` (lista), `tags` (lista). Campo opcional `verEmDetalhe` (string de prompt) para um botão que dispara ajuda contextual, se o projeto tiver esse recurso.

---

## 7. Comportamentos de UI (requisitos funcionais)

1. **Busca** filtra perguntas em tempo real por texto da pergunta, do corpo e das tags. Sem resultados → estado vazio amigável ("Nenhuma pergunta encontrada para…").
2. **Dois caminhos** ("Como preencho?" / "Como explico esse resultado?") alternam o conjunto de seções exibido. Um deve vir ativo por padrão (sugestão: "Como explico esse resultado?", que é o uso mais frequente em campo).
3. **Tags clicáveis** aplicam o termo como filtro de busca.
4. **Perguntas expansíveis** (accordion). Uma aberta por vez OU múltiplas — decisão do Claude Code conforme o padrão já usado no app. A primeira pergunta da seção pode vir aberta como amostra.
5. **Acessibilidade:** navegável por teclado, `aria-expanded` nos toggles, foco visível. Contraste adequado em light/dark (se o app tiver dark mode).
6. **Responsivo:** os dois caminhos viram empilhados no mobile; busca sempre no topo.

---

## 8. Evoluções futuras (fora do escopo desta entrega, registrar como ideias)

- **Deep-link a partir dos tooltips:** o botão "Saber mais" de um tooltip (previsto em `CLAUDE.md` §5.3 para conceitos complexos) abrir a aba Ajuda já na pergunta correspondente (via âncora/`id`).
- **Busca destacando o termo** dentro das respostas.
- **Marcar perguntas como úteis** (feedback) para priorizar conteúdo.
- **Versão imprimível** de uma pergunta para deixar com o produtor.

---

## 9. Critérios de aceitação

- [ ] Existe uma nova aba de Ajuda/FAQ no Dashboard da fazenda, coerente com as abas existentes.
- [ ] A aba tem busca funcional em tempo real e os dois caminhos de entrada.
- [ ] Todas as perguntas de `docs/faq-conteudo.md` estão presentes, com os 3 blocos e as tags.
- [ ] Nenhuma resposta menciona planilha/Excel/células; nenhuma usa valores fixos de fazenda como se fossem padrão.
- [ ] Os termos técnicos batem com `docs/GLOSSARY.md`; a explicação da mecânica bate com `src/engine/projecao.ts`.
- [ ] Visual usando tokens/tipografia/componentes existentes; zero hex hardcoded e zero `style={{}}` inline em código novo.
- [ ] Conteúdo editável sem mexer no layout.
- [ ] `npm run build` e `tsc` passam sem erros.
- [ ] Português brasileiro em toda a UI.

---

## 10. Validação sugerida

```bash
npm run dev      # abrir a fazenda → aba Ajuda; testar busca, caminhos, tags, expandir
npm run build    # deve sair 0
```

Conferir manualmente 3 perguntas (uma de preenchimento, duas de justificativa) contra `projecao.ts` para garantir que a mecânica descrita corresponde ao cálculo real.
