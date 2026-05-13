import { supabase, type FazendaRow } from '@/lib/supabase'
import type { Fazenda, EstadoAtualRebanho, Cenario, RebanhoAtual, PrevistoRealizado, Parametros } from '@/types'
import { DEFAULT_PARAMETROS } from '@/lib/defaults'

/**
 * Lista fazendas do usuário logado (RLS aplica filtro tecnico_id = auth.uid()).
 * Apenas metadados — não traz dados_rebanho.
 */
export async function listarFazendas(): Promise<Fazenda[]> {
  const { data: fazendas, error } = await supabase
    .from('fazendas')
    .select('*')
    .order('criado_em', { ascending: false })

  if (error) throw error
  if (!fazendas || fazendas.length === 0) return []

  // Busca dados_rebanho em batch
  const ids = fazendas.map(f => f.id)
  const { data: dados, error: e2 } = await supabase
    .from('dados_rebanho')
    .select('*')
    .in('fazenda_id', ids)

  if (e2) throw e2

  const dadosMap = new Map(dados?.map(d => [d.fazenda_id, d]) ?? [])

  return fazendas.map(f => rowToFazenda(f, dadosMap.get(f.id)))
}

/** Busca uma fazenda + seus dados_rebanho. */
export async function buscarFazenda(id: string): Promise<Fazenda | null> {
  const { data: f, error } = await supabase
    .from('fazendas')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!f) return null

  const { data: d } = await supabase
    .from('dados_rebanho')
    .select('*')
    .eq('fazenda_id', id)
    .maybeSingle()

  return rowToFazenda(f, d ?? undefined)
}

/** Cria uma nova fazenda (linha em `fazendas` + linha em `dados_rebanho`). */
export async function criarFazenda(fazenda: Fazenda): Promise<Fazenda> {
  const user = await supabase.auth.getUser()
  const userId = user.data.user?.id
  if (!userId) throw new Error('Usuário não autenticado')

  const { data: fRow, error: eF } = await supabase
    .from('fazendas')
    .insert({
      id: fazenda.id,
      nome: fazenda.nome,
      tecnico_id: userId,
    })
    .select()
    .single()

  if (eF) throw eF

  const { data: dRow, error: eD } = await supabase
    .from('dados_rebanho')
    .insert({
      fazenda_id: fRow.id,
      parametros: fazenda.parametros as unknown as Record<string, unknown>,
      estado_atual: fazenda.estadoAtual as unknown as Record<string, unknown>,
      rebanho_atual: serializeRebanho(fazenda.rebanhoAtual),
      cenario_a: fazenda.cenarioA as unknown as Record<string, unknown> | null,
      cenario_b: fazenda.cenarioB as unknown as Record<string, unknown> | null,
      previsto_realizado: fazenda.previstoRealizado as unknown as unknown[],
      logo_base64: fazenda.logoBase64 ?? null,
      data_ultimo_upload: fazenda.dataUltimoUpload,
    })
    .select()
    .single()

  if (eD) throw eD

  return rowToFazenda(fRow, dRow)
}

/**
 * Salva fazenda — cria se não existe, atualiza se existe.
 * Detecta via SELECT na tabela `fazendas` por id.
 */
export async function salvarFazenda(fazenda: Fazenda): Promise<Fazenda> {
  const { data: existente } = await supabase
    .from('fazendas')
    .select('id')
    .eq('id', fazenda.id)
    .maybeSingle()

  if (existente) {
    await atualizarFazenda(fazenda)
    const recarregado = await buscarFazenda(fazenda.id)
    if (!recarregado) throw new Error('Fazenda salva mas não foi possível recarregar')
    return recarregado
  }
  return await criarFazenda(fazenda)
}

/** Atualiza fazenda (metadados + dados). Upsert em dados_rebanho. */
export async function atualizarFazenda(fazenda: Fazenda): Promise<void> {
  const { error: eF } = await supabase
    .from('fazendas')
    .update({ nome: fazenda.nome })
    .eq('id', fazenda.id)

  if (eF) throw eF

  const { error: eD } = await supabase
    .from('dados_rebanho')
    .upsert({
      fazenda_id: fazenda.id,
      parametros: fazenda.parametros as unknown as Record<string, unknown>,
      estado_atual: fazenda.estadoAtual as unknown as Record<string, unknown>,
      rebanho_atual: serializeRebanho(fazenda.rebanhoAtual),
      cenario_a: fazenda.cenarioA as unknown as Record<string, unknown> | null,
      cenario_b: fazenda.cenarioB as unknown as Record<string, unknown> | null,
      previsto_realizado: fazenda.previstoRealizado as unknown as unknown[],
      logo_base64: fazenda.logoBase64 ?? null,
      data_ultimo_upload: fazenda.dataUltimoUpload,
    }, { onConflict: 'fazenda_id' })

  if (eD) throw eD
}

