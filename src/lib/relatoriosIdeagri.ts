/**
 * Metadata dos 3 relatórios Ideagri usados na importação.
 *
 * Nomes confirmados com o usuário (técnico veterinário Rehagro):
 * - Agenda de Secagem
 * - Agenda de Partos
 * - Relatório dos Animais Jovens
 */

export type CSVTipo = 'secagem' | 'agenda' | 'crescimento'

export interface RelatorioIdeagri {
  tipo: CSVTipo
  /** Rótulo curto pra UI (cards, slots). */
  rotulo: string
  /** Nome exato no menu do Ideagri — é o que o técnico vê no sistema externo. */
  nomeIdeagri: string
  /** Colunas que o app precisa ler do CSV. */
  camposObrigatorios: string[]
  /** Palavras-chave usadas para detectar tipo pelo nome do arquivo + conteúdo. */
  detectKeywords: string[]
}

export const RELATORIOS_IDEAGRI: Record<CSVTipo, RelatorioIdeagri> = {
  secagem: {
    tipo: 'secagem',
    rotulo: 'Secagem',
    nomeIdeagri: 'Agenda de Secagem',
    camposObrigatorios: [
      'N° Animal',
      'Dt. sec. prev.',
      'Dt. últ. leite',
      'Sit. Pro.',
      'Sit. Rep.',
      'Últ. CL (kg)',
    ],
    detectKeywords: ['secag', 'Dt. sec. prev.'],
  },
  agenda: {
    tipo: 'agenda',
    rotulo: 'Agenda de Partos',
    nomeIdeagri: 'Agenda de Partos',
    camposObrigatorios: [
      'N° Animal',
      'Parto previsto',
      'OP (ordem de parto)',
      'Sit. produtiva (L/S)',
      'Sit. reprodutiva',
    ],
    detectKeywords: ['agenda', 'parto', 'Parto previsto', 'Parto simples'],
  },
  crescimento: {
    tipo: 'crescimento',
    rotulo: 'Animais Jovens',
    nomeIdeagri: 'Relatório dos Animais Jovens',
    camposObrigatorios: [
      'N° Animal',
      'Idade (dias)',
      'Categoria',
    ],
    detectKeywords: ['crescimento', 'jovem', 'animal', 'Idade (dias)'],
  },
}

export const TIPO_ORDER: CSVTipo[] = ['secagem', 'agenda', 'crescimento']
