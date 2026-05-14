import type { Fazenda, Parametros } from '@/types'

/**
 * Retorna a Date que o motor deve usar como `dataReferencia` (= primeiro dia
 * do mês 1 da projeção). Convenção do motor (`projecao.ts:326`):
 *
 *   mesAtual = new Date(dataReferencia.year, dataReferencia.month - 1, 1)
 *   // pre-increment no loop → i=0 = mês de dataReferencia (0-idx)
 *
 * Logo, `dataReferencia.getMonth()` define o mês 1.
 *
 * Prioridade:
 *   1. `parametros.mesInicioProjecao` ('YYYY-MM') — input explícito do usuário
 *   2. `fazenda.dataUltimoUpload` — mês do upload (legado)
 *   3. Mês corrente
 */
export function resolverMesInicio(parametros: Parametros, fazenda: Fazenda): Date {
  const mi = parametros.mesInicioProjecao
  if (mi && /^\d{4}-\d{2}$/.test(mi)) {
    const [ano, mes] = mi.split('-').map(Number)
    if (!Number.isNaN(ano) && !Number.isNaN(mes) && mes >= 1 && mes <= 12) {
      return new Date(ano, mes - 1, 1)
    }
  }
  if (fazenda.dataUltimoUpload) {
    const d = new Date(fazenda.dataUltimoUpload)
    return new Date(d.getFullYear(), d.getMonth(), 1)
  }
  const hoje = new Date()
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1)
}

/** Converte uma Date em 'YYYY-MM' (zero-padded). */
export function dateToMesInicio(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
