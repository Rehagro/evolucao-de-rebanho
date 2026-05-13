# Setup Externo — Supabase + GitHub + Vercel

Passo a passo do que **você precisa fazer manualmente** fora do código. Eu cuido de tudo que é código no projeto.

## 1. GitHub — criar repo

1. Abre https://github.com/new
2. Nome sugerido: `rehagro-painel`
3. **Privado** (não público — vai ter dados sensíveis de fazendas)
4. **Não** marcar "Initialize with README" / `.gitignore` / `license`
5. Cria. Anota a URL do repo (algo como `https://github.com/seu-usuario/rehagro-painel.git`)

> Depois eu rodo `git init` + primeiro commit + `git remote add origin ...` + `git push`.

---

## 2. Supabase — criar projeto

### 2.1 Criar projeto
1. Abre https://supabase.com/dashboard
2. **New project** → escolhe organização
3. Nome: `rehagro-painel`
4. Senha forte do banco (anota — usa caso precise SSH direto)
5. Região: **South America (São Paulo)** — sa-east-1
6. Plano **Free** está OK pra começar
7. Espera ~2 min provisionar

### 2.2 Rodar o SQL
1. Painel do projeto → **SQL Editor** (ícone de banco na sidebar esquerda)
2. **New query**
3. Cola o conteúdo do arquivo `app/supabase/schema.sql` (todo ele)
4. **Run** (canto inferior direito ou Ctrl+Enter)
5. Espera ver "Success. No rows returned" — significa que rodou OK

Se der erro, copia a mensagem e me manda.

### 2.3 Anotar credenciais
1. Painel → **Project Settings** (engrenagem) → **API**
2. Copia:
   - **Project URL** (algo como `https://xxxxxxxxxxx.supabase.co`)
   - **anon public key** (cabeçalho `eyJhb...` longo, começa com "eyJ")
3. Me manda esses dois valores (vou colocar no `.env.local`)

### 2.4 Criar primeiro usuário admin (você)
1. Painel → **Authentication** → **Users**
2. **Add user** → **Create new user**
3. Email: seu email (`ernanecampos1@gmail.com`)
4. Password: escolhe uma senha forte (não precisa ser provisória — você é o admin)
5. **Auto Confirm User**: ✅ (marca, senão precisa clicar no email pra confirmar)
6. **Create user**

### 2.5 Promover esse usuário a admin
O trigger cria por padrão como `tecnico`. Pra você virar admin:

1. Painel → **SQL Editor** → **New query**
2. Cola:
   ```sql
   update public.profiles
   set perfil = 'admin'
   where email = 'ernanecampos1@gmail.com';
   ```
3. **Run**

Pronto. Você é admin.

---

## 3. Vercel — preparar (faz depois que o repo estiver no GitHub)

> Volta nessa etapa depois que eu tiver feito o `git push` inicial.

1. Abre https://vercel.com/new
2. **Import** o repo `rehagro-painel`
3. **Root Directory**: clica em "Edit", escolhe **`.`** (raiz do repo — porque vamos fazer git init dentro de `app/`, ou seja, `app/` vira a raiz do repo)
4. **Framework Preset**: Vite (auto-detectado)
5. **Environment Variables** — adicione:
   - `VITE_SUPABASE_URL` = (o URL do passo 2.3)
   - `VITE_SUPABASE_ANON_KEY` = (a chave do passo 2.3)
6. **Deploy**

Espera ~2 min. Vercel te dá uma URL (algo como `rehagro-painel.vercel.app`).

---

## 4. Como criar novos técnicos depois

Mesmo passo a passo do 2.4, sem o 2.5:

1. **Authentication** → **Users** → **Add user**
2. Email do técnico + senha temporária (você vai mandar pra ele por WhatsApp/e-mail)
3. **Auto Confirm User**: ✅
4. **Create user**

Pronto. O trigger cria o profile como `tecnico`. Esse técnico:
- Loga com as credenciais que você passou
- Pode trocar a senha em **Authentication settings** (se a gente adicionar) ou via "Esqueci senha"
- Só vê as fazendas dele

---

## 5. Checklist final

- [ ] Repo GitHub criado (privado), URL anotada
- [ ] Projeto Supabase criado em sa-east-1
- [ ] Schema SQL executado sem erro
- [ ] URL + anon key anotadas
- [ ] Usuário admin criado e promovido
- [ ] Credenciais (URL + key) enviadas pro Claude

Depois disso, eu cuido do resto.
