# Planos de Ensino SC

Aplicativo para professores da rede estadual de Santa Catarina criarem e
organizarem seus planos de ensino (Formação Geral Básica e cursos técnicos).

## Stack

- [Next.js 16](https://nextjs.org/) (App Router) + TypeScript + Tailwind CSS
- [Supabase](https://supabase.com/) — banco de dados (Postgres), autenticação e storage
- Deploy: Hostinger (hospedagem Node.js), via importação do repositório Git

## Rodando localmente

1. Instale as dependências:

   ```bash
   npm install
   ```

2. O arquivo `.env.local` já vem preenchido com as credenciais do projeto
   Supabase (`plano-de-ensino-sc`). Se precisar recriar, use
   `.env.local.example` como modelo.

3. Rode o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

4. Acesse [http://localhost:3000](http://localhost:3000).

## Estrutura do projeto

```
src/
  app/
    page.tsx              → página inicial
    login/                 → tela de login
    cadastro/              → tela de cadastro
    dashboard/
      layout.tsx           → cabeçalho + proteção de rota (exige login)
      page.tsx              → lista de planos do professor
      planos/
        novo/               → criar plano
        [id]/               → editar/excluir plano
        actions.ts          → Server Actions (criar/atualizar/excluir)
        plano-form.tsx      → formulário compartilhado
  lib/
    supabase/
      client.ts             → cliente Supabase (navegador)
      server.ts              → cliente Supabase (servidor)
    database.types.ts        → tipos TypeScript do banco
  proxy.ts                   → renovação de sessão + proteção de rotas
```

## Banco de dados (Supabase)

O schema já está criado no projeto Supabase `plano-de-ensino-sc`:

- `professores` — perfil do professor (criado automaticamente no cadastro)
- `disciplinas` — disciplinas da Formação Geral Básica (já populada)
- `cursos_tecnicos` — cursos técnicos (itinerários integrados e CEDUPs) —
  **ainda vazia**, aguardando os dados que você for enviando
- `habilidades_curriculares` — base de habilidades (BNCC, currículo
  catarinense, matrizes técnicas) — **ainda vazia**, será alimentada aos
  poucos a partir dos documentos oficiais
- `planos_de_ensino` — os planos criados pelos professores
- `planos_habilidades` — vínculo entre um plano e as habilidades trabalhadas

Todas as tabelas têm Row Level Security ativado: cada professor só
enxerga e edita os próprios planos.

## Deploy na Hostinger

1. Suba este projeto para um repositório no GitHub.
2. No painel da Hostinger, vá em "Implante seu web app em Node.js" →
   "Importar repositório Git" → conecte com o GitHub e selecione o
   repositório.
3. Configure as variáveis de ambiente no painel da Hostinger (as mesmas do
   `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. A cada novo `git push`, a Hostinger publica a atualização automaticamente.
