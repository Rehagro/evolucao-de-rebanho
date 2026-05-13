/**
 * Migração de fazendas em localStorage → Supabase.
 *
 * O app antigo guardava as fazendas em `localStorage` na chave `fazendas_v1`.
 * Após o primeiro login, oferecemos importar essas fazendas para a conta.
 * Quando o usuário aceita, marcamos `fazendas_v1_importado = '1'` para o banner
 * não aparecer mais.
 */
import type { Fazenda } from '@/types'
import { criarFazenda } from './fazendas'

const STORAGE_KEY = 'fazendas_v1'
const FLAG_IMPORTADO = 'fazendas_v1_importado'

export function temLocalStorageImportavel(): boolean {
  if (typeof localStorage === 'undefined') return false
  if (localStorage.getItem(FLAG_IMPORTADO) === '1') return false
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0
  } catch {
    return false
  }
}

export function listarFazendasLocalStorage(): Fazenda[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Fazenda[]
  } catch {
    return []
  }
}

/** Importa todas as fazendas do localStorage para a conta atual.
 *  Retorna { ok: numero importado, erros: lista de erros por fazenda }. */
export async function importarFazendasLocalStorage(): Promise<{
  ok: number
  erros: { nome: string; mensagem: string }[]
}> {
  const fazendas = listarFazendasLocalStorage()
  let ok = 0
  const erros: { nome: string; mensagem: string }[] = []

  for (const f of fazendas) {
    try {
      // Cria novo id para evitar colisão de UUID em conta vazia
      const copia: Fazenda = {
        ...f,
        id: crypto.randomUUID(),
        dataCriacao: f.dataCriacao ?? new Date().toISOString(),
      }
      await criarFazenda(copia)
      ok++
    } catch (e) {
      erros.push({
        nome: f.nome,
        mensagem: e instanceof Error ? e.message : String(e),
      })
    }
  }

  if (erros.length === 0) marcarComoImportado()
  return { ok, erros }
}

export function marcarComoImportado() {
  localStorage.setItem(FLAG_IMPORTADO, '1')
}

export function dispensarBanner() {
  // Usuário clicou "não importar" — marca como dispensado pra não voltar
  marcarComoImportado()
}
