-- Gerado por `yarn db:migrate` (Better Auth, ver server/utils/auth.ts) — só
-- de referência/leitura. Não rode este arquivo manualmente: a fonte da
-- verdade é a config em server/utils/auth.ts, aplicada ao banco pelo comando
-- acima. Rodando `yarn db:migrate` num banco vazio, TODAS as colunas e o
-- índice único de "cpf" abaixo nascem sozinhos, sem nenhum SQL manual.
--
-- Promoção de papel (não há cadastro público de servidor nem de admin):
--   update "user" set papel = 'servidor', secretaria = 'Nome da secretaria' where email = 'email@da-conta.com';
--   update "user" set papel = 'admin' where email = 'email@da-conta.com';
--
-- Servidor criado por um admin (ver server/api/admin/servidores/index.post.ts)
-- já nasce com "primeiroAcesso" = true e sem CPF — não precisa de UPDATE manual.

create table "user" ("id" text not null primary key, "name" text not null, "email" text not null unique, "emailVerified" boolean not null, "image" text, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null, "papel" text, "cpf" text unique, "telefone" text, "secretaria" text, "primeiroAcesso" boolean, "banned" boolean);

create table "session" ("id" text not null primary key, "expiresAt" timestamptz not null, "token" text not null unique, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null, "ipAddress" text, "userAgent" text, "userId" text not null references "user" ("id") on delete cascade);

create table "account" ("id" text not null primary key, "accountId" text not null, "providerId" text not null, "userId" text not null references "user" ("id") on delete cascade, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" timestamptz, "refreshTokenExpiresAt" timestamptz, "scope" text, "password" text, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null);

create table "verification" ("id" text not null primary key, "identifier" text not null, "value" text not null, "expiresAt" timestamptz not null, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null);

create index "session_userId_idx" on "session" ("userId");

create index "account_userId_idx" on "account" ("userId");

create index "verification_identifier_idx" on "verification" ("identifier");

-- Índice único de "cpf": aplicado automaticamente pelo `yarn db:migrate`
-- porque o campo tem `unique: true` na config (ver server/utils/auth.ts).
-- Confirmado nascendo sozinho num banco recriado do zero — nome real gerado
-- pelo Postgres/Better Auth: "user_cpf_key". `cpf = null` (contas Google
-- antes de completar cadastro, ou qualquer servidor/admin) continua podendo
-- se repetir à vontade — comportamento padrão de índice único, NULL nunca é
-- igual a NULL. Só CPF preenchido não pode repetir.

-- `papel`: 'cidadao' | 'servidor' | 'admin' (ver PapelUsuario em
-- shared/types/perfil.ts). 'cidadao' é o default de qualquer cadastro
-- público (tradicional ou Google) — nunca escolhido pelo cliente
-- (`input: false`). 'servidor' só existe via criação por um admin
-- (server/api/admin/servidores/index.post.ts) ou promoção manual acima.
-- 'admin' só existe via promoção manual (bootstrap do primeiro admin).

-- `primeiroAcesso`: true só em servidor recém-criado pelo admin — força a
-- trocar a senha inicial (ver app/pages/perfil.vue) antes de operar o
-- painel (bloqueado de verdade em server/utils/exigirServidor.ts, não só
-- na tela). Zerado automaticamente pelo hook `after` de `/change-password`
-- em server/utils/auth.ts assim que a troca é concluída com sucesso.

-- `banned`: ativo/inativo de uma conta de servidor (mesmo nome que o plugin
-- `admin` nativo do Better Auth usaria — ver decisão de não habilitar esse
-- plugin em server/utils/auth.ts, por causa do campo `role` dele ser
-- separado do nosso `papel`). Só um campo comum aqui, sem a autorização do
-- plugin; quem checa isso de verdade é server/utils/exigirServidor.ts.

-- Login/cadastro com Google (ver `socialProviders.google` em
-- server/utils/auth.ts) não precisou de nenhuma tabela ou coluna nova: a
-- tabela "account" acima já foi desenhada de forma genérica por provedor
-- (`providerId`, tokens de acesso/refresh, etc.) — uma conta Google vira só
-- mais uma linha em "account" com `providerId = 'google'`, ligada ao mesmo
-- "user".
