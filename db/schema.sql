-- Gerado por `yarn db:migrate` (Better Auth, ver server/utils/auth.ts) — só
-- de referência/leitura. Não rode este arquivo manualmente: a fonte da
-- verdade é a config em server/utils/auth.ts, aplicada ao banco pelo comando
-- acima. Para promover uma conta a servidor da Prefeitura (não há cadastro
-- público de servidor):
--   update "user" set papel = 'servidor', secretaria = 'Nome da secretaria' where email = 'email@da-conta.com';

create table "user" ("id" text not null primary key, "name" text not null, "email" text not null unique, "emailVerified" boolean not null, "image" text, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null, "papel" text, "cpf" text, "telefone" text, "secretaria" text);

create table "session" ("id" text not null primary key, "expiresAt" timestamptz not null, "token" text not null unique, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null, "ipAddress" text, "userAgent" text, "userId" text not null references "user" ("id") on delete cascade);

create table "account" ("id" text not null primary key, "accountId" text not null, "providerId" text not null, "userId" text not null references "user" ("id") on delete cascade, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" timestamptz, "refreshTokenExpiresAt" timestamptz, "scope" text, "password" text, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null);

create table "verification" ("id" text not null primary key, "identifier" text not null, "value" text not null, "expiresAt" timestamptz not null, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null);

create index "session_userId_idx" on "session" ("userId");

create index "account_userId_idx" on "account" ("userId");

create index "verification_identifier_idx" on "verification" ("identifier");

-- Adicionado quando o cadastro tradicional passou a exigir CPF (ver
-- server/utils/auth.ts, campo `cpf` com `unique: true`). Garante no banco
-- que CPF preenchido não se repete entre contas; `cpf = null` (contas
-- criadas via Google, que não pedem CPF) continua podendo se repetir à
-- vontade — é o comportamento padrão de índice único no Postgres, NULL
-- nunca é igual a NULL. Numa instalação nova, `yarn db:migrate` já cria
-- este índice sozinho (o campo tem `unique: true` na config); numa
-- instalação já existente, ele precisa ser criado manualmente uma vez, com
-- exatamente este comando:
create unique index "user_cpf_uidx" on "user" ("cpf");

-- Login/cadastro com Google (ver `socialProviders.google` em
-- server/utils/auth.ts) não precisou de nenhuma tabela ou coluna nova: a
-- tabela "account" acima já foi desenhada de forma genérica por provedor
-- (`providerId`, tokens de acesso/refresh, etc.) — uma conta Google vira só
-- mais uma linha em "account" com `providerId = 'google'`, ligada ao mesmo
-- "user".