export async function deletarFazenda(id: string): Promise<void> {
  const { error } = await supabase.from('fazendas').delete().eq('id', id)
  if (error) throw error
}

export async function renomearFazenda(id: string, nome: string): Promise<void> {
  const { error } = await supabase.from('fazendas').update({ nome }).eq('id', id)
  if (error) throw error
}

/**
 * Duplica fazenda como nova evolução. Sugere nome com o mês atual.
 * Ex: "Bela Vista" → "Bela Vista — Mai/26"
 */
export async function duplicarFazendaComoEvolucao(id: string, novoNome?: string): Promise<Fazenda | null> {
  const original = await buscarFazenda(id)
  if (!original) return null

  const nome = novoNome ?? sugerirNomeEvolucao(original.nome)
  const copia: Fazenda = {
    ...JSON.parse(JSON.stringify(original)),
    id: crypto.randomUUID(),
    nome,
    dataCriacao: new Date().toISOString(),
  }
  // Datas dentro de rebanhoAtual e cenários voltam para Date no buscar; aqui já serializou.
  return await criarFazenda(copia)
}

export function sugerirNomeEvolucao(nomeBase: string): string {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const agora = new Date()
  const sufixo = `${meses[agora.getMonth()]}/${String(agora.getFullYear()).slice(2)}`
  // Se já tem um sufixo " — Mes/AA", substitui; senão adiciona
  const limpo = nomeBase.replace(/\s+—\s+\w{3}\/\d{2}$/, '')
  return `${limpo} — ${sufixo}`
}

// ─── helpers de conversão Row ↔ Fazenda ──────────────────────────────────

function rowToFazenda(f: FazendaRow, d?: Record<string, unknown> | null): Fazenda {
  const params = (d?.parametros ?? {}) as Partial<Parametros>
  return {
    id: f.id,
    nome: f.nome,
    dataCriacao: f.criado_em,
    dataUltimoUpload: (d?.data_ultimo_upload as string | null) ?? null,
    parametros: { ...DEFAULT_PARAMETROS, ...params },
    estadoAtual: (d?.estado_atual as EstadoAtualRebanho) ?? defaultEstado(),
    rebanhoAtual: deserializeRebanho(d?.rebanho_atual as Record<string, unknown> | null | undefined),
    cenarioA: (d?.cenario_a as Cenario | null) ?? null,
    cenarioB: (d?.cenario_b as Cenario | null) ?? null,
    previstoRealizado: ((d?.previsto_realizado as PrevistoRealizado[]) ?? []),
    logoBase64: (d?.logo_base64 as string | null) ?? null,
  }
}

function defaultEstado(): EstadoAtualRebanho {
  return {
    vacasLactacao: 0, vacasSecas: 0,
    bezerrasMenores180d: 0, bezerrasNovilhas180dAteAptas: 0,
    vacasVaziasAptas: 0, vacasAtrasadas: 0,
    vacasInseminadas_lt25: 0, vacasInseminadas_gt25: 0,
    novilhasVaziasAptas: 0, novilhasAtrasadas: 0,
    novilhasInseminadas_lt25: 0, novilhasInseminadas_gt25: 0,
    partosUltimos30d: 0, partos31a60d: 0,
  }
}

function serializeRebanho(r: RebanhoAtual | null): Record<string, unknown> | null {
  if (!r) return null
  return JSON.parse(JSON.stringify(r))
}

function deserializeRebanho(raw: Record<string, unknown> | null | undefined): RebanhoAtual | null {
  if (!raw) return null
  // Datas viraram strings ao serializar — reconstrói Date
  const r = raw as unknown as RebanhoAtual & { dataReferencia: string | Date }
  return {
    ...r,
    dataReferencia: new Date(r.dataReferencia),
    vacasSecagem: r.vacasSecagem.map(v => ({
      ...v,
      dtSecPrev: v.dtSecPrev ? new Date(v.dtSecPrev as unknown as string) : null,
      dtUltLeite: v.dtUltLeite ? new Date(v.dtUltLeite as unknown as string) : null,
      dtSecagemPorProducao: v.dtSecagemPorProducao ? new Date(v.dtSecagemPorProducao as unknown as string) : null,
      dtSecagemFinal: v.dtSecagemFinal ? new Date(v.dtSecagemFinal as unknown as string) : null,
    })),
    partosPrevistos: r.partosPrevistos.map(p => ({
      ...p,
      partoPrevisto: new Date(p.partoPrevisto as unknown as string),
    })),
  }
}
