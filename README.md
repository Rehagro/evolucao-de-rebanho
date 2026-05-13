# Evolução de Rebanho — Painel Rehagro

Aplicativo web para projeção de evolução de rebanho leiteiro.
Stack: **Vite + React 19 + TypeScript + Tailwind 4 + Supabase**.

---

## Rodar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Criar `.env.local` com credenciais do Supabase
cp .env.example .env.local
# edite .env.local e cole os valores reais

# 3. Rodar
npm run dev
```

Abre http://localhost:5173/. Faz login com seu usuário (criado no Supabase).

---

## Setup inicial (apenas uma vez)

Veja [`supabase/SETUP.md`](./supabase/SETUP.md) para o passo a passo de criar projeto Supabase, rodar o SQL e configurar o primeiro admin.

---

## Como criar novos técnicos

1. Entre no painel do Supabase → **Authentication → Users**
2. **Add user → Create new user**
3. E-mail do técnico + senha temporária
4. **Auto Confirm User**: ✅
5. **Create user**
6. Mande as credenciais pro técnico (WhatsApp/e-mail). Ele pode trocar a senha no primeiro login via "Esqueci minha senha".

O trigger automático cria o profile como `tecnico`. Pra promover a admin, rode no SQL Editor:

```sql
update public.profiles set perfil = 'admin' where email = 'email@dominio.com';
```

---

## Deploy

Deploy automático no Vercel ao fazer push para `main`:

1. Conectar repositório no [Vercel](https://vercel.com/new)
2. **Framework Preset**: Vite (auto-detectado)
3. **Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Cada push em `main` dispara novo deploy.

---

## Estrutura

```
app/
├── src/
│   ├── App.tsx               # roteamento (react-router) + AuthProvider
│   ├── contexts/AuthContext  # sessão + perfil + login/logout
│   ├── lib/supabase.ts       # cliente Supabase
│   ├── lib/storage.ts        # wrapper async (era localStorage)
│   ├── services/             # CRUD + migração
│   ├── pages/                # Login, EsqueciSenha, Lista, Dashboard, Admin
│   ├── components/           # UI compartilhada (shadcn-style)
│   ├── engine/projecao.ts    # MOTOR de projeção (idêntico à planilha Bela Vista)
│   └── types/index.ts        # tipos do domínio
└── supabase/
    ├── schema.sql            # tabelas + RLS + triggers
    └── SETUP.md              # passo a passo do setup externo
```

## Domínio rápido

- **Fazenda** = uma "evolução" no modelo Caminho A (cada nova projeção = nova linha)
- **Técnico** vê só suas fazendas (RLS no banco)
- **Admin** vê todas, em modo só-leitura
- Botão **"Duplicar"** cria uma nova evolução sugerindo o mês atual no nome
