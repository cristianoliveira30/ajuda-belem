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
