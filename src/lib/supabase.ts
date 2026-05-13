import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variáveis de ambiente Supabase ausentes. Crie um arquivo `.env.local` na raiz de `app/` com:\n' +
    '  VITE_SUPABASE_URL=sua_url\n' +
    '  VITE_SUPABASE_ANON_KEY=sua_chave_anon\n' +
    'Veja app/supabase/SETUP.md para o passo a passo.',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export type Profile = {
  id: string
  nome: string
  email: string
  perfil: 'tecnico' | 'admin'
  criado_em: string
}

/** Linha em `public.fazendas` no Supabase. */
export type FazendaRow = {
  id: string
  nome: string
  proprietario: string | null
  municipio: string | null
  estado: string | null
  tecnico_id: string
  criado_em: string
  atualizado_em: string
}

/** Linha em `public.dados_rebanho`. Os campos JSONB ficam livres (validação na UI). */
export type DadosRebanhoRow = {
  fazenda_id: string
  parametros: Record<string, unknown>
  estado_atual: Record<string, unknown> | null
  rebanho_atual: Record<string, unknown> | null
  cenario_a: Record<string, unknown> | null
  cenario_b: Record<string, unknown> | null
  previsto_realizado: unknown[]
  logo_base64: string | null
  data_ultimo_upload: string | null
  atualizado_em: string
}
