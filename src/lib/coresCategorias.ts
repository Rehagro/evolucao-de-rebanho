/**
 * Cores oficiais das 5 categorias do rebanho.
 *
 * Tokens equivalentes em `index.css`:
 * - `--color-data-vl`     → vacasLactacao
 * - `--color-data-vs`     → vacasSecas
 * - `--color-data-bez012` → bezerras0_12m
 * - `--color-data-bez1223`→ novilhas12_24m
 * - `--color-data-novp`   → novilhasPrenhas
 *
 * Use estas constantes em qualquer componente que pinte categorias do rebanho
 * para garantir consistência visual e facilitar trocas centralizadas.
 */

export const CORES_CATEGORIAS = {
  vacasLactacao:   '#2D6BC8',
  vacasSecas:      '#9CA09C',
  bezerras0_12m:   '#4FA85C',
  novilhas12_24m:  '#9E5AC8',
  novilhasPrenhas: '#28A89A',
} as const

export type CategoriaRebanho = keyof typeof CORES_CATEGORIAS

export const LABELS_CATEGORIAS: Record<CategoriaRebanho, string> = {
  vacasLactacao:   'Vacas Lactação',
  vacasSecas:      'Vacas Secas',
  bezerras0_12m:   'Bezerras 0–12m',
  novilhas12_24m:  'Bezerras 12–23m',
  novilhasPrenhas: 'Novilhas Prenhas',
}

export const ORDEM_CATEGORIAS: CategoriaRebanho[] = [
  'vacasLactacao',
  'vacasSecas',
  'bezerras0_12m',
  'novilhas12_24m',
  'novilhasPrenhas',
]
