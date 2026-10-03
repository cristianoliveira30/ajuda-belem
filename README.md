# Ajuda Belém

Portal de solicitações de serviços de infraestrutura urbana da Prefeitura de Belém, inspirado no modelo do [SP156](https://www.prefeitura.sp.gov.br/) (São Paulo).

Permite que o cidadão registre ocorrências de infraestrutura (iluminação pública, buracos e pavimentação, saneamento, poda de árvores, limpeza urbana, sinalização de trânsito, entre outras), acompanhe o andamento por número de protocolo e, para a Prefeitura, gerencie e priorize os atendimentos.

## Stack

- [Nuxt 4](https://nuxt.com)
- [Nuxt UI v4](https://ui.nuxt.com) (componentes + Tailwind CSS v4 + ícones + modo escuro)
- [Better Auth](https://better-auth.com) + PostgreSQL (autenticação de cidadão/servidor)
- [Leaflet](https://leafletjs.com) + OpenStreetMap (mapa de ocorrências)
- PWA instalável (`@vite-pwa/nuxt`)
- TypeScript

Veja o roadmap de construção do projeto, por etapas, em [docs/etapa-iniciais.md](./docs/etapa-iniciais.md).

## Configuração

O login/cadastro (`/entrar`, `/cadastro`, `/perfil`) usa [Better Auth](https://better-auth.com) contra um Postgres próprio e precisa do banco rodando para funcionar:

1. Copie `.env.example` para `.env` e gere um valor para `BETTER_AUTH_SECRET` (ex.: `openssl rand -base64 32`).
2. Suba o banco com `docker compose up -d db` (ou use um Postgres já instalado, ajustando `DATABASE_URL`).
3. Crie as tabelas do Better Auth (usuário, sessão etc., ver [server/utils/auth.ts](./server/utils/auth.ts)):
   - Com Docker, sem precisar de yarn/node local: `docker compose run --rm migrate`.
   - Ou local (se já tem `yarn install` feito e `DATABASE_URL` no `.env` apontando pro banco): `yarn db:migrate`.

Contas de servidor não têm cadastro público — são promovidas manualmente no banco (ver comentário no topo de [db/schema.sql](./db/schema.sql)).

### Dados de demonstração (seed)

Só para desenvolvimento. Depois de criar as tabelas (passo 3), `yarn db:seed` ([db/seed.mjs](./db/seed.mjs)) popula os dois lugares onde o app guarda dados:

| Onde | O que cria |
| --- | --- |
| Postgres (`user` + `account`) | 4 contas de demonstração (tabela abaixo) |
| `.data/solicitacoes` (arquivos JSON, ver `nuxt.config.ts`) | 100 solicitações simuladas de [db/seed/solicitacoes.json](./db/seed/solicitacoes.json): todas as categorias, status e bairros, com histórico e relatos |

| E-mail | Papel | Observação |
| --- | --- | --- |
| `admin@ajudabelem.local` | admin | |
| `servidor.obras@ajudabelem.local` | servidor | Secretaria de Obras |
| `servidor.limpeza@ajudabelem.local` | servidor | Secretaria de Limpeza Urbana |
| `cidadao@ajudabelem.local` | cidadão | CPF fictício válido |

A senha de todas é `Belem123`. Os servidores já nascem com `primeiroAcesso = false`, para entrar direto no painel.

Ao entrar em `/entrar`, cada papel cai na sua tela ([app/utils/destinoPosLogin.ts](./app/utils/destinoPosLogin.ts)): **admin** → `/painel` (visão geral + gestão de servidores), **servidor** → `/painel/solicitacoes` (fila de atendimento), **cidadão** → `/perfil`. Servidor em primeiro acesso vai para `/perfil` trocar a senha antes. Quem já está logado e abre `/entrar` vê um aviso com a conta atual (atalho para a sua tela ou "Sair") e pode entrar com outra conta direto pelo formulário; conta desativada é recusada no login.

```bash
# Com Docker (o .data pertence ao container, então rode lá dentro)
docker compose exec dev yarn db:seed

# Ou local, com DATABASE_URL no .env
yarn db:seed
```

#### Contas pessoais (fora do seed)

Além das contas acima, o banco local tem duas contas criadas à mão, **fora** do `db/seed.mjs` (projeto acadêmico, então a senha fica registrada aqui):

| E-mail | Papel | Senha |
| --- | --- | --- |
| `renan.admin@ajudabelem.local` | admin | `renan123` |
| `renan.servidor@ajudabelem.local` | servidor (Prefeitura de Belém) | `renan123` |

Elas vivem só no volume `db-data` do Postgres: se o volume for apagado, somem junto e `yarn db:seed` não as recria. Para refazer, crie o servidor pelo próprio admin em `/painel/servidores`, ou promova uma conta já cadastrada com o `update "user" set papel = ...` do topo de [db/schema.sql](./db/schema.sql).

#### Rodando o seed

É idempotente: só mexe em ids `seed-*` e nos protocolos do fixture, nunca em contas ou solicitações reais. Recusa rodar com `NODE_ENV=production`. Para gravar as solicitações em outro diretório, defina `SOLICITACOES_DIR`.

## Desenvolvimento

Precisa de Node/Yarn instalados localmente. Se preferir não instalar nada além do Docker, veja "Desenvolvimento com Docker" abaixo — faz a mesma coisa dentro de um container.

```bash
# Instalar dependências
yarn install

# Ambiente de desenvolvimento
yarn dev

# Build de produção
yarn build

# Lint
yarn lint

# Testes
yarn test
```

## Docker

### Desenvolvimento com Docker

Não precisa de Node/Yarn instalados — só Docker. O projeto roda com hot-reload (`yarn dev` dentro do container), montando o diretório local por bind mount: editar um arquivo aqui já reflete no container na hora.

```bash
# Copie e preencha BETTER_AUTH_SECRET (ver seção Configuração)
cp .env.example .env

# Sobe o Postgres + o app em modo dev (http://localhost:3000)
docker compose --profile dev up dev

# Uma única vez (ou após mudar server/utils/auth.ts): cria as tabelas do
# Better Auth
docker compose run --rm migrate
```

Usa [Dockerfile.dev](./Dockerfile.dev) — só instala as dependências, sem copiar o código (que vem do bind mount). `node_modules` fica de fora do bind mount (volume anônimo, ver `docker-compose.yml`) para não ser sobrescrito pelo `node_modules` do host.

### Produção

```bash
# Copie e preencha BETTER_AUTH_SECRET (ver seção Configuração)
cp .env.example .env

# Builda a imagem de produção e sobe o app + o Postgres (db-data e app-data
# são volumes nomeados, persistem entre execuções)
docker compose up -d

# Uma única vez (ou após mudar server/utils/auth.ts): cria as tabelas do
# Better Auth. Não precisa de yarn/node instalado no host.
docker compose run --rm migrate
```

O `Dockerfile` usa build multi-stage: primeiro instala as dependências e roda `yarn build`; a imagem final copia apenas o resultado (`.output`) e instala só as dependências de runtime do Nitro, sem o restante do projeto. O volume `app-data` (`/app/.data` dentro do container) é onde o armazenamento local das solicitações (`useStorage`, ver [docs/etapa-iniciais.md](./docs/etapa-iniciais.md)) grava os arquivos — sem ele, os dados somem a cada `docker compose up` novo. O volume `db-data` guarda os dados do Postgres (contas de usuário).
