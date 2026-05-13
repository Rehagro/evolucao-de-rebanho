/**
 * Camada de storage — agora 100% Supabase (era localStorage).
 *
 * Mantemos os MESMOS nomes de função pra minimizar diff nos callers, mas agora
 * todos retornam Promise. Cada caller precisa usar await + loading state.
 *
 * A lógica de localStorage migrou para `services/migracao.ts` (importador one-shot
 * após primeiro login).
 */
import type { Fazenda } from '@/types'
import {
  listarFazendas as svListar,
  buscarFazenda as svBuscar,
  salvarFazenda as svSalvar,
  deletarFazenda as svDeletar,
  duplicarFazendaComoEvolucao as svDuplicar,
} from '@/services/fazendas'

export async function getFazendas(): Promise<Fazenda[]> {
  return await svListar()
}

export async function getFazenda(id: string): Promise<Fazenda | null> {
  return await svBuscar(id)
}

export async function saveFazenda(fazenda: Fazenda): Promise<Fazenda> {
  return await svSalvar(fazenda)
}

export async function deleteFazenda(id: string): Promise<void> {
  await svDeletar(id)
}

export async function clearCenario(fazendaId: string, slot: 'A' | 'B'): Promise<void> {
  const f = await getFazenda(fazendaId)
  if (!f) return
  if (slot === 'A') await saveFazenda({ ...f, cenarioA: null })
  else await saveFazenda({ ...f, cenarioB: null })
}

export async function promoverBparaA(fazendaId: string): Promise<void> {
  const f = await getFazenda(fazendaId)
  if (!f || !f.cenarioB) return
  await saveFazenda({ ...f, cenarioA: f.cenarioB })
}

/**
 * Duplica fazenda como nova evolução. Se `novoNome` não vier, sugere automaticamente
 * com base no nome original + mês/ano atual (ex: "Bela Vista — Mai/26").
 */
export async function duplicateFazenda(id: string, novoNome?: string): Promise<Fazenda | null> {
  return await svDuplicar(id, novoNome)
}